'use client';

import { useMemo } from 'react';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

interface ScoreSummaryProps {
  tasks: Task[];
}

export function ScoreSummary({ tasks }: ScoreSummaryProps) {
  const { today, week, allTime } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const doneTasks = tasks.filter((t) => t.status === 'done');

    const todayScore = doneTasks
      .filter((t) => new Date(t.updatedAt) >= startOfToday)
      .reduce((sum, t) => sum + (t.score ?? 0), 0);

    const weekScore = doneTasks
      .filter((t) => new Date(t.updatedAt) >= startOfWeek)
      .reduce((sum, t) => sum + (t.score ?? 0), 0);

    const allTimeScore = doneTasks.reduce((sum, t) => sum + (t.score ?? 0), 0);

    return { today: todayScore, week: weekScore, allTime: allTimeScore };
  }, [tasks]);

  if (allTime === 0) return null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 px-4 py-2">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {today > 0 && (
          <div className="flex items-center gap-1.5">
            <Target className="size-3 text-emerald-400" />
            <span className="font-semibold tabular-nums text-emerald-400">
              Today:
              {' '}
              {today}
              {' '}
              pts
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3 text-amber-400" />
          <span className="font-semibold tabular-nums text-foreground">
            Week: 
            {' '}
            {week}
            {' '}
            pts
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="size-3 text-primary" />
          <span className="font-semibold tabular-nums text-foreground">
            Total: 
            {' '}
            {allTime}
            {' '}
            pts
          </span>
        </div>
      </div>
    </div>
  );
}
