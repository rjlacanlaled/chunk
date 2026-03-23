'use client';

import type { UIMessage } from 'ai';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { User } from 'lucide-react';
import ToolChip from '@/components/chat/tool-chip';
import { ToolTaskList } from '@/components/chat/tool-task-list';

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

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

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

  // Pick avatar based on state
  const avatar = isStreaming
    ? '/chunk-tools/chunky-avatar-working.svg'
    : '/chunk-tools/chunky-avatar-idle.svg';

  // For assistant messages, render parts in chronological order
  return (
    <div className="flex w-full gap-3 justify-start">
      <img src={avatar} alt="Chunky" className="size-8 shrink-0" />
      <div className="flex max-w-[75%] flex-col gap-2">
        {message.parts.map((part, i) => {
          if (part.type === 'text' && part.text.length > 0) {
            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`text-${i}`}
                className={`chat-bubble-assistant rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground${isStreaming ? ' animate-shimmer' : ''}`}
              >
                <ReactMarkdown components={mdComponents}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
            const toolName = part.type.replace('tool-', '');
            const tp = part as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            const showTaskList = (toolName === 'listTasks' || toolName === 'searchTasks')
              && tp.state === 'output-available' && tp.output;
            return (
              <div key={tp.toolCallId} className="flex flex-col gap-2">
                <ToolChip
                  tool={toolName}
                  state={tp.state}
                  input={tp.input}
                />
                {showTaskList && <ToolTaskList output={tp.output} />}
              </div>
            );
          }

          return null;
        })}

        {/* Shimmer while tools are running with no text yet */}
        {isStreaming && !message.parts.some((p) => p.type === 'text' && p.text.length > 0) && (
          <ToolChip tool="thinking" />
        )}
      </div>
    </div>
  );
}
