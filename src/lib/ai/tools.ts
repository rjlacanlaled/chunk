import { tool } from 'ai';
import { z } from 'zod';
import {
  createTask,
  updateTask,
  deleteTask,
  listTasks,
} from '@/server/actions/tasks';

type Owner = { userId?: string; guestId?: string };

export const makeTaskTools = (owner: Owner) => ({
  createTask: tool({
    description: 'Create a new task for the user',
    parameters: z.object({
      title: z.string().describe('The title of the task'),
      description: z.string().optional().describe('A description of the task'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
        .describe('The priority level of the task'),
      status: z.enum(['todo', 'in_progress', 'done']).optional()
        .describe('The current status of the task'),
      dueDate: z.string().optional()
        .describe('The due date in ISO format'),
    }),
    execute: async (input) => {
      const task = await createTask(
        {
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
        owner,
      );
      return task;
    },
  }),

  updateTask: tool({
    description: 'Update an existing task',
    parameters: z.object({
      id: z.string().describe('The id of the task to update'),
      title: z.string().optional().describe('The new title'),
      description: z.string().optional().describe('The new description'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
        .describe('The new priority level'),
      status: z.enum(['todo', 'in_progress', 'done']).optional()
        .describe('The new status'),
      dueDate: z.string().nullable().optional()
        .describe('The new due date in ISO format, or null to clear'),
    }),
    execute: async (input) => {
      const task = await updateTask({
        id: input.id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
      });
      return task;
    },
  }),

  deleteTask: tool({
    description: 'Delete a task by its id',
    parameters: z.object({
      id: z.string().describe('The id of the task to delete'),
    }),
    execute: async ({ id }) => {
      await deleteTask(id);
      return { success: true };
    },
  }),

  listTasks: tool({
    description: 'List all tasks for the current user, optionally filtered by status or priority',
    parameters: z.object({
      status: z.enum(['todo', 'in_progress', 'done']).optional()
        .describe('Filter by status'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
        .describe('Filter by priority'),
    }),
    execute: async () => {
      const tasks = await listTasks(owner);
      return tasks;
    },
  }),
});

export const taskTools = makeTaskTools({ guestId: 'test' });
