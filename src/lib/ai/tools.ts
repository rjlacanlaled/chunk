import { tool } from 'ai';
import { z } from 'zod';
import {
  createTasks,
  updateTask,
  deleteTask,
  listTasks,
  findTaskByName,
} from '@/server/actions/tasks';

type Owner = { userId?: string; guestId?: string };

const taskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().describe('Due date in ISO format'),
  score: z.number().min(1).describe('Difficulty score — YOU decide. 1-5 trivial, 6-15 moderate, 16-30 hard, 30+ massive'),
  parentTaskId: z.string().optional().describe('Parent task ID if this is a subtask'),
});

export const makeTaskTools = (owner: Owner) => ({
  createTasks: tool({
    description: 'Create one or more tasks. Always use this — works for single tasks too. Always assign a difficulty score.',
    inputSchema: z.object({
      tasks: z.array(taskSchema).describe('Tasks to create (1 or more)'),
    }),
    execute: async ({ tasks: inputs }) => {
      const result = await createTasks(
        inputs.map((t) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        })),
        owner,
      );
      return result;
    },
  }),

  completeTasks: tool({
    description: 'Mark one or more tasks as done by name.',
    inputSchema: z.object({
      names: z.array(z.string()).describe('Task names to complete (partial match works)'),
    }),
    execute: async ({ names }) => {
      const results = [];
      for (const name of names) {
        const task = await findTaskByName(name, owner);
        if (!task) { results.push({ error: `No task matching "${name}"` }); continue; }
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
    description: 'Delete one or more tasks by name.',
    inputSchema: z.object({
      names: z.array(z.string()).describe('Task names to delete (partial match)'),
    }),
    execute: async ({ names }) => {
      const results = [];
      for (const name of names) {
        const task = await findTaskByName(name, owner);
        if (!task) { results.push({ error: `No task matching "${name}"` }); continue; }
        await deleteTask(task.id);
        results.push({ deleted: true, title: task.title });
      }
      return results;
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

      // Enforce: subtask scores must sum to parent score
      // If they don't, proportionally adjust them
      const adjusted = parentScore > 0 && subtaskTotal !== parentScore
        ? subtasks.map((s) => ({
          ...s,
          score: Math.max(1, Math.round((s.score / subtaskTotal) * parentScore)),
        }))
        : subtasks;

      const created = await createTasks(
        adjusted.map((s) => ({ ...s, parentTaskId: parent.id })),
        owner,
      );
      return { parent: parent.title, subtasks: created };
    },
  }),
});

export const taskTools = makeTaskTools({ guestId: 'test' });
