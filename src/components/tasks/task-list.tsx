'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ListChecks,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';
import { TaskItem } from './task-item';

/* ── Sorting ─────────────────────────────────────────────── */

const sortByScoreAndDate = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

/* ── Quick stats bar ─────────────────────────────────────── */

interface QuickStatsProps {
  total: number;
  completed: number;
  completedToday: number;
}

function QuickStats({ total, completed, completedToday }: QuickStatsProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/50 p-3">
      {/* stat row */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <ListChecks className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums text-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          <span className="text-muted-foreground">Done</span>
          <span className="font-semibold tabular-nums text-foreground">{completed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-amber-400" />
          <span className="text-muted-foreground">Today</span>
          <span className="font-semibold tabular-nums text-foreground">{completedToday}</span>
        </div>
        <span className="ml-auto text-xs font-semibold tabular-nums text-primary">
          {pct}%
        </span>
      </div>

      {/* progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct === 100 ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Section header ──────────────────────────────────────── */

const SECTION_STYLES = {
  in_progress: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'In Progress',
  },
  todo: {
    icon: Circle,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    label: 'To Do',
  },
  done: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Done',
  },
} as const;

type SectionKey = keyof typeof SECTION_STYLES;

interface SectionHeaderProps {
  section: SectionKey;
  count: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

function SectionHeader({
  section,
  count,
  collapsible,
  collapsed,
  onToggle,
}: SectionHeaderProps) {
  const style = SECTION_STYLES[section];
  const Icon = style.icon;

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-md border px-3 py-2',
        style.bg,
        style.border,
        collapsible && 'cursor-pointer hover:opacity-80',
      )}
      onClick={collapsible ? onToggle : undefined}
      disabled={!collapsible}
    >
      <Icon className={cn('size-4', style.color)} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {style.label}
      </h3>
      <span
        className={cn(
          'ml-1 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
          style.bg,
          style.color,
        )}
      >
        {count}
      </span>

      {collapsible && (
        <ChevronDown
          className={cn(
            'ml-auto size-4 text-muted-foreground transition-transform duration-200',
            collapsed && '-rotate-90',
          )}
        />
      )}
    </button>
  );
}

/* ── TaskList (main export) ──────────────────────────────── */

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
  const [doneCollapsed, setDoneCollapsed] = useState(true);

  const { todo, inProgress, done, totalRoots, completedRoots, completedToday } =
    useMemo(() => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const roots = tasks.filter((t) => !t.parentTaskId);
      const doneRoots = roots.filter((t) => t.status === 'done');

      return {
        todo: sortByScoreAndDate(roots.filter((t) => t.status === 'todo')),
        inProgress: sortByScoreAndDate(roots.filter((t) => t.status === 'in_progress')),
        done: sortByScoreAndDate(doneRoots),
        totalRoots: roots.length,
        completedRoots: doneRoots.length,
        completedToday: doneRoots.filter(
          (t) => new Date(t.updatedAt) >= startOfToday,
        ).length,
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

  const getSubtasks = (parentId: string) =>
    tasks.filter((t) => t.parentTaskId === parentId);

  const renderSection = (sectionTasks: Task[]) =>
    sectionTasks.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
        subtasks={getSubtasks(task.id)}
        allTasks={tasks}
        onToggleDone={onToggleDone}
        onBreakDown={onBreakDown}
      />
    ));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* ── Quick stats ────────────────────────────────── */}
        <QuickStats
          total={totalRoots}
          completed={completedRoots}
          completedToday={completedToday}
        />

        {/* ── In Progress section ────────────────────────── */}
        {inProgress.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeader section="in_progress" count={inProgress.length} />
            {renderSection(inProgress)}
          </div>
        )}

        {/* ── To Do section ──────────────────────────────── */}
        {todo.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeader section="todo" count={todo.length} />
            {renderSection(todo)}
          </div>
        )}

        {/* ── Done section (collapsed by default) ────────── */}
        {done.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeader
              section="done"
              count={done.length}
              collapsible
              collapsed={doneCollapsed}
              onToggle={() => setDoneCollapsed(!doneCollapsed)}
            />
            {!doneCollapsed && renderSection(done)}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
