# Chunk

**Your chaos, made manageable.**

Chunk is a chat-first productivity app where you talk to an AI buddy instead of clicking around a boring task manager. Tell it what you need to do, and it turns your brain dumps into organized tasks. Built as a web development course project at OPIT University.

## What It Does

- **Chat to create tasks** — just tell the AI what you need to do and it handles the rest
- **Smart prioritization** — mention a deadline and it flags it as high priority
- **Guest sessions** — start using it immediately, no sign-up required
- **Account migration** — when you do sign up (Google or GitHub OAuth), your guest tasks come with you
- **Task list with live updates** — optimistic UI powered by TanStack Query
- **Board view** — coming soon (placeholder is there, Kanban is next)
- **Message persistence** — your chat history sticks around between sessions
- **Dark mode by default** — because we have taste

## Tech Stack

| Layer       | What We're Using                          |
|-------------|-------------------------------------------|
| Framework   | Next.js 16 (App Router, React 19)        |
| Language    | TypeScript (strict)                       |
| Runtime     | Bun                                       |
| Styling     | Tailwind CSS v4 + shadcn/ui              |
| Database    | PostgreSQL via Supabase                   |
| ORM         | Drizzle ORM                               |
| Auth        | Better-Auth (Google + GitHub OAuth)       |
| AI          | Vercel AI SDK + OpenRouter                |
| State       | TanStack Query                            |
| Testing     | Vitest + React Testing Library            |

## Getting Started

### Prerequisites

You'll need these installed:

- [Bun](https://bun.sh) (v1.0+)
- A [Supabase](https://supabase.com) project (free tier works fine)
- An [OpenRouter](https://openrouter.ai) API key
- Google and/or GitHub OAuth credentials (for auth)

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/rjlacanlaled/chunk.git
cd chunk
bun install
```

2. Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

3. Push the database schema:

```bash
bun drizzle-kit push
```

4. Start the dev server:

```bash
bun dev
```

That's it. Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Environment Variables

| Variable                | What It's For                              |
|-------------------------|--------------------------------------------|
| `DATABASE_URL`          | Supabase PostgreSQL connection string      |
| `BETTER_AUTH_SECRET`    | Secret key for session encryption          |
| `BETTER_AUTH_URL`       | Base URL for auth callbacks (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                     |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                 |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID                     |
| `GITHUB_CLIENT_SECRET`  | GitHub OAuth client secret                 |
| `OPENROUTER_API_KEY`   | OpenRouter API key for the AI model        |

Check `.env.example` for the full list.

## Testing

We use Vitest with React Testing Library. Tests live in `__tests__/` and mirror the `src/` structure.

```bash
# Run tests in watch mode
bun run test

# Single run
bun run test:run
```

## Project Structure

```
chunk/
├── __tests__/              # Test files (mirrors src/ structure)
├── src/
│   ├── app/                # Next.js pages + API routes
│   │   └── api/chat/       # AI chat streaming endpoint
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── chat/           # Chat panel, messages
│   │   ├── tasks/          # Task list, items, board placeholder
│   │   └── auth/           # OAuth buttons, sign-up CTA
│   ├── hooks/              # React hooks (tasks, auth, guest)
│   ├── lib/                # Auth config, AI tools, utilities
│   ├── server/
│   │   ├── actions/        # Server actions (tasks, messages, migration)
│   │   └── db/             # Drizzle schema + connection
│   └── types/              # Shared TypeScript types
├── vitest.config.ts        # Test configuration
└── package.json
```

## Deployment

Chunk is built for [Vercel](https://vercel.com). To deploy:

1. Push your repo to GitHub
2. Import the project in Vercel
3. Set the framework preset to **Next.js**
4. Add all the environment variables from `.env.example`
5. Deploy

Vercel auto-detects the Bun runtime and handles the rest. Make sure your Supabase database is accessible from Vercel's servers (it should be by default).
