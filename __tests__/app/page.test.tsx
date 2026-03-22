import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: null }),
}));

vi.mock('@/hooks/use-guest', () => ({
  useGuestId: () => 'test-guest-id',
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

describe('Home page', () => {
  it('shows hero text when no tasks', async () => {
    const { default: Home } = await import('@/app/page');
    const Wrapper = createWrapper();
    render(<Wrapper><Home /></Wrapper>);

    expect(
      screen.getByText('Your chaos, made manageable.'),
    ).toBeInTheDocument();
  });

  it('shows chat input', async () => {
    const { default: Home } = await import('@/app/page');
    const Wrapper = createWrapper();
    render(<Wrapper><Home /></Wrapper>);

    expect(
      screen.getByPlaceholderText('Type your chaos here...'),
    ).toBeInTheDocument();
  });

  it('renders the Chunk logo', async () => {
    const { default: Home } = await import('@/app/page');
    const Wrapper = createWrapper();
    render(<Wrapper><Home /></Wrapper>);

    const logo = screen.getByAltText('Chunk');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      'src',
      '/chunk-logos/chunk-logo-horizontal-dark.svg',
    );
  });
});
