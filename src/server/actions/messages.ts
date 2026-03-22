'use server';

import { eq, or, desc } from 'drizzle-orm';
import { db } from '@/server/db';
import { chatMessages } from '@/server/db/schema';

interface SaveMessageInput {
  role: string;
  content: string;
  toolInvocations?: unknown;
  userId?: string;
  guestId?: string;
}

export const saveMessage = async (input: SaveMessageInput) => {
  const [message] = await db.insert(chatMessages).values({
    role: input.role,
    content: input.content,
    toolInvocations: input.toolInvocations ?? null,
    userId: input.userId ?? null,
    guestId: input.guestId ?? null,
  }).returning();

  return message;
};

export const getRecentMessages = async (
  owner: { userId?: string; guestId?: string },
  limit = 20,
) => {
  if (!owner.userId && !owner.guestId) return [];

  const conditions = [];

  if (owner.userId) {
    conditions.push(eq(chatMessages.userId, owner.userId));
  }

  if (owner.guestId) {
    conditions.push(eq(chatMessages.guestId, owner.guestId));
  }

  const rows = await db.select().from(chatMessages).where(
    conditions.length > 1 ? or(...conditions) : conditions[0],
  ).orderBy(desc(chatMessages.createdAt)).limit(limit);

  return rows.reverse();
};
