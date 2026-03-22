import { tool } from 'ai';
import { z } from 'zod';
import {
  createTask,
  updateTask,
  deleteTask,
  listTasks,
  findTaskByName,
} from '@/server/actions/tasks';

type Owner = { userId?: string; guestId?: string };

export const makeTaskTools = (owner: Owner) => ({
  createTask: tool({
    description: 'Create a new task for the user',
    inputSchema: z.object({
      title: z.string().describe('The title of the task'),
      description: z.string().optional().describe('A description of the task'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
        .describe('The priority level'),
      status: z.enum(['todo', 'in_progress', 'done']).optional(),
      dueDate: z.string().optional().describe('Due date in ISO format'),
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

  completeTask: tool({
    description: 'Mark a task as done by its name. Use this when the user says they finished something.',
    inputSchema: z.object({
      name: z.string().describe('The name/title of the task to mark as done (partial match works)'),
    }),
    execute: async ({ name }) => {
      const task = await findTaskByName(name, owner);
      if (!task) return { error: `No task found matching "${name}"` };
      const updated = await updateTask({ id: task.id, status: 'done' });
      return updated;
    },
  }),

  updateTaskByName: tool({
    description: 'Update a task by its name. Use for changing priority, due date, title, or status.',
    inputSchema: z.object({
      name: z.string().describe('The name/title of the task to update (partial match works)'),
      title: z.string().optional().describe('New title'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      status: z.enum(['todo', 'in_progress', 'done']).optional(),
      dueDate: z.string().nullable().optional().describe('New due date in ISO format, or null to clear'),
    }),
    execute: async ({ name, ...fields }) => {
      const task = await findTaskByName(name, owner);
      if (!task) return { error: `No task found matching "${name}"` };
      const updated = await updateTask({
        id: task.id,
        ...fields,
        dueDate: fields.dueDate ? new Date(fields.dueDate) : fields.dueDate === null ? null : undefined,
      });
      return updated;
    },
  }),

  deleteTaskByName: tool({
    description: 'Delete a task by its name.',
    inputSchema: z.object({
      name: z.string().describe('The name/title of the task to delete (partial match works)'),
    }),
    execute: async ({ name }) => {
      const task = await findTaskByName(name, owner);
      if (!task) return { error: `No task found matching "${name}"` };
      await deleteTask(task.id);
      return { deleted: true, title: task.title };
    },
  }),

  listTasks: tool({
    description: 'List all tasks for the current user',
    inputSchema: z.object({}),
    execute: async () => {
      const tasks = await listTasks(owner);
      return tasks;
    },
  }),
});

export const taskTools = makeTaskTools({ guestId: 'test' });
