'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks, chatMessages, user } from '@/server/db/schema';

export const migrateGuestData = async (guestId: string, userId: string, guestXp?: number) => {
  // Check if the signed-in account already has data
  const existingTasks = await db.select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .limit(1);

  if (existingTasks.length > 0) {
    // Account already has data — delete guest data instead of merging
    // The signed-in session's data wins
    await db.delete(tasks).where(eq(tasks.guestId, guestId));
    await db.delete(chatMessages).where(eq(chatMessages.guestId, guestId));
    return { action: 'discarded', reason: 'account already has data' };
  }

  // Account is fresh — migrate guest data to the account
  await db.update(tasks)
    .set({ userId, guestId: null })
    .where(eq(tasks.guestId, guestId));

  await db.update(chatMessages)
    .set({ userId, guestId: null })
    .where(eq(chatMessages.guestId, guestId));

  // Migrate guest XP to the user row
  if (guestXp && guestXp > 0) {
    await db.update(user)
      .set({ xp: guestXp })
      .where(eq(user.id, userId));
  }

  return { action: 'migrated' };
};
