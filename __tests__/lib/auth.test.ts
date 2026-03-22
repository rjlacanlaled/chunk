import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  db: {},
}));

describe('auth configuration', () => {
  it('should export auth instance', async () => {
    const { auth } = await import('@/lib/auth');
    expect(auth).toBeDefined();
    expect(auth.handler).toBeDefined();
  });
});
