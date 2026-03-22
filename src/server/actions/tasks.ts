'use server';

import { eq, or, and, isNull, sql, desc } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import type { CreateTaskInput, UpdateTaskInput } from '@/types/task';

type Owner = { userId?: string; guestId?: string };

// Get max task number using SQL MAX() — much faster than pulling all rows
const getNextTaskNumber = async (owner: Owner): Promise<number> => {
  const conditions = [];
  if (owner.userId) conditions.push(eq(tasks.userId, owner.userId));
  if (owner.guestId) conditions.push(eq(tasks.guestId, owner.guestId));

  if (conditions.length === 0) return 1;

  const [result] = await db
    .select({ max: sql<number>`COALESCE(MAX(${tasks.taskNumber}), 0)` })
    .from(tasks)
    .where(conditions.length > 1 ? or(...conditions) : conditions[0]!);

  return (result?.max ?? 0) + 1;
};

export const createTask = async (
  input: CreateTaskInput,
  owner: Owner,
) => {
  const taskNumber = await getNextTaskNumber(owner);

  const [task] = await db.insert(tasks).values({
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'medium',
    status: input.status ?? 'todo',
    dueDate: input.dueDate ?? null,
    parentTaskId: input.parentTaskId ?? null,
    score: input.score ?? null,
    taskNumber,
    userId: owner.userId ?? null,
    guestId: owner.guestId ?? null,
  }).returning();

  return task;
};

export const createTasks = async (
  inputs: CreateTaskInput[],
  owner: Owner,
) => {
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
  return result;
};

export const updateTask = async (input: UpdateTaskInput) => {
  const { id, ...fields } = input;

  const [task] = await db.update(tasks)
    .set(fields)
    .where(eq(tasks.id, id))
    .returning();

  return task;
};

// Soft delete — sets deletedAt timestamp instead of removing from DB
export const deleteTask = async (id: string) => {
  await db.update(tasks)
    .set({ deletedAt: new Date() })
    .where(eq(tasks.id, id));
};

export const findTaskByName = async (
  name: string,
  owner: Owner,
) => {
  const allTasks = await listTasks(owner);
  const lower = name.toLowerCase().trim();

  // Match by task number
  const numMatch = lower.replace('#', '');
  if (/^\d+$/.test(numMatch)) {
    const num = parseInt(numMatch, 10);
    const byNumber = allTasks.find((t) => t.taskNumber === num);
    if (byNumber) return byNumber;
  }

  // Fuzzy match by title — prefer parent tasks over subtasks
  const words = lower.split(/\s+/);
  const matches = allTasks.filter((t) => {
    const title = t.title.toLowerCase();
    return words.every((word) => title.includes(word));
  });

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Prefer root tasks (no parent) over subtasks
  const root = matches.find((t) => !t.parentTaskId);
  return root ?? matches[0];
};

export const searchTasks = async (
  query: string,
  owner: Owner,
) => {
  const allTasks = await listTasks(owner);
  const lower = query.toLowerCase().trim();

  // Match by task number
  const numMatch = lower.replace('#', '');
  if (/^\d+$/.test(numMatch)) {
    const num = parseInt(numMatch, 10);
    return allTasks.filter((t) => t.taskNumber === num);
  }

  // Fuzzy match
  const words = lower.split(/\s+/);
  return allTasks.filter((t) => {
    const title = t.title.toLowerCase();
    return words.every((word) => title.includes(word));
  });
};

// Only returns non-deleted tasks, limited to 200 most recent
export const listTasks = async (owner: Owner, limit = 200) => {
  if (!owner.userId && !owner.guestId) return [];

  const conditions = [];

  if (owner.userId) {
    conditions.push(eq(tasks.userId, owner.userId));
  }

  if (owner.guestId) {
    conditions.push(eq(tasks.guestId, owner.guestId));
  }

  const ownerCondition = conditions.length > 1 ? or(...conditions) : conditions[0]!;

  const result = await db.select().from(tasks).where(
    and(ownerCondition, isNull(tasks.deletedAt)),
  ).orderBy(desc(tasks.createdAt)).limit(limit);

  return result;
};
