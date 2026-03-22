'use client';

import { useState } from 'react';
import { Circle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const getScoreColor = (score: number | null) => {
  if (!score) return 'bg-muted';
  if (score <= 3) return 'bg-green-500';
  if (score <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
};

interface TaskItemProps {
  task: Task;
  subtasks: Task[];
  allTasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  depth?: number;
  xpGain?: number | null;
  recentlyCompleted?: boolean;
}

export function TaskItem({
  task,
  subtasks,
  allTasks,
  onToggleDone,
  onBreakDown,
  depth = 0,
  xpGain,
  recentlyCompleted,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const isDone = task.status === 'done';
  const hasChildren = subtasks.length > 0;
  const showBreakDown = !isDone && (task.score ?? 0) > 3 && !hasChildren;

  return (
    <div style={{ paddingLeft: `${depth * 24}px` }}>
      <div
        className={cn(
          'group relative flex items-center gap-3 rounded-lg border p-3 transition-all',
          isDone && 'opacity-50',
          recentlyCompleted && 'animate-success-flash',
        )}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            <ChevronRight
              className={cn(
                'size-4 text-muted-foreground transition-transform',
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-medium truncate', isDone && 'line-through')}>
              {task.title}
            </p>
            {task.score && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(task.score, 9) }).map((_, i) => (
                  <span
                    key={i}
                    className={cn('size-1.5 rounded-full', getScoreColor(task.score))}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <p className="text-xs text-muted-foreground">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </p>
            )}
            {isDone && (
              <p className="text-xs text-muted-foreground">
                Done {new Date(task.updatedAt).toLocaleDateString()}
              </p>
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
            {(task.score ?? 0) >= 6
              ? 'Chunk it!'
              : 'Break it down?'}
          </Button>
        )}

        <Badge className={cn('shrink-0', PRIORITY_COLORS[task.priority])}>
          {task.priority}
        </Badge>

        {recentlyCompleted && xpGain && (
          <span className="absolute -top-2 right-3 animate-float-up text-xs font-bold text-primary">
            +{xpGain} XP
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-1 flex flex-col gap-1">
          {subtasks.map((sub) => (
            <TaskItem
              key={sub.id}
              task={sub}
              subtasks={allTasks.filter((t) => t.parentTaskId === sub.id)}
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
