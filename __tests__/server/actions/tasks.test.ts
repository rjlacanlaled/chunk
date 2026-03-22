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

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockSelectWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

describe('task server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task and return it', async () => {
      // First call: listTasks inside getNextTaskNumber
      mockSelectWhere.mockResolvedValueOnce([]);
      // Second call: the insert returning
      mockReturning.mockResolvedValueOnce([mockTask]);

      const { createTask } = await import('@/server/actions/tasks');
      const result = await createTask(
        { title: 'Test task' },
        { guestId: 'guest-123' },
      );

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test task', guestId: 'guest-123', taskNumber: 1 }),
      );
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
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
      expect(mockWhereAfterSet).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task by id', async () => {
      mockDeleteWhere.mockResolvedValueOnce(undefined);

      const { deleteTask } = await import('@/server/actions/tasks');
      await deleteTask('test-id-1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });
  });

  describe('listTasks', () => {
    it('should return tasks for a guest', async () => {
      mockSelectWhere.mockResolvedValueOnce([mockTask]);

      const { listTasks } = await import('@/server/actions/tasks');
      const result = await listTasks({ guestId: 'guest-123' });

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockSelectWhere).toHaveBeenCalled();
      expect(result).toEqual([mockTask]);
    });

    it('should return tasks for a user', async () => {
      const userTask = { ...mockTask, userId: 'user-1', guestId: null };
      mockSelectWhere.mockResolvedValueOnce([userTask]);

      const { listTasks } = await import('@/server/actions/tasks');
      const result = await listTasks({ userId: 'user-1' });

      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual([userTask]);
    });
  });
});
