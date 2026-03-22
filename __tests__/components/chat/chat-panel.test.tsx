import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    status: 'ready',
  }),
}));

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
  isToolUIPart: vi.fn(() => false),
}));

// Mock fetch for chat history loading
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve([]),
  }) as unknown as typeof fetch;
});

describe('ChatPanel', () => {
  it('shows hero text when no messages', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel owner={{ guestId: 'test-guest' }} />);

    await waitFor(() => {
      expect(
        screen.getByText('What\'s slowing you down?'),
      ).toBeInTheDocument();
    });
  });

  it('renders suggestion chips in empty state', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel owner={{ guestId: 'test-guest' }} />);

    await waitFor(() => {
      expect(
        screen.getByText('I have 5 things due this week'),
      ).toBeInTheDocument();
    });
  });
});
