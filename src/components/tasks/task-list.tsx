'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task } from '@/types/task';
import { TaskItem } from './task-item';

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 4)
      - (PRIORITY_ORDER[b.priority] ?? 4);
    if (priorityDiff !== 0) return priorityDiff;

    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

interface TaskListProps {
  tasks: Task[];
  onToggleDone: (task: Task) => void;
}

export function TaskList({ tasks, onToggleDone }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">
          No tasks yet. Start chatting to create some!
        </p>
      </div>
    );
  }

  const sorted = sortTasks(tasks);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4">
        {sorted.map((task) => (
          <TaskItem key={task.id} task={task} onToggleDone={onToggleDone} />
        ))}
      </div>
    </ScrollArea>
  );
}
