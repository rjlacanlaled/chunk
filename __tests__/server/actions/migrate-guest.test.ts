import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWhereTask = vi.fn();
const mockSetTask = vi.fn(() => ({ where: mockWhereTask }));
const mockUpdateTask = vi.fn(() => ({ set: mockSetTask }));

const mockWhereChat = vi.fn();
const mockSetChat = vi.fn(() => ({ where: mockWhereChat }));
const mockUpdateChat = vi.fn(() => ({ set: mockSetChat }));

let callCount = 0;

vi.mock('@/server/db', () => ({
  db: {
    update: (...args: unknown[]) => {
      callCount += 1;
      if (callCount % 2 === 1) return mockUpdateTask(...args);
      return mockUpdateChat(...args);
    },
  },
}));

describe('migrateGuestData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callCount = 0;
  });

  it('updates tasks and chat messages with userId and clears guestId', async () => {
    mockWhereTask.mockResolvedValueOnce(undefined);
    mockWhereChat.mockResolvedValueOnce(undefined);

    const { migrateGuestData } = await import(
      '@/server/actions/migrate-guest'
    );
    await migrateGuestData('guest-123', 'user-456');

    expect(mockUpdateTask).toHaveBeenCalled();
    expect(mockSetTask).toHaveBeenCalledWith({
      userId: 'user-456',
      guestId: null,
    });
    expect(mockWhereTask).toHaveBeenCalled();

    expect(mockUpdateChat).toHaveBeenCalled();
    expect(mockSetChat).toHaveBeenCalledWith({
      userId: 'user-456',
      guestId: null,
    });
    expect(mockWhereChat).toHaveBeenCalled();
  });
});
