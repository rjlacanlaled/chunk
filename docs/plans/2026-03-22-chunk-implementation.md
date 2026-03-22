# Chunk Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Chunk — a chat-first AI productivity app that turns brain dumps into actionable tasks.

**Architecture:** Single Next.js 16 app on Vercel. Server Actions for task CRUD, API route for AI streaming via Vercel AI SDK + OpenRouter, TanStack Query for optimistic updates, Better-Auth for OAuth, Drizzle ORM for Supabase Postgres. Guest mode via localStorage with sync-to-DB on signup.

**Tech Stack:** Next.js 16.2.1, TypeScript 5.9.3, Bun, Tailwind CSS 4.2.2, shadcn/ui 4.1.0, Drizzle ORM 0.45.1, Supabase Postgres, Better-Auth 1.5.5, Vercel AI SDK 6.0.134, OpenRouter (via @openrouter/ai-sdk-provider 2.3.1), TanStack Query 5.94.5, Vitest 4.1.0, React Testing Library 16.3.2, MSW 2.12.13, ESLint 10.1.0 + eslint-config-airbnb-extended 3.0.1.

**Design System:** Strapi brand colors (Dark Blue #1C1C4E, Blue #4945FF, Light Blue #9593FF, White #FFFFFF), Poppins font, 5px border-radius, dark mode default. shadcn/ui components customized with these tokens.

**Coding Standards:** Airbnb ESLint rules. TDD. Optimistic updates on all mutations. Frequent commits.

**Design Doc:** `docs/plans/2026-03-22-chunk-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: entire project via `create-next-app`
- Modify: `package.json` (add dependencies)

**Step 1: Scaffold Next.js project with Bun**

```bash
cd /Users/rjlacanlaled/Work/opit/chunk
bunx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-bun --yes
```

Note: This will scaffold into the existing directory. The `--yes` flag accepts defaults.

**Step 2: Install core dependencies**

```bash
bun add @tanstack/react-query drizzle-orm better-auth ai @openrouter/ai-sdk-provider postgres
```

**Step 3: Install dev dependencies**

```bash
bun add -d drizzle-kit vitest @testing-library/react @testing-library/dom @testing-library/jest-dom msw @vitejs/plugin-react jsdom eslint-config-airbnb-extended
```

**Step 4: Install shadcn/ui**

```bash
bunx shadcn@latest init -d
```

Follow prompts: style = default, base color = slate, CSS variables = yes.

**Step 5: Add Poppins font**

Modify `src/app/layout.tsx` — replace the default font import:

```tsx
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})
```

Update the `<html>` tag to use `poppins.variable`.

**Step 6: Verify it runs**

```bash
bun dev
```

Open http://localhost:3000 — should see the Next.js starter page.

**Step 7: Commit**

```bash
git add -A
git commit -m "scaffold next.js project with dependencies"
```

---

## Task 2: CLAUDE.md Coding Guide

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write the coding guide**

Create `CLAUDE.md` at project root with:

```markdown
# Chunk — Coding Guide

## Project Overview

Chunk is a chat-first AI productivity app. Brain dumps → tasks via AI chat.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript 5.9 (strict)
- Bun (runtime + package manager)
- Tailwind CSS v4 + shadcn/ui
- Drizzle ORM + Supabase Postgres
- Better-Auth (Google + GitHub OAuth)
- Vercel AI SDK + OpenRouter
- TanStack Query (optimistic updates)
- Vitest + React Testing Library + MSW

## Coding Conventions

### Style
- ESLint Airbnb config enforced
- Single quotes for strings
- Semicolons required
- 2-space indentation
- Trailing commas in multiline
- Max line length: 100 characters
- Prefer `const` over `let`, never `var`
- Prefer arrow functions for components and callbacks
- Named exports over default exports (except pages)

### Naming
- Components: PascalCase (`TaskList.tsx`)
- Hooks: camelCase with `use` prefix (`useTaskMutations.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Types/Interfaces: PascalCase (`Task`, `ChatMessage`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_MESSAGES`)
- File names: kebab-case for non-components (`auth-client.ts`)
- Server Actions: camelCase verbs (`createTask`, `updateTask`)

### Components
- Use shadcn/ui components from `@/components/ui/`
- Customize with Strapi design tokens, never override shadcn defaults inline
- Keep components small — extract when > 80 lines
- Colocate component-specific types in the same file

### Data Fetching
- All mutations via TanStack Query `useMutation` with optimistic updates
- Server Actions as mutation functions
- `queryClient.invalidateQueries()` on settlement
- Cache snapshot + rollback on error in `onMutate`

### Testing (TDD)
- Write failing test FIRST, then implement
- Tests in `__tests__/` mirroring `src/` structure
- Use MSW for network mocking
- Test optimistic update cycle: instant UI → server response → final/rollback
- Run: `bun test` or `bunx vitest`

### Git
- Commit after each task/subtask
- Commit messages: lowercase, imperative (`add task crud server actions`)
- No co-author tags
- No AI references anywhere in committed files

## Project Structure

```
src/
├── app/                    # Next.js pages + API routes
├── components/
│   ├── chat/               # Chat-related components
│   ├── tasks/              # Task-related components
│   └── ui/                 # shadcn/ui base components
├── server/
│   ├── actions/            # Server Actions
│   └── db/
│       ├── index.ts        # Drizzle client
│       └── schema.ts       # Drizzle schema
├── lib/
│   ├── ai/                 # AI config, tools, system prompt
│   ├── auth.ts             # Better-Auth server config
│   ├── auth-client.ts      # Better-Auth client
│   └── utils.ts            # Shared utilities
├── hooks/                  # Custom React hooks
└── types/                  # Shared TypeScript types
```

## Design System

### Colors (Strapi Brand)
- Primary: `#4945FF` (Strapi Blue) — buttons, links, accents
- Dark: `#1C1C4E` (Strapi Dark Blue) — dark mode backgrounds
- Light: `#9593FF` (Strapi Light Blue) — hover states, secondary
- White: `#FFFFFF` — text on dark, light backgrounds
- Text: `#37352F` — body text (light mode)
- Border: `#E9E9E7` — borders

### Typography
- Font: Poppins (400, 500, 600, 700)
- Headings: weight 600
- Body: weight 400

### Components
- Border radius: 5px (use `rounded-[5px]` or configure in theme)
- Dark mode is the DEFAULT theme
- Use shadcn/ui components, customize via CSS variables in globals.css

## Environment Variables

```
DATABASE_URL=             # Supabase Postgres connection string
BETTER_AUTH_SECRET=        # Random secret for Better-Auth
BETTER_AUTH_URL=           # App URL (http://localhost:3000 in dev)
GOOGLE_CLIENT_ID=          # Google OAuth
GOOGLE_CLIENT_SECRET=      # Google OAuth
GITHUB_CLIENT_ID=          # GitHub OAuth
GITHUB_CLIENT_SECRET=      # GitHub OAuth
OPENROUTER_API_KEY=        # OpenRouter API key
```
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "add coding guide"
```

---

## Task 3: ESLint + Vitest Configuration

**Files:**
- Modify: `eslint.config.js` (replace default)
- Create: `vitest.config.ts`
- Create: `__tests__/setup.ts`

**Step 1: Configure ESLint with Airbnb**

Replace `eslint.config.js` with flat config using `eslint-config-airbnb-extended`:

```js
import airbnb from 'eslint-config-airbnb-extended';

export default [
  ...airbnb,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'import/prefer-default-export': 'off',
      'react/require-default-props': 'off',
      'no-console': 'warn',
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/'],
  },
];
```

**Step 2: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Create test setup file**

Create `__tests__/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

**Step 4: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest",
"test:run": "vitest run",
"lint": "eslint src/"
```

**Step 5: Create a smoke test**

Create `__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

**Step 6: Run tests and lint**

```bash
bun test:run
bun lint
```

Expected: 1 test passes, lint has no errors (or only warnings from starter code).

**Step 7: Commit**

```bash
git add -A
git commit -m "configure eslint airbnb and vitest"
```

---

## Task 4: Design System + shadcn/ui Theming

**Files:**
- Modify: `src/app/globals.css` (Strapi tokens)
- Modify: `src/app/layout.tsx` (dark mode default, Poppins)

**Step 1: Configure Strapi design tokens in globals.css**

Update the CSS variables in `globals.css` to match Strapi's brand. Map shadcn/ui CSS variables to Strapi colors:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 30 5% 20%;
    --card: 0 0% 100%;
    --card-foreground: 30 5% 20%;
    --popover: 0 0% 100%;
    --popover-foreground: 30 5% 20%;
    --primary: 241 100% 64%;
    --primary-foreground: 0 0% 100%;
    --secondary: 243 100% 79%;
    --secondary-foreground: 0 0% 100%;
    --muted: 240 5% 92%;
    --muted-foreground: 30 5% 45%;
    --accent: 241 100% 64%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 40 5% 91%;
    --input: 40 5% 91%;
    --ring: 241 100% 64%;
    --radius: 5px;
    --font-sans: 'Poppins', sans-serif;
  }

  .dark {
    --background: 240 47% 21%;
    --foreground: 0 0% 100%;
    --card: 240 42% 16%;
    --card-foreground: 0 0% 100%;
    --popover: 240 42% 16%;
    --popover-foreground: 0 0% 100%;
    --primary: 241 100% 64%;
    --primary-foreground: 0 0% 100%;
    --secondary: 243 100% 79%;
    --secondary-foreground: 0 0% 100%;
    --muted: 240 30% 28%;
    --muted-foreground: 243 100% 79%;
    --accent: 241 100% 64%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 30% 30%;
    --input: 240 30% 30%;
    --ring: 241 100% 64%;
  }
}
```

Note: HSL values are derived from the Strapi hex codes:
- #4945FF → hsl(241, 100%, 64%) — primary
- #1C1C4E → hsl(240, 47%, 21%) — dark background
- #9593FF → hsl(243, 100%, 79%) — secondary/muted
- #37352F → hsl(30, 5%, 20%) — text
- #E9E9E7 → hsl(40, 5%, 91%) — border

**Step 2: Set dark mode as default in layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Chunk',
  description: 'Your chaos, made manageable.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Install initial shadcn components**

```bash
bunx shadcn@latest add button input card badge dialog scroll-area avatar dropdown-menu
```

**Step 4: Verify dark mode renders**

```bash
bun dev
```

Should see a dark-themed page with Strapi's dark blue background.

**Step 5: Commit**

```bash
git add -A
git commit -m "configure strapi design tokens and dark mode"
```

---

## Task 5: Database Schema (Drizzle + Supabase)

**Files:**
- Create: `src/server/db/schema.ts`
- Create: `src/server/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `.env.local` (not committed)
- Test: `__tests__/server/db/schema.test.ts`

**Step 1: Write the schema test**

Create `__tests__/server/db/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { tasks, chatMessages } from '@/server/db/schema';

describe('database schema', () => {
  describe('tasks table', () => {
    it('should have all required columns', () => {
      const columns = Object.keys(tasks);
      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('guestId');
      expect(columns).toContain('title');
      expect(columns).toContain('description');
      expect(columns).toContain('priority');
      expect(columns).toContain('status');
      expect(columns).toContain('position');
      expect(columns).toContain('dueDate');
      expect(columns).toContain('metadata');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });
  });

  describe('chat_messages table', () => {
    it('should have all required columns', () => {
      const columns = Object.keys(chatMessages);
      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('guestId');
      expect(columns).toContain('sessionId');
      expect(columns).toContain('role');
      expect(columns).toContain('content');
      expect(columns).toContain('toolInvocations');
      expect(columns).toContain('createdAt');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
bunx vitest run __tests__/server/db/schema.test.ts
```

Expected: FAIL — module not found.

**Step 3: Create the schema**

Create `src/server/db/schema.ts`:

```ts
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
```

**Step 4: Create the Drizzle client**

Create `src/server/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
```

**Step 5: Create Drizzle config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 6: Create .env.local**

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
BETTER_AUTH_SECRET=generate-a-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
OPENROUTER_API_KEY=sk-or-xxxxx
```

User must fill in actual values.

**Step 7: Run the schema test**

```bash
bunx vitest run __tests__/server/db/schema.test.ts
```

Expected: PASS

**Step 8: Generate and push migrations**

```bash
bunx drizzle-kit generate
bunx drizzle-kit push
```

**Step 9: Commit**

```bash
git add src/server/db/ drizzle.config.ts drizzle/ __tests__/server/
git commit -m "add database schema and drizzle config"
```

---

## Task 6: Better-Auth Setup

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Test: `__tests__/lib/auth.test.ts`

**Step 1: Write auth config test**

Create `__tests__/lib/auth.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('auth configuration', () => {
  it('should export auth instance', async () => {
    const { auth } = await import('@/lib/auth');
    expect(auth).toBeDefined();
    expect(auth.handler).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
bunx vitest run __tests__/lib/auth.test.ts
```

Expected: FAIL — module not found.

**Step 3: Create Better-Auth server config**

Create `src/lib/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/server/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

**Step 4: Create Better-Auth client**

Create `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
```

**Step 5: Create auth API route**

Create `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

**Step 6: Generate Better-Auth tables**

```bash
bunx @better-auth/cli generate
bunx drizzle-kit push
```

This creates the auth tables (user, session, account, verification) in Supabase.

**Step 7: Run auth test**

```bash
bunx vitest run __tests__/lib/auth.test.ts
```

Expected: PASS

**Step 8: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts src/app/api/auth/ __tests__/lib/auth.test.ts
git commit -m "add better-auth with google and github oauth"
```

---

## Task 7: Task Server Actions (TDD)

**Files:**
- Create: `src/server/actions/tasks.ts`
- Create: `src/types/task.ts`
- Test: `__tests__/server/actions/tasks.test.ts`

**Step 1: Create task types**

Create `src/types/task.ts`:

```ts
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  userId: string | null;
  guestId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  position: number;
  dueDate: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  position?: number;
  dueDate?: Date | null;
}
```

**Step 2: Write failing tests for server actions**

Create `__tests__/server/actions/tasks.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@/server/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'test-id',
          userId: null,
          guestId: 'guest-123',
          title: 'Test task',
          description: null,
          priority: 'medium',
          status: 'todo',
          position: 0,
          dueDate: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'test-id',
            title: 'Updated task',
            priority: 'high',
            status: 'todo',
          }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

describe('task server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTask should create a task and return it', async () => {
    const { createTask } = await import('@/server/actions/tasks');
    const result = await createTask({
      title: 'Test task',
    }, { guestId: 'guest-123' });

    expect(result).toBeDefined();
    expect(result.title).toBe('Test task');
  });

  it('updateTask should update fields and return updated task', async () => {
    const { updateTask } = await import('@/server/actions/tasks');
    const result = await updateTask({
      id: 'test-id',
      title: 'Updated task',
      priority: 'high',
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Updated task');
  });

  it('deleteTask should delete a task by id', async () => {
    const { deleteTask } = await import('@/server/actions/tasks');
    const result = await deleteTask('test-id');
    expect(result).toBeDefined();
  });

  it('listTasks should return tasks for a user or guest', async () => {
    const { listTasks } = await import('@/server/actions/tasks');
    const result = await listTasks({ guestId: 'guest-123' });
    expect(Array.isArray(result)).toBe(true);
  });
});
```

**Step 3: Run tests to verify failure**

```bash
bunx vitest run __tests__/server/actions/tasks.test.ts
```

Expected: FAIL — module not found.

**Step 4: Implement server actions**

Create `src/server/actions/tasks.ts`:

```ts
'use server';

import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import type { CreateTaskInput, UpdateTaskInput } from '@/types/task';

interface OwnerContext {
  userId?: string;
  guestId?: string;
}

export async function createTask(input: CreateTaskInput, owner: OwnerContext) {
  const [task] = await db.insert(tasks).values({
    ...input,
    userId: owner.userId ?? null,
    guestId: owner.guestId ?? null,
  }).returning();

  return task;
}

export async function updateTask(input: UpdateTaskInput) {
  const { id, ...fields } = input;
  const [task] = await db.update(tasks)
    .set(fields)
    .where(eq(tasks.id, id))
    .returning();

  return task;
}

export async function deleteTask(id: string) {
  const result = await db.delete(tasks)
    .where(eq(tasks.id, id));

  return result;
}

export async function listTasks(owner: OwnerContext) {
  const conditions = [];
  if (owner.userId) conditions.push(eq(tasks.userId, owner.userId));
  if (owner.guestId) conditions.push(eq(tasks.guestId, owner.guestId));

  if (conditions.length === 0) return [];

  const result = await db.select().from(tasks)
    .where(conditions.length === 1 ? conditions[0] : or(...conditions));

  return result;
}
```

**Step 5: Run tests**

```bash
bunx vitest run __tests__/server/actions/tasks.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/server/actions/ src/types/ __tests__/server/actions/
git commit -m "add task crud server actions with tests"
```

---

## Task 8: TanStack Query Setup + Task Hooks

**Files:**
- Create: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx` (wrap with providers)
- Create: `src/hooks/use-tasks.ts`
- Test: `__tests__/hooks/use-tasks.test.tsx`

**Step 1: Create providers component**

Create `src/components/providers.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Step 2: Wrap layout with providers**

In `src/app/layout.tsx`, wrap `{children}` with `<Providers>`:

```tsx
import { Providers } from '@/components/providers';

// ... existing code

<body className={`${poppins.variable} font-sans antialiased`}>
  <Providers>{children}</Providers>
</body>
```

**Step 3: Write failing test for task hooks**

Create `__tests__/hooks/use-tasks.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/server/actions/tasks', () => ({
  createTask: vi.fn().mockResolvedValue({
    id: 'new-id',
    title: 'New task',
    priority: 'medium',
    status: 'todo',
  }),
  listTasks: vi.fn().mockResolvedValue([]),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useTaskMutations', () => {
  it('should export create, update, delete mutations', async () => {
    const { useTaskMutations } = await import('@/hooks/use-tasks');
    const { result } = renderHook(() => useTaskMutations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createMutation).toBeDefined();
    expect(result.current.updateMutation).toBeDefined();
    expect(result.current.deleteMutation).toBeDefined();
  });
});
```

**Step 4: Run test to verify failure**

```bash
bunx vitest run __tests__/hooks/use-tasks.test.tsx
```

Expected: FAIL — module not found.

**Step 5: Implement task hooks with optimistic updates**

Create `src/hooks/use-tasks.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, updateTask, deleteTask, listTasks } from '@/server/actions/tasks';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';

const TASKS_KEY = ['tasks'];

export function useTasksQuery(owner: { userId?: string; guestId?: string }) {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => listTasks(owner),
    enabled: !!(owner.userId || owner.guestId),
  });
}

export function useTaskMutations(owner: { userId?: string; guestId?: string } = {}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input, owner),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          userId: owner.userId ?? null,
          guestId: owner.guestId ?? null,
          title: newTask.title,
          description: newTask.description ?? null,
          priority: newTask.priority ?? 'medium',
          status: newTask.status ?? 'todo',
          position: 0,
          dueDate: newTask.dueDate ?? null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Task,
      ]);

      return { previous };
    },
    onError: (_err, _newTask, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(input),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old = []) =>
        old.map((task) =>
          task.id === updated.id ? { ...task, ...updated } : task
        )
      );

      return { previous };
    },
    onError: (_err, _updated, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old = []) =>
        old.filter((task) => task.id !== id)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
```

**Step 6: Run test**

```bash
bunx vitest run __tests__/hooks/use-tasks.test.tsx
```

Expected: PASS

**Step 7: Commit**

```bash
git add src/components/providers.tsx src/hooks/ src/app/layout.tsx __tests__/hooks/
git commit -m "add tanstack query setup with optimistic task hooks"
```

---

## Task 9: AI Chat API Route

**Files:**
- Create: `src/lib/ai/tools.ts`
- Create: `src/lib/ai/system-prompt.ts`
- Create: `src/app/api/chat/route.ts`
- Test: `__tests__/lib/ai/tools.test.ts`

**Step 1: Write AI tools test**

Create `__tests__/lib/ai/tools.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('AI tools', () => {
  it('should export all 4 tools', async () => {
    const { taskTools } = await import('@/lib/ai/tools');
    const toolNames = Object.keys(taskTools);

    expect(toolNames).toContain('createTask');
    expect(toolNames).toContain('updateTask');
    expect(toolNames).toContain('deleteTask');
    expect(toolNames).toContain('listTasks');
    expect(toolNames).toHaveLength(4);
  });

  it('each tool should have a description and parameters', async () => {
    const { taskTools } = await import('@/lib/ai/tools');

    for (const [, tool] of Object.entries(taskTools)) {
      expect(tool.description).toBeDefined();
      expect(tool.parameters).toBeDefined();
    }
  });
});
```

**Step 2: Run test to verify failure**

```bash
bunx vitest run __tests__/lib/ai/tools.test.ts
```

Expected: FAIL

**Step 3: Create system prompt**

Create `src/lib/ai/system-prompt.ts`:

```ts
export const SYSTEM_PROMPT = `You are Chunk, a friendly and slightly witty productivity buddy. Your job is to help people turn their chaotic brain dumps into organized tasks.

Personality:
- Casual, warm, encouraging
- Keep responses short — 1-3 sentences max
- Lightly humorous, anti-procrastination vibe
- Never preachy or lecture-y

Behavior:
- When someone mentions things they need to do, create tasks for them automatically
- Set priorities based on urgency signals (deadlines = high, "whenever" = low)
- If dates are mentioned, set due dates
- If something is ambiguous, ask ONE clarifying question — don't over-ask
- When someone says they finished something, mark it done
- When chatting casually, just be friendly — don't force task creation

Task priorities: low, medium, high, urgent
Task statuses: todo, in_progress, done

Always use the tools available to you to manage tasks. Never just describe what you would do — actually do it.`;
```

**Step 4: Create AI tools**

Create `src/lib/ai/tools.ts`:

```ts
import { tool } from 'ai';
import { z } from 'zod';
import { createTask, updateTask, deleteTask, listTasks } from '@/server/actions/tasks';

export function makeTaskTools(owner: { userId?: string; guestId?: string }) {
  return {
    createTask: tool({
      description: 'Create a new task from something the user needs to do',
      parameters: z.object({
        title: z.string().describe('Short task title'),
        description: z.string().optional().describe('Extra details'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
          .describe('How urgent this is'),
        dueDate: z.string().optional()
          .describe('Due date in ISO format if mentioned'),
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
      }),
      execute: async ({ title, description, priority, dueDate, status }) => {
        const task = await createTask({
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status,
        }, owner);
        return task;
      },
    }),

    updateTask: tool({
      description: 'Update an existing task (change title, priority, status, due date, etc)',
      parameters: z.object({
        id: z.string().describe('The task ID to update'),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        dueDate: z.string().nullable().optional()
          .describe('New due date in ISO format, or null to remove'),
      }),
      execute: async ({ id, title, description, priority, status, dueDate }) => {
        const task = await updateTask({
          id,
          title,
          description,
          priority,
          status,
          dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
        });
        return task;
      },
    }),

    deleteTask: tool({
      description: 'Delete a task permanently',
      parameters: z.object({
        id: z.string().describe('The task ID to delete'),
      }),
      execute: async ({ id }) => {
        await deleteTask(id);
        return { deleted: true, id };
      },
    }),

    listTasks: tool({
      description: 'List all tasks for the current user, optionally filtered by status or priority',
      parameters: z.object({
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      }),
      execute: async () => {
        const allTasks = await listTasks(owner);
        return allTasks;
      },
    }),
  };
}

// Static export for testing tool definitions
export const taskTools = makeTaskTools({ guestId: 'test' });
```

**Step 5: Create the chat API route**

Create `src/app/api/chat/route.ts`:

```ts
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { makeTaskTools } from '@/lib/ai/tools';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
  const { messages, owner } = await req.json();

  const tools = makeTaskTools(owner ?? { guestId: 'anonymous' });

  const result = streamText({
    model: openrouter('google/gemini-flash-1.5'),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
```

Note: `google/gemini-flash-1.5` is cheap and supports tool calling well on OpenRouter. Can be swapped easily.

**Step 6: Run the tools test**

```bash
bunx vitest run __tests__/lib/ai/tools.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add src/lib/ai/ src/app/api/chat/ __tests__/lib/ai/
git commit -m "add ai chat route with openrouter and tool calling"
```

---

## Task 10: Chat UI Component

**Files:**
- Create: `src/components/chat/chat-panel.tsx`
- Create: `src/components/chat/chat-message.tsx`
- Create: `src/components/chat/chat-input.tsx`
- Test: `__tests__/components/chat/chat-panel.test.tsx`

**Step 1: Write chat panel test**

Create `__tests__/components/chat/chat-panel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('ai/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

describe('ChatPanel', () => {
  it('should render the chat input', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel />);

    expect(screen.getByPlaceholderText(/type your chaos/i)).toBeInTheDocument();
  });

  it('should show hero text when no messages exist', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel />);

    expect(screen.getByText(/your chaos, made manageable/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify failure**

```bash
bunx vitest run __tests__/components/chat/chat-panel.test.tsx
```

Expected: FAIL

**Step 3: Create chat message component**

Create `src/components/chat/chat-message.tsx`:

```tsx
import type { Message } from 'ai';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-[5px] px-4 py-2',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-card-foreground'
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
```

**Step 4: Create chat input component**

Create `src/components/chat/chat-input.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormEvent, ChangeEvent } from 'react';

interface ChatInputProps {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({ input, onInputChange, onSubmit, isLoading }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={input}
        onChange={onInputChange}
        placeholder="Type your chaos here..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !input.trim()}>
        Send
      </Button>
    </form>
  );
}
```

**Step 5: Create chat panel component**

Create `src/components/chat/chat-panel.tsx`:

```tsx
'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

interface ChatPanelProps {
  owner?: { userId?: string; guestId?: string };
  onTasksChanged?: () => void;
}

export function ChatPanel({ owner, onTasksChanged }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { owner },
    onFinish: () => {
      onTasksChanged?.();
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <h1 className="text-3xl font-semibold text-foreground">
            Your chaos, made manageable.
          </h1>
          <p className="text-muted-foreground text-sm">
            Tell me what&apos;s on your mind. I&apos;ll turn it into tasks.
          </p>
        </div>
      ) : (
        <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </ScrollArea>
      )}

      <div className="p-4 border-t border-border">
        <ChatInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
```

**Step 6: Run tests**

```bash
bunx vitest run __tests__/components/chat/chat-panel.test.tsx
```

Expected: PASS

**Step 7: Commit**

```bash
git add src/components/chat/ __tests__/components/chat/
git commit -m "add chat panel with message display and input"
```

---

## Task 11: Task List UI Component

**Files:**
- Create: `src/components/tasks/task-list.tsx`
- Create: `src/components/tasks/task-item.tsx`
- Test: `__tests__/components/tasks/task-list.test.tsx`

**Step 1: Write task list test**

Create `__tests__/components/tasks/task-list.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/server/actions/tasks', () => ({
  listTasks: vi.fn().mockResolvedValue([]),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('TaskList', () => {
  it('should render task items', async () => {
    const { TaskList } = await import('@/components/tasks/task-list');
    const tasks = [
      { id: '1', title: 'Buy groceries', priority: 'low', status: 'todo', dueDate: null },
      { id: '2', title: 'Fix bug', priority: 'high', status: 'todo', dueDate: null },
    ];

    render(
      <Wrapper>
        <TaskList tasks={tasks as any} />
      </Wrapper>
    );

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Fix bug')).toBeInTheDocument();
  });

  it('should show empty state when no tasks', async () => {
    const { TaskList } = await import('@/components/tasks/task-list');
    render(
      <Wrapper>
        <TaskList tasks={[]} />
      </Wrapper>
    );

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify failure**

```bash
bunx vitest run __tests__/components/tasks/task-list.test.tsx
```

Expected: FAIL

**Step 3: Create task item component**

Create `src/components/tasks/task-item.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggleDone?: (id: string, done: boolean) => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-muted text-muted-foreground',
};

export function TaskItem({ task, onToggleDone }: TaskItemProps) {
  const isDone = task.status === 'done';

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-[5px] border border-border',
      isDone && 'opacity-50'
    )}>
      <button
        type="button"
        onClick={() => onToggleDone?.(task.id, !isDone)}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
          isDone ? 'bg-primary border-primary' : 'border-muted-foreground'
        )}
      >
        {isDone && <span className="text-primary-foreground text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isDone && 'line-through'
        )}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <Badge className={cn('text-xs', priorityColors[task.priority])}>
        {task.priority}
      </Badge>
    </div>
  );
}
```

**Step 4: Create task list component**

Create `src/components/tasks/task-list.tsx`:

```tsx
'use client';

import { TaskItem } from './task-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onToggleDone?: (id: string, done: boolean) => void;
}

export function TaskList({ tasks, onToggleDone }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No tasks yet. Start chatting to create some!</p>
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4">
        {sorted.map((task) => (
          <TaskItem key={task.id} task={task} onToggleDone={onToggleDone} />
        ))}
      </div>
    </ScrollArea>
  );
}
```

**Step 5: Run tests**

```bash
bunx vitest run __tests__/components/tasks/task-list.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/tasks/ __tests__/components/tasks/
git commit -m "add task list and task item components"
```

---

## Task 12: Main Page — Layout Transitions

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/hooks/use-guest.ts`
- Test: `__tests__/app/page.test.tsx`

**Step 1: Write page layout test**

Create `__tests__/app/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('ai/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

vi.mock('@/server/actions/tasks', () => ({
  listTasks: vi.fn().mockResolvedValue([]),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('Home Page', () => {
  it('should render fullscreen chat when no tasks exist', async () => {
    const Page = (await import('@/app/page')).default;
    render(<Wrapper><Page /></Wrapper>);

    expect(screen.getByText(/your chaos, made manageable/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type your chaos/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify failure**

```bash
bunx vitest run __tests__/app/page.test.tsx
```

Expected: FAIL

**Step 3: Create guest ID hook**

Create `src/hooks/use-guest.ts`:

```ts
'use client';

import { useState, useEffect } from 'react';

const GUEST_ID_KEY = 'chunk-guest-id';

function generateId() {
  return crypto.randomUUID();
}

export function useGuestId() {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    setGuestId(id);
  }, []);

  return guestId;
}
```

**Step 4: Build the main page**

Modify `src/app/page.tsx`:

```tsx
'use client';

import { useSession } from '@/lib/auth-client';
import { useGuestId } from '@/hooks/use-guest';
import { useTasksQuery, useTaskMutations } from '@/hooks/use-tasks';
import { ChatPanel } from '@/components/chat/chat-panel';
import { TaskList } from '@/components/tasks/task-list';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function Home() {
  const { data: session } = useSession();
  const guestId = useGuestId();
  const queryClient = useQueryClient();

  const owner = session?.user
    ? { userId: session.user.id }
    : { guestId: guestId ?? undefined };

  const { data: tasks = [] } = useTasksQuery(owner);
  const { updateMutation } = useTaskMutations(owner);

  const hasTasks = tasks.length > 0;

  const handleToggleDone = (id: string, done: boolean) => {
    updateMutation.mutate({ id, status: done ? 'done' : 'todo' });
  };

  const handleTasksChanged = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <main className="h-screen flex flex-col bg-background">
      <header className="h-[45px] flex items-center justify-between px-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Chunk</h1>
        <div className="flex items-center gap-2">
          {hasTasks && (
            <>
              <button type="button" className="text-sm text-primary font-medium">List</button>
              <button type="button" className="text-sm text-muted-foreground">Board</button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {hasTasks && (
          <div className={cn('border-r border-border transition-all duration-300', 'w-[70%]')}>
            <TaskList tasks={tasks as any} onToggleDone={handleToggleDone} />
          </div>
        )}

        <div className={cn(
          'transition-all duration-300',
          hasTasks ? 'w-[30%]' : 'w-full'
        )}>
          <ChatPanel owner={owner} onTasksChanged={handleTasksChanged} />
        </div>
      </div>
    </main>
  );
}
```

**Step 5: Run tests**

```bash
bunx vitest run __tests__/app/page.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/app/page.tsx src/hooks/use-guest.ts __tests__/app/page.test.tsx
git commit -m "add main page with adaptive chat and task layout"
```

---

## Task 13: Guest-to-Account Migration

**Files:**
- Create: `src/server/actions/migrate-guest.ts`
- Create: `src/hooks/use-auth-with-migration.ts`
- Test: `__tests__/server/actions/migrate-guest.test.ts`

**Step 1: Write migration test**

Create `__tests__/server/actions/migrate-guest.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
});

vi.mock('@/server/db', () => ({
  db: {
    update: () => mockUpdate(),
  },
}));

describe('migrateGuestData', () => {
  it('should export a migrateGuestData function', async () => {
    const { migrateGuestData } = await import('@/server/actions/migrate-guest');
    expect(migrateGuestData).toBeDefined();
    expect(typeof migrateGuestData).toBe('function');
  });
});
```

**Step 2: Run test to verify failure**

```bash
bunx vitest run __tests__/server/actions/migrate-guest.test.ts
```

Expected: FAIL

**Step 3: Implement migration action**

Create `src/server/actions/migrate-guest.ts`:

```ts
'use server';

import { db } from '@/server/db';
import { tasks, chatMessages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function migrateGuestData(guestId: string, userId: string) {
  await db.update(tasks)
    .set({ userId, guestId: null })
    .where(eq(tasks.guestId, guestId));

  await db.update(chatMessages)
    .set({ userId, guestId: null })
    .where(eq(chatMessages.guestId, guestId));

  return { migrated: true };
}
```

**Step 4: Create auth hook with migration**

Create `src/hooks/use-auth-with-migration.ts`:

```ts
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { migrateGuestData } from '@/server/actions/migrate-guest';
import { useQueryClient } from '@tanstack/react-query';

const GUEST_ID_KEY = 'chunk-guest-id';

export function useAuthWithMigration() {
  const { data: session, isPending } = useSession();
  const hasMigrated = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isPending || hasMigrated.current) return;
    if (!session?.user) return;

    const guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) return;

    hasMigrated.current = true;

    migrateGuestData(guestId, session.user.id).then(() => {
      localStorage.removeItem(GUEST_ID_KEY);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
  }, [session, isPending, queryClient]);

  return { session, isPending };
}
```

**Step 5: Run tests**

```bash
bunx vitest run __tests__/server/actions/migrate-guest.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/server/actions/migrate-guest.ts src/hooks/use-auth-with-migration.ts __tests__/server/actions/migrate-guest.test.ts
git commit -m "add guest to account data migration"
```

---

## Task 14: Auth UI (Sign Up CTA + OAuth Buttons)

**Files:**
- Create: `src/components/auth/sign-up-cta.tsx`
- Create: `src/components/auth/auth-buttons.tsx`
- Modify: `src/app/page.tsx` (add CTA)

**Step 1: Create sign up CTA**

Create `src/components/auth/sign-up-cta.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signIn } from '@/lib/auth-client';

export function SignUpCta() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className="mx-4 mt-2 p-3 flex items-center justify-between bg-card border-border">
      <p className="text-sm text-muted-foreground">
        Sign up to save your stuff across visits
      </p>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
        >
          Later
        </Button>
        <Button
          size="sm"
          onClick={() => signIn.social({ provider: 'google' })}
        >
          Sign up
        </Button>
      </div>
    </Card>
  );
}
```

**Step 2: Create auth buttons for header**

Create `src/components/auth/auth-buttons.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { signIn, signOut, useSession } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AuthButtons() {
  const { data: session } = useSession();

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-7 w-7 cursor-pointer">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback>{session.user.name?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut()}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={() => signIn.social({ provider: 'google' })}>
      Sign in
    </Button>
  );
}
```

**Step 3: Add CTA and auth buttons to page**

Update `src/app/page.tsx` header and add `<SignUpCta />` below header when user is a guest. Import `useAuthWithMigration` instead of `useSession`.

**Step 4: Install additional shadcn components if needed**

```bash
bunx shadcn@latest add avatar dropdown-menu
```

(Skip if already installed in Task 4.)

**Step 5: Commit**

```bash
git add src/components/auth/ src/app/page.tsx
git commit -m "add sign up cta and auth buttons"
```

---

## Task 15: Chat Message Persistence

**Files:**
- Create: `src/server/actions/messages.ts`
- Modify: `src/app/api/chat/route.ts` (save messages)
- Test: `__tests__/server/actions/messages.test.ts`

**Step 1: Write messages test**

Create `__tests__/server/actions/messages.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}));

describe('message actions', () => {
  it('should export saveMessage and getRecentMessages', async () => {
    const { saveMessage, getRecentMessages } = await import('@/server/actions/messages');
    expect(saveMessage).toBeDefined();
    expect(getRecentMessages).toBeDefined();
  });
});
```

**Step 2: Run test to verify failure**

```bash
bunx vitest run __tests__/server/actions/messages.test.ts
```

Expected: FAIL

**Step 3: Implement message actions**

Create `src/server/actions/messages.ts`:

```ts
'use server';

import { db } from '@/server/db';
import { chatMessages } from '@/server/db/schema';
import { eq, or, desc } from 'drizzle-orm';

interface MessageInput {
  role: string;
  content: string;
  toolInvocations?: unknown;
  userId?: string;
  guestId?: string;
}

export async function saveMessage(input: MessageInput) {
  await db.insert(chatMessages).values({
    role: input.role,
    content: input.content,
    toolInvocations: input.toolInvocations ?? null,
    userId: input.userId ?? null,
    guestId: input.guestId ?? null,
  });
}

export async function getRecentMessages(
  owner: { userId?: string; guestId?: string },
  limit = 20,
) {
  const conditions = [];
  if (owner.userId) conditions.push(eq(chatMessages.userId, owner.userId));
  if (owner.guestId) conditions.push(eq(chatMessages.guestId, owner.guestId));

  if (conditions.length === 0) return [];

  const messages = await db.select().from(chatMessages)
    .where(conditions.length === 1 ? conditions[0] : or(...conditions))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return messages.reverse();
}
```

**Step 4: Update chat API route to save messages**

Modify `src/app/api/chat/route.ts` to save user and assistant messages after streaming completes. Use the `onFinish` callback in `streamText` to save the assistant message, and save the user message before streaming.

**Step 5: Run tests**

```bash
bunx vitest run __tests__/server/actions/messages.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/server/actions/messages.ts src/app/api/chat/route.ts __tests__/server/actions/messages.test.ts
git commit -m "add chat message persistence"
```

---

## Task 16: Kanban "Coming Soon" Placeholder

**Files:**
- Create: `src/components/tasks/board-placeholder.tsx`
- Modify: `src/app/page.tsx` (add view toggle)

**Step 1: Create board placeholder**

Create `src/components/tasks/board-placeholder.tsx`:

```tsx
export function BoardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <div className="text-4xl">🚀</div>
      <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
      <p className="text-sm text-center max-w-xs">
        Board view is on its way. For now, manage your tasks via the list or just chat!
      </p>
    </div>
  );
}
```

**Step 2: Add view toggle to page**

Update `src/app/page.tsx` to support `view` state (`'list' | 'board'`). When `view === 'board'`, render `<BoardPlaceholder />` instead of `<TaskList />`.

**Step 3: Commit**

```bash
git add src/components/tasks/board-placeholder.tsx src/app/page.tsx
git commit -m "add kanban board coming soon placeholder"
```

---

## Task 17: Prototype Checkpoint (Assessment 1)

At this point the app should have:
- Chat UI with hero text
- Task list that renders
- Basic auth buttons
- Design system applied
- Coming soon board placeholder

**Step 1: Verify the app runs**

```bash
bun dev
```

Open http://localhost:3000 — verify the chat-first interface renders with Strapi styling.

**Step 2: Tag as prototype**

```bash
git tag prototype-v1
```

This tag serves as the assessment 1 deliverable checkpoint.

**Step 3: Continue to full implementation**

No commit needed — tag only.

---

## Task 18: README Documentation

**Files:**
- Create: `README.md`

**Step 1: Write the README**

Create `README.md` with:

```markdown
# Chunk

> Your chaos, made manageable.

Chunk is a chat-first AI productivity app that turns brain dumps into actionable tasks. Talk to the AI and it organizes everything for you.

## Features

- **Chat-first interface** — just type what's on your mind
- **AI-powered task creation** — the AI identifies tasks, sets priorities, and due dates
- **Task list view** — see all your tasks sorted by priority and due date
- **Guest mode** — start using immediately without signing up
- **Account persistence** — sign up with Google or GitHub to save your data
- **Dark mode** — default dark theme with Strapi-inspired design

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (PostgreSQL) via Drizzle ORM
- **Auth:** Better-Auth (Google + GitHub OAuth)
- **AI:** Vercel AI SDK + OpenRouter
- **State:** TanStack Query with optimistic updates
- **Testing:** Vitest + React Testing Library

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- [Supabase](https://supabase.com/) project (free tier)
- [OpenRouter](https://openrouter.ai/) API key
- Google and/or GitHub OAuth credentials

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rjlacanlaled/chunk.git
   cd chunk
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

4. Push the database schema:
   ```bash
   bunx drizzle-kit push
   ```

5. Run the development server:
   ```bash
   bun dev
   ```

6. Open http://localhost:3000

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string |
| `BETTER_AUTH_SECRET` | Random secret for auth sessions |
| `BETTER_AUTH_URL` | App URL (http://localhost:3000 in dev) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `OPENROUTER_API_KEY` | OpenRouter API key |

## Testing

```bash
bun test        # watch mode
bun test:run    # single run
```

## Project Structure

```
src/
├── app/          # Pages and API routes
├── components/   # React components (chat, tasks, ui)
├── server/       # Server actions and database
├── lib/          # Auth, AI, utilities
├── hooks/        # Custom React hooks
└── types/        # TypeScript types
```

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
bunx vercel
```

Set all environment variables in the Vercel dashboard.
```

**Step 2: Create .env.example**

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
OPENROUTER_API_KEY=
```

**Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "add readme and env example"
```

---

## Task 19: Deployment to Vercel

**Step 1: Deploy**

```bash
bunx vercel
```

Follow prompts to link to the Vercel project.

**Step 2: Set environment variables**

In the Vercel dashboard, add all env vars from `.env.local`.

**Step 3: Deploy to production**

```bash
bunx vercel --prod
```

**Step 4: Verify**

Open the production URL and verify:
- Dark mode renders correctly
- Chat input works
- Auth buttons appear
- Can create tasks via chat (requires OpenRouter key set)

**Step 5: Update BETTER_AUTH_URL**

Set `BETTER_AUTH_URL` to the production URL in Vercel env vars. Redeploy.

**Step 6: Commit any config changes**

```bash
git add -A
git commit -m "configure vercel deployment"
```

---

## Execution Order Summary

| Task | Description | Dependencies |
|---|---|---|
| 1 | Project scaffolding | None |
| 2 | CLAUDE.md coding guide | 1 |
| 3 | ESLint + Vitest config | 1 |
| 4 | Design system + shadcn theming | 1 |
| 5 | Database schema (Drizzle) | 1 |
| 6 | Better-Auth setup | 5 |
| 7 | Task server actions (TDD) | 5 |
| 8 | TanStack Query + task hooks | 7 |
| 9 | AI chat API route | 7 |
| 10 | Chat UI component | 4, 8 |
| 11 | Task list UI component | 4, 8 |
| 12 | Main page layout | 10, 11 |
| 13 | Guest-to-account migration | 6, 7 |
| 14 | Auth UI (CTA + buttons) | 6, 12 |
| 15 | Chat message persistence | 5, 9 |
| 16 | Kanban placeholder | 12 |
| 17 | Prototype checkpoint | 12 |
| 18 | README documentation | All |
| 19 | Vercel deployment | All |

**Parallelizable groups:**
- Tasks 2, 3, 4, 5 can run in parallel after Task 1
- Tasks 6, 7 can run in parallel after Task 5
- Tasks 8, 9 can run in parallel after Task 7
- Tasks 10, 11 can run in parallel after Tasks 4 + 8
- Tasks 13, 14, 15, 16 can run in parallel after their deps
