'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTask,
  updateTask,
  deleteTask,
  listTasks,
} from '@/server/actions/tasks';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';

type Owner = { userId?: string; guestId?: string };

const taskKeys = {
  all: (owner: Owner) => ['tasks', owner] as const,
};

export const useTasksQuery = (owner: Owner) => useQuery({
  queryKey: taskKeys.all(owner),
  queryFn: () => listTasks(owner),
});

export const useTaskMutations = (owner: Owner) => {
  const queryClient = useQueryClient();
  const key = taskKeys.all(owner);

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input, owner),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          userId: owner.userId ?? null,
          guestId: owner.guestId ?? null,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? 'medium',
          status: input.status ?? 'todo',
          position: old.length,
          dueDate: input.dueDate ?? null,
          parentTaskId: input.parentTaskId ?? null,
          score: input.score ?? null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Task,
      ]);

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (old = []) => old.map((task) => (
        task.id === input.id ? { ...task, ...input, updatedAt: new Date() } : task
      )));

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (old = []) => old.filter(
        (task) => task.id !== id,
      ));

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
