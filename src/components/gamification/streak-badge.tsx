'use client';

import { Flame } from 'lucide-react';
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
      <Flame className="size-3.5" />
      <span className="text-xs font-semibold">{streak}</span>
    </div>
  );
}
