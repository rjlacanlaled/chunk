'use client';

import { ChunkIcon } from './chunk-icon';

export function ChatThinking({ label }: { label?: string }) {
  return (
    <div className="flex w-full gap-3 justify-start items-center">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <ChunkIcon className="size-4" variant="animated" />
      </div>
      <span className="text-sm font-medium animate-shimmer-text">
        {label || 'Thinking...'}
      </span>
    </div>
  );
}
