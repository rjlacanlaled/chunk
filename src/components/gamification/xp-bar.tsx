'use client';

import { cn } from '@/lib/utils';
import { LEVELS } from '@/lib/gamification';

function getBadgeSrc(levelNum: number): string {
  if (levelNum <= 2) return '/chunk-gamification/chunk-badge-common.svg';
  if (levelNum <= 4) return '/chunk-gamification/chunk-badge-rare.svg';
  return '/chunk-gamification/chunk-badge-epic.svg';
}

interface XpBarProps {
  xp: number;
  level: {
    current: { name: string; xp: number };
    next: { name: string; xp: number } | null;
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
      <div className="flex items-center gap-1 text-primary">
        <img
          src={getBadgeSrc(levelNum)}
          alt={`Level ${levelNum} badge`}
          width={20}
          height={20}
          className="size-5"
        />
        <span className="text-xs font-bold tabular-nums">
          Lv.{levelNum}
        </span>
      </div>
      <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline">
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
      <span className="text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">
        {next ? `${currentXp}/${neededXp} XP` : `${xp} XP`}
      </span>
    </div>
  );
}
