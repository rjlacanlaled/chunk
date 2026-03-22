import { tool } from 'ai';
import { z } from 'zod';
import {
  createTasks,
  updateTask,
  deleteTask,
  listTasks,
  findTaskByName,
  searchTasks,
} from '@/server/actions/tasks';

type Owner = { userId?: string; guestId?: string };

const subtaskSchema = z.object({
  title: z.string(),
  score: z.number().min(1),
  description: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().describe('Due date in ISO format'),
  score: z.number().min(1).describe('Difficulty score — YOU decide. 1-5 trivial, 6-15 moderate, 16-30 hard, 30+ massive'),
  parentTaskId: z.string().optional().describe('Parent task ID if this is a subtask'),
  subtasks: z.array(subtaskSchema).optional().describe('Optional subtasks to create immediately. Scores MUST sum to parent score. Use this instead of calling breakDownTask separately.'),
});

export const makeTaskTools = (owner: Owner) => ({
  createTasks: tool({
    description: 'Create one or more tasks with optional inline subtasks. If a task has score 20+, include subtasks directly — no need to call breakDownTask separately. Subtask scores MUST sum to parent score.',
    inputSchema: z.object({
      tasks: z.array(taskSchema).describe('Tasks to create (1 or more)'),
    }),
    execute: async ({ tasks: inputs }) => {
      const results = [];

      for (const input of inputs) {
        const { subtasks: subs, ...taskInput } = input;

        // Create the parent task
        const [parent] = await createTasks(
          [{ ...taskInput, dueDate: taskInput.dueDate ? new Date(taskInput.dueDate) : undefined }],
          owner,
        );
        results.push(parent);

        // Create inline subtasks if provided
        if (subs && subs.length > 0) {
          const parentScore = parent.score ?? 0;
          const subTotal = subs.reduce((sum, s) => sum + s.score, 0);

          // Proportionally adjust subtask scores to match parent
          let adjusted = subs;
          if (parentScore > 0 && subTotal !== parentScore) {
            adjusted = subs.map((s) => ({
              ...s,
              score: Math.max(1, Math.round((s.score / subTotal) * parentScore)),
            }));
            const adjTotal = adjusted.reduce((sum, s) => sum + s.score, 0);
            const diff = parentScore - adjTotal;
            if (diff !== 0) {
              const largest = adjusted.reduce((max, s, i) => s.score > adjusted[max].score ? i : max, 0);
              adjusted[largest].score += diff;
            }
          }

          const children = await createTasks(
            adjusted.map((s) => ({ ...s, parentTaskId: parent.id })),
            owner,
          );
          results.push(...children);
        }
      }

      return results;
    },
  }),

  completeTasks: tool({
    description: 'Mark one or more tasks as done by name. If a task has subtasks, all subtasks are completed too.',
    inputSchema: z.object({
      names: z.array(z.string()).describe('Task names to complete (partial match works)'),
    }),
    execute: async ({ names }) => {
      const allTasks = await listTasks(owner);
      const getDescendants = (parentId: string): typeof allTasks => {
        const children = allTasks.filter((t) => t.parentTaskId === parentId);
        return children.flatMap((c) => [c, ...getDescendants(c.id)]);
      };

      const results = [];
      for (const name of names) {
        const task = await findTaskByName(name, owner);
        if (!task) { results.push({ error: `No task matching "${name}"` }); continue; }

        // Complete all descendants first
        const descendants = getDescendants(task.id);
        for (const d of descendants) {
          if (d.status !== 'done') await updateTask({ id: d.id, status: 'done' });
        }

        // Complete the task itself
        results.push(await updateTask({ id: task.id, status: 'done' }));
      }
      return results;
    },
  }),

  updateTasks: tool({
    description: 'Update one or more tasks by name. Use for changing priority, due date, title, status, or score.',
    inputSchema: z.object({
      updates: z.array(z.object({
        name: z.string().describe('Current task name (partial match)'),
        title: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        dueDate: z.string().nullable().optional(),
        score: z.number().min(1).optional(),
      })).describe('Tasks to update'),
    }),
    execute: async ({ updates }) => {
      const results = [];
      for (const { name, ...fields } of updates) {
        const task = await findTaskByName(name, owner);
        if (!task) { results.push({ error: `No task matching "${name}"` }); continue; }
        results.push(await updateTask({
          id: task.id,
          ...fields,
          dueDate: fields.dueDate ? new Date(fields.dueDate) : fields.dueDate === null ? null : undefined,
        }));
      }
      return results;
    },
  }),

  deleteTasks: tool({
    description: 'Delete one or more tasks by name. Also deletes all subtasks recursively.',
    inputSchema: z.object({
      names: z.array(z.string()).describe('Task names to delete (partial match)'),
    }),
    execute: async ({ names }) => {
      const allTasks = await listTasks(owner);
      const getDescendants = (parentId: string): typeof allTasks => {
        const children = allTasks.filter((t) => t.parentTaskId === parentId);
        return children.flatMap((c) => [c, ...getDescendants(c.id)]);
      };

      const results = [];
      for (const name of names) {
        const task = await findTaskByName(name, owner);
        if (!task) { results.push({ error: `No task matching "${name}"` }); continue; }

        // Delete all descendants first (bottom-up)
        const descendants = getDescendants(task.id);
        for (const d of descendants) {
          await deleteTask(d.id);
        }

        await deleteTask(task.id);
        results.push({ deleted: true, title: task.title, childrenDeleted: descendants.length });
      }
      return results;
    },
  }),

  searchTasks: tool({
    description: 'Search tasks by keyword. Returns ALL matches. Use this when unsure which task the user means — if multiple results, ask the user to clarify.',
    inputSchema: z.object({
      query: z.string().describe('Search keyword (partial match on title)'),
    }),
    execute: async ({ query }) => {
      const matches = await searchTasks(query, owner);
      return matches.map((t) => ({ id: t.id, title: t.title, score: t.score, status: t.status, parentTaskId: t.parentTaskId }));
    },
  }),

  listTasks: tool({
    description: 'List all current tasks for the user.',
    inputSchema: z.object({}),
    execute: async () => listTasks(owner),
  }),

  breakDownTask: tool({
    description: 'Break a complex task into subtasks. Use when a task has score 5+ and user wants it broken down.',
    inputSchema: z.object({
      name: z.string().describe('Name of task to break down'),
      subtasks: z.array(z.object({
        title: z.string(),
        score: z.number().min(1),
        description: z.string().optional(),
      })),
    }),
    execute: async ({ name, subtasks }) => {
      const parent = await findTaskByName(name, owner);
      if (!parent) return { error: `No task matching "${name}"` };

      const parentScore = parent.score ?? 0;
      const subtaskTotal = subtasks.reduce((sum, s) => sum + s.score, 0);

      // Enforce: subtask scores must sum to exactly the parent score
      let adjusted = subtasks;
      if (parentScore > 0 && subtaskTotal !== parentScore) {
        adjusted = subtasks.map((s) => ({
          ...s,
          score: Math.max(1, Math.round((s.score / subtaskTotal) * parentScore)),
        }));
        // Fix rounding error — add/subtract difference to the largest subtask
        const adjustedTotal = adjusted.reduce((sum, s) => sum + s.score, 0);
        const diff = parentScore - adjustedTotal;
        if (diff !== 0) {
          const largest = adjusted.reduce((max, s, i) => s.score > adjusted[max].score ? i : max, 0);
          adjusted[largest].score += diff;
        }
      }

      const created = await createTasks(
        adjusted.map((s) => ({ ...s, parentTaskId: parent.id })),
        owner,
      );
      const finalTotal = created.reduce((sum, s) => sum + (s.score ?? 0), 0);
      return {
        parent: parent.title,
        parentScore,
        subtaskScoreTotal: finalTotal,
        subtasks: created,
      };
    },
  }),
});
