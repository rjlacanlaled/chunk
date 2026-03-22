# Chunk

**Your chaos, made manageable.**

Chunk is a chat-first productivity app. You talk to an AI, it manages your to-do list. No clicking through menus, no drag-and-drop nonsense — just tell it what you need to do and it handles the rest. I built this for my web development course at OPIT University.

<!-- TODO: Add screenshot here -->

## Features

- **Chat to manage tasks** — tell the AI what you need to do, it creates, updates, and completes tasks for you
- **Smart task breakdown** — big tasks get automatically split into smaller subtasks
- **Gamification** — earn XP, level up, collect medals, and maintain daily streaks
- **Difficulty scoring** — the AI assigns scores to tasks based on effort, and subtask scores always add up to the parent
- **Guest mode** — start using it right away without signing up
- **Account migration** — sign up later with Google or GitHub and your guest data carries over
- **Task hierarchy** — tasks can have subtasks, which can have subtasks, recursively
- **Live updates** — optimistic UI so everything feels instant
- **Dark mode by default** — because obviously

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Runtime | Bun |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Better-Auth (Google + GitHub OAuth) |
| AI | Vercel AI SDK + OpenRouter |
| State | TanStack Query |
| Testing | Vitest + React Testing Library + MSW |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+) — if you don't have it, go to bun.sh
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenRouter](https://openrouter.ai) API key
- Google and/or GitHub OAuth credentials

### Setup

1. Clone and install:

```bash
git clone https://github.com/rjlacanlaled/chunk.git
cd chunk
bun install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Fill in the values (see table below).

3. Push the database schema:

```bash
bun drizzle-kit push
```

4. Run the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random 32+ character string for session encryption |
| `BETTER_AUTH_URL` | Base URL for auth callbacks (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID ([console.cloud.google.com](https://console.cloud.google.com)) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID ([github.com/settings/developers](https://github.com/settings/developers)) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `OPENROUTER_API_KEY` | OpenRouter API key ([openrouter.ai/keys](https://openrouter.ai/keys)) |

See `.env.example` for the full list with comments.

## Running Tests

Tests use Vitest with React Testing Library. Test files live in `__tests__/` and mirror the `src/` structure.

```bash
# Watch mode
bun run test

# Single run
bun run test:run
```

## Project Structure

```
chunk/
├── __tests__/              # Tests (mirrors src/)
│   ├── app/                # Page tests
│   ├── components/         # Component tests
│   ├── hooks/              # Hook tests
│   ├── lib/                # Utility + AI tool tests
│   └── server/             # Server action tests
├── src/
│   ├── app/                # Next.js pages + API routes
│   │   ├── api/chat/       # AI chat streaming endpoint
│   │   └── dashboard/      # Main app page
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── chat/           # Chat panel, messages, input
│   │   ├── tasks/          # Task list, items, board placeholder
│   │   ├── gamification/   # XP bar, streaks, medals, score summary
│   │   └── auth/           # OAuth buttons, sign-up CTA
│   ├── hooks/              # React hooks (tasks, auth, guest, gamification)
│   ├── lib/                # Auth config, AI tools + prompt, gamification logic
│   ├── server/
│   │   ├── actions/        # Server actions (tasks, messages, migration)
│   │   └── db/             # Drizzle schema + connection
│   └── types/              # Shared TypeScript types
├── public/                 # Static assets, logos, medals
├── vitest.config.ts
└── package.json
```

## Deployment

Built for [Vercel](https://vercel.com):

1. Push to GitHub
2. Import the project in Vercel
3. Set framework to Next.js
4. Add all the environment variables
5. Deploy

Vercel picks up the Bun runtime automatically. Make sure your Supabase database allows external connections (it does by default).

## Built for OPIT

This is a course project for Web Development at [OPIT University](https://www.opit.com). It's a real, working app — not just a prototype.
