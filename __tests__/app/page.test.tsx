import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Landing page', () => {
  it('should redirect to landing.html', async () => {
    const { redirect } = await import('next/navigation');
    const Page = (await import('@/app/page')).default;

    Page();

    expect(redirect).toHaveBeenCalledWith('/landing.html');
  });
});
