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
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));
  const complete = progress >= 1;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={3}
        className={complete ? 'text-emerald-400' : 'text-primary'}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dy="0.35em"
        className={cn(
          'text-xs font-bold fill-current',
          complete ? 'text-emerald-400' : 'text-foreground',
        )}
      >
        {complete ? '\u2713' : `${Math.round(progress * 100)}%`}
      </text>
    </svg>
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
