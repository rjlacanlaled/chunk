'use client';

import { useState, useMemo } from 'react';
import {
  Circle,
  CheckCircle2,
  ChevronRight,
  Zap,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

/* ── Score badge ─────────────────────────────────────────── */

function getScoreLabel(score: number | null) {
  if (!score) return null;
  if (score <= 3) return { text: 'Easy', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' };
  if (score <= 6) return { text: 'Medium', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
  return { text: 'Hard', color: 'bg-red-500/15 text-red-400 border-red-500/25' };
}

function ScoreBadge({ score }: { score: number | null }) {
  const label = getScoreLabel(score);
  if (!label) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
        label.color,
      )}
    >
      {label.text}
    </span>
  );
}

/* ── Due date display ────────────────────────────────────── */

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
        overdue ? 'font-semibold text-red-400' : 'text-muted-foreground',
      )}
    >
      {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {label}
    </span>
  );
}

/* ── Subtask progress bar ────────────────────────────────── */

function SubtaskProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
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
        {done}/{total}
      </span>
    </div>
  );
}

/* ── Priority badge (only for high/urgent) ───────────────── */

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority];
  if (!style) return null; // hide medium/low — it's noise
  return (
    <Badge className={cn('shrink-0 border text-[10px] uppercase', style)}>
      {priority}
    </Badge>
  );
}

/* ── Subtask row (simplified) ────────────────────────────── */

interface SubtaskRowProps {
  task: Task;
  onToggleDone: (task: Task) => void;
  isLast: boolean;
}

function SubtaskRow({ task, onToggleDone, isLast }: SubtaskRowProps) {
  const isDone = task.status === 'done';
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isDone;

  return (
    <div className="relative flex items-center gap-2.5 py-1.5 pl-4">
      {/* tree connector */}
      <div
        className={cn(
          'absolute left-0 top-0 w-3 border-l-2 border-b-2 border-border/50 rounded-bl-md',
          isLast ? 'h-[50%]' : 'h-full',
        )}
      />
      {!isLast && (
        <div className="absolute left-0 top-0 h-full w-0 border-l-2 border-border/50" />
      )}

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onToggleDone(task)}
        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
      >
        {isDone
          ? <CheckCircle2 className="size-4 text-primary" />
          : <Circle className="size-4 text-muted-foreground/60" />}
      </Button>

      <span
        className={cn(
          'flex-1 truncate text-[13px]',
          isDone && 'text-muted-foreground line-through',
        )}
      >
        {task.title}
      </span>

      <ScoreBadge score={task.score} />

      {!isDone && <DueDateLabel dueDate={task.dueDate} />}

      {isDone && (
        <span className="text-[11px] text-muted-foreground/60">
          {new Date(task.updatedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

/* ── Main TaskItem (parent card) ─────────────────────────── */

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
  const showBreakDown = !isDone && (task.score ?? 0) > 3 && !hasChildren;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isDone;

  // Subtask progress
  const subtaskStats = useMemo(() => {
    if (!hasChildren) return null;
    const doneCount = subtasks.filter((s) => s.status === 'done').length;
    return { done: doneCount, total: subtasks.length };
  }, [hasChildren, subtasks]);

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isDone
          ? 'border-border/30 bg-card/30 opacity-60'
          : isOverdue
            ? 'border-red-500/30 bg-card/80'
            : 'border-border/50 bg-card/60',
        recentlyCompleted && 'animate-success-flash',
      )}
    >
      {/* ── Card header row ──────────────────────────────── */}
      <div className="relative flex items-center gap-3 p-3">
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            <ChevronRight
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                expanded && 'rotate-90',
              )}
            />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onToggleDone(task)}
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
          className={cn(recentlyCompleted && 'animate-bounce')}
        >
          {isDone
            ? <CheckCircle2 className="size-5 text-primary" />
            : <Circle className="size-5 text-muted-foreground" />}
        </Button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'truncate text-sm font-semibold',
                isDone && 'text-muted-foreground line-through',
              )}
            >
              {task.title}
            </p>
            <ScoreBadge score={task.score} />
            <PriorityBadge priority={task.priority} />
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-400">
                <AlertTriangle className="size-2.5" />
                Overdue
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isDone && <DueDateLabel dueDate={task.dueDate} />}
            {isDone && (
              <span className="text-[11px] text-muted-foreground/60">
                Completed {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            )}
            {subtaskStats && (
              <SubtaskProgress done={subtaskStats.done} total={subtaskStats.total} />
            )}
          </div>
        </div>

        {showBreakDown && onBreakDown && (
          <Button
            variant={(task.score ?? 0) >= 6 ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBreakDown(task.title)}
            className={cn(
              'shrink-0 text-xs',
              (task.score ?? 0) >= 6
                ? 'bg-primary/20 text-primary hover:bg-primary/30'
                : 'text-muted-foreground',
            )}
          >
            <Zap className="mr-1 size-3" />
            {(task.score ?? 0) >= 6 ? 'Chunk it!' : 'Break it down'}
          </Button>
        )}

        {recentlyCompleted && xpGain && (
          <span className="absolute -top-2 right-3 animate-float-up text-xs font-bold text-primary">
            +{xpGain} XP
          </span>
        )}
      </div>

      {/* ── Subtask tree ─────────────────────────────────── */}
      {hasChildren && expanded && (
        <div className="border-t border-border/30 px-3 pb-2 pl-10 pt-1">
          {subtasks.map((sub, i) => (
            <SubtaskRow
              key={sub.id}
              task={sub}
              onToggleDone={onToggleDone}
              isLast={i === subtasks.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
