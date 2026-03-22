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
}));

describe('ChatPanel', () => {
  it('shows hero text when no messages', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel owner={{ guestId: 'test-guest' }} />);

    expect(
      screen.getByText('Your chaos, made manageable.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tell me what you need to get done. I will turn it into tasks.',
      ),
    ).toBeInTheDocument();
  });

  it('renders chat input with correct placeholder', async () => {
    const { ChatPanel } = await import('@/components/chat/chat-panel');
    render(<ChatPanel owner={{ guestId: 'test-guest' }} />);

    expect(
      screen.getByPlaceholderText('Type your chaos here...'),
    ).toBeInTheDocument();
  });
});
