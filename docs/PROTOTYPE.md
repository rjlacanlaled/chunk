# Chunk — Design Journey & Prototype

## Why this exists

This document tells the story of how Chunk went from a vague idea to a working app. It covers the original prototype thinking, the key decisions we made along the way, and what the final product looks like compared to where we started.

If you're reviewing this for Assessment 2, this is the "design process" document — it shows that we didn't just jump into code. We thought about what we were building, why, and how.

## The original idea

The starting point was frustration with traditional task managers. They all work the same way: click "New Task", fill out a form, pick a priority from a dropdown, maybe add a due date through a calendar widget. It's a lot of friction for something that should be simple.

The insight was: what if you could just *talk* about what you need to do, and the app figured out the rest?

That's the core of Chunk. You type "I need to plan my trip to Rome" into a chat, and the AI creates a parent task, breaks it into subtasks (book flights, find hotels, make an itinerary), assigns difficulty scores, and sets it all up. You go from a vague thought to an organized plan in seconds.

The name "Chunk" comes from chunking — the idea of breaking big, overwhelming things into smaller, manageable pieces.

## Prototype specification

Here's what we designed as the minimum viable product before writing any code.

### Core screens

**Screen 1: Chat (full width)**
When you first open the app, there are no tasks yet. The entire screen is the chat interface — a clean input field with suggestion buttons like "I have 5 things due this week" or "Help me plan my day." This is intentional. The chat is the entry point, not a sidebar.

**Screen 2: Dashboard (split layout)**
Once tasks exist, the layout splits. Tasks take up the left side, chat takes up the right. On desktop, it's roughly 70/30. On mobile, you switch between them with a tab bar at the bottom — you're either looking at your tasks or talking to Chunky.

**Screen 3: Landing page**
A static marketing page explaining what Chunk does, with a clear call-to-action to get started. Features the Chunky mascot and animated task cards to show the app in action.

### User flows

**Flow 1: Guest onboarding**
No sign-up required. You land on the app, get assigned a guest ID stored in your browser, and start chatting immediately. Tasks and chat history persist across page refreshes. If you close the tab and come back, everything's still there.

**Flow 2: Chat → Tasks**
You type something like "plan my wedding." The AI creates a parent task (score ~60), auto-breaks it into subtasks (choose venue, send invitations, select vendors, etc.), and the task list appears on the left. Each subtask has a proportional difficulty score that adds up to the parent's score.

**Flow 3: Guest → Account**
When you sign up with Google or GitHub, your guest data migrates to your new account. No data loss, no starting over. If your new account already has data (edge case), the system keeps the account data and discards the guest data to avoid duplicates.

**Flow 4: Gamification loop**
Complete a task → earn XP → level up → maintain a streak. The XP amount scales with task difficulty. There are 6 levels (Starter → Legend) and a streak system that rewards daily consistency.

### Feature scope

| Feature | In prototype? | Why |
|---------|--------------|-----|
| Chat-first task management | Yes | Core concept |
| AI task creation with scoring | Yes | Core concept |
| Auto-breakdown (score > 20) | Yes | Key differentiator |
| Recursive subtask hierarchy | Yes | Makes breakdown useful |
| Gamification (XP, levels, streaks) | Yes | Engagement hook |
| Guest mode | Yes | Zero-friction onboarding |
| Google/GitHub OAuth | Yes | Persistence beyond guest |
| Guest-to-account migration | Yes | Connects the two modes |
| Dark mode | Yes | Default theme |
| Kanban board view | No | Nice-to-have, deferred |
| Team collaboration | No | Out of scope |
| Mobile app | No | Web-first, responsive instead |

### Tech choices (and why)

**Next.js 16 with App Router** — we wanted server components, server actions, and the latest React 19 features. The App Router gives us file-based routing, loading states, and error boundaries for free.

**Bun** — faster than npm/yarn for installs and running scripts. It's the runtime, package manager, and test runner all in one.

**Supabase PostgreSQL** — managed Postgres with a generous free tier. We needed a real database (not SQLite) because we use Postgres-specific features like recursive CTEs and full-text search.

**Drizzle ORM** — type-safe SQL without the magic of Prisma. We write queries that look like SQL, and the TypeScript types are inferred from the schema.

**Vercel AI SDK** — the standard for building AI chat interfaces in Next.js. Handles streaming, tool calling, and message history.

**OpenRouter** — lets us swap AI models without changing code. We started with Gemini 2.0 Flash and upgraded to Gemini 2.5 Flash for better tool-calling accuracy.

**Better-Auth** — lightweight auth library that works with Drizzle. Google and GitHub OAuth with minimal setup.

## Key design decisions

### Why chat-first?

Most productivity apps start with a list or a board. We started with a conversation.

The reasoning: people think in natural language, not in form fields. When someone says "I need to prepare for my job interview next week," they're expressing a goal with context (timing, urgency, scope). A chat interface captures all of that in one message. A form would need separate fields for title, description, priority, and due date.

The AI extracts everything it needs from the conversation and makes decisions about scoring, breakdown, and priority. The user doesn't have to think about any of that.

### Why gamification?

Task managers have a completion problem. People create tasks but don't finish them. Gamification adds a psychological reward loop: complete a task → see XP animate → watch your level bar fill up → maintain your streak.

We kept it simple on purpose. Six levels, no achievements system, no leaderboards. Just XP, levels, and streaks. Enough to make completing tasks feel good without turning it into a game you need to manage.

### Why guest-first?

Forcing sign-up before someone can use the app is a conversion killer. With guest mode, you can go from landing page to chatting with the AI in under 3 seconds. No email, no password, no OAuth flow.

The trade-off is that guest data is tied to a browser. Clear your cookies and it's gone. That's why we built the migration flow — sign up when you're ready, and everything carries over.

### Why recursive task hierarchy?

A flat task list doesn't capture how real projects work. "Plan a wedding" isn't one task — it's a tree of subtasks that can themselves have subtasks. We needed recursive depth, not just one level of children.

This decision drove a lot of the technical architecture. We use Postgres recursive CTEs to complete, delete, and query entire subtrees in a single database call. When you check off a parent task, every descendant gets completed too.

## From prototype to production

Here's what changed as we built:

### What stayed the same
- Chat-first interface as the primary interaction model
- Auto-breakdown for tasks scoring above 20
- Six-level gamification system
- Guest mode with migration
- 70/30 split layout on desktop

### What evolved

**AI model upgrade** — we started with Gemini 2.0 Flash but it was inconsistent at calling tools. Upgraded to Gemini 2.5 Flash, which is much better at following structured tool schemas.

**7 tools → 6 tools** — we merged `breakDownTask` into `createTasks`. Breaking down an existing task is just creating subtasks with a parent ID. No need for a separate tool.

**Database operations** — the original implementation had N+1 query problems (looping through tasks one at a time). We rewrote everything with recursive CTEs and batch operations. Deleting 50 tasks now takes one database call instead of 50.

**Full-text search** — started with simple ILIKE substring matching. Added Postgres full-text search as a fallback so "running" matches "Run social media advertising" through word stemming.

**Mobile responsiveness** — the prototype was desktop-only. We added a tab-based layout for mobile and tablets (below 1024px), where you switch between tasks and chat with a bottom tab bar.

**Custom tool chip animations** — the chat UI shows animated icons for each tool call (creating, completing, updating, deleting, searching, listing). Each has a unique SVG animation that plays while the operation runs.

**Interactive task lists in chat** — when the AI lists or searches tasks, the results render as an interactive mini task list with complete and delete buttons, right inside the chat.

### What we'd do differently

**Start with a better model.** We spent too long debugging tool-calling issues that were actually model limitations, not code bugs. Should have started with Gemini 2.5 Flash from day one.

**Design the database queries first.** The recursive CTE approach should have been the plan from the start, not a refactor. Thinking about the query patterns before writing the tool code would have saved a full rewrite.

**Keep the system prompt short.** Our first prompt was 119 lines and full of contradictions. The rewritten version is 55 lines and works better. Concise instructions are more effective than detailed ones for current AI models.

## The result

Chunk is a fully functional, deployed web application. It's not a prototype or a demo — it's a real app that handles edge cases, works on mobile, and has proper error handling.

You can try it at **https://chunk-production.up.railway.app**.

The source code, documentation, and commit history are all at **https://github.com/rjlacanlaled/chunk**.
