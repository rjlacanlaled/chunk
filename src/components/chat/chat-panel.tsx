'use client';

import { useEffect, useRef, useCallback, useState, type MutableRefObject } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart } from 'ai';
import type { UIMessage } from 'ai';
import { ChunkIcon } from './chunk-icon';
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
  sendRef?: MutableRefObject<((text: string) => void) | null>;
}

export function ChatPanel({
  owner,
  onTasksChanged,
  compact,
  sendRef,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loadedMessages, setLoadedMessages] = useState<UIMessage[] | null>(null);
  const ownerKey = owner.userId || owner.guestId || '';
  const loadedForOwner = useRef('');

  // Load chat history from DB — only once per owner
  useEffect(() => {
    if (!ownerKey || loadedForOwner.current === ownerKey) return;
    loadedForOwner.current = ownerKey;
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner }),
    })
      .then((res) => res.json())
      .then((msgs: UIMessage[]) => setLoadedMessages(msgs.length > 0 ? msgs : []))
      .catch(() => setLoadedMessages([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey]);

  // Don't mount useChat until history is loaded for the first time
  if (loadedMessages === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <img src="/chunk-logos/chunky-thinking.svg" alt="Loading" className="size-16" />
      </div>
    );
  }

  return <ChatPanelInner owner={owner} onTasksChanged={onTasksChanged} compact={compact} sendRef={sendRef} initialMessages={loadedMessages.length > 0 ? loadedMessages : undefined} />;
}

function ChatPanelInner({
  owner,
  onTasksChanged,
  compact,
  sendRef,
  initialMessages,
}: ChatPanelProps & { initialMessages?: UIMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const transport = new DefaultChatTransport({
    api: '/api/chat',
    body: { owner, clientTimezone: timezone },
  });

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onFinish: () => onTasksChanged?.(),
  });

  // Load initial messages from DB on first mount
  const hasSetInitial = useRef(false);
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0 && !hasSetInitial.current) {
      hasSetInitial.current = true;
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const isLoading = status === 'submitted' || status === 'streaming';
  const prevStatusRef = useRef(status);
  const [stuck, setStuck] = useState(false);

  // Detect stuck state — if loading for more than 30 seconds, show retry
  useEffect(() => {
    if (!isLoading) { setStuck(false); return; }
    const timer = setTimeout(() => setStuck(true), 120000);
    return () => clearTimeout(timer);
  }, [isLoading, messages.length]);

  useEffect(() => {
    if (prevStatusRef.current !== 'ready' && status === 'ready') {
      onTasksChanged?.();
    }
    prevStatusRef.current = status;
  }, [status, onTasksChanged]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refresh tasks whenever tool outputs appear during streaming
  const lastToolOutputCount = useRef(0);
  useEffect(() => {
    if (status !== 'streaming' || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return;
    // Count tool parts with output-available state (tool finished executing)
    const completedTools = lastMsg.parts.filter(
      (p) => isToolUIPart(p) && (p as any).state === 'output-available',
    ).length;
    if (completedTools > lastToolOutputCount.current) {
      lastToolOutputCount.current = completedTools;
      onTasksChanged?.();
    }
  }, [messages, status, onTasksChanged]);

  // Reset count when not streaming
  useEffect(() => {
    if (status === 'ready') lastToolOutputCount.current = 0;
  }, [status]);

  const handleSend = useCallback((text: string) => {
    sendMessage({ text });
  }, [sendMessage]);

  // Listen for chat actions from interactive components (e.g. task list buttons)
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      if (msg) handleSend(msg);
    };
    window.addEventListener('chunk-action', handler);
    return () => window.removeEventListener('chunk-action', handler);
  }, [handleSend]);

  useEffect(() => {
    if (sendRef) {
      sendRef.current = handleSend;
    }
  }, [sendRef, handleSend]);


  if (messages.length === 0 && !compact) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-[600px] flex-col items-center gap-6">
          <ChunkIcon variant="idle" className="size-12" />
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              What&apos;s slowing you down?
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Drop it here. Chunky will sort it out.
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
          What&apos;s on your plate?
        </p>
        <div className="w-full">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="flex-1 min-h-0 px-2 md:px-4">
        <div
          className={`mx-auto flex flex-col gap-3 md:gap-4 py-4 md:py-6 ${
            compact ? 'max-w-full' : 'max-w-[700px]'
          }`}
        >
          {messages.map((msg, i) => {
            const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
            const msgIsStreaming = isLastAssistant && isLoading;
            return (
              <ChatMessage key={msg.id} message={msg} isStreaming={msgIsStreaming} />
            );
          })}
          {status === 'submitted' && !stuck && <ChatThinking />}
          {stuck && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              <span>Chunky seems stuck. Try sending your message again.</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div
        className={`shrink-0 border-t border-border/40 p-2 md:p-4 ${
          compact ? '' : 'mx-auto w-full max-w-[700px]'
        }`}
      >
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
