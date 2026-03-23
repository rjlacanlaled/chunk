# Chunk — Product Requirements Document

## Project Overview

Chunk is a chat-first AI productivity app. Instead of clicking buttons and filling out forms to create tasks, you just talk to an AI assistant in a chat interface. It figures out what you need, creates the tasks, assigns difficulty scores, breaks big projects into subtasks, and tracks your progress with a gamification system. Think of it as a to-do app that you interact with through conversation.

I built Chunk to explore what a modern AI-powered productivity tool could look like. The goal was to build a complete, deployed web application — not just a toy demo. I wanted to pick something that would be genuinely useful and let me work with a bunch of modern web technologies at the same time.

The name "Chunk" comes from the idea of breaking big, overwhelming tasks into smaller, manageable chunks. That's the core philosophy of the app.

## Problem Statement

Traditional task managers are boring. You open them, stare at a blank list, manually type out tasks, assign priorities by clicking dropdowns, maybe set a due date through a date picker. It's a lot of clicking for something that should be simple.

The bigger problem is that people dump ideas in their head but never organize them. "I need to plan my trip to Rome" stays as a vague intention instead of becoming actionable steps. Most people know what they want to do — they just don't want to spend 10 minutes setting it all up in a task manager.

Chunk solves this by letting you dump your thoughts into a chat. Say "I need to plan my trip to Rome" and the AI creates a parent task, breaks it into subtasks (book flights, find hotels, make an itinerary, etc.), and assigns difficulty scores to each one. You go from a vague idea to an organized plan in seconds.

## Target Users

Primarily students and young professionals who:
- Have a lot on their plate and don't want to spend time organizing it manually
- Are comfortable chatting with AI (most people are, at this point)
- Want something faster and more natural than traditional task managers
- Like gamification — XP, levels, and streaks keep things motivating

For the current scope, I'm targeting a single-user experience. There's no team collaboration or shared workspaces (yet).

## Core Features

### Chat-First Task Management

The entire app revolves around a chat interface. There's no "Create Task" button — you just talk to the AI. The chat panel takes up the full screen when you have no tasks. Once tasks start appearing, the layout splits: task list on the left (70%), chat on the right (30%). This transition is animated so it feels smooth.

Messages persist across sessions. When you come back, your chat history is still there. Messages are stored in the database tied to either a user ID (authenticated) or a guest ID (unauthenticated).

### AI Task Engine

This is the backbone of the app. The AI doesn't just respond with text — it uses tool calling to actually perform actions. Here's what it can do:

- **createTasks** — Create one or more tasks in a single call. Supports inline subtasks and breaking down existing tasks by passing a parent ID.
- **completeTasks** — Mark tasks done by name, number, or bulk keyword query. If a task has subtasks, it completes all of them recursively via a Postgres recursive CTE.
- **updateTasks** — Change title, priority, status, due date, or score for one or more tasks.
- **deleteTasks** — Delete tasks by name/number, or bulk-delete by filter (overdue, done, all). Uses recursive CTEs to cascade to subtasks.
- **searchTasks** — Find tasks by keyword with ILIKE and full-text search (Postgres stemming). If there's ambiguity, it asks the user to clarify.
- **listTasks** — List tasks with optional filters (overdue, today, todo, done) and cursor-based pagination.

The AI is configured to be autonomous. It doesn't ask "what priority should this be?" or "how many subtasks do you want?" — it makes decisions based on context. If you say "plan a wedding," it knows that's a big task (score ~60), creates it, and immediately breaks it down into subtasks without asking.

### Gamification

I added a gamification layer to make task completion feel rewarding. Here's how it works:

**XP System:**
- Completing a task earns XP based on its difficulty score
- Trivial tasks (score 1-5): 5 XP
- Moderate tasks (score 6-15): 15 XP
- Hard tasks (score 16-30): 30 XP
- Major tasks (score 31-100): 50 XP
- Epic tasks (score 101-500): 200 XP
- Legendary tasks (score 500+): 500 XP

**Levels and Medals:**
There are 6 levels, each with a custom medal icon:
1. Starter (0 XP)
2. Builder (100 XP)
3. Chunker (500 XP)
4. Crusher (1,500 XP)
5. Champion (3,500 XP)
6. Legend (10,000 XP)

The XP bar in the header shows your progress toward the next level, along with the current and next medal icons.

**Streaks:**
Daily streaks track consecutive days where you completed at least one task. The streak counter shows up in the header, and there's a visual streak strip showing your completion pattern for the last 7 days.

**Score Summary:**
A score panel shows points earned today, this week, and all time. Completing high-score tasks (20+) triggers confetti.

**Daily Missions:**
A simple daily challenge based on your current task list — complete a certain number of tasks to finish today's mission.

### Task Hierarchy

Tasks can have subtasks, and subtasks can have their own subtasks — it's recursive. The key constraint is that subtask scores must always add up to the parent's score. If a parent task is worth 100 points, its subtasks total exactly 100. This matters because XP is only earned from leaf tasks (tasks with no children), so the math needs to be consistent.

The UI renders this as a nested, collapsible tree. Each level is indented with a visual connector line. Parent tasks show a progress indicator based on how many of their children are complete.

When you check off a parent task, all its descendants get completed too. And it works in reverse — when you complete the last subtask, the parent auto-completes, and this cascades all the way up the tree.

Users can also click a "Chunk it" button on any task to ask the AI to break it down further.

### Guest Mode and Account Migration

You can start using Chunk immediately without signing up. The app generates a guest ID (stored in localStorage) and uses it to associate tasks and messages with your session.

When you decide to sign up (via Google or GitHub OAuth), a migration function runs that reassigns all your guest data — tasks and chat messages — to your new authenticated account. It's seamless; you don't lose anything.

### Authentication

Auth is handled by Better-Auth with two social providers:
- Google OAuth
- GitHub OAuth

I chose Better-Auth because it's lightweight, works well with Drizzle ORM, and handles session management out of the box. The session data lives in PostgreSQL alongside the rest of the app data.

There's a sign-up CTA that appears for guest users, and OAuth buttons in the header for signing in/out.

## Technical Architecture

### Stack Decisions

I chose **Next.js 16** with the App Router because it gives me both frontend and backend in one project. Server Actions let me write database mutations as plain async functions without building a separate API layer. React 19's features (like `use()` and improved Suspense) work nicely with this setup.

**Bun** is the runtime and package manager. It's fast — installs are near-instant and the dev server starts in under a second.

**Supabase** gives me a managed Postgres database for free. I don't have to deal with database hosting, backups, or connection pooling. I just get a connection string and go.

**Drizzle ORM** handles the database layer. I picked it over Prisma because it's lighter, has better TypeScript inference, and the schema-as-code approach feels more natural. Migrations are handled with `drizzle-kit push`.

**TanStack Query** manages all server state. Every database read goes through a query hook, and every write goes through a mutation with optimistic updates. This means the UI updates instantly when you check off a task — the database write happens in the background, and if it fails, the UI rolls back.

**Vercel AI SDK** with **OpenRouter** handles the AI integration. OpenRouter lets me route to different models without changing code. I'm using Gemini 2.5 Flash for its strong tool-calling accuracy and low cost, but I could switch to GPT-4 or Claude with a one-line config change.

### Data Flow

1. User sends a message in the chat panel
2. The message is sent to `/api/chat` as a POST request
3. The API route creates a streaming text response using the Vercel AI SDK
4. The AI processes the message and decides which tools to call
5. Tool calls execute server actions that modify the database
6. The streamed response is rendered in the chat panel
7. After tool execution, TanStack Query invalidates the task list and refetches
8. The UI updates with the new/modified tasks

### API Design

There's really only one API route: `POST /api/chat`. Everything else is handled through server actions, which Next.js calls directly without going through HTTP.

The chat endpoint accepts the message history and an owner object (either `{ userId }` or `{ guestId }`), constructs the tool set for that owner, and streams a response using `streamText()`.

Server actions:
- `createTask` / `createTasks` — insert tasks into the database
- `updateTask` — update any fields on a task
- `deleteTask` — remove a task
- `listTasks` — get all tasks for an owner
- `findTaskByName` — fuzzy match a task by title
- `searchTasks` — search tasks by keyword
- `migrateGuestData` — move guest tasks and messages to an authenticated user

## Database Schema

The database has 5 tables. Four are managed by Better-Auth (user, session, account, verification), and one is mine.

### `tasks` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | TEXT | Authenticated user's ID (nullable) |
| `guest_id` | TEXT | Guest session ID (nullable) |
| `title` | TEXT | Task title |
| `description` | TEXT | Optional description |
| `priority` | TEXT | low, medium, high, or urgent |
| `status` | TEXT | todo, in_progress, or done |
| `position` | REAL | For ordering (future drag-and-drop) |
| `due_date` | TIMESTAMP | Optional due date |
| `parent_task_id` | UUID | Self-referencing FK for subtask hierarchy |
| `score` | REAL | Difficulty score assigned by AI |
| `metadata` | JSONB | Flexible field for future extensions |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last modification time (auto-updates) |

### `chat_messages` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Authenticated user's ID (nullable) |
| `guest_id` | TEXT | Guest session ID (nullable) |
| `session_id` | UUID | Groups messages by chat session |
| `role` | TEXT | user or assistant |
| `content` | TEXT | Message text |
| `tool_invocations` | JSONB | Stored tool call data for replay |
| `created_at` | TIMESTAMP | When the message was sent |

The `user_id`/`guest_id` pattern is repeated in both tables. One of them is always set — either you're authenticated (user_id) or you're a guest (guest_id). The migration function simply swaps guest_id for user_id when you sign up.

The `parent_task_id` on the tasks table is a self-referencing foreign key. This is what enables the recursive subtask hierarchy. A task with `parent_task_id = null` is a top-level task. Anything else is a subtask.

## AI Integration

### How It Works

The AI runs on the server through a single API route (`/api/chat`). Here's the flow:

1. The frontend sends the full message history to the server
2. The server converts messages to model format and calls `streamText()`
3. The AI has access to 6 tools (listed above under AI Task Engine)
4. It can call multiple tools in sequence — up to 20 steps per request
5. The response streams back to the frontend in real-time

### The System Prompt

The system prompt defines the AI's personality and behavior. It's configured to be:
- Witty and warm, like a friend who happens to be great at organizing
- Short in responses (1-3 sentences, never walls of text)
- Autonomous — it makes decisions instead of asking for permission
- Celebratory when tasks are completed

The prompt also contains detailed scoring guidelines so the AI knows that "do laundry" is a 3 and "plan a wedding" is a 60. There's no upper limit on scores — "colonize Mars" could be 1000+.

### Tool Calling

Tools are defined using Zod schemas for input validation. Each tool maps to a server action. The AI decides which tools to call based on the conversation context. For example:

- User says "buy milk" → AI calls `createTasks` with one task, score 2
- User says "plan my move to Berlin" → AI calls `createTasks` with inline subtasks for the parent and its breakdown
- User says "done with grocery shopping" → AI calls `completeTasks` by name
- User says "what's on my list?" → AI calls `listTasks`

The tool-first approach means the AI never just describes what it would do. It always acts first, then confirms what happened.

### Model

Currently using Google Gemini 2.5 Flash via OpenRouter. We upgraded from 2.0 Flash because 2.5 has significantly better tool-calling accuracy — it follows structured schemas more reliably and rarely hallucinates tool results. The model is configured in one place, so switching is trivial.

## Gamification System

### Scoring

Every task gets a difficulty score assigned by the AI. The score is a number with no upper bound. The AI uses rough brackets:
- 1-5: trivial stuff (take out trash, reply to an email)
- 6-15: moderate effort (grocery run, write a report)
- 16-30: hard (plan a trip, build a feature)
- 30-100: major (launch a product, move cities)
- 100-500: epic (change careers, write a book)
- 500+: legendary

When a task is broken into subtasks, the subtask scores are proportionally distributed so they add up to the parent's score. This is enforced both in the system prompt and in the `createTasks` tool logic (with rounding correction).

### XP and Levels

XP is only awarded for completing leaf tasks — tasks with no children. This prevents double-counting (you don't get XP for a parent AND its subtasks). The XP amount is based on the task's score, mapped to one of 6 tiers.

XP is stored in localStorage for now. It persists across sessions but doesn't sync across devices. For v1, this is fine.

Levels are just XP thresholds. Each level has a name and a custom medal SVG. The XP bar in the header shows your progress toward the next level.

### Streaks

A streak counts consecutive days where you completed at least one task. The logic checks the `updatedAt` timestamp of done tasks and groups them by date. If there's a gap of more than one day, the streak resets.

The streak strip is a visual row of 7 dots (last 7 days), colored to show which days had completions. It's a quick at-a-glance view of your recent activity.

## UI/UX Design

### Layout

The app has two main states:

**Empty state** (no tasks): The chat panel takes up 100% of the screen. The AI's welcome message encourages you to start dumping tasks.

**Active state** (has tasks): The layout splits into a 70/30 split — task list on the left, chat on the right. The transition between these states is animated (500ms ease-in-out).

The header contains: logo, XP bar, streak badge, sign-up CTA (for guests), view toggle (list/board), and auth buttons.

### Design System

The visual design is based on the Strapi brand palette:
- Primary: `#4945FF` (a strong purple-blue)
- Dark background: `#1C1C4E`
- Light accent: `#9593FF`
- Font: Poppins (400, 500, 600, 700 weights)
- Border radius: 5px (tight, clean corners)
- Dark mode is the default theme

Components come from shadcn/ui with the base-nova preset, customized to match the color scheme.

### Responsive Behavior

The dashboard uses a responsive layout — 70/30 split on desktop, tab-based switching on mobile and tablets (below 1024px). The landing page is fully responsive with mobile-first media queries.

## Testing Strategy

Tests are written with Vitest and React Testing Library, using MSW for network mocking.

The test structure mirrors `src/`:
- `__tests__/server/actions/tasks.test.ts` — tests for task CRUD server actions
- `__tests__/server/actions/messages.test.ts` — tests for message persistence
- `__tests__/server/actions/migrate-guest.test.ts` — tests for guest-to-user migration
- `__tests__/server/db/schema.test.ts` — schema validation tests
- `__tests__/lib/ai/tools.test.ts` — AI tool definition and execution tests
- `__tests__/lib/auth.test.ts` — auth configuration tests
- `__tests__/hooks/use-tasks.test.tsx` — TanStack Query hook tests
- `__tests__/components/tasks/task-list.test.tsx` — task list rendering tests
- `__tests__/components/chat/chat-panel.test.tsx` — chat panel tests
- `__tests__/app/page.test.tsx` — page-level tests
- `__tests__/app/dashboard/page.test.tsx` — dashboard integration tests

The approach is TDD where it makes sense — server actions and utility functions were test-first. Component tests verify rendering and interaction patterns.

Tests run with `bun run test` (watch mode) or `bun run test:run` (single run).

## Deployment

The app is deployed on Railway. The setup is straightforward:

1. Connect the GitHub repo to Railway
2. Railway auto-detects Next.js and Bun
3. Add all environment variables in the Railway dashboard
4. Deploy

Railway handles the build and serves the app. The Supabase database is external (hosted in EU) but accessible from Railway's servers. The live URL is https://chunk-production.up.railway.app.

Every push to main triggers a production deploy automatically.

## Future Improvements

If I were to keep building this, here's what I'd add:

- **Kanban board** — the board view toggle exists but shows a "coming soon" placeholder. Drag-and-drop columns for todo/in-progress/done would be the natural next step.
- **Workspaces** — multiple task lists for different areas of life (work, personal, school).
- **Calendar view** — show tasks on a calendar based on due dates.
- **Recurring tasks** — daily/weekly tasks that auto-reset.
- **XP sync to database** — right now XP lives in localStorage. Moving it to the database would enable cross-device progress.
- **Notifications** — reminders for upcoming due dates.
- **Mobile layout** — proper responsive design for the main dashboard.
- **Collaboration** — shared task lists, team workspaces, assignments.
- **Voice input** — speak your tasks instead of typing them.

But for now, what's here is a fully working app that does what it says on the tin.
