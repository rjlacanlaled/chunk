'use client';

import type { UIMessage } from 'ai';
import { isToolUIPart } from 'ai';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { User, CheckCircle2 } from 'lucide-react';
import { ChunkIcon } from './chunk-icon';
import { cn } from '@/lib/utils';

const TOOL_LABELS: Record<string, string> = {
  createTasks: 'Creating tasks',
  completeTasks: 'Completing tasks',
  updateTasks: 'Updating tasks',
  deleteTasks: 'Deleting tasks',
  listTasks: 'Checking your tasks',
  searchTasks: 'Searching tasks',
};

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-md bg-muted/60 p-3 text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-sm bg-muted/60 px-1 py-0.5 text-xs font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
  h1: ({ children }) => <p className="mb-1 text-base font-bold">{children}</p>,
  h2: ({ children }) => <p className="mb-1 text-sm font-bold">{children}</p>,
  h3: ({ children }) => <p className="mb-1 text-sm font-semibold">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ToolChip({ part }: { part: any }) {
  // v6: part.type is 'tool-<name>', toolName from type prefix
  const toolName = (part.type as string).replace('tool-', '');
  const label = TOOL_LABELS[toolName] || toolName;
  const isComplete = part.state === 'output-available';

  const args = (part.input ?? {}) as Record<string, unknown>;
  let detail = '';
  if (args?.title) detail = `: ${args.title}`;
  else if (Array.isArray(args?.tasks)) detail = ` (${args.tasks.length})`;
  else if (Array.isArray(args?.names)) detail = ` (${args.names.length})`;
  else if (args?.query) detail = `: "${args.query}"`;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs',
        isComplete
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-primary/30 bg-primary/10 text-primary',
      )}
    >
      {isComplete ? (
        <CheckCircle2 className="size-3.5 shrink-0" />
      ) : (
        <ChunkIcon variant="animated" className="size-3.5 shrink-0" />
      )}
      <span className="font-medium">
        {label}
        {detail}
      </span>
    </div>
  );
}

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const iconVariant = !isUser && isStreaming ? 'animated' : 'static';

  // For user messages, just render plain text
  if (isUser) {
    const text = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');

    return (
      <div className="flex w-full gap-3 justify-end">
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <User className="size-4" />
        </div>
      </div>
    );
  }

  // For assistant messages, render parts in chronological order
  return (
    <div className="flex w-full gap-3 justify-start">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <ChunkIcon className="size-4" variant={iconVariant} />
      </div>
      <div className="flex max-w-[75%] flex-col gap-2">
        {message.parts.map((part, i) => {
          if (part.type === 'text' && part.text.length > 0) {
            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`text-${i}`}
                className={`chat-bubble-assistant rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground ring-1 ring-border/50${isStreaming ? ' animate-shimmer' : ''}`}
              >
                <ReactMarkdown components={mdComponents}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          if (isToolUIPart(part)) {
            return (
              <ToolChip
                key={(part as any).toolCallId} // eslint-disable-line @typescript-eslint/no-explicit-any
                part={part}
              />
            );
          }

          return null;
        })}

        {/* Shimmer while tools are running with no text yet */}
        {isStreaming && !message.parts.some((p) => p.type === 'text' && p.text.length > 0) && (
          <span className="text-sm font-medium animate-shimmer-text">
            Working on it...
          </span>
        )}
      </div>
    </div>
  );
}
