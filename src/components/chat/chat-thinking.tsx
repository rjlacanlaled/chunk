'use client';

import { Bot } from 'lucide-react';

export function ChatThinking() {
  return (
    <div className="flex w-full gap-3 justify-start">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Bot className="size-4" />
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-card ring-1 ring-border/50 px-4 py-3">
        <p className="mb-2.5 text-xs font-medium text-muted-foreground">
          Thinking...
        </p>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-52 rounded-md bg-muted/60 animate-shimmer" />
          <div className="h-3 w-40 rounded-md bg-muted/60 animate-shimmer" />
          <div className="h-3 w-28 rounded-md bg-muted/60 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
