'use client';

import type { UIMessage } from 'ai';
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
  breakDownTask: 'Breaking it down',
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

function ToolChip({ part }: { part: Extract<UIMessage['parts'][number], { type: 'tool-invocation' }> }) {
  const { toolInvocation } = part;
  const label = TOOL_LABELS[toolInvocation.toolName] ?? toolInvocation.toolName;
  const isComplete = toolInvocation.state === 'result';

  // Try to get a meaningful description from the args
  const args = toolInvocation.args as Record<string, unknown>;
  let detail = '';
  if (args?.title) detail = `: ${args.title}`;
  else if (Array.isArray(args?.tasks)) detail = ` (${args.tasks.length})`;
  else if (Array.isArray(args?.names)) detail = ` (${args.names.length})`;
  else if (args?.name) detail = `: ${args.name}`;

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
        {label}{detail}
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

  const textParts = message.parts.filter((p) => p.type === 'text');
  const toolParts = message.parts.filter((p) => p.type === 'tool-invocation');
  const hasText = textParts.some((p) => p.text.length > 0);
  const hasTools = toolParts.length > 0;

  // Use animated icon while this message is still streaming
  const iconVariant = !isUser && isStreaming ? 'animated' : 'static';

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <ChunkIcon className="size-4" variant={iconVariant} />
        </div>
      )}
      <div className="flex max-w-[75%] flex-col gap-2">
        {/* Tool invocation chips — always visible */}
        {!isUser && hasTools && (
          <div className="flex flex-col gap-1">
            {toolParts.map((part) => (
              <ToolChip
                key={(part as Extract<UIMessage['parts'][number], { type: 'tool-invocation' }>).toolInvocation.toolCallId}
                part={part as Extract<UIMessage['parts'][number], { type: 'tool-invocation' }>}
              />
            ))}
          </div>
        )}

        {/* Text content */}
        {hasText && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card ring-1 ring-border/50 text-card-foreground rounded-bl-md',
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">
                {textParts.map((p) => p.text).join('')}
              </p>
            ) : (
              <ReactMarkdown components={mdComponents}>
                {textParts.map((p) => p.text).join('')}
              </ReactMarkdown>
            )}
          </div>
        )}

        {/* Shimmer status when tools are running but no text yet */}
        {!isUser && !hasText && hasTools && (
          <span className="text-sm font-medium animate-shimmer-text">
            {(() => {
              const activeTool = toolParts.find(
                (p) => (p as any).toolInvocation?.state !== 'result',
              );
              if (activeTool) {
                const name = (activeTool as any).toolInvocation?.toolName;
                return TOOL_LABELS[name] || 'Working on it...';
              }
              return 'Finishing up...';
            })()}
          </span>
        )}
      </div>
      {isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <User className="size-4" />
        </div>
      )}
    </div>
  );
}
