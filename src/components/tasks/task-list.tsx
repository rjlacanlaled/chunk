'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';
import { TaskItem } from './task-item';

const sortByScoreAndDate = (tasks: Task[]): Task[] => (
  [...tasks].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  })
);

interface SectionHeaderProps {
  title: string;
  count: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

function SectionHeader({
  title,
  count,
  collapsible,
  collapsed,
  onToggle,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 py-2">
      {collapsible && (
        <Button variant="ghost" size="icon-xs" onClick={onToggle}>
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              collapsed && '-rotate-90',
            )}
          />
        </Button>
      )}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <span className="text-xs text-muted-foreground/60">({count})</span>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  lastXpGain?: number | null;
}

export function TaskList({
  tasks,
  onToggleDone,
  onBreakDown,
  lastXpGain,
}: TaskListProps) {
  const [doneCollapsed, setDoneCollapsed] = useState(false);

  const { todo, inProgress, done, rootTasks } = useMemo(() => {
    const roots = tasks.filter((t) => !t.parentTaskId);
    return {
      todo: sortByScoreAndDate(roots.filter((t) => t.status === 'todo')),
      inProgress: sortByScoreAndDate(roots.filter((t) => t.status === 'in_progress')),
      done: sortByScoreAndDate(roots.filter((t) => t.status === 'done')),
      rootTasks: roots,
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">
          No tasks yet. Start chatting to create some!
        </p>
      </div>
    );
  }

  const getSubtasks = (parentId: string) => (
    tasks.filter((t) => t.parentTaskId === parentId)
  );

  const renderSection = (sectionTasks: Task[]) => (
    sectionTasks.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
        subtasks={getSubtasks(task.id)}
        allTasks={tasks}
        onToggleDone={onToggleDone}
        onBreakDown={onBreakDown}
      />
    ))
  );

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-4">
        {inProgress.length > 0 && (
          <>
            <SectionHeader title="In Progress" count={inProgress.length} />
            {renderSection(inProgress)}
          </>
        )}

        {todo.length > 0 && (
          <>
            <SectionHeader title="To Do" count={todo.length} />
            {renderSection(todo)}
          </>
        )}

        {done.length > 0 && (
          <>
            <SectionHeader
              title="Done"
              count={done.length}
              collapsible
              collapsed={doneCollapsed}
              onToggle={() => setDoneCollapsed(!doneCollapsed)}
            />
            {!doneCollapsed && renderSection(done)}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
