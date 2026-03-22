'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { tasks, chatMessages } from '@/server/db/schema';

export const migrateGuestData = async (guestId: string, userId: string) => {
  await db.update(tasks)
    .set({ userId, guestId: null })
    .where(eq(tasks.guestId, guestId));

  await db.update(chatMessages)
    .set({ userId, guestId: null })
    .where(eq(chatMessages.guestId, guestId));
};
