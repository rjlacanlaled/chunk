'use client';

import { useMemo } from 'react';
import { CheckCircle2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getXpForTask } from '@/lib/gamification';
import type { Task } from '@/types/task';

const MAX_ENTRIES = 8;

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface ActivityFeedProps {
  tasks: Task[];
}

export function ActivityFeed({ tasks }: ActivityFeedProps) {
  const recentDone = useMemo(
    () => tasks
      .filter((t) => t.status === 'done')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_ENTRIES),
    [tasks],
  );

  if (recentDone.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 px-1">
        <Activity className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </span>
      </div>
      <div className="flex flex-col gap-0.5 rounded-lg border border-border/40 bg-card/50 p-2 max-h-48 overflow-y-auto">
        {recentDone.map((task) => {
          const earnedXp = getXpForTask(task.score);
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/30 transition-colors"
            >
              <CheckCircle2 className="size-3 shrink-0 text-emerald-400" />
              <span className="truncate text-foreground/90">{task.title}</span>
              <span
                className={cn(
                  'ml-auto shrink-0 font-semibold tabular-nums',
                  'text-primary',
                )}
              >
                +
                {earnedXp}
                {' XP'}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums w-12 text-right">
                {timeAgo(task.updatedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
