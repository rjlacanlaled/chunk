import {
  pgTable,
  uuid,
  text,
  timestamp,
  real,
  jsonb,
} from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  guestId: text('guest_id'),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('todo'),
  position: real('position').notNull().default(0),
  dueDate: timestamp('due_date'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  guestId: text('guest_id'),
  sessionId: uuid('session_id'),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolInvocations: jsonb('tool_invocations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
