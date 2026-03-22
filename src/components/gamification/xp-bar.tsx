'use client';

import { cn } from '@/lib/utils';

interface XpBarProps {
  xp: number;
  level: {
    current: { name: string; xp: number };
    next: { name: string; xp: number } | null;
  };
}

export function XpBar({ xp, level }: XpBarProps) {
  const { current, next } = level;

  const progress = next
    ? ((xp - current.xp) / (next.xp - current.xp)) * 100
    : 100;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {current.name}
      </span>
      <div className="relative h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full bg-primary',
            'transition-all duration-700 ease-out',
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {xp} XP
      </span>
    </div>
  );
}
