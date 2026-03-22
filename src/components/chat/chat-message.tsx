'use client';

import type { UIMessage } from 'ai';
import { Bot, User, Loader2, CheckCircle2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOL_LABELS: Record<string, string> = {
  createTask: 'Creating task',
  updateTask: 'Updating task',
  deleteTask: 'Deleting task',
  listTasks: 'Looking up tasks',
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
        <Loader2 className="size-3 animate-spin" />
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
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot className="size-4" />
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
          <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Wrench className="size-3" />
            Working on it...
          </div>
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
