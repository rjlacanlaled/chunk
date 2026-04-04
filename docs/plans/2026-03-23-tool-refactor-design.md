# Tool System Refactor Design

Date: 2026-03-23

## Problem

The AI tool system has 24 identified issues including N+1 query patterns, no DB-level batching, a hidden 200-task limit, O(n²) recursive descendant lookups, mixed return types, and a bloated system prompt that contradicts the actual code behavior. Deletion is the most broken — bulk delete triggers individual DB calls per task.

## Decisions

- **Approach A: Thin Tools, Fat DB** — all business logic in Postgres via recursive CTEs and batch operations
- **Cursor-based pagination** for task listing (no more hidden limits)
- **Recursive CTEs** for hierarchical operations (complete/delete with descendants)
- **Merge `completeTasks` into dedicated tool** (keep separate from updateTasks due to descendant logic)
- **Remove `breakDownTask` tool** — `createTasks` with `parentTaskId` handles it
- **Smart task resolution**: exact number match → single partial → disambiguate
- **Full system prompt rewrite** optimized for Gemini Flash (~55 lines, structured tables)
- **6 tools** total (down from 7)

## Schema Changes

1. `taskNumber: real` → `integer`
2. Index on `(user_id, deleted_at)`
3. Index on `(guest_id, deleted_at)`
4. Index on `(parent_task_id)`
5. Index on `chatMessages(user_id)` and `chatMessages(guest_id)`

## Server Actions (tasks.ts) — Full Rewrite

### resolveTask(nameOrNumber, owner)
- `#N` or digits → `WHERE task_number = N`
- Text → `ILIKE '%term%'`, limit 5
- Returns `{ match }` | `{ matches }` | `{ error }`

### createTasks(inputs[], owner)
- Single `INSERT ... VALUES` with `RETURNING`
- Two-pass for parent+child (parents first to get IDs, then children)

### updateTasksByIds(ids[], fields)
- Single `UPDATE ... WHERE id IN (...) RETURNING`

### completeWithDescendants(id)
- Recursive CTE finds all descendants, batch UPDATE status='done' in one query

### deleteByIds(ids[])
- Recursive CTE per root ID, soft-deletes all descendants in one query

### deleteByFilter(filter, owner)
- Builds WHERE from filter, includes descendants via CTE, one query

### listTasks(owner, { cursor?, limit?, filter?, query? })
- Cursor-based: `WHERE created_at < $cursor ORDER BY created_at DESC LIMIT $limit+1`
- Filter/query in WHERE clause
- Default limit: 50

### searchTasks(query, owner)
- `ILIKE '%query%'`, limit 10, lightweight results

### Removed
- `createTask` (singular), `deleteTask` (singular), `updateTask` (singular), `findTaskByName`, `ownerCondition`

## AI Tools (tools.ts) — 6 Tools

1. **createTasks** — batch create with inline subtasks, score adjustment in JS
2. **completeTasks** — resolve names → `completeWithDescendants`, typed response with `completed/ambiguous/notFound`
3. **updateTasks** — resolve names → collect IDs → single `updateTasksByIds`
4. **deleteTasks** — discriminated union: `{ names }` or `{ filter }`, returns `{ deleted, titles }`
5. **searchTasks** — lightweight search by keyword
6. **listTasks** — paginated with filter/cursor/limit

### Removed
- `breakDownTask` — use `createTasks` with `parentTaskId`

## System Prompt

- ~55 lines (down from 119)
- Table format for tools reference
- Compact scoring table
- No repetition, no contradictions
- Stronger disambiguation rule
- Personality compressed to 1 line

## Type Safety

```typescript
type ResolveResult =
  | { match: Task }
  | { matches: Task[] }
  | { error: string };

type CompletionResult = {
  completed: string[];
  ambiguous: { name: string; matches: { taskNumber: number; title: string }[] }[];
  notFound: string[];
};

type DeletionResult = { deleted: number; titles: string[] };
type PaginatedTasks = { tasks: Task[]; nextCursor: string | null };
```

## Files Affected

1. `src/server/db/schema.ts` — column type + indexes
2. `src/server/actions/tasks.ts` — full rewrite
3. `src/lib/ai/tools.ts` — full rewrite
4. `src/lib/ai/system-prompt.ts` — full rewrite
5. `src/types/task.ts` — add new types
6. `src/app/dashboard/page.tsx` — update server action calls
7. `src/hooks/use-tasks.ts` — update mutation signatures
