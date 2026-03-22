'use client';

import { useMemo } from 'react';
import { Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChunkIcon } from '@/components/chat/chunk-icon';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

const DAILY_TASK_GOAL = 3;
const DAILY_SCORE_GOAL = 30;

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const complete = progress >= 1;
  const empty = progress === 0;

  const src = complete
    ? '/chunk-gamification/chunk-progress-ring-complete.svg'
    : empty
      ? '/chunk-gamification/chunk-progress-ring-empty.svg'
      : '/chunk-gamification/chunk-progress-ring.svg';

  const alt = complete
    ? 'Mission complete'
    : empty
      ? 'No progress'
      : `${Math.round(progress * 100)}% progress`;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0"
    />
  );
}

interface DailyMissionProps {
  tasks: Task[];
}

export function DailyMission({ tasks }: DailyMissionProps) {
  const { tasksDone, scoreDone, progress, isComplete } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayDone = tasks.filter(
      (t) => t.status === 'done' && new Date(t.updatedAt) >= startOfToday,
    );

    const doneCount = todayDone.length;
    const doneScore = todayDone.reduce((sum, t) => sum + (t.score ?? 0), 0);

    const taskProgress = doneCount / DAILY_TASK_GOAL;
    const scoreProgress = doneScore / DAILY_SCORE_GOAL;
    const best = Math.max(taskProgress, scoreProgress);

    return {
      tasksDone: doneCount,
      scoreDone: doneScore,
      progress: best,
      isComplete: best >= 1,
    };
  }, [tasks]);

  const goalText = isComplete
    ? 'Mission Complete!'
    : `Complete ${DAILY_TASK_GOAL} tasks or earn ${DAILY_SCORE_GOAL} pts`;

  return (
    <Card size="sm" className="border-none ring-1 ring-border/40 bg-card/60">
      <CardContent className="flex items-center gap-3">
        <div className="animate-bounce-subtle shrink-0">
          <ChunkIcon variant="idle" className="size-9" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Rocket className="size-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Today&apos;s Mission
            </span>
          </div>
          <p
            className={cn(
              'text-xs truncate',
              isComplete ? 'font-semibold text-emerald-400' : 'text-muted-foreground',
            )}
          >
            {goalText}
          </p>
          {!isComplete && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {tasksDone}
              /
              {DAILY_TASK_GOAL}
              {' tasks \u00b7 '}
              {scoreDone}
              /
              {DAILY_SCORE_GOAL}
              {' pts'}
            </span>
          )}
        </div>
        <div className="ml-auto">
          <ProgressRing progress={progress} size={44} />
        </div>
      </CardContent>
    </Card>
  );
}
