'use client';

import ToolChip from './tool-chip';

export function ChatThinking({ label }: { label?: string }) {
  return (
    <div className="flex w-full gap-3 justify-start items-center">
      <img src="/chunk-tools/chunky-avatar-thinking.svg" alt="Chunky" className="size-8 shrink-0" />
      {label ? (
        <span className="text-sm font-medium animate-shimmer-text">{label}</span>
      ) : (
        <ToolChip tool="thinking" />
      )}
    </div>
  );
}
