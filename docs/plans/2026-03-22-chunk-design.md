# Chunk — Design Document

> Your chaos, made manageable.

## Overview

Chunk is a chat-first AI productivity app that turns brain dumps into actionable tasks. The primary interface is a persistent chat window — you talk to the AI, and it organizes your chaos. Tasks can be viewed as a list, with a kanban board view planned for a future release.

## Architecture

Single Next.js application deployed on Vercel.

```
Vercel
├── Next.js App
│   ├── Pages / Components (React, shadcn/ui)
│   ├── Server Actions (Task CRUD)
│   ├── API Route /api/chat (AI streaming)
│   └── Better-Auth (Google/GitHub OAuth)
│
├── OpenRouter (AI — cheap model with tool calling)
└── Supabase (Postgres via Drizzle ORM)
```

- Server Actions handle task mutations
- API route streams AI responses via Vercel AI SDK + OpenRouter
- TanStack Query wraps all data fetching with optimistic updates
- Better-Auth handles Google/GitHub OAuth
- Guest state lives in localStorage, syncs to DB on signup

## Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js (latest) | App Router, Turbopack |
| Language | TypeScript (latest) | Strict mode |
| Runtime | Bun | Latest |
| Styling | Tailwind CSS v4 | Strapi design tokens |
| Components | shadcn/ui | Customized with Strapi branding |
| Font | Poppins | Google Fonts |
| DB ORM | Drizzle | Latest |
| Database | Supabase Postgres | Free tier |
| Auth | Better-Auth | Google + GitHub OAuth |
| AI | Vercel AI SDK + OpenRouter | Cheap model, tool calling |
| Data Fetching | TanStack Query | Optimistic updates everywhere |
| Testing | Vitest + React Testing Library + MSW | TDD approach |
| Linting | ESLint (Airbnb config) | Enforced via CI |
| Deployment | Vercel | Single deployment |

## Data Model

### tasks

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | FK → user.id | nullable (guests) |
| guest_id | string | nullable, for localStorage linking |
| title | string | required |
| description | text | nullable |
| priority | string | "low" / "medium" / "high" / "urgent", default "medium" |
| status | string | "todo" / "in_progress" / "done", default "todo" |
| position | float | for ordering, default 0 |
| due_date | timestamp | nullable |
| metadata | jsonb | default {}, escape hatch for future fields |
| created_at | timestamp | default now |
| updated_at | timestamp | auto-updated |

Indexes: user_id, guest_id, status

### chat_messages

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | FK → user.id | nullable (guests) |
| guest_id | string | nullable |
| session_id | uuid | nullable, for future conversation grouping |
| role | string | "user" / "assistant" / "tool" |
| content | text | message content |
| tool_invocations | jsonb | nullable, AI SDK tool call data |
| created_at | timestamp | default now |

Indexes: user_id, guest_id, session_id, created_at

### Auth tables

Managed entirely by Better-Auth (user, session, account, verification). We don't define these.

## Design System

Based on Strapi's brand book, dark mode default.

### Colors

| Token | Hex | Usage |
|---|---|---|
| Strapi Blue | #4945FF | Primary — buttons, links, accents |
| Strapi Dark Blue | #1C1C4E | Dark backgrounds, dark mode base |
| Strapi Light Blue | #9593FF | Hover states, secondary accents |
| White | #FFFFFF | Light backgrounds, text on dark |
| Text Default | #37352F | Body text (light mode) |
| Border | #E9E9E7 | Borders |

### Typography

- Font: Poppins (400, 500, 600, 700)
- Code: Fira Code / Fira Mono
- Headings: weight 600
- Body: weight 400

### Components

- Border radius: 5px
- Pill buttons: border-radius 50px
- shadcn/ui components customized with above tokens

## UI Flow

### State 1: New visitor (no tasks)

Chat is fullscreen, centered. Hero text: "Your chaos, made manageable." Input placeholder: "Type your chaos here..." Subtle CTA to sign up — dismissible, non-blocking. App is fully functional without auth.

### State 2: Tasks exist

Layout splits — task list takes ~70% left, chat slides to ~30% right. Smooth transition animation. Chat remains always visible.

Task list shows: title, priority badge (color-coded), due date, done/not-done toggle. Sorted by priority then due date.

### State 3: Board view (coming soon)

Placeholder in the board tab: "Coming soon. For now, manage your tasks via the list or chat."

## Auth Flow

1. User starts as guest — full app access, data in localStorage
2. Subtle sign-up CTA visible but not forced
3. User signs up via Google or GitHub (Better-Auth)
4. Guest-to-account migration: localStorage data synced to DB with new user_id
5. Subsequent visits: data loads from DB

## AI Behavior

### Personality

Friendly, slightly witty, anti-procrastination buddy. Short responses. Proactive task identification. Asks clarifying questions only when genuinely ambiguous.

### Tools

| Tool | Params | When used |
|---|---|---|
| create_task | title, description?, priority?, due_date?, status? | User mentions something to do |
| update_task | id, fields to update | User changes task details or marks done |
| delete_task | id | User wants to remove a task |
| list_tasks | filter? (status, priority) | AI references existing tasks |

### Context

Load last 20 messages as conversation history. Tasks available via list_tasks tool — not stored in chat context.

### Edge cases

- "done with laundry" → AI calls list_tasks, finds match, calls update_task
- "delete everything" → AI confirms before mass deletion
- Casual chat → AI responds naturally, no tool calls

## Optimistic Updates

All mutations use TanStack Query with optimistic updates:

1. User action triggers mutation
2. onMutate: cancel refetches, snapshot cache, optimistically update UI
3. On success: invalidate queries, refetch true state
4. On error: rollback from snapshot, show error

UI updates are instant. Server syncs in background.

## Testing Strategy

TDD approach with Vitest.

- Unit tests for server actions, AI tools, utilities
- Component tests with React Testing Library
- MSW for mocking network (AI responses, DB calls)
- Optimistic update cycle tested: instant UI → server response → final state / rollback
- Rapid consecutive action consistency tested

## What's NOT in MVP

- Kanban board (coming soon placeholder only)
- Collaboration / shared boards
- Mobile app (web only)
- Recurring tasks
- Sub-tasks / dependencies
- File attachments
- Notifications / reminders
- Calendar integration
- Multiple boards
- Custom kanban columns
- Session context compaction (simple chat history instead)

## Deliverables

1. Simple prototype checkpoint (assessment 1 deliverable)
2. Full working app (assessment 2 deliverable)
3. Documentation (README with setup, features, architecture)

## Project Structure

```
chunk/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts
│   ├── components/
│   │   ├── chat/
│   │   ├── tasks/
│   │   └── ui/              # shadcn/ui components
│   ├── server/
│   │   ├── actions/
│   │   └── db/
│   │       ├── index.ts
│   │       └── schema.ts
│   ├── lib/
│   │   ├── ai/
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── hooks/
│   └── types/
├── __tests__/
├── public/
├── .env.local
├── tailwind.config.ts
├── drizzle.config.ts
├── vitest.config.ts
├── eslint.config.js
└── package.json
```
