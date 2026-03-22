'use server';

import { eq, or } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import type { CreateTaskInput, UpdateTaskInput } from '@/types/task';

type Owner = { userId?: string; guestId?: string };

const getNextTaskNumber = async (owner: Owner): Promise<number> => {
  const existing = await listTasks(owner);
  const maxNum = existing.reduce((max, t) => Math.max(max, t.taskNumber ?? 0), 0);
  return maxNum + 1;
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

export const deleteTask = async (id: string) => {
  await db.delete(tasks).where(eq(tasks.id, id));
};

export const findTaskByName = async (
  name: string,
  owner: Owner,
) => {
  const allTasks = await listTasks(owner);
  const lower = name.toLowerCase().trim();

  // Match by task number (e.g., "#5" or "5")
  const numMatch = lower.replace('#', '');
  if (/^\d+$/.test(numMatch)) {
    const num = parseInt(numMatch, 10);
    const byNumber = allTasks.find((t) => t.taskNumber === num);
    if (byNumber) return byNumber;
  }

  // Fuzzy match — all words in query must appear in title
  const words = lower.split(/\s+/);
  return allTasks.find((t) => {
    const title = t.title.toLowerCase();
    return words.every((word) => title.includes(word));
  }) ?? null;
};

export const searchTasks = async (
  query: string,
  owner: Owner,
) => {
  const allTasks = await listTasks(owner);
  const lower = query.toLowerCase().trim();

  // Match by task number (e.g., "#5" or "5")
  const numMatch = lower.replace('#', '');
  if (/^\d+$/.test(numMatch)) {
    const num = parseInt(numMatch, 10);
    const byNumber = allTasks.filter((t) => t.taskNumber === num);
    if (byNumber.length > 0) return byNumber;
  }

  // Fuzzy match — all words in query must appear in title
  return allTasks.filter((t) => {
    const title = t.title.toLowerCase();
    const words = lower.split(/\s+/);
    return words.every((word) => title.includes(word));
  });
};

export const listTasks = async (
  owner: Owner,
) => {
  if (!owner.userId && !owner.guestId) return [];

  const conditions = [];

  if (owner.userId) {
    conditions.push(eq(tasks.userId, owner.userId));
  }

  if (owner.guestId) {
    conditions.push(eq(tasks.guestId, owner.guestId));
  }

  const result = await db.select().from(tasks).where(
    conditions.length > 1 ? or(...conditions) : conditions[0],
  );

  return result;
};
