import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: null }),
  signIn: { social: vi.fn() },
  signOut: vi.fn(),
}));

vi.mock('@/hooks/use-guest', () => ({
  useGuestId: () => 'test-guest-id',
}));

vi.mock('@/hooks/use-auth-with-migration', () => ({
  useAuthWithMigration: () => null,
}));

vi.mock('@/server/actions/tasks', () => ({
  listTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    status: 'ready',
  }),
}));

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('Dashboard page', () => {
  it('renders the Chunk logo', async () => {
    const { default: Dashboard } = await import('@/app/dashboard/page');
    const Wrapper = createWrapper();
    render(<Wrapper><Dashboard /></Wrapper>);

    const logos = screen.getAllByAltText('Chunk');
    const headerLogo = logos.find(
      (el) => el.getAttribute('src') === '/chunk-logos/chunk-logo-horizontal-dark.svg',
    );
    expect(headerLogo).toBeInTheDocument();
  });
});
