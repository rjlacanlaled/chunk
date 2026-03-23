'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { user } from '@/server/db/schema';

export const getXp = async (userId: string): Promise<number> => {
  const [row] = await db
    .select({ xp: user.xp })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.xp ?? 0;
};

export const updateXp = async (userId: string, xp: number): Promise<void> => {
  await db
    .update(user)
    .set({ xp: Math.max(0, xp) })
    .where(eq(user.id, userId));
};
