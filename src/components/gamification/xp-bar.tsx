'use client';

import { cn } from '@/lib/utils';
import { LEVELS } from '@/lib/gamification';

interface XpBarProps {
  xp: number;
  level: {
    current: { name: string; xp: number; medal: string };
    next: { name: string; xp: number; medal: string } | null;
  };
}

export function XpBar({ xp, level }: XpBarProps) {
  const { current, next } = level;

  const levelIndex = LEVELS.findIndex((l) => l.name === current.name);
  const levelNum = levelIndex + 1;

  const progress = next
    ? ((xp - current.xp) / (next.xp - current.xp)) * 100
    : 100;

  const currentXp = xp - current.xp;
  const neededXp = next ? next.xp - current.xp : 0;

  return (
    <div className="flex items-center gap-2">
      <img
        src={current.medal}
        alt={current.name}
        className="size-6"
      />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-foreground">
            {current.name}
          </span>
          {next && (
            <img
              src={next.medal}
              alt={next.name}
              className="size-3.5 opacity-30"
              title={`Next: ${next.name}`}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full bg-primary',
                'transition-all duration-700 ease-out',
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">
            {next ? `${currentXp}/${neededXp} XP` : `${xp} XP`}
          </span>
        </div>
      </div>
    </div>
  );
}
