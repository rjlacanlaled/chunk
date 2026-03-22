'use client';

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
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

    const allTimeScore = doneTasks
      .reduce((sum, t) => sum + (t.score ?? 0), 0);

    return { today: todayScore, week: weekScore, allTime: allTimeScore };
  }, [tasks]);

  if (allTime === 0) return null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 px-4 py-2">
      <Trophy className="size-4 text-primary" />
      <div className="flex gap-4 text-xs">
        <div className="flex flex-col items-center">
          <span className="font-semibold tabular-nums text-foreground">{today}</span>
          <span className="text-muted-foreground">Today</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold tabular-nums text-foreground">{week}</span>
          <span className="text-muted-foreground">Week</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold tabular-nums text-foreground">{allTime}</span>
          <span className="text-muted-foreground">Total</span>
        </div>
      </div>
    </div>
  );
}
