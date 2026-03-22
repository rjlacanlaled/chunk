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

/* -- Score color helpers ---------------------------------------- */

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
  if (!score) return 'border-l-border/50';
  if (score <= 5) return 'border-l-emerald-400/60';
  if (score <= 15) return 'border-l-amber-400/60';
  if (score <= 30) return 'border-l-orange-400/60';
  if (score <= 100) return 'border-l-red-400/60';
  if (score <= 500) return 'border-l-purple-400/60';
  return 'border-l-pink-400/60';
};

/* -- Score indicator -------------------------------------------- */

function ScoreMeter({ score, large }: { score: number | null; large?: boolean }) {
  if (!score) return null;

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className={cn('size-2 rounded-full', getScoreDotColor(score))} />
      <span
        className={cn(
          'font-bold tabular-nums',
          large ? 'text-xs' : 'text-[10px]',
          getScoreColor(score),
        )}
      >
        {score}
      </span>
    </div>
  );
}

/* -- Time ago label --------------------------------------------- */

function TimeAgo({ date }: { date: Date }) {
  const label = formatDistanceToNow(new Date(date), { addSuffix: false });
  return (
    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
      {label}
      {' '}
      ago
    </span>
  );
}

/* -- Due date display ------------------------------------------- */

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
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px]',
        overdue ? 'font-semibold text-red-400' : 'text-amber-400/80',
      )}
    >
      {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {label}
    </span>
  );
}

/* -- Subtask progress bar (score-based) ------------------------- */

function SubtaskProgress({ doneScore, totalScore }: { doneScore: number; totalScore: number }) {
  const pct = totalScore > 0 ? Math.round((doneScore / totalScore) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            pct === 100 ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {doneScore}
        /
        {totalScore}
        {' '}
        pts
      </span>
    </div>
  );
}

/* -- Depth style config ----------------------------------------- */

const getDepthStyles = (depth: number) => {
  if (depth === 0) {
    return {
      padding: '',
      text: 'text-sm font-semibold text-foreground',
      checkbox: 'size-5',
    };
  }
  if (depth === 1) {
    return {
      padding: 'pl-8',
      text: 'text-[13px] font-normal text-foreground/90',
      checkbox: 'size-4',
    };
  }
  if (depth === 2) {
    return {
      padding: 'pl-14',
      text: 'text-[13px] font-normal text-muted-foreground',
      checkbox: 'size-3.5',
    };
  }
  return {
    padding: 'pl-20',
    text: 'text-xs font-normal text-muted-foreground/80',
    checkbox: 'size-3.5',
  };
};

/* -- Group colors for nesting depth ------------------------------ */

const GROUP_COLORS = [
  'border-primary/30',
  'border-purple-400/30',
  'border-amber-400/30',
  'border-emerald-400/30',
  'border-pink-400/30',
];

const getGroupColor = (depth: number) => GROUP_COLORS[depth % GROUP_COLORS.length];

/* -- Subtask row (clean, no connectors) ------------------------- */

interface SubtaskRowProps {
  task: Task;
  allTasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  depth: number;
}

function SubtaskRow({ task, allTasks, onToggleDone, onBreakDown, depth }: SubtaskRowProps) {
  const [expanded, setExpanded] = useState(true);
  const isDone = task.status === 'done';
  const showChunkIt = !isDone && (task.score ?? 0) > 7;
  const children = allTasks.filter((t) => t.parentTaskId === task.id);
  const hasChildren = children.length > 0;
  const styles = getDepthStyles(depth);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2.5 py-2 rounded-md',
          'transition-colors hover:bg-muted/20',
          hasChildren && 'cursor-pointer',
          styles.padding,
        )}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        >
          {isDone
            ? <CheckCircle2 className={cn(styles.checkbox, 'text-primary')} />
            : <Circle className={cn(styles.checkbox, 'text-muted-foreground/60')} />}
        </Button>

        <span
          className={cn(
            'flex-1 truncate',
            styles.text,
            isDone && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </span>

        {showChunkIt && !hasChildren && onBreakDown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onBreakDown(task.title); }}
            className="shrink-0 text-[11px] bg-primary/10 text-primary hover:bg-primary/20 h-6 px-2"
          >
            <Zap className="mr-0.5 size-2.5" />
            {(task.score ?? 0) >= 20 ? 'Chunk it!' : 'Break down'}
          </Button>
        )}

        <ScoreMeter score={task.score} />

        {!isDone && <DueDateLabel dueDate={task.dueDate} />}
      </div>

      {/* Recursive children */}
      {hasChildren && expanded && (
        <div className={cn('ml-4 border-l-2 pl-1', getGroupColor(depth))}>
          {children.map((child) => (
            <SubtaskRow
              key={child.id}
              task={child}
              allTasks={allTasks}
              onToggleDone={onToggleDone}
              onBreakDown={onBreakDown}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Main TaskItem (parent card) -------------------------------- */

export interface TaskItemProps {
  task: Task;
  subtasks: Task[];
  allTasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  xpGain?: number | null;
  recentlyCompleted?: boolean;
}

export function TaskItem({
  task,
  subtasks,
  allTasks,
  onToggleDone,
  onBreakDown,
  xpGain,
  recentlyCompleted,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const isDone = task.status === 'done';
  const hasChildren = subtasks.length > 0;
  const showBreakDown = !isDone && (task.score ?? 0) > 7 && !hasChildren;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isDone;

  // Score-based subtask progress
  const subtaskStats = useMemo(() => {
    if (!hasChildren) return null;
    const doneScore = subtasks
      .filter((s) => s.status === 'done')
      .reduce((sum, s) => sum + (s.score ?? 0), 0);
    const totalScore = subtasks.reduce((sum, s) => sum + (s.score ?? 0), 0);
    return { doneScore, totalScore };
  }, [hasChildren, subtasks]);

  return (
    <div
      className={cn(
        'rounded-lg border border-l-[3px] transition-all',
        isDone
          ? 'border-border/30 border-l-border/30 bg-card/30 opacity-60'
          : isOverdue
            ? 'border-red-500/30 bg-card/80'
            : 'border-border/50 bg-card/60',
        !isDone && !isOverdue && getScoreBorderColor(task.score),
        recentlyCompleted && 'animate-success-flash',
      )}
    >
      {/* -- Card header row ------------------------------------- */}
      <div
        className={cn(
          'relative flex items-center gap-3 p-3',
          hasChildren && 'cursor-pointer',
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
            ? <CheckCircle2 className="size-5 text-primary" />
            : <Circle className="size-5 text-muted-foreground" />}
        </Button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'truncate text-sm font-semibold text-foreground',
                isDone && 'text-muted-foreground line-through',
              )}
            >
              {task.title}
            </p>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-400">
                <AlertTriangle className="size-2.5" />
                Overdue
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isDone && <DueDateLabel dueDate={task.dueDate} />}
            {subtaskStats && (
              <SubtaskProgress
                doneScore={subtaskStats.doneScore}
                totalScore={subtaskStats.totalScore}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ScoreMeter score={task.score} large />
          <TimeAgo date={task.createdAt} />
        </div>

        {showBreakDown && onBreakDown && (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onBreakDown(task.title); }}
            className="shrink-0 text-xs bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Zap className="mr-1 size-3" />
            {(task.score ?? 0) >= 20 ? 'Chunk it!' : 'Break it down'}
          </Button>
        )}

        {recentlyCompleted && xpGain && (
          <span className="absolute -top-2 right-3 animate-float-up text-xs font-bold text-primary">
            +
            {xpGain}
            {' '}
            XP
          </span>
        )}
      </div>

      {/* -- Subtask list (no tree lines) ------------------------ */}
      {hasChildren && expanded && (
        <div className={cn('ml-4 border-l-2 px-3 pb-2 pt-1', getGroupColor(0))}>
          {subtasks.map((sub) => (
            <SubtaskRow
              key={sub.id}
              task={sub}
              allTasks={allTasks}
              onToggleDone={onToggleDone}
              onBreakDown={onBreakDown}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
