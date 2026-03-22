'use client';

import type { UIMessage } from 'ai';
import { User, CheckCircle2 } from 'lucide-react';
import { ChunkIcon } from './chunk-icon';
import { cn } from '@/lib/utils';

const TOOL_LABELS: Record<string, string> = {
  createTask: 'Creating task',
  createTasks: 'Creating tasks',
  completeTask: 'Completing task',
  updateTaskByName: 'Updating task',
  deleteTaskByName: 'Deleting task',
  listTasks: 'Checking your tasks',
};

function ToolChip({ part }: { part: Extract<UIMessage['parts'][number], { type: 'tool-invocation' }> }) {
  const { toolInvocation } = part;
  const label = TOOL_LABELS[toolInvocation.toolName] ?? toolInvocation.toolName;
  const title = (toolInvocation.args as Record<string, unknown>)?.title as string | undefined;
  const isComplete = toolInvocation.state === 'result';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
        isComplete
          ? 'bg-primary/10 text-primary'
          : 'bg-muted/80 text-muted-foreground',
      )}
    >
      {isComplete ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <span className="size-3 rounded-full bg-primary/50 animate-breathe" />
      )}
      {label}
      {title ? `: ${title}` : ''}
    </span>
  );
}

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const textParts = message.parts.filter((p) => p.type === 'text');
  const toolParts = message.parts.filter((p) => p.type === 'tool-invocation');
  const hasText = textParts.some((p) => p.text.length > 0);
  const hasTools = toolParts.length > 0;

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <ChunkIcon className="size-4" />
        </div>
      )}
      <div className="flex max-w-[75%] flex-col gap-2">
        {/* Tool invocation chips */}
        {!isUser && hasTools && (
          <div className="flex flex-wrap gap-1.5">
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
            <p className="whitespace-pre-wrap">
              {textParts.map((p) => p.text).join('')}
            </p>
          </div>
        )}

        {/* If assistant message has tool calls but no text yet */}
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
              return 'Working on it...';
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
