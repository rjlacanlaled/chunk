'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

interface ChatPanelProps {
  owner: { userId?: string; guestId?: string };
  onTasksChanged?: () => void;
}

export function ChatPanel({ owner, onTasksChanged }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: owner,
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

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Your chaos, made manageable.
        </h1>
        <p className="text-muted-foreground">
          Tell me what you need to get done. I will turn it into tasks.
        </p>
        <div className="w-full max-w-md">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-3 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
