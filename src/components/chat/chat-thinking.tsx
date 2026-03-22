'use client';

import { Loader2 } from 'lucide-react';
import { ChunkIcon } from './chunk-icon';

export function ChatThinking({ label }: { label?: string }) {
  return (
    <div className="flex w-full gap-3 justify-start">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <ChunkIcon className="size-4" />
      </div>
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground animate-pulse">
          {label || 'Thinking...'}
        </span>
      </div>
    </div>
  );
}
