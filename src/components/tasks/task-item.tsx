'use client';

import { useState, useMemo } from 'react';
import {
  Circle,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

/* -- Score colors ------------------------------------------------- */

const getScoreColor = (score: number): string => {
  if (score <= 5) return 'text-emerald-400';
  if (score <= 15) return 'text-amber-400';
  if (score <= 30) return 'text-orange-400';
  if (score <= 100) return 'text-red-400';
  if (score <= 500) return 'text-purple-400';
  return 'text-pink-400';
};

const getScoreDotColor = (score: number): string => {
  if (score <= 5) return 'bg-emerald-400';
  if (score <= 15) return 'bg-amber-400';
  if (score <= 30) return 'bg-orange-400';
  if (score <= 100) return 'bg-red-400';
  if (score <= 500) return 'bg-purple-400';
  return 'bg-pink-400';
};

const getScoreBorderColor = (score: number | null): string => {
  if (!score) return 'border-l-border/40';
  if (score <= 5) return 'border-l-emerald-400/50';
  if (score <= 15) return 'border-l-amber-400/50';
  if (score <= 30) return 'border-l-orange-400/50';
  if (score <= 100) return 'border-l-red-400/50';
  if (score <= 500) return 'border-l-purple-400/50';
  return 'border-l-pink-400/50';
};

/* -- Small components --------------------------------------------- */

function ScoreMeter({ score }: { score: number | null }) {
  if (!score) return null;
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className={cn('size-2 rounded-full', getScoreDotColor(score))} />
      <span className={cn('text-[11px] font-bold tabular-nums', getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
}

function TimeAgo({ date }: { date: Date }) {
  return (
    <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
      {formatDistanceToNow(new Date(date), { addSuffix: false })} ago
    </span>
  );
}

function DueDateLabel({ dueDate }: { dueDate: Date | null }) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const overdue = isPast(date) && !isToday(date);
  let label: string;
  if (isToday(date)) label = 'Due today';
  else if (isTomorrow(date)) label = 'Due tomorrow';
  else if (overdue) label = 'Overdue';
  else label = `Due ${formatDistanceToNow(date, { addSuffix: true })}`;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px]', overdue ? 'font-semibold text-red-400' : 'text-amber-400/80')}>
      {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {label}
    </span>
  );
}

function SubtaskProgress({ doneScore, totalScore }: { doneScore: number; totalScore: number }) {
  const pct = totalScore > 0 ? Math.round((doneScore / totalScore) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-300', pct === 100 ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground">{doneScore}/{totalScore} pts</span>
    </div>
  );
}

/* -- Unified TaskItem (recursive) --------------------------------- */

export interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  depth?: number;
  recentlyCompleted?: boolean;
  xpGain?: number | null;
}

export function TaskItem({
  task,
  allTasks,
  onToggleDone,
  onBreakDown,
  depth = 0,
  recentlyCompleted,
  xpGain,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [chunking, setChunking] = useState(false);
  const isDone = task.status === 'done';
  const children = allTasks.filter((t) => t.parentTaskId === task.id);
  const hasChildren = children.length > 0;

  // Stop chunking animation when children arrive
  if (chunking && hasChildren) setChunking(false);
  const showBreakDown = !isDone && (task.score ?? 0) >= 15 && !hasChildren;
  const isRoot = depth === 0;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isDone;

  const subtaskStats = useMemo(() => {
    if (!hasChildren) return null;
    const doneScore = children.filter((s) => s.status === 'done').reduce((sum, s) => sum + (s.score ?? 0), 0);
    const totalScore = children.reduce((sum, s) => sum + (s.score ?? 0), 0);
    return { doneScore, totalScore };
  }, [hasChildren, children]);

  // Size scales down with depth
  const checkSize = depth === 0 ? 'size-5' : depth === 1 ? 'size-4' : 'size-3.5';
  const textStyle = depth === 0
    ? 'text-sm font-semibold text-foreground'
    : depth === 1
      ? 'text-[13px] font-medium text-foreground/90'
      : 'text-[13px] font-normal text-muted-foreground';

  const row = (
    <div
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-md transition-colors',
        hasChildren && 'cursor-pointer hover:bg-muted/10',
        !hasChildren && 'hover:bg-muted/10',
        recentlyCompleted && 'animate-success-flash',
        chunking && 'animate-chunking',
      )}
      onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        className={cn(recentlyCompleted && 'animate-bounce')}
      >
        {isDone
          ? <CheckCircle2 className={cn(checkSize, 'text-primary')} />
          : <Circle className={cn(checkSize, 'text-muted-foreground/60')} />}
      </Button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className={cn('truncate', textStyle, isDone && 'text-muted-foreground line-through')}>
            {task.title}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-400">
              <AlertTriangle className="size-2.5" />
              Overdue
            </span>
          )}
        </div>
        {(subtaskStats || (dueDate && !isDone)) && (
          <div className="flex items-center gap-3">
            {!isDone && <DueDateLabel dueDate={task.dueDate} />}
            {subtaskStats && <SubtaskProgress doneScore={subtaskStats.doneScore} totalScore={subtaskStats.totalScore} />}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 pr-1">
        {showBreakDown && onBreakDown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setChunking(true); onBreakDown(task.title); }}
            className="text-[11px] bg-primary/10 text-primary hover:bg-primary/20 h-6 px-2 cursor-pointer"
          >
            <Zap className="mr-0.5 size-2.5" />
            Chunk it!
          </Button>
        )}
        <ScoreMeter score={task.score} />
        {isRoot && <TimeAgo date={task.createdAt} />}
      </div>

      {recentlyCompleted && xpGain && (
        <span className="absolute -top-2 right-3 animate-float-up text-xs font-bold text-primary">
          +{xpGain} XP
        </span>
      )}
    </div>
  );

  // Children block
  const childrenBlock = hasChildren && expanded && (
    <div className="pl-6 pr-2 pb-1">
      {children.map((child) => (
        <TaskItem
          key={child.id}
          task={child}
          allTasks={allTasks}
          onToggleDone={onToggleDone}
          onBreakDown={onBreakDown}
          depth={depth + 1}
        />
      ))}
    </div>
  );

  // Root level: card with border
  if (isRoot) {
    return (
      <div
        className={cn(
          'rounded-lg border border-l-[3px] overflow-hidden transition-all',
          isDone
            ? 'border-border/30 border-l-border/30 bg-card/30 opacity-60'
            : isOverdue
              ? 'border-red-500/30 border-l-red-500/50 bg-card/80'
              : 'border-border/50 bg-card/60',
          !isDone && !isOverdue && getScoreBorderColor(task.score),
        )}
      >
        {row}
        {childrenBlock}
      </div>
    );
  }

  // Non-root with children: group with left border
  if (hasChildren) {
    return (
      <div className={cn('border-l-2 rounded-sm my-0.5', getScoreBorderColor(task.score))}>
        {row}
        {childrenBlock}
      </div>
    );
  }

  // Leaf node: just the row
  return row;
}
