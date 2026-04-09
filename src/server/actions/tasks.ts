'use server';

import { eq, or, and, isNull, sql, desc, ilike, lt, inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ResolveResult,
  PaginatedTasks,
  DeletionResult,
  Owner,
} from '@/types/task';

const ownerWhere = (owner: Owner) => {
  const conditions = [];
  if (owner.userId) conditions.push(eq(tasks.userId, owner.userId));
  if (owner.guestId) conditions.push(eq(tasks.guestId, owner.guestId));
  if (conditions.length === 0) return sql`false`;
  return conditions.length > 1 ? or(...conditions)! : conditions[0]!;
};

const ownerWhereSql = (owner: Owner) => {
  if (owner.userId && owner.guestId) {
    return sql`(${tasks.userId} = ${owner.userId} OR ${tasks.guestId} = ${owner.guestId})`;
  }
  if (owner.userId) return sql`${tasks.userId} = ${owner.userId}`;
  if (owner.guestId) return sql`${tasks.guestId} = ${owner.guestId}`;
  return sql`false`;
};

const getNextTaskNumber = async (owner: Owner): Promise<number> => {
  const ow = ownerWhere(owner);

  const [result] = await db
    .select({ max: sql<number>`COALESCE(MAX(${tasks.taskNumber}), 0)` })
    .from(tasks)
    .where(ow);

  return (result?.max ?? 0) + 1;
};

// ---------------------------------------------------------------------------
// resolveTask — find a single task by name or number, return match/ambiguous
// ---------------------------------------------------------------------------
export const resolveTask = async (
  nameOrNumber: string,
  owner: Owner,
): Promise<ResolveResult> => {
  const ow = ownerWhere(owner);
  const trimmed = nameOrNumber.trim();

  // Try task number first — strip common prefixes like "task", "#", "task #"
  const numMatch = trimmed.replace(/^(task\s*#?\s*|#)/i, '').trim();
  if (/^\d+$/.test(numMatch)) {
    const [found] = await db
      .select()
      .from(tasks)
      .where(and(ow, eq(tasks.taskNumber, parseInt(numMatch, 10)), isNull(tasks.deletedAt)))
      .limit(1);

    if (found) return { match: found as Task };
    return { error: `No task with number #${numMatch}` };
  }

  // ILIKE search on title
  const pattern = `%${trimmed}%`;
  let matches = await db
    .select()
    .from(tasks)
    .where(and(ow, ilike(tasks.title, pattern), isNull(tasks.deletedAt)))
    .limit(10);

  // Fallback: Postgres full-text search with stemming (running → run, advertising → advertis)
  if (matches.length === 0) {
    const tsQuery = trimmed.split(/\s+/).map((w) => `${w}:*`).join(' & ');
    matches = await db
      .select()
      .from(tasks)
      .where(and(
        ow,
        sql`to_tsvector('english', ${tasks.title}) @@ to_tsquery('english', ${tsQuery})`,
        isNull(tasks.deletedAt),
      ))
      .limit(10);
  }

  if (matches.length === 0) return { error: `No task matching "${trimmed}"` };
  if (matches.length === 1) return { match: matches[0] as Task };

  // Exact title match takes priority
  const exact = matches.find((t) => t.title.toLowerCase() === trimmed.toLowerCase());
  if (exact) return { match: exact as Task };

  // Single root task takes priority
  const roots = matches.filter((t) => !t.parentTaskId);
  if (roots.length === 1) return { match: roots[0] as Task };

  // Ambiguous — return summaries
  return {
    matches: matches.map((t) => ({
      id: t.id,
      taskNumber: t.taskNumber!,
      title: t.title,
      score: t.score,
      status: t.status,
      parentTaskId: t.parentTaskId,
    })),
  };
};

// ---------------------------------------------------------------------------
// createTasks — batch INSERT with sequential task numbers
// ---------------------------------------------------------------------------
export const createTasks = async (
  inputs: CreateTaskInput[],
  owner: Owner,
): Promise<Task[]> => {
  if (inputs.length === 0) return [];

  const nextNumber = await getNextTaskNumber(owner);

  const values = inputs.map((input, i) => ({
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'medium',
    status: input.status ?? 'todo',
    dueDate: input.dueDate ?? null,
    parentTaskId: input.parentTaskId ?? null,
    score: input.score ?? null,
    taskNumber: nextNumber + i,
    userId: owner.userId ?? null,
    guestId: owner.guestId ?? null,
  }));

  const result = await db.insert(tasks).values(values).returning();
  return result as Task[];
};

// ---------------------------------------------------------------------------
// updateTasksByIds — batch UPDATE shared fields across multiple task IDs
// ---------------------------------------------------------------------------
export const updateTasksByIds = async (
  ids: string[],
  fields: Partial<Omit<UpdateTaskInput, 'id'>>,
): Promise<Task[]> => {
  if (ids.length === 0) return [];

  const result = await db
    .update(tasks)
    .set(fields)
    .where(inArray(tasks.id, ids))
    .returning();

  return result as Task[];
};

// ---------------------------------------------------------------------------
// completeWithDescendants — recursive CTE to mark task + all children done
// ---------------------------------------------------------------------------
export const completeWithDescendants = async (id: string): Promise<number> => {
  const result = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id FROM tasks WHERE id = ${id}::uuid
      UNION ALL
      SELECT t.id FROM tasks t
        INNER JOIN descendants d ON t.parent_task_id = d.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET status = 'done', updated_at = NOW()
    WHERE id IN (SELECT id FROM descendants)
      AND status != 'done'
      AND deleted_at IS NULL
  `);

  return Number(result.count ?? 0);
};

// ---------------------------------------------------------------------------
// completeByQuery — find all tasks matching a keyword, complete them + descendants
// ---------------------------------------------------------------------------
export const completeByQuery = async (
  query: string,
  owner: Owner,
): Promise<{ completed: number; titles: string[] }> => {
  const ownerCond = ownerWhereSql(owner);
  const pattern = `%${query.trim()}%`;

  const matching = await db.execute(sql`
    SELECT title FROM tasks
    WHERE ${ownerCond} AND deleted_at IS NULL AND status != 'done'
      AND title ILIKE ${pattern}
  `);
  const titles = ([...matching] as { title: string }[]).map((r) => r.title);

  const result = await db.execute(sql`
    WITH RECURSIVE
      roots AS (
        SELECT id FROM tasks
        WHERE ${ownerCond} AND deleted_at IS NULL AND status != 'done'
          AND title ILIKE ${pattern}
      ),
      descendants AS (
        SELECT id FROM roots
        UNION ALL
        SELECT t.id FROM tasks t
          INNER JOIN descendants d ON t.parent_task_id = d.id
        WHERE t.deleted_at IS NULL
      )
    UPDATE tasks
    SET status = 'done', updated_at = NOW()
    WHERE id IN (SELECT id FROM descendants)
      AND status != 'done'
      AND deleted_at IS NULL
  `);

  return { completed: Number(result.count ?? 0), titles };
};

// ---------------------------------------------------------------------------
// uncompleteWithDescendants — recursive CTE to reopen task + all children
// ---------------------------------------------------------------------------
export const uncompleteWithDescendants = async (id: string): Promise<number> => {
  const result = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id FROM tasks WHERE id = ${id}::uuid
      UNION ALL
      SELECT t.id FROM tasks t
        INNER JOIN descendants d ON t.parent_task_id = d.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET status = 'todo', updated_at = NOW()
    WHERE id IN (SELECT id FROM descendants)
      AND status = 'done'
      AND deleted_at IS NULL
  `);

  return Number(result.count ?? 0);
};

// ---------------------------------------------------------------------------
// deleteByIds — recursive CTE soft-delete, returns titles of root tasks
// ---------------------------------------------------------------------------
export const deleteByIds = async (ids: string[]): Promise<DeletionResult> => {
  if (ids.length === 0) return { deleted: 0, titles: [] };

  const roots = await db
    .select({ title: tasks.title })
    .from(tasks)
    .where(inArray(tasks.id, ids));

  const titles = roots.map((r) => r.title);

  const idList = sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `);
  const result = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id FROM tasks WHERE id IN (${idList})
      UNION ALL
      SELECT t.id FROM tasks t
        INNER JOIN descendants d ON t.parent_task_id = d.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id IN (SELECT id FROM descendants)
      AND deleted_at IS NULL
  `);

  return { deleted: Number(result.count ?? 0), titles };
};

// ---------------------------------------------------------------------------
// deleteByFilter — bulk soft-delete by filter (overdue/done/all)
// ---------------------------------------------------------------------------
export const deleteByFilter = async (
  filter: 'overdue' | 'done' | 'all',
  owner: Owner,
): Promise<DeletionResult> => {
  const ownerCond = ownerWhereSql(owner);

  let filterCond;
  if (filter === 'overdue') {
    filterCond = sql`due_date < NOW() AND status != 'done'`;
  } else if (filter === 'done') {
    filterCond = sql`status = 'done'`;
  } else {
    // 'all' — no extra filter
    filterCond = sql`true`;
  }

  const matchingTasks = await db.execute(sql`
    SELECT title FROM tasks
    WHERE ${ownerCond}
      AND deleted_at IS NULL
      AND ${filterCond}
  `);

  const titles = ([...matchingTasks] as { title: string }[]).map((r) => r.title);

  const result = await db.execute(sql`
    WITH RECURSIVE
      roots AS (
        SELECT id FROM tasks
        WHERE ${ownerCond}
          AND deleted_at IS NULL
          AND ${filterCond}
      ),
      descendants AS (
        SELECT id FROM roots
        UNION ALL
        SELECT t.id FROM tasks t
          INNER JOIN descendants d ON t.parent_task_id = d.id
        WHERE t.deleted_at IS NULL
      )
    UPDATE tasks
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id IN (SELECT id FROM descendants)
      AND deleted_at IS NULL
  `);

  return { deleted: Number(result.count ?? 0), titles };
};

// ---------------------------------------------------------------------------
// listTasks — cursor-based pagination with optional filter/search
// ---------------------------------------------------------------------------
export const listTasks = async (
  owner: Owner,
  options?: { cursor?: string; limit?: number; filter?: string; query?: string },
): Promise<PaginatedTasks> => {
  if (!owner.userId && !owner.guestId) return { tasks: [], nextCursor: null };

  const ow = ownerWhere(owner);
  const pageSize = options?.limit === 0 ? null : (options?.limit ?? 200);
  const conditions = [ow, isNull(tasks.deletedAt)];

  // Cursor-based pagination: fetch items created before the cursor timestamp
  if (options?.cursor) {
    const cursorDate = new Date(options.cursor);
    conditions.push(lt(tasks.createdAt, cursorDate));
  }

  // Filter conditions
  if (options?.filter) {
    const now = new Date();
    if (options.filter === 'overdue') {
      conditions.push(lt(tasks.dueDate, now));
      conditions.push(sql`${tasks.status} != 'done'`);
    } else if (options.filter === 'today') {
      conditions.push(sql`DATE(${tasks.dueDate}) = CURRENT_DATE`);
    } else if (options.filter === 'todo') {
      conditions.push(eq(tasks.status, 'todo'));
    } else if (options.filter === 'done') {
      conditions.push(eq(tasks.status, 'done'));
    }
  }

  // Text search
  if (options?.query) {
    conditions.push(ilike(tasks.title, `%${options.query}%`));
  }

  const query = db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  const rows = pageSize
    ? await query.limit(pageSize + 1)
    : await query;

  const hasMore = pageSize ? rows.length > pageSize : false;
  const page = hasMore ? rows.slice(0, pageSize!) : rows;
  const nextCursor = hasMore && pageSize ? page[page.length - 1].createdAt.toISOString() : null;

  return { tasks: page as Task[], nextCursor };
};

// ---------------------------------------------------------------------------
// searchTasks — keyword or task number search
// ---------------------------------------------------------------------------
export const searchTasks = async (
  query: string,
  owner: Owner,
): Promise<Task[]> => {
  const ow = ownerWhere(owner);
  const trimmed = query.trim();

  // Match by task number — strip common prefixes
  const numMatch = trimmed.replace(/^(task\s*#?\s*|#)/i, '').trim();
  if (/^\d+$/.test(numMatch)) {
    const result = await db
      .select()
      .from(tasks)
      .where(and(ow, eq(tasks.taskNumber, parseInt(numMatch, 10)), isNull(tasks.deletedAt)))
      .limit(10);
    return result as Task[];
  }

  // ILIKE search
  const pattern = `%${trimmed}%`;
  let result = await db
    .select()
    .from(tasks)
    .where(and(ow, ilike(tasks.title, pattern), isNull(tasks.deletedAt)))
    .limit(20);

  // Fallback: full-text search with stemming
  if (result.length === 0) {
    const tsQuery = trimmed.split(/\s+/).map((w) => `${w}:*`).join(' & ');
    result = await db
      .select()
      .from(tasks)
      .where(and(
        ow,
        sql`to_tsvector('english', ${tasks.title}) @@ to_tsquery('english', ${tsQuery})`,
        isNull(tasks.deletedAt),
      ))
      .limit(20);
  }

  return result as Task[];
};

// ---------------------------------------------------------------------------
// updateTask (singular) — kept for UI hooks
// ---------------------------------------------------------------------------
export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  const { id, ...fields } = input;

  const [task] = await db
    .update(tasks)
    .set(fields)
    .where(eq(tasks.id, id))
    .returning();

  return task as Task;
};

// ---------------------------------------------------------------------------
// deleteTask (singular) — soft delete, kept for UI hooks
// ---------------------------------------------------------------------------
export const deleteTask = async (id: string): Promise<void> => {
  await db
    .update(tasks)
    .set({ deletedAt: new Date() })
    .where(eq(tasks.id, id));
};
