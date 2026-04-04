# Tool System Refactor Implementation Plan

**Goal:** Replace the N+1 query, JS-loop-heavy tool system with DB-level batch operations using recursive CTEs, cursor-based pagination, and a rewritten system prompt optimized for Gemini Flash.

**Architecture:** Thin Tools, Fat DB — AI tools are thin wrappers that call server actions, which execute 1-2 SQL queries each using Postgres recursive CTEs for hierarchical operations and batch INSERT/UPDATE for bulk ops.

**Tech Stack:** Drizzle ORM (raw SQL for CTEs), Postgres, Zod schemas, Vercel AI SDK v6 `tool()`, Vitest

**Design doc:** `docs/plans/2026-03-23-tool-refactor-design.md`

---

### Task 1: Update Database Schema

**Files:**
- Modify: `src/server/db/schema.ts`

**Step 1: Change `taskNumber` from `real` to `integer` and add `score` as integer**

In `src/server/db/schema.ts`, replace:
```typescript
score: real('score'),
taskNumber: real('task_number'),
```
with:
```typescript
score: integer('score'),
taskNumber: integer('task_number'),
```

Add `integer` to the import from `drizzle-orm/pg-core`.

**Step 2: Generate and apply migration**

Run:
```bash
bunx drizzle-kit generate
```

Then review the generated migration SQL. It should contain:
```sql
ALTER TABLE tasks ALTER COLUMN score TYPE integer USING score::integer;
ALTER TABLE tasks ALTER COLUMN task_number TYPE integer USING task_number::integer;
```

Then apply:
```bash
bunx drizzle-kit push
```

**Step 3: Add indexes via raw SQL**

Since Drizzle's `pgTable` doesn't inline indexes easily, add them via a migration or push. Create indexes for performance:

```bash
bunx drizzle-kit push
```

If indexes aren't auto-generated, run manually against Supabase SQL editor:
```sql
CREATE INDEX IF NOT EXISTS idx_tasks_user_deleted ON tasks (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_guest_deleted ON tasks (guest_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks (parent_task_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_guest ON chat_messages (guest_id);
```

**Step 4: Commit**

```bash
git add src/server/db/schema.ts
git commit -m "change task number and score columns to integer, add indexes"
```

---

### Task 2: Add New Types

**Files:**
- Modify: `src/types/task.ts`

**Step 1: Add new result types**

Append to `src/types/task.ts`:

```typescript
export type ResolveResult =
  | { match: Task }
  | { matches: Pick<Task, 'id' | 'taskNumber' | 'title' | 'score' | 'status' | 'parentTaskId'>[] }
  | { error: string };

export type CompletionResult = {
  completed: string[];
  ambiguous: { name: string; matches: { taskNumber: number; title: string }[] }[];
  notFound: string[];
};

export type DeletionResult = {
  deleted: number;
  titles: string[];
};

export type PaginatedTasks = {
  tasks: Task[];
  nextCursor: string | null;
};
```

**Step 2: Update `taskNumber` type from `number | null` to `number`**

In the `Task` interface, change:
```typescript
taskNumber: number | null;
```
to:
```typescript
taskNumber: number;
```

Also update `score` to be consistent:
```typescript
score: number | null;
```
(keep as-is, score can be null for legacy tasks)

**Step 3: Commit**

```bash
git add src/types/task.ts
git commit -m "add result types for tool refactor"
```

---

### Task 3: Rewrite Server Actions

This is the core task. Full rewrite of `src/server/actions/tasks.ts`.

**Files:**
- Rewrite: `src/server/actions/tasks.ts`

**Step 1: Write the new server actions file**

Replace the entire contents of `src/server/actions/tasks.ts` with:

```typescript
'use server';

import { eq, and, isNull, sql, desc, ilike, lt, inArray, or } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import type { CreateTaskInput, UpdateTaskInput, ResolveResult, PaginatedTasks } from '@/types/task';

type Owner = { userId?: string; guestId?: string };

const ownerWhere = (owner: Owner) => {
  if (owner.userId) return eq(tasks.userId, owner.userId);
  if (owner.guestId) return eq(tasks.guestId, owner.guestId);
  return null;
};

// --- RESOLVE ---

export const resolveTask = async (
  nameOrNumber: string,
  owner: Owner,
): Promise<ResolveResult> => {
  const ow = ownerWhere(owner);
  if (!ow) return { error: 'No owner provided' };

  const trimmed = nameOrNumber.trim().replace(/^#/, '');

  // Numeric → exact task number lookup
  if (/^\d+$/.test(trimmed)) {
    const [found] = await db
      .select()
      .from(tasks)
      .where(and(ow, eq(tasks.taskNumber, parseInt(trimmed, 10)), isNull(tasks.deletedAt)))
      .limit(1);
    if (!found) return { error: `No task #${trimmed}` };
    return { match: found };
  }

  // Text → ILIKE search
  const matches = await db
    .select()
    .from(tasks)
    .where(and(ow, ilike(tasks.title, `%${trimmed}%`), isNull(tasks.deletedAt)))
    .limit(5);

  if (matches.length === 0) return { error: `No task matching "${trimmed}"` };
  if (matches.length === 1) return { match: matches[0] };

  // Exact match takes priority
  const exact = matches.find((t) => t.title.toLowerCase() === trimmed.toLowerCase());
  if (exact) return { match: exact };

  // Single root match takes priority
  const roots = matches.filter((t) => !t.parentTaskId);
  if (roots.length === 1) return { match: roots[0] };

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

// --- CREATE ---

const getNextTaskNumber = async (owner: Owner): Promise<number> => {
  const ow = ownerWhere(owner);
  if (!ow) return 1;

  const [result] = await db
    .select({ max: sql<number>`COALESCE(MAX(${tasks.taskNumber}), 0)` })
    .from(tasks)
    .where(ow);

  return (result?.max ?? 0) + 1;
};

export const createTasks = async (
  inputs: CreateTaskInput[],
  owner: Owner,
) => {
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

  return db.insert(tasks).values(values).returning();
};

// --- UPDATE ---

export const updateTasksByIds = async (
  ids: string[],
  fields: Omit<UpdateTaskInput, 'id'>,
) => {
  if (ids.length === 0) return [];

  return db
    .update(tasks)
    .set({ ...fields, updatedAt: new Date() })
    .where(inArray(tasks.id, ids))
    .returning();
};

// --- COMPLETE WITH DESCENDANTS (recursive CTE) ---

export const completeWithDescendants = async (id: string): Promise<number> => {
  const result = await db.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id FROM tasks WHERE id = ${id} AND deleted_at IS NULL
      UNION ALL
      SELECT t.id FROM tasks t
      INNER JOIN tree ON t.parent_task_id = tree.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET status = 'done', updated_at = NOW()
    WHERE id IN (SELECT id FROM tree) AND status != 'done'
  `);

  return Number(result.rowCount ?? 0);
};

// --- UNCOMPLETE (set back to todo, including descendants) ---

export const uncompleteWithDescendants = async (id: string): Promise<number> => {
  const result = await db.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id FROM tasks WHERE id = ${id} AND deleted_at IS NULL
      UNION ALL
      SELECT t.id FROM tasks t
      INNER JOIN tree ON t.parent_task_id = tree.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET status = 'todo', updated_at = NOW()
    WHERE id IN (SELECT id FROM tree) AND status = 'done'
  `);

  return Number(result.rowCount ?? 0);
};

// --- DELETE BY IDS (recursive CTE, soft delete) ---

export const deleteByIds = async (ids: string[]): Promise<{ deleted: number; titles: string[] }> => {
  if (ids.length === 0) return { deleted: 0, titles: [] };

  // Get titles before deleting
  const toDelete = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(and(inArray(tasks.id, ids), isNull(tasks.deletedAt)));

  const titles = toDelete.map((t) => t.title);

  // Soft-delete roots + all descendants in one query
  const result = await db.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id FROM tasks WHERE id = ANY(${ids}) AND deleted_at IS NULL
      UNION ALL
      SELECT t.id FROM tasks t
      INNER JOIN tree ON t.parent_task_id = tree.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id IN (SELECT id FROM tree)
  `);

  return { deleted: Number(result.rowCount ?? 0), titles };
};

// --- DELETE BY FILTER (DB-level filter + recursive CTE) ---

export const deleteByFilter = async (
  filter: 'overdue' | 'done' | 'all',
  owner: Owner,
): Promise<{ deleted: number; titles: string[] }> => {
  const ow = ownerWhere(owner);
  if (!ow) return { deleted: 0, titles: [] };

  let filterCondition;
  if (filter === 'overdue') {
    filterCondition = sql`due_date < NOW() AND status != 'done'`;
  } else if (filter === 'done') {
    filterCondition = sql`status = 'done'`;
  } else {
    filterCondition = sql`TRUE`;
  }

  // Get titles of root matches (not descendants)
  const roots = await db.execute(sql`
    SELECT id, title FROM tasks
    WHERE ${ow} AND deleted_at IS NULL AND ${filterCondition}
  `);
  const titles = (roots.rows as { title: string }[]).map((r) => r.title);

  // Delete roots + all descendants
  const result = await db.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id FROM tasks
      WHERE ${ow} AND deleted_at IS NULL AND ${filterCondition}
      UNION ALL
      SELECT t.id FROM tasks t
      INNER JOIN tree ON t.parent_task_id = tree.id
      WHERE t.deleted_at IS NULL
    )
    UPDATE tasks
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id IN (SELECT id FROM tree)
  `);

  return { deleted: Number(result.rowCount ?? 0), titles };
};

// --- LIST (cursor-based pagination) ---

export const listTasks = async (
  owner: Owner,
  options: { cursor?: string; limit?: number; filter?: string; query?: string } = {},
): Promise<PaginatedTasks> => {
  const ow = ownerWhere(owner);
  if (!ow) return { tasks: [], nextCursor: null };

  const limit = options.limit ?? 50;
  const conditions = [ow, isNull(tasks.deletedAt)];

  // Cursor
  if (options.cursor) {
    conditions.push(lt(tasks.createdAt, new Date(options.cursor)));
  }

  // Filters
  if (options.filter === 'overdue') {
    conditions.push(sql`${tasks.dueDate} < NOW()`);
    conditions.push(sql`${tasks.status} != 'done'`);
  } else if (options.filter === 'today') {
    conditions.push(sql`DATE(${tasks.dueDate}) = CURRENT_DATE`);
  } else if (options.filter === 'todo') {
    conditions.push(eq(tasks.status, 'todo'));
  } else if (options.filter === 'done') {
    conditions.push(eq(tasks.status, 'done'));
  }

  // Search query
  if (options.query) {
    conditions.push(ilike(tasks.title, `%${options.query}%`));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;

  return { tasks: page, nextCursor };
};

// --- SEARCH (lightweight) ---

export const searchTasks = async (
  query: string,
  owner: Owner,
) => {
  const ow = ownerWhere(owner);
  if (!ow) return [];

  const trimmed = query.trim().replace(/^#/, '');

  // Numeric → task number
  if (/^\d+$/.test(trimmed)) {
    return db
      .select()
      .from(tasks)
      .where(and(ow, eq(tasks.taskNumber, parseInt(trimmed, 10)), isNull(tasks.deletedAt)))
      .limit(10);
  }

  return db
    .select()
    .from(tasks)
    .where(and(ow, ilike(tasks.title, `%${trimmed}%`), isNull(tasks.deletedAt)))
    .limit(10);
};

// --- SINGLE UPDATE (kept for UI mutations) ---

export const updateTask = async (input: UpdateTaskInput) => {
  const { id, ...fields } = input;
  const [task] = await db
    .update(tasks)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  return task;
};

// --- SINGLE DELETE (kept for UI mutations) ---

export const deleteTask = async (id: string) => {
  await db
    .update(tasks)
    .set({ deletedAt: new Date() })
    .where(eq(tasks.id, id));
};
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
bun run build
```

Fix any type errors.

**Step 3: Commit**

```bash
git add src/server/actions/tasks.ts
git commit -m "rewrite server actions with recursive CTEs and batch operations"
```

---

### Task 4: Rewrite AI Tools

**Files:**
- Rewrite: `src/lib/ai/tools.ts`

**Step 1: Write the new tools file**

Replace the entire contents of `src/lib/ai/tools.ts` with:

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import {
  createTasks,
  resolveTask,
  updateTasksByIds,
  completeWithDescendants,
  deleteByIds,
  deleteByFilter,
  listTasks,
  searchTasks,
} from '@/server/actions/tasks';

type Owner = { userId?: string; guestId?: string };

const subtaskSchema = z.object({
  title: z.string(),
  score: z.number().min(1),
  description: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().describe('YYYY-MM-DDTHH:mm:ss — store exactly what user says, no timezone conversion'),
  score: z.number().min(1).describe('YOU assign this. 1-5 trivial, 6-15 moderate, 16-30 hard, 30+ massive'),
  parentTaskId: z.string().optional().describe('Parent task ID — use this to create subtasks for an existing task'),
  subtasks: z.array(subtaskSchema).optional().describe('Inline subtasks. Scores MUST sum to parent score.'),
});

// Adjust subtask scores to sum to parent score
const adjustScores = (subs: { title: string; score: number; description?: string }[], parentScore: number) => {
  const total = subs.reduce((sum, s) => sum + s.score, 0);
  if (total === parentScore) return subs;

  const adjusted = subs.map((s) => ({
    ...s,
    score: Math.max(1, Math.round((s.score / total) * parentScore)),
  }));

  const adjTotal = adjusted.reduce((sum, s) => sum + s.score, 0);
  const diff = parentScore - adjTotal;
  if (diff !== 0) {
    const largest = adjusted.reduce((max, s, i) => (s.score > adjusted[max].score ? i : max), 0);
    adjusted[largest].score += diff;
  }

  return adjusted;
};

export const makeTaskTools = (owner: Owner) => ({
  createTasks: tool({
    description: 'Create one or more tasks. Include inline subtasks for complex tasks (score 20+). Subtask scores MUST sum to parent score. Also use this to break down an existing task by passing its ID as parentTaskId.',
    inputSchema: z.object({
      tasks: z.array(taskSchema).describe('Tasks to create'),
    }),
    execute: async ({ tasks: inputs }) => {
      try {
        const results = [];

        for (const input of inputs) {
          const { subtasks: subs, ...taskInput } = input;

          const [parent] = await createTasks(
            [{ ...taskInput, dueDate: taskInput.dueDate ? new Date(taskInput.dueDate) : undefined }],
            owner,
          );
          results.push(parent);

          if (subs && subs.length > 0) {
            const adjusted = adjustScores(subs, parent.score ?? 0);
            const children = await createTasks(
              adjusted.map((s) => ({ ...s, parentTaskId: parent.id })),
              owner,
            );
            results.push(...children);
          }
        }

        return results;
      } catch (err) {
        return { error: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
      }
    },
  }),

  completeTasks: tool({
    description: 'Mark tasks as done. Automatically completes all subtasks too.',
    inputSchema: z.object({
      names: z.array(z.string()).describe('Task names or numbers. "task 85" → pass "85". Partial name match works.'),
    }),
    execute: async ({ names }) => {
      const completed: string[] = [];
      const ambiguous: { name: string; matches: { taskNumber: number; title: string }[] }[] = [];
      const notFound: string[] = [];

      for (const name of names) {
        const result = await resolveTask(name, owner);

        if ('error' in result) {
          notFound.push(name);
        } else if ('matches' in result) {
          ambiguous.push({
            name,
            matches: result.matches.map((m) => ({ taskNumber: m.taskNumber!, title: m.title })),
          });
        } else {
          await completeWithDescendants(result.match.id);
          completed.push(result.match.title);
        }
      }

      return { completed, ambiguous, notFound };
    },
  }),

  updateTasks: tool({
    description: 'Update one or more tasks. Use for changing priority, due date, title, status, or score.',
    inputSchema: z.object({
      updates: z.array(z.object({
        name: z.string().describe('Task name or number. "task 196" → pass "196".'),
        title: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        dueDate: z.string().nullable().optional().describe('Set to null to clear due date'),
        score: z.number().min(1).optional(),
      })),
    }),
    execute: async ({ updates }) => {
      const results = [];
      const errors = [];

      for (const { name, ...fields } of updates) {
        const resolved = await resolveTask(name, owner);

        if ('error' in resolved) {
          errors.push(resolved.error);
          continue;
        }
        if ('matches' in resolved) {
          errors.push(`Multiple tasks match "${name}": ${resolved.matches.map((m) => `#${m.taskNumber} ${m.title}`).join(', ')}`);
          continue;
        }

        const updateFields: Record<string, unknown> = {};
        if (fields.title !== undefined) updateFields.title = fields.title;
        if (fields.priority !== undefined) updateFields.priority = fields.priority;
        if (fields.status !== undefined) updateFields.status = fields.status;
        if (fields.score !== undefined) updateFields.score = fields.score;
        if (fields.dueDate !== undefined) {
          updateFields.dueDate = fields.dueDate ? new Date(fields.dueDate) : null;
        }

        const [updated] = await updateTasksByIds([resolved.match.id], updateFields as Omit<UpdateTaskInput, 'id'>);
        results.push(updated);
      }

      return errors.length > 0 ? { results, errors } : results;
    },
  }),

  deleteTasks: tool({
    description: 'Delete tasks and their subtasks. Pass names for specific tasks, OR a filter for bulk delete. Never pass both.',
    inputSchema: z.object({
      names: z.array(z.string()).optional().describe('Task names or numbers. "task 190" → pass "190".'),
      filter: z.enum(['overdue', 'done', 'all']).optional().describe('Bulk delete: "overdue", "done", or "all"'),
    }),
    execute: async ({ names, filter }) => {
      // Filter mode — one DB query
      if (filter) {
        return deleteByFilter(filter, owner);
      }

      // Names mode — resolve then batch delete
      if (names && names.length > 0) {
        const ids: string[] = [];
        const errors: string[] = [];

        for (const name of names) {
          const resolved = await resolveTask(name, owner);
          if ('error' in resolved) {
            errors.push(resolved.error);
          } else if ('matches' in resolved) {
            errors.push(`Multiple tasks match "${name}": ${resolved.matches.map((m) => `#${m.taskNumber} ${m.title}`).join(', ')}`);
          } else {
            ids.push(resolved.match.id);
          }
        }

        const result = await deleteByIds(ids);
        return errors.length > 0 ? { ...result, errors } : result;
      }

      return { deleted: 0, titles: [] };
    },
  }),

  searchTasks: tool({
    description: 'Search tasks by keyword or task number (#N). Returns matches with task numbers.',
    inputSchema: z.object({
      query: z.string().describe('Search keyword or task number'),
    }),
    execute: async ({ query }) => {
      const matches = await searchTasks(query, owner);
      return matches.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        score: t.score,
        status: t.status,
        parentTaskId: t.parentTaskId,
      }));
    },
  }),

  listTasks: tool({
    description: 'List tasks with optional filters and pagination.',
    inputSchema: z.object({
      filter: z.enum(['all', 'overdue', 'today', 'todo', 'done']).optional().describe('Filter tasks'),
      cursor: z.string().optional().describe('Pagination cursor from previous response'),
      limit: z.number().optional().describe('Results per page (default 50)'),
    }),
    execute: async ({ filter, cursor, limit }) => {
      return listTasks(owner, {
        filter: filter === 'all' ? undefined : filter,
        cursor,
        limit,
      });
    },
  }),
});
```

**Step 2: Add missing import to tools.ts**

Make sure `UpdateTaskInput` is imported at the top:
```typescript
import type { UpdateTaskInput } from '@/types/task';
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
bun run build
```

**Step 4: Commit**

```bash
git add src/lib/ai/tools.ts
git commit -m "rewrite AI tools with batch operations and smart resolution"
```

---

### Task 5: Rewrite System Prompt

**Files:**
- Rewrite: `src/lib/ai/system-prompt.ts`

**Step 1: Write the new system prompt**

Replace the entire contents of `src/lib/ai/system-prompt.ts` with:

```typescript
export const getSystemPrompt = (clientTime?: string, clientTimezone?: string) => {
  let today: string;
  let time: string;

  if (clientTime) {
    const parts = clientTime.split(' ');
    today = parts[0] || new Date().toLocaleDateString('en-CA');
    time = parts[1]?.slice(0, 5) || '00:00';
  } else {
    const now = new Date();
    today = now.toLocaleDateString('en-CA');
    time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  return SYSTEM_PROMPT
    .replace(/\{\{TODAY\}\}/g, today)
    .replace(/\{\{TIME\}\}/g, time)
    .replace('{{TIMEZONE}}', clientTimezone || 'UTC');
};

const SYSTEM_PROMPT = `You are Chunky — witty, warm, slightly cheeky productivity agent. Short responses (1-3 sentences). Celebrate wins. Never robotic.

## Time
Today: {{TODAY}}, now: {{TIME}}, timezone: {{TIMEZONE}}

Date format: YYYY-MM-DDTHH:mm:ss (no Z, no conversion). Store exactly what user says.
- "6am" → 06:00:00. "8pm" → 20:00:00
- "in 30 min" → add to {{TIME}}. "tomorrow" → next day 09:00:00
- "next week" → +7 days 09:00:00. No time given → 23:59:59

## Tools

| Tool | Use when |
|------|----------|
| createTasks | Creating new tasks. Include inline subtasks for score 20+. Also use with parentTaskId to break down existing tasks. |
| completeTasks | Marking tasks done. Auto-completes all subtasks. |
| updateTasks | Changing priority, due date, title, status, score. |
| deleteTasks | Deleting specific tasks (by name) OR bulk delete (by filter: overdue/done/all). |
| searchTasks | Finding tasks by keyword or number. Use BEFORE update/delete if name is ambiguous. |
| listTasks | Viewing tasks with filters (overdue/today/todo/done) and pagination. |

## Task Resolution
- User says "task 85" or "#85" → pass "85" to name field
- Exact match → use it. Single partial match → use it. Multiple matches → list them with numbers, ask user which one.
- General references ("the gym task") → prefer root/parent task over subtask
- If task not found, it was likely deleted. Tell user.
- ALWAYS search/list to verify a task exists before operating on it. Don't rely on memory.

## Scoring (YOUR job, never ask the user)

| Range | Level | Examples |
|-------|-------|---------|
| 1-5 | Trivial | Reply to email, take out trash |
| 6-15 | Moderate | Grocery run, write a report |
| 16-30 | Hard | Plan a trip, build a feature |
| 30-100 | Major | Launch a product, move cities |
| 100-500 | Epic | Change careers, write a book |
| 500+ | Legendary | Build a corporation, cure a disease |

No upper limit. Be thoughtful.

## Auto-Breakdown
- Score > 20: auto-break parent with inline subtasks via createTasks. Never auto-break subtasks.
- Score ≤ 20: don't break. User can click "Chunk it" in UI.
- Subtask scores MUST sum to parent score exactly. Distribute by effort.
- User explicitly asks to break down → do it regardless of score, using createTasks with parentTaskId.

## Decision Rules
- Single goal with steps (plan a wedding, start a business) → ONE parent task + subtasks
- Multiple unrelated items (laundry, gym, groceries) → separate top-level tasks
- Enough context → act. Too vague → ask.
- Default to ACTION.

## Batch Operations
- "delete all done" → call deleteTasks with filter "done" (one call)
- "complete task 5 and task 8" → call completeTasks with ["5", "8"]
- Never create what you can filter. Use filter param for bulk ops.

## Hard Rules
1. No tool call = didn't happen. Always call the tool first.
2. Never ask user for score or difficulty.
3. Never ask "what subtasks?" — decide yourself.
4. Never mention numeric scores to user.
5. Always respond in English only.
6. Never respond with just "?" or single characters.
7. Subtask scores MUST sum to parent score.
8. When completeTasks returns ambiguous matches, list them with #numbers and ask.
9. Batch up to 20 tasks per createTasks call.
10. Celebrate completions. Mention XP when natural.`;
```

**Step 2: Commit**

```bash
git add src/lib/ai/system-prompt.ts
git commit -m "rewrite system prompt optimized for gemini flash"
```

---

### Task 6: Update use-tasks Hook

**Files:**
- Modify: `src/hooks/use-tasks.ts`

**Step 1: Update imports and listTasks call**

The `listTasks` server action now returns `PaginatedTasks` instead of `Task[]`. The hook needs to unwrap `.tasks` from the result. Also remove the `createTask` singular import.

Update `src/hooks/use-tasks.ts`:

Replace the import block:
```typescript
import {
  createTask,
  updateTask,
  deleteTask,
  listTasks,
} from '@/server/actions/tasks';
```
with:
```typescript
import {
  createTasks,
  updateTask,
  deleteTask,
  listTasks,
} from '@/server/actions/tasks';
```

Update the query function:
```typescript
queryFn: () => listTasks(owner),
```
to:
```typescript
queryFn: async () => {
  const result = await listTasks(owner);
  return result.tasks;
},
```

Update the create mutation:
```typescript
mutationFn: (input: CreateTaskInput) => createTask(input, owner),
```
to:
```typescript
mutationFn: async (input: CreateTaskInput) => {
  const [task] = await createTasks([input], owner);
  return task;
},
```

**Step 2: Commit**

```bash
git add src/hooks/use-tasks.ts
git commit -m "update use-tasks hook for new server action signatures"
```

---

### Task 7: Update Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Update handleBreakDown**

The `breakDownTask` tool is removed. The AI now uses `createTasks` with `parentTaskId`. Update the chat message:

Replace:
```typescript
const handleBreakDown = useCallback((taskTitle: string) => {
  sendChatRef.current?.(`break down "${taskTitle}" into subtasks`);
}, []);
```
with:
```typescript
const handleBreakDown = useCallback((taskTitle: string) => {
  sendChatRef.current?.(`chunk "${taskTitle}" into subtasks`);
}, []);
```

(No functional change needed — the AI will interpret this correctly with the new prompt. The message is just cleaner.)

**Step 2: Verify everything else still works**

The dashboard uses `updateMutation.mutate({ id, status })` and `deleteMutation.mutate(id)` which still call `updateTask` and `deleteTask` (kept in server actions for UI use). No other changes needed.

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "update dashboard for tool refactor"
```

---

### Task 8: Update Tests

**Files:**
- Rewrite: `__tests__/server/actions/tasks.test.ts`
- Rewrite: `__tests__/lib/ai/tools.test.ts`

**Step 1: Update server actions tests**

Replace `__tests__/server/actions/tasks.test.ts` with tests that cover:
- `resolveTask` — numeric lookup, text ILIKE, exact match, multiple matches, not found
- `createTasks` — batch insert, task number assignment
- `updateTasksByIds` — batch update
- `completeWithDescendants` — recursive CTE (mock `db.execute`)
- `deleteByIds` — recursive CTE soft delete
- `deleteByFilter` — filter-based deletion
- `listTasks` — cursor pagination, filters
- `searchTasks` — ILIKE search

Use the same mock pattern (mock `@/server/db`) but add `db.execute` mock for raw SQL:

```typescript
const mockExecute = vi.fn();

vi.mock('@/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));
```

**Step 2: Update tools tests**

Replace `__tests__/lib/ai/tools.test.ts` — update to expect 6 tools (not 7), remove `breakDownTask` from expected names, update mock imports to match new server action names:

```typescript
vi.mock('@/server/actions/tasks', () => ({
  createTasks: vi.fn(),
  resolveTask: vi.fn(),
  updateTasksByIds: vi.fn(),
  completeWithDescendants: vi.fn(),
  deleteByIds: vi.fn(),
  deleteByFilter: vi.fn(),
  listTasks: vi.fn(),
  searchTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

describe('taskTools', () => {
  it('should export all 6 tools', async () => {
    const { makeTaskTools } = await import('@/lib/ai/tools');
    const taskTools = makeTaskTools({ guestId: 'test' });
    const toolNames = Object.keys(taskTools);

    expect(toolNames).toContain('createTasks');
    expect(toolNames).toContain('completeTasks');
    expect(toolNames).toContain('updateTasks');
    expect(toolNames).toContain('deleteTasks');
    expect(toolNames).toContain('searchTasks');
    expect(toolNames).toContain('listTasks');
    expect(toolNames).not.toContain('breakDownTask');
    expect(toolNames).toHaveLength(6);
  });

  // ... keep description and schema tests
});
```

**Step 3: Run tests**

```bash
bun run test:run
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add __tests__/
git commit -m "update tests for tool refactor"
```

---

### Task 9: Build Verification and Type Check

**Files:** None (verification only)

**Step 1: Full type check**

```bash
bunx tsc --noEmit
```

Expected: No errors.

**Step 2: Full build**

```bash
bun run build
```

Expected: Build succeeds.

**Step 3: Run all tests**

```bash
bun run test:run
```

Expected: All tests pass.

---

### Task 10: Deploy and Verify

**Step 1: Deploy to Railway**

```bash
git push origin main
```

Railway auto-deploys from main.

**Step 2: Run database indexes**

In Supabase SQL editor, run:
```sql
CREATE INDEX IF NOT EXISTS idx_tasks_user_deleted ON tasks (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_guest_deleted ON tasks (guest_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks (parent_task_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_guest ON chat_messages (guest_id);
```

**Step 3: Test in production**

Test these scenarios:
1. "Create a task: plan my vacation" → should create with subtasks if score > 20
2. "Delete all done tasks" → should use filter, one DB query
3. "Complete task 5" → should resolve by number, complete with descendants
4. "Delete task 5 and task 8" → should batch resolve and delete
5. "What are my tasks?" → should list with pagination
6. Create 60+ tasks, then list → pagination should work
