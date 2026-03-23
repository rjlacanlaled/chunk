import { tool } from 'ai';
import { z } from 'zod';
import {
  createTasks,
  resolveTask,
  updateTasksByIds,
  completeWithDescendants,
  completeByQuery,
  deleteByIds,
  deleteByFilter,
  listTasks,
  searchTasks,
} from '@/server/actions/tasks';
import type { CompletionResult } from '@/types/task';

type Owner = { userId?: string; guestId?: string };

// Normalize subtask scores so they sum exactly to the parent score.
// Proportionally scales each score, then corrects rounding error
// by adjusting the largest subtask.
const adjustScores = (
  subtasks: { title: string; score: number; description?: string }[],
  parentScore: number,
) => {
  const total = subtasks.reduce((sum, s) => sum + s.score, 0);
  if (parentScore <= 0 || total === parentScore) return subtasks;

  const adjusted = subtasks.map((s) => ({
    ...s,
    score: Math.max(1, Math.round((s.score / total) * parentScore)),
  }));

  const adjTotal = adjusted.reduce((sum, s) => sum + s.score, 0);
  const diff = parentScore - adjTotal;
  if (diff !== 0) {
    const largest = adjusted.reduce(
      (max, s, i) => (s.score > adjusted[max].score ? i : max),
      0,
    );
    adjusted[largest].score += diff;
  }

  return adjusted;
};

const subtaskSchema = z.object({
  title: z.string(),
  score: z.number().min(1),
  description: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z
    .string()
    .optional()
    .describe(
      'Due date/time as YYYY-MM-DDTHH:mm:ss — use the time the user says, no timezone conversion',
    ),
  score: z
    .number()
    .min(1)
    .describe(
      'Difficulty score — YOU decide. 1-5 trivial, 6-15 moderate, 16-30 hard, 30+ massive',
    ),
  parentTaskId: z
    .string()
    .optional()
    .describe(
      'Parent task ID to create this as a subtask. Use when breaking down an existing task.',
    ),
  subtasks: z
    .array(subtaskSchema)
    .optional()
    .describe(
      'Optional inline subtasks. Scores MUST sum to parent score. Use for new tasks that deserve immediate breakdown.',
    ),
});

export const makeTaskTools = (owner: Owner) => ({
  createTasks: tool({
    description:
      'Create one or more tasks with optional inline subtasks. Also used to break down an existing task — pass its ID as parentTaskId. If a task has score 20+, include subtasks directly. Subtask scores MUST sum to parent score.',
    inputSchema: z.object({
      tasks: z.array(taskSchema).describe('Tasks to create (1 or more)'),
    }),
    execute: async ({ tasks: inputs }) => {
      try {
        const results = [];

        for (const input of inputs) {
          const { subtasks: subs, ...taskInput } = input;

          const [parent] = await createTasks(
            [{
              ...taskInput,
              dueDate: taskInput.dueDate
                ? new Date(taskInput.dueDate + 'Z')
                : undefined,
            }],
            owner,
          );
          results.push(parent);

          if (subs && subs.length > 0) {
            const parentScore = parent.score ?? 0;
            const adjusted = adjustScores(subs, parentScore);

            const children = await createTasks(
              adjusted.map((s) => ({ ...s, parentTaskId: parent.id })),
              owner,
            );
            results.push(...children);
          }
        }

        return results;
      } catch (err) {
        return {
          error: `Failed to create tasks: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
      }
    },
  }),

  completeTasks: tool({
    description:
      'Mark tasks as done. Pass names/numbers for specific tasks, OR pass query to bulk-complete all matching tasks (e.g. query "renew" completes every task with "renew" in the title). Automatically completes all subtasks too.',
    inputSchema: z.object({
      names: z
        .array(z.string())
        .optional()
        .describe(
          'Task names or numbers. When user says "task 85", pass "85".',
        ),
      query: z
        .string()
        .optional()
        .describe('Bulk complete: keyword to match. "mark all renew tasks done" → query "renew"'),
    }),
    execute: async ({ names, query }) => {
      try {
        // Bulk mode — complete all tasks matching keyword
        if (query) {
          return completeByQuery(query, owner);
        }

        if (!names || names.length === 0) {
          return { error: 'Provide names or query' };
        }

        const result: CompletionResult = {
          completed: [],
          ambiguous: [],
          notFound: [],
        };

        for (const name of names) {
          const resolved = await resolveTask(name, owner);

          if ('error' in resolved) {
            result.notFound.push(name);
          } else if ('matches' in resolved) {
            result.ambiguous.push({
              name,
              matches: resolved.matches.map((m) => ({
                taskNumber: m.taskNumber,
                title: m.title,
              })),
            });
          } else {
            const count = await completeWithDescendants(resolved.match.id);
            result.completed.push(
              `${resolved.match.title} (${count} task${count !== 1 ? 's' : ''} completed)`,
            );
          }
        }

        return result;
      } catch (err) {
        // error returned to AI via tool result
        return { error: `Complete failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  }),

  updateTasks: tool({
    description:
      'Update one or more tasks. Use for changing priority, due date, title, status, description, or score.',
    inputSchema: z.object({
      updates: z
        .array(
          z.object({
            name: z
              .string()
              .describe(
                'Task name OR task number (e.g. "#196" or "196"). When user says "task 196", pass "196" here.',
              ),
            title: z.string().optional(),
            description: z.string().optional(),
            priority: z
              .enum(['low', 'medium', 'high', 'urgent'])
              .optional(),
            status: z.enum(['todo', 'in_progress', 'done']).optional(),
            dueDate: z
              .string()
              .nullable()
              .optional()
              .describe(
                'YYYY-MM-DDTHH:mm:ss to set, null to clear, omit to leave unchanged',
              ),
            score: z.number().min(1).optional(),
          }),
        )
        .describe('Tasks to update'),
    }),
    execute: async ({ updates }) => {
      const results: { updated: string[]; errors: string[] } = {
        updated: [],
        errors: [],
      };

      for (const { name, dueDate, ...fields } of updates) {
        const resolved = await resolveTask(name, owner);

        if ('error' in resolved) {
          results.errors.push(resolved.error);
          continue;
        }

        if ('matches' in resolved) {
          results.errors.push(
            `"${name}" is ambiguous — matches: ${resolved.matches.map((m) => `#${m.taskNumber} ${m.title}`).join(', ')}`,
          );
          continue;
        }

        const parsedDueDate = dueDate !== undefined
          ? (dueDate === null ? null : new Date(dueDate + 'Z'))
          : undefined;

        const updateFields = {
          ...fields,
          ...(parsedDueDate !== undefined ? { dueDate: parsedDueDate } : {}),
        };

        const [updated] = await updateTasksByIds(
          [resolved.match.id],
          updateFields,
        );
        results.updated.push(`#${updated.taskNumber} ${updated.title}`);
      }

      return results;
    },
  }),

  deleteTasks: tool({
    description:
      'Delete tasks. Two modes: pass names to delete specific tasks, OR pass a filter ("overdue", "done", "all") for bulk delete. Filter mode is preferred for bulk operations — ONE call instead of many. If filter is provided, names are ignored.',
    inputSchema: z.object({
      names: z
        .array(z.string())
        .optional()
        .describe(
          'Task names or numbers. When user says "task 190", pass "190".',
        ),
      filter: z
        .enum(['overdue', 'done', 'all'])
        .optional()
        .describe('Bulk delete by filter instead of names'),
    }),
    execute: async ({ names, filter }) => {
      try {
        // Filter mode — single server action call
        if (filter) {
          return deleteByFilter(filter, owner);
        }

        // Names mode — resolve each, then batch delete
        if (!names || names.length === 0) {
          return { deleted: 0, titles: [] };
        }

        const ids: string[] = [];
        const errors: string[] = [];

        for (const name of names) {
          const resolved = await resolveTask(name, owner);

          if ('error' in resolved) {
            errors.push(resolved.error);
          } else if ('matches' in resolved) {
            errors.push(
              `"${name}" is ambiguous — matches: ${resolved.matches.map((m) => `#${m.taskNumber} ${m.title}`).join(', ')}`,
            );
          } else {
            ids.push(resolved.match.id);
          }
        }

        const result = await deleteByIds(ids);
        return { ...result, errors: errors.length > 0 ? errors : undefined };
      } catch (err) {
        // error returned to AI via tool result
        return { error: `Delete failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  }),

  searchTasks: tool({
    description:
      'Search tasks by keyword or task number (#N). Returns matching tasks with task numbers for disambiguation.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Search keyword (partial match on title) or task number (#N)',
        ),
    }),
    execute: async ({ query }) => {
      const matches = await searchTasks(query, owner);
      return matches.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        score: t.score,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        parentTaskId: t.parentTaskId,
      }));
    },
  }),

  listTasks: tool({
    description:
      'List tasks with optional filters and pagination. Use filter "overdue" for past-due, "today" for due today, "todo"/"done" by status, or "all" for everything.',
    inputSchema: z.object({
      filter: z
        .enum(['all', 'overdue', 'today', 'todo', 'done'])
        .optional()
        .describe('Filter tasks. Default: all'),
      cursor: z
        .string()
        .optional()
        .describe('Pagination cursor from a previous response'),
      limit: z
        .number()
        .optional()
        .describe('Max tasks to return (default 200)'),
    }),
    execute: async ({ filter, cursor, limit }) => {
      const serverFilter = filter === 'all' ? undefined : filter;
      return listTasks(owner, { cursor, limit, filter: serverFilter });
    },
  }),
});
