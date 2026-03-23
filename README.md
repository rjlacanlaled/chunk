<p align="center">
  <img src="public/chunk-logos/chunk-logo-stacked.svg" alt="Chunk" width="120" />
</p>

<h3 align="center">Your chaos, made manageable.</h3>

<p align="center">
  Chat-first AI productivity app that breaks big goals into manageable tasks.
  <br />
  <a href="https://chunk-production.up.railway.app"><strong>Live Demo</strong></a> · <a href="docs/PRD.md">PRD</a> · <a href="docs/PROTOTYPE.md">Design Journey</a>
</p>

---

## What is Chunk?

Chunk is a productivity app where you manage tasks by chatting with an AI assistant called Chunky. Instead of clicking through forms and dropdowns, you just say what you need to do. The AI creates tasks, assigns difficulty scores, breaks big goals into subtasks, and tracks your progress with XP and levels.

Built as a personal project to explore modern full-stack web development with AI integration.

## Features

| Feature | How it works |
|---------|-------------|
| **Chat-first** | Talk to Chunky in natural language. No buttons, no forms. |
| **Smart breakdown** | Tasks scoring 20+ are automatically split into subtasks. Scores always add up. |
| **Gamification** | Earn XP, level up through 6 ranks (Starter → Legend), and maintain daily streaks. |
| **Guest mode** | Start immediately — no sign-up required. Data persists in your browser. |
| **Account migration** | Sign up with Google or GitHub later. Your guest data carries over. |
| **Recursive tasks** | Tasks can have subtasks, which can have subtasks. Completing a parent completes everything below it. |
| **Full-text search** | Find tasks by keyword with Postgres stemming — "running" matches "Run social media advertising." |
| **Interactive results** | When the AI lists tasks, they render as clickable cards with complete/delete buttons right in the chat. |
| **Mobile responsive** | Tab-based layout on phones and tablets, side-by-side on desktop. |
| **Dark mode** | Default and only theme. Because obviously. |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript (strict mode) | 5.x |
| Runtime | Bun | 1.x |
| UI | Tailwind CSS + shadcn/ui | v4 |
| Database | PostgreSQL (Supabase) | — |
| ORM | Drizzle ORM | 0.45.x |
| Auth | Better-Auth (Google + GitHub) | 1.5.x |
| AI | Vercel AI SDK + OpenRouter (Gemini 2.5 Flash) | 6.x |
| State | TanStack Query | 5.x |
| Testing | Vitest + React Testing Library | 4.x |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenRouter](https://openrouter.ai) API key
- Google and/or GitHub OAuth credentials

### Setup

```bash
git clone https://github.com/rjlacanlaled/chunk.git
cd chunk
bun install
```

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://...your-supabase-connection-string
BETTER_AUTH_SECRET=any-random-32-character-string
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
OPENROUTER_API_KEY=your-openrouter-key
```

Push the database schema and start the dev server:

```bash
bunx drizzle-kit push
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Project Structure

```
chunk/
├── __tests__/                # Tests (mirrors src/ structure)
├── docs/
│   ├── PRD.md                # Product requirements
│   └── PROTOTYPE.md          # Design journey & prototype spec
├── public/
│   ├── chunk-avatars/        # Chunky expression avatars
│   ├── chunk-logos/           # Brand logos and icons
│   └── chunk-tools/          # Animated tool chip SVGs
├── src/
│   ├── app/
│   │   ├── api/chat/         # AI chat streaming endpoint
│   │   ├── api/messages/     # Chat history endpoint
│   │   ├── dashboard/        # Main app page
│   │   ├── error.tsx         # Error boundary
│   │   ├── not-found.tsx     # 404 page
│   │   ├── opengraph-image.tsx  # Dynamic OG image
│   │   └── sitemap.ts        # Auto-generated sitemap
│   ├── components/
│   │   ├── chat/             # Chat panel, messages, tool chips, input
│   │   ├── tasks/            # Task list, task items
│   │   ├── gamification/     # XP bar, streaks, medals, daily missions
│   │   ├── auth/             # OAuth buttons, sign-up prompt
│   │   └── ui/               # shadcn/ui primitives
│   ├── hooks/                # React hooks (tasks, gamification, guest, auth)
│   ├── lib/                  # Auth config, AI tools + prompt, gamification
│   ├── server/
│   │   ├── actions/          # Server actions (tasks, messages, migration)
│   │   └── db/               # Drizzle schema + connection
│   └── types/                # Shared TypeScript types
└── package.json
```

## How It Works

The architecture is straightforward:

1. **You type a message** in the chat
2. **The chat API** sends it to Gemini 2.5 Flash via OpenRouter with a system prompt and 6 tools
3. **The AI decides** what to do — create tasks, complete them, search, update, delete, or list
4. **Tools call server actions** which run SQL against Supabase PostgreSQL (using recursive CTEs for hierarchical operations)
5. **Results stream back** to the chat UI, and the task list refreshes

The AI has 6 tools:

| Tool | What it does |
|------|-------------|
| `createTasks` | Creates tasks with optional inline subtasks |
| `completeTasks` | Marks tasks done (cascades to all subtasks) |
| `updateTasks` | Changes any field — title, priority, due date, status |
| `deleteTasks` | Deletes by name or bulk-deletes by filter (overdue/done/all) |
| `searchTasks` | Finds tasks by keyword with full-text search |
| `listTasks` | Lists tasks with filters and cursor-based pagination |

All database operations use batch queries and recursive CTEs. Completing a parent with 20 subtasks is one SQL query, not 21.

## Testing

Tests live in `__tests__/` and mirror the `src/` structure. We use Vitest with React Testing Library.

```bash
# Watch mode
bun run test

# Single run
bun run test:run
```

## Deployment

Chunk is deployed on [Railway](https://railway.app) with the database on [Supabase](https://supabase.com).

To deploy your own:

1. Push the repo to GitHub
2. Create a Railway project and link the repo
3. Set all environment variables in Railway's dashboard
4. Railway auto-detects Next.js and deploys on every push

Make sure `BETTER_AUTH_URL` points to your Railway domain (e.g., `https://your-app.up.railway.app`).

## Documentation

| Document | What it covers |
|----------|---------------|
| [PRD](docs/PRD.md) | Full product requirements — features, architecture, AI system, gamification |
| [Design Journey](docs/PROTOTYPE.md) | How we got here — prototype spec, design decisions, what changed |
| This README | Setup, structure, how it works |

## Try It

Chunk is live at **https://chunk-production.up.railway.app** — no sign-up required, just start chatting.
