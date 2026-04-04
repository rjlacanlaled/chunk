'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTasks,
  updateTask,
  deleteTask,
  listTasks,
} from '@/server/actions/tasks';
import type { Task, CreateTaskInput, UpdateTaskInput, Owner } from '@/types/task';

const getTaskKey = (owner: Owner) => ['tasks', owner.userId || owner.guestId || ''] as const;

export const useTasksQuery = (owner: Owner) => useQuery({
  queryKey: getTaskKey(owner),
  queryFn: async () => {
    const result = await listTasks(owner);
    return result.tasks;
  },
  enabled: !!(owner.userId || owner.guestId),
  staleTime: 5000,
  refetchOnWindowFocus: false,
});

export const useTaskMutations = (owner: Owner) => {
  const queryClient = useQueryClient();
  const key = getTaskKey(owner);

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const [task] = await createTasks([input], owner);
      return task;
    },
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
    onSuccess: () => {
      // Delay refetch to ensure DB write is committed
      setTimeout(() => queryClient.invalidateQueries({ queryKey: key }), 1000);
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
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: key }), 1000);
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
