'use client';

import { Circle, CheckCircle2 } from 'lucide-react';
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

interface TaskItemProps {
  task: Task;
  onToggleDone: (task: Task) => void;
}

export function TaskItem({ task, onToggleDone }: TaskItemProps) {
  const isDone = task.status === 'done';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-opacity',
        isDone && 'opacity-50',
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onToggleDone(task)}
        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
      >
        {isDone
          ? <CheckCircle2 className="size-5 text-primary" />
          : <Circle className="size-5 text-muted-foreground" />}
      </Button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isDone && 'line-through')}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <Badge className={cn('shrink-0', PRIORITY_COLORS[task.priority])}>
        {task.priority}
      </Badge>
    </div>
  );
}
