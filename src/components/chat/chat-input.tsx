'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLACEHOLDERS = [
  'I need to...',
  'I have this big thing...',
  'Help me plan...',
  'I keep putting off...',
  'My week looks like...',
];

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  value?: string;
  variant?: 'hero' | 'inline';
}

export function ChatInput({
  onSend,
  isLoading,
  value: controlledValue,
  variant = 'inline',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInput(controlledValue);
    }
  }, [controlledValue]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = variant === 'hero' ? 200 : 150;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, [variant]);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Refocus textarea after AI finishes responding
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isHero = variant === 'hero';

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={`
          flex items-end gap-2 rounded-2xl border border-border/60
          bg-card/80 backdrop-blur-sm shadow-lg
          transition-all duration-200
          focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20
          ${isHero ? 'px-5 py-4' : 'px-4 py-3'}
        `}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          disabled={isLoading}
          autoFocus // eslint-disable-line jsx-a11y/no-autofocus
          rows={1}
          className={`
            flex-1 resize-none bg-transparent outline-none
            placeholder:text-muted-foreground/60
            disabled:opacity-50
            ${isHero ? 'text-base' : 'text-sm'}
          `}
        />
        <Button
          type="submit"
          size={isHero ? 'icon' : 'icon-sm'}
          disabled={isLoading || !input.trim()}
          className={`
            shrink-0 rounded-xl transition-all duration-200
            ${input.trim()
              ? 'bg-primary text-primary-foreground opacity-100'
              : 'bg-muted text-muted-foreground opacity-50'}
          `}
        >
          <Send className={isHero ? 'size-4' : 'size-3.5'} />
        </Button>
      </div>
    </form>
  );
}
