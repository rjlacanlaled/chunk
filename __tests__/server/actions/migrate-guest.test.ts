import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

vi.mock('@/server/db', () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

describe('migrateGuestData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('migrates guest data when account is fresh', async () => {
    // No existing tasks for the user
    mockSelectLimit.mockResolvedValueOnce([]);

    const { migrateGuestData } = await import('@/server/actions/migrate-guest');
    const result = await migrateGuestData('guest-123', 'user-456');

    expect(result.action).toBe('migrated');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ userId: 'user-456', guestId: null });
  });

  it('discards guest data when account already has data', async () => {
    // Account already has tasks
    mockSelectLimit.mockResolvedValueOnce([{ id: 'existing-task' }]);

    const { migrateGuestData } = await import('@/server/actions/migrate-guest');
    const result = await migrateGuestData('guest-123', 'user-456');

    expect(result.action).toBe('discarded');
    expect(mockDelete).toHaveBeenCalled();
  });
});
