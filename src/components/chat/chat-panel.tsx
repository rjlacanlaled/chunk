'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { ChatThinking } from './chat-thinking';
import { ChatInput } from './chat-input';

const SUGGESTIONS = [
  'I have 5 things due this week',
  'Help me plan my day',
  'I\'m procrastinating...',
];

interface ChatPanelProps {
  owner: { userId?: string; guestId?: string };
  onTasksChanged?: () => void;
  compact?: boolean;
}

export function ChatPanel({
  owner,
  onTasksChanged,
  compact,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { owner },
    }),
    onFinish: () => onTasksChanged?.(),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  if (messages.length === 0 && !compact) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-[600px] flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary/80">
            <Sparkles className="size-5" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Your chaos, made manageable.
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Tell me what&apos;s on your mind. I&apos;ll turn it into tasks.
            </p>
          </div>
          <div className="mt-2 w-full">
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              variant="hero"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="rounded-full border border-border/60 bg-card/50 px-4 py-2
                  text-sm text-muted-foreground
                  transition-all duration-200
                  hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0 && compact) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground">
          Type your chaos here...
        </p>
        <div className="w-full">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div
          className={`mx-auto flex flex-col gap-4 py-6 ${
            compact ? 'max-w-full' : 'max-w-[700px]'
          }`}
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {status === 'submitted' && <ChatThinking />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div
        className={`border-t border-border/40 p-4 ${
          compact ? '' : 'mx-auto w-full max-w-[700px]'
        }`}
      >
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
