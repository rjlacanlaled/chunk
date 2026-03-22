'use server';

import { eq, or } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import type { CreateTaskInput, UpdateTaskInput } from '@/types/task';

export const createTask = async (
  input: CreateTaskInput,
  owner: { userId?: string; guestId?: string },
) => {
  const [task] = await db.insert(tasks).values({
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'medium',
    status: input.status ?? 'todo',
    dueDate: input.dueDate ?? null,
    userId: owner.userId ?? null,
    guestId: owner.guestId ?? null,
  }).returning();

  return task;
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

export const listTasks = async (
  owner: { userId?: string; guestId?: string },
) => {
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
