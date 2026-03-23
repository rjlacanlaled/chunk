'use client';

import ToolChip from './tool-chip';

export function ChatThinking({ label }: { label?: string }) {
  return (
    <div className="flex w-full gap-3 justify-start items-center">
      <img src="/chunk-tools/chunky-avatar-thinking.svg" alt="Chunky" className="size-6 md:size-8 shrink-0" width={32} height={32} />
      {label ? (
        <span className="text-sm font-medium animate-shimmer-text">{label}</span>
      ) : (
        <div className="flex-1"><ToolChip tool="thinking" /></div>
      )}
    </div>
  );
}
