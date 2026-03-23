'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ListChecks,
  Clock,
  CheckCircle2,
  Circle,
  Activity,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getXpForTask } from '@/lib/gamification';
import type { Task } from '@/types/task';
import { TaskItem } from './task-item';

/* -- Sorting ---------------------------------------------------- */

const sortByUrgency = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    // Due date first: overdue → due today → due soon → no date
    const now = Date.now();
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

    // Both have dates: sort by date (earliest first)
    if (a.dueDate && b.dueDate) {
      if (aDate !== bDate) return aDate - bDate;
    }
    // One has date, one doesn't: dated first
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Same date priority: sort by score (highest first)
    return (b.score ?? 0) - (a.score ?? 0);
  });

/* -- Time ago helper -------------------------------------------- */

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* -- Quick stats bar -------------------------------------------- */

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
      <div className="flex flex-wrap items-center gap-4 text-xs">
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
          {pct}
          %
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

/* -- Section header --------------------------------------------- */

const SECTION_STYLES = {
  recent: {
    icon: Activity,
    color: 'text-[#9593FF]',
    bg: 'bg-[#9593FF]/10',
    border: 'border-[#9593FF]/20',
    accent: 'bg-[#9593FF]',
    label: 'Recent Activity',
  },
  in_progress: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    accent: 'bg-amber-400',
    label: 'In Progress',
  },
  todo: {
    icon: Circle,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    accent: 'bg-primary',
    label: 'To Do',
  },
  done: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    accent: 'bg-emerald-400',
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
        'flex w-full items-center gap-2 rounded-md border px-3 py-2 overflow-hidden',
        style.bg,
        style.border,
        collapsible && 'cursor-pointer hover:opacity-80',
      )}
      onClick={collapsible ? onToggle : undefined}
      disabled={!collapsible}
    >
      <span className={cn('w-0.5 h-4 rounded-full shrink-0', style.accent)} />
      <Icon className={cn('size-4', style.color)} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {style.label}
      </h3>
      <span
        className={cn(
          'ml-1 inline-flex size-5 items-center justify-center rounded-full text-xs md:text-[10px] font-bold',
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

/* -- Inline activity feed --------------------------------------- */

const ACTIVITY_LIMIT = 5;

function InlineActivityFeed({ tasks }: { tasks: Task[] }) {
  const recentDone = useMemo(
    () => tasks
      .filter((t) => t.status === 'done')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, ACTIVITY_LIMIT),
    [tasks],
  );

  if (recentDone.length === 0) return null;

  const getColor = (score: number | null) => {
    const s = score ?? 5;
    if (s <= 5) return 'text-emerald-400';
    if (s <= 15) return 'text-amber-400';
    if (s <= 30) return 'text-orange-400';
    if (s <= 100) return 'text-red-400';
    if (s <= 500) return 'text-purple-400';
    return 'text-pink-400';
  };

  const getDotBg = (score: number | null) => {
    const s = score ?? 5;
    if (s <= 5) return 'bg-emerald-400';
    if (s <= 15) return 'bg-amber-400';
    if (s <= 30) return 'bg-orange-400';
    if (s <= 100) return 'bg-red-400';
    if (s <= 500) return 'bg-purple-400';
    return 'bg-pink-400';
  };

  return (
    <div className="flex flex-col gap-1">
      {recentDone.map((task) => {
        const earnedXp = getXpForTask(task.score);
        const isEpic = (task.score ?? 0) >= 30;
        return (
          <div
            key={task.id}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-muted/20',
              isEpic && 'bg-muted/10 border border-border/30',
            )}
          >
            <span className={cn('size-2 shrink-0 rounded-full', getDotBg(task.score))} />
            <CheckCircle2 className={cn('size-3.5 shrink-0', getColor(task.score))} />
            <span className={cn(
              'truncate',
              isEpic ? 'font-semibold text-foreground' : 'text-foreground/80',
            )}>
              {task.title}
            </span>
            {task.score && (
              <span className={cn('shrink-0 text-xs md:text-[10px] font-bold tabular-nums', getColor(task.score))}>
                {task.score}
              </span>
            )}
            <span className={cn(
              'ml-auto shrink-0 font-bold tabular-nums text-xs md:text-[11px]',
              isEpic ? 'text-primary' : 'text-primary/70',
            )}>
              +{earnedXp} XP
            </span>
            <span className="shrink-0 text-xs md:text-[10px] text-muted-foreground/50 tabular-nums w-12 text-right">
              {timeAgo(task.updatedAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -- TaskList (main export) ------------------------------------- */

interface TaskListProps {
  tasks: Task[];
  onToggleDone: (task: Task) => void;
  onBreakDown?: (taskTitle: string) => void;
  onDelete?: (task: Task) => void;
  lastXpGain?: number | null;
}

export function TaskList({
  tasks,
  onToggleDone,
  onBreakDown,
  onDelete,
  lastXpGain,
}: TaskListProps) {
  const [doneCollapsed, setDoneCollapsed] = useState(true);
  const [activityCollapsed, setActivityCollapsed] = useState(true);

  const hasDoneItems = useMemo(
    () => tasks.some((t) => t.status === 'done'),
    [tasks],
  );

  const doneCount = useMemo(
    () => tasks.filter((t) => t.status === 'done').length,
    [tasks],
  );

  const { todo, inProgress, done, totalRoots, completedRoots, completedToday } =
    useMemo(() => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const roots = tasks.filter((t) => !t.parentTaskId);
      const doneRoots = roots.filter((t) => t.status === 'done');

      return {
        todo: sortByUrgency(roots.filter((t) => t.status === 'todo')),
        inProgress: sortByUrgency(roots.filter((t) => t.status === 'in_progress')),
        done: sortByUrgency(doneRoots),
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

  const renderSection = (sectionTasks: Task[]) =>
    sectionTasks.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
        allTasks={tasks}
        onToggleDone={onToggleDone}
        onBreakDown={onBreakDown}
        onDelete={onDelete}
      />
    ));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* -- Quick stats --------------------------------------- */}
        <QuickStats
          total={totalRoots}
          completed={completedRoots}
          completedToday={completedToday}
        />

        {/* -- Recent Activity (collapsed by default) ------------ */}
        {hasDoneItems && (
          <div className="flex flex-col gap-2">
            <SectionHeader
              section="recent"
              count={Math.min(doneCount, ACTIVITY_LIMIT)}
              collapsible
              collapsed={activityCollapsed}
              onToggle={() => setActivityCollapsed(!activityCollapsed)}
            />
            {!activityCollapsed && <InlineActivityFeed tasks={tasks} />}
          </div>
        )}

        {/* -- Divider after activity ---------------------------- */}
        {hasDoneItems && (inProgress.length > 0 || todo.length > 0) && (
          <div className="h-px bg-border/30" />
        )}

        {/* -- In Progress section ------------------------------- */}
        {inProgress.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeader section="in_progress" count={inProgress.length} />
            {renderSection(inProgress)}
          </div>
        )}

        {/* -- Divider between sections -------------------------- */}
        {inProgress.length > 0 && todo.length > 0 && (
          <div className="h-px bg-border/30" />
        )}

        {/* -- To Do section ------------------------------------- */}
        {todo.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeader section="todo" count={todo.length} />
            {renderSection(todo)}
          </div>
        )}

        {/* -- Divider before done ------------------------------- */}
        {done.length > 0 && (inProgress.length > 0 || todo.length > 0) && (
          <div className="h-px bg-border/30" />
        )}

        {/* -- Done section (collapsed by default) --------------- */}
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
