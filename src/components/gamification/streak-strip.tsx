'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface StreakStripProps {
  tasks: Task[];
  streak: number;
}

export function StreakStrip({ tasks, streak }: StreakStripProps) {
  const days = useMemo(() => {
    const completedDates = new Set(
      tasks
        .filter((t) => t.status === 'done')
        .map((t) => toDateStr(new Date(t.updatedAt))),
    );

    const today = new Date();
    const todayStr = toDateStr(today);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = toDateStr(date);
      return {
        key: dateStr,
        label: DAY_LABELS[date.getDay()],
        active: completedDates.has(dateStr),
        isToday: dateStr === todayStr,
      };
    });
  }, [tasks]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {days.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'size-5 rounded-full transition-colors duration-300',
                day.active
                  ? 'bg-primary'
                  : 'bg-muted/50',
                day.isToday && 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background',
                day.isToday && !day.active && 'animate-pulse',
              )}
            />
            <span
              className={cn(
                'text-[9px] font-medium',
                day.isToday ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="size-3.5" />
          <span className="text-xs font-bold tabular-nums">
            {streak}
            d
          </span>
        </div>
      )}
    </div>
  );
}
