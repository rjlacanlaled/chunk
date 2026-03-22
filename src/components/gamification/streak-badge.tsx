'use client';

import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full px-2.5 py-1',
        'bg-orange-500/15 text-orange-400',
        streak > 0 && 'animate-pulse',
      )}
      title={`${streak} day streak`}
    >
      <img
        src="/chunk-gamification/chunk-flame-animated.svg"
        alt="Streak flame"
        width={16}
        height={16}
        className="size-4"
      />
      <span className="text-xs font-semibold">{streak}</span>
    </div>
  );
}
