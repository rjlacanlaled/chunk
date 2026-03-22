import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

describe('ChatPanel', () => {
  it('shows hero text when no messages', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel owner={{ guestId: 'test-guest' }} />);

    expect(
      screen.getByText('What\'s slowing you down?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chunky will sort it out/),
    ).toBeInTheDocument();
  });

  it('renders suggestion chips in empty state', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel owner={{ guestId: 'test-guest' }} />);

    expect(
      screen.getByText('I have 5 things due this week'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Help me plan my day'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('I\'m procrastinating...'),
    ).toBeInTheDocument();
  });
});
