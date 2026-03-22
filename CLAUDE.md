# Chunk — Coding Guide

## Project Overview

Chunk is a chat-first AI productivity app built for an OPIT University web development course. Users interact with an AI assistant via chat to manage tasks, which are displayed in a sidebar task list and (eventually) a Kanban board. The app supports guest sessions that persist and migrate to full accounts on sign-up.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Runtime | Bun |
| Styling | Tailwind CSS v4, shadcn/ui (base-nova) |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Better-Auth (Google + GitHub OAuth) |
| AI | Vercel AI SDK + OpenRouter |
| State | TanStack Query (React Query) |
| Testing | Vitest, React Testing Library, MSW |

## Coding Conventions

### Style Rules

- **ESLint**: Airbnb rules via `eslint-config-airbnb-extended`
- **Quotes**: Single quotes
- **Semicolons**: Always
- **Indentation**: 2 spaces
- **Trailing commas**: Always (ES5+)
- **Prefer `const`** over `let`; never use `var`
- **Arrow functions** for callbacks and non-method functions
- **Named exports** preferred over default exports

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TaskList.tsx` |
| Hooks | camelCase with `use` prefix | `useTaskMutations.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `Task`, `ChatMessage` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Non-component files | kebab-case | `auth-client.ts` |
| Server Actions | camelCase verbs | `createTask`, `deleteTask` |

### Component Rules

- Import shadcn/ui components from `@/components/ui/`
- Keep components small — under 80 lines
- Colocate types with their component when specific to that component
- Extract shared types to `src/types/`

### Data Fetching

- Use TanStack Query for all server state
- Mutations use optimistic updates
- Server Actions serve as mutation functions
- Query keys follow `[resource, ...params]` pattern

### Testing

- TDD: write tests before implementation
- Test files live in `__tests__/` mirroring `src/` structure
- Use MSW for network mocking
- Run tests with `bun run test`

### Git

- Commit after each completed task
- Messages: lowercase, imperative mood (e.g., `add task list component`)
- No co-author tags
- No AI references in commits or code comments

## Project Structure

```
chunk/
├── __tests__/
│   ├── setup.ts
│   ├── actions/
│   ├── components/
│   └── hooks/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       └── chat/
│   ├── components/
│   │   ├── ui/           # shadcn/ui primitives
│   │   ├── chat/
│   │   ├── tasks/
│   │   └── layout/
│   ├── hooks/
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   └── auth/
│   ├── actions/
│   └── types/
├── public/
├── CLAUDE.md
├── eslint.config.mjs
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── next.config.ts
```

## Design System

### Colors (Strapi Brand)

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Primary | `#4945FF` | `hsl(241, 100%, 64%)` | Buttons, links, accents |
| Dark Blue | `#1C1C4E` | `hsl(240, 47%, 21%)` | Dark mode background |
| Light Blue | `#9593FF` | `hsl(243, 100%, 79%)` | Hover states, secondary |
| White | `#FFFFFF` | `hsl(0, 0%, 100%)` | Light mode background |
| Text | `#37352F` | `hsl(30, 5%, 20%)` | Body text (light mode) |
| Border | `#E9E9E7` | `hsl(40, 5%, 91%)` | Borders, dividers |

### Typography

- **Font**: Poppins (weights: 400, 500, 600, 700)
- **CSS variable**: `--font-poppins`

### Spacing & Radius

- **Border radius**: 5px base (`--radius: 0.3125rem`)
- Dark mode is the **default** theme

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for Better-Auth sessions |
| `BETTER_AUTH_URL` | Base URL for auth callbacks |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI models |
