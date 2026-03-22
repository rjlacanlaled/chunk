import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task } from '@/types/task';

const mockTask: Task = {
  id: 'test-id-1',
  userId: null,
  guestId: 'guest-123',
  title: 'Test task',
  description: null,
  priority: 'medium',
  status: 'todo',
  position: 0,
  dueDate: null,
  parentTaskId: null,
  score: null,
  taskNumber: 1,
  deletedAt: null,
  metadata: {},
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockWhereAfterSet = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhereAfterSet }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockSelectWhere = vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockExecute = vi.fn();

vi.mock('@/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

describe('task server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTasks', () => {
    it('should batch create tasks and return them', async () => {
      // getNextTaskNumber: select().from().where() returns array-like
      mockSelectWhere.mockResolvedValueOnce([{ max: 0 }]);
      // insert().values().returning()
      mockReturning.mockResolvedValueOnce([mockTask]);

      const { createTasks } = await import('@/server/actions/tasks');
      const result = await createTasks(
        [{ title: 'Test task' }],
        { guestId: 'guest-123' },
      );

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'Test task', guestId: 'guest-123', taskNumber: 1 }),
      ]);
      expect(result).toEqual([mockTask]);
    });

    it('should return empty array for empty input', async () => {
      const { createTasks } = await import('@/server/actions/tasks');
      const result = await createTasks([], { guestId: 'guest-123' });
      expect(result).toEqual([]);
    });
  });

  describe('updateTask', () => {
    it('should update fields and return updated task', async () => {
      const updatedTask = { ...mockTask, title: 'Updated task' };
      mockReturning.mockResolvedValueOnce([updatedTask]);

      const { updateTask } = await import('@/server/actions/tasks');
      const result = await updateTask({ id: 'test-id-1', title: 'Updated task' });

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated task' }),
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe('deleteTask', () => {
    it('should soft delete a task by setting deletedAt', async () => {
      const { deleteTask } = await import('@/server/actions/tasks');
      await deleteTask('test-id-1');

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });
  });

  describe('completeWithDescendants', () => {
    it('should execute recursive CTE to complete task and descendants', async () => {
      mockExecute.mockResolvedValueOnce({ count: 3 });

      const { completeWithDescendants } = await import('@/server/actions/tasks');
      const count = await completeWithDescendants('test-id-1');

      expect(mockExecute).toHaveBeenCalled();
      expect(count).toBe(3);
    });
  });

  describe('deleteByIds', () => {
    it('should get titles then soft-delete via recursive CTE', async () => {
      // Title lookup: select({title}).from().where() — mockSelectWhere returns array
      mockSelectWhere.mockResolvedValueOnce([{ title: 'Task A' }]);
      // CTE delete
      mockExecute.mockResolvedValueOnce({ count: 2 });

      const { deleteByIds } = await import('@/server/actions/tasks');
      const result = await deleteByIds(['id-1']);

      expect(result.deleted).toBe(2);
      expect(result.titles).toEqual(['Task A']);
    });

    it('should return zero for empty ids', async () => {
      const { deleteByIds } = await import('@/server/actions/tasks');
      const result = await deleteByIds([]);
      expect(result).toEqual({ deleted: 0, titles: [] });
    });
  });

  describe('listTasks', () => {
    it('should return paginated results for a guest', async () => {
      mockLimit.mockResolvedValueOnce([mockTask]);

      const { listTasks } = await import('@/server/actions/tasks');
      const result = await listTasks({ guestId: 'guest-123' });

      expect(mockSelect).toHaveBeenCalled();
      expect(result.tasks).toEqual([mockTask]);
      expect(result.nextCursor).toBeNull();
    });

    it('should return empty for no owner', async () => {
      const { listTasks } = await import('@/server/actions/tasks');
      const result = await listTasks({});
      expect(result).toEqual({ tasks: [], nextCursor: null });
    });
  });
});
