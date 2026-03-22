import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/server/actions/tasks', () => ({
  createTask: vi.fn().mockResolvedValue({
    id: 'new-id',
    title: 'New task',
    userId: null,
    guestId: 'guest-123',
    description: null,
    priority: 'medium',
    status: 'todo',
    position: 0,
    dueDate: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateTask: vi.fn().mockResolvedValue({
    id: 'test-id',
    title: 'Updated task',
    userId: null,
    guestId: 'guest-123',
    description: null,
    priority: 'medium',
    status: 'todo',
    position: 0,
    dueDate: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  listTasks: vi.fn().mockResolvedValue([]),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useTaskMutations', () => {
  it('should export createMutation, updateMutation, and deleteMutation', async () => {
    const { useTaskMutations } = await import('@/hooks/use-tasks');
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useTaskMutations({ guestId: 'guest-123' }),
      { wrapper },
    );

    expect(result.current.createMutation).toBeDefined();
    expect(result.current.updateMutation).toBeDefined();
    expect(result.current.deleteMutation).toBeDefined();
  });

  it('should call createTask action on createMutation.mutate', async () => {
    const { createTask } = await import('@/server/actions/tasks');
    const { useTaskMutations } = await import('@/hooks/use-tasks');
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useTaskMutations({ guestId: 'guest-123' }),
      { wrapper },
    );

    result.current.createMutation.mutate({ title: 'New task' });

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        { title: 'New task' },
        { guestId: 'guest-123' },
      );
    });
  });

  it('should call updateTask action on updateMutation.mutate', async () => {
    const { updateTask } = await import('@/server/actions/tasks');
    const { useTaskMutations } = await import('@/hooks/use-tasks');
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useTaskMutations({ guestId: 'guest-123' }),
      { wrapper },
    );

    result.current.updateMutation.mutate({ id: 'test-id', title: 'Updated task' });

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith({ id: 'test-id', title: 'Updated task' });
    });
  });

  it('should call deleteTask action on deleteMutation.mutate', async () => {
    const { deleteTask } = await import('@/server/actions/tasks');
    const { useTaskMutations } = await import('@/hooks/use-tasks');
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useTaskMutations({ guestId: 'guest-123' }),
      { wrapper },
    );

    result.current.deleteMutation.mutate('test-id');

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith('test-id');
    });
  });
});

describe('useTasksQuery', () => {
  it('should call listTasks with owner', async () => {
    const { listTasks } = await import('@/server/actions/tasks');
    const { useTasksQuery } = await import('@/hooks/use-tasks');
    const wrapper = createWrapper();

    renderHook(
      () => useTasksQuery({ guestId: 'guest-123' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(listTasks).toHaveBeenCalledWith({ guestId: 'guest-123' });
    });
  });
});
