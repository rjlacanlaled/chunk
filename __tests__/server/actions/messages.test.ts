import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockSelectWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

describe('message server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveMessage', () => {
    it('should be a function', async () => {
      const { saveMessage } = await import('@/server/actions/messages');
      expect(typeof saveMessage).toBe('function');
    });

    it('should insert a message and return it', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        userId: null,
        guestId: 'guest-123',
        sessionId: null,
        toolInvocations: null,
        createdAt: new Date('2026-01-01'),
      };
      mockReturning.mockResolvedValueOnce([mockMessage]);

      const { saveMessage } = await import('@/server/actions/messages');
      const result = await saveMessage({
        role: 'user',
        content: 'Hello',
        guestId: 'guest-123',
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Hello',
          guestId: 'guest-123',
        }),
      );
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getRecentMessages', () => {
    it('should be a function', async () => {
      const { getRecentMessages } = await import('@/server/actions/messages');
      expect(typeof getRecentMessages).toBe('function');
    });

    it('should return messages in chronological order', async () => {
      const messages = [
        { id: 'msg-2', content: 'Newer', createdAt: new Date('2026-01-02') },
        { id: 'msg-1', content: 'Older', createdAt: new Date('2026-01-01') },
      ];
      mockLimit.mockResolvedValueOnce(messages);

      const { getRecentMessages } = await import('@/server/actions/messages');
      const result = await getRecentMessages({ guestId: 'guest-123' });

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockSelectWhere).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(20);
      // Result should be reversed (oldest first)
      expect(result).toEqual(messages.reverse());
    });
  });
});
