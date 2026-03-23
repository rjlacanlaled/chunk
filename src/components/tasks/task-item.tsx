'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Circle,
  CheckCircle2,
  Zap,
  Trash2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChunkIcon } from '@/components/chat/chunk-icon';
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
      <span className={cn('text-xs md:text-[11px] font-bold tabular-nums', getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
}

function TimeAgo({ date }: { date: Date }) {
  return (
    <span className="text-xs md:text-[10px] text-muted-foreground/50 whitespace-nowrap">
      {formatDistanceToNow(new Date(date), { addSuffix: false })}
      {' '}
      ago
    </span>
  );
}

// Force-interpret a DB date as local time (strip Z suffix so JS doesn't convert)
function asLocalDate(d: Date | string): Date {
  const iso = typeof d === 'string' ? d : d.toISOString();
  // Remove Z or timezone offset so Date parses as local
  return new Date(iso.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

function DueDateLabel({ dueDate }: { dueDate: Date | null }) {
  if (!dueDate) return null;
  const date = asLocalDate(dueDate);
  const now = new Date();
  const overdue = date.getTime() < now.getTime();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayStr = now.toLocaleDateString();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toLocaleDateString();
  const dueDateStr = date.toLocaleDateString();

  const h = date.getHours();
  const m = date.getMinutes();
  const hasTime = h !== 0 || m !== 0;
  const timeStr = hasTime
    ? ` ${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`
    : '';

  let label: string;
  if (dueDateStr === todayStr) label = `Today${timeStr}`;
  else if (dueDateStr === tomorrowStr) label = `Tomorrow${timeStr}`;
  else label = `${months[date.getMonth()]} ${date.getDate()}${timeStr}`;

  const isTodays = dueDateStr === todayStr;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs md:text-[11px] font-medium',
      overdue ? 'text-red-400' : isTodays ? 'text-amber-400' : 'text-muted-foreground/70',
    )}>
      {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {overdue ? `${label} · Overdue` : label}
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
      <span className="text-xs md:text-[11px] tabular-nums text-muted-foreground">
        {doneScore}
        /
        {totalScore}
        {' '}
        pts
      </span>
    </div>
  );
}

/* -- Unified TaskItem (recursive) --------------------------------- */

export interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  onDelete?: (task: Task) => void;
  depth?: number;
  recentlyCompleted?: boolean;
  xpGain?: number | null;
}

export function TaskItem({
  task,
  allTasks,
  onToggleDone,
  onBreakDown,
  onDelete,
  depth = 0,
  recentlyCompleted,
  xpGain,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [chunking, setChunking] = useState(false);
  const isDone = task.status === 'done';
  const children = allTasks
    .filter((t) => t.parentTaskId === task.id)
    .sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0));
  const hasChildren = children.length > 0;

  // Stop chunking animation when children arrive
  useEffect(() => {
    if (chunking && hasChildren) setChunking(false);
  }, [chunking, hasChildren]);
  const showBreakDown = !isDone && (task.score ?? 0) >= 15 && !hasChildren;
  const isRoot = depth === 0;

  const dueDate = task.dueDate ? asLocalDate(task.dueDate) : null;
  const isOverdue = dueDate && dueDate.getTime() < Date.now() && !isDone;

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
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex set when interactive
    <div
      className={cn(
        'group flex items-center gap-3 py-2 px-3 rounded-md transition-colors',
        hasChildren && 'cursor-pointer hover:bg-muted/10',
        !hasChildren && 'hover:bg-muted/10',
        recentlyCompleted && 'animate-success-flash',
        chunking && 'animate-chunking',
      )}
      role={hasChildren ? 'button' : undefined}
      tabIndex={hasChildren ? 0 : undefined}
      onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      onKeyDown={hasChildren ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      } : undefined}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md transition-all',
          checkSize === 'size-5' ? 'size-6' : checkSize === 'size-4' ? 'size-5' : 'size-4',
          isDone
            ? cn('bg-primary/20', getScoreColor(task.score ?? 5).replace('text-', 'text-'))
            : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50',
          recentlyCompleted && 'animate-bounce',
        )}
      >
        {isDone
          ? <CheckCircle2 className={cn(checkSize, getScoreColor(task.score ?? 5))} />
          : <Circle className={cn(checkSize)} />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {task.taskNumber && (
            <span className="text-xs md:text-[10px] font-mono text-muted-foreground/60 shrink-0">
              #
              {task.taskNumber}
            </span>
          )}
          <span className={cn('truncate', textStyle, isDone && 'text-muted-foreground line-through')}>
            {task.title}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-xs md:text-[10px] font-semibold leading-none text-red-400">
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
        {showBreakDown && onBreakDown && !chunking && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setChunking(true); onBreakDown(task.title); }}
            aria-label="Break down task"
            className="text-xs md:text-[11px] bg-primary/10 text-primary hover:bg-primary/20 h-8 md:h-6 px-2 cursor-pointer"
          >
            <Zap className="mr-0.5 size-2.5" />
            Chunk it!
          </Button>
        )}
        {chunking && (
          <span className="flex items-center gap-1.5 text-xs md:text-[11px] text-primary">
            <ChunkIcon variant="animated" className="size-3.5" />
            <span className="animate-shimmer-text font-medium">Chunking...</span>
          </span>
        )}
        <ScoreMeter score={task.score} />
        {isRoot && <span className="hidden md:inline"><TimeAgo date={task.createdAt} /></span>}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            aria-label="Delete task"
            className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      {recentlyCompleted && xpGain && (
        <span className="absolute -top-2 right-3 animate-float-up text-xs font-bold text-primary">
          +
          {xpGain}
          {' '}
          XP
        </span>
      )}
    </div>
  );

  // Children block
  const childrenBlock = hasChildren && expanded && (
    <div className="pl-3 md:pl-6 pr-2 pb-1">
      {children.map((child) => (
        <TaskItem
          key={child.id}
          task={child}
          allTasks={allTasks}
          onToggleDone={onToggleDone}
          onBreakDown={onBreakDown}
          onDelete={onDelete}
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
