'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { List, LayoutGrid, MessageCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useGuestId } from '@/hooks/use-guest';
import { useAuthWithMigration } from '@/hooks/use-auth-with-migration';
import { useTasksQuery, useTaskMutations } from '@/hooks/use-tasks';
import { useGamification } from '@/hooks/use-gamification';
import { ChatPanel } from '@/components/chat/chat-panel';
import { TaskList } from '@/components/tasks/task-list';
import { BoardPlaceholder } from '@/components/tasks/board-placeholder';
import { StreakBadge } from '@/components/gamification/streak-badge';
import { XpBar } from '@/components/gamification/xp-bar';
import { ScoreSummary } from '@/components/gamification/score-summary';
import { DailyMission } from '@/components/gamification/daily-mission';
import { StreakStrip } from '@/components/gamification/streak-strip';
import { SignUpCta } from '@/components/auth/sign-up-cta';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/task';

type ViewMode = 'list' | 'board';

export default function Home() {
  const { data: session, isPending: sessionPending } = useSession();
  const guestId = useGuestId();
  const [view, setView] = useState<ViewMode>('list');
  const [mobileView, setMobileView] = useState<'tasks' | 'chat'>('chat');
  const sendChatRef = useRef<(text: string) => void>(null);

  useAuthWithMigration();

  // Determine owner — keep previous owner while session re-validates on tab switch
  const prevOwner = useRef<{ userId?: string; guestId?: string } | null>(null);
  const owner = useMemo(() => {
    if (session?.user) {
      prevOwner.current = { userId: session.user.id };
      return prevOwner.current;
    }
    if (!sessionPending && guestId) {
      prevOwner.current = { guestId };
      return prevOwner.current;
    }
    // While session is re-checking (tab switch), keep previous owner
    return prevOwner.current;
  }, [sessionPending, session?.user, guestId]);

  const isGuest = !session?.user;
  const queryClient = useQueryClient();
  const { data: tasks = [], isFetched: tasksFetched } = useTasksQuery(owner ?? { guestId: '' });
  const { updateMutation, deleteMutation } = useTaskMutations(owner ?? { guestId: '' });
  const { xp, level, streak, lastXpGain, completeTask, uncompleteTask } = useGamification(tasks);

  const getDescendants = useCallback((parentId: string): Task[] => {
    const children = tasks.filter((t) => t.parentTaskId === parentId);
    return children.flatMap((c) => [c, ...getDescendants(c.id)]);
  }, [tasks]);

  const getChildren = useCallback((parentId: string): Task[] => (
    tasks.filter((t) => t.parentTaskId === parentId)
  ), [tasks]);

  const getAncestors = useCallback((taskId: string): Task[] => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t?.parentTaskId) return [];
    const parent = tasks.find((x) => x.id === t.parentTaskId);
    if (!parent) return [];
    return [parent, ...getAncestors(parent.id)];
  }, [tasks]);

  const handleToggleDone = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const marking = newStatus === 'done';
    const hasChildren = getChildren(task.id).length > 0;

    // Confetti for any high-score task completion
    if (marking && (task.score ?? 0) >= 20) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: Math.min(200, 80 + (task.score ?? 0)),
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#4945FF', '#9593FF', '#5CB176', '#F5CF0D'],
        });
      });
    }

    // Only award XP for leaf tasks (no children)
    if (!hasChildren) {
      if (marking) {
        completeTask(task);
      } else {
        uncompleteTask(task);
      }
    }

    // Update this task
    updateMutation.mutate({ id: task.id, status: newStatus });

    // Also update all descendants
    const descendants = getDescendants(task.id);
    for (const child of descendants) {
      if (child.status !== newStatus) {
        const childHasChildren = getChildren(child.id).length > 0;
        if (!childHasChildren) {
          if (marking) completeTask(child);
          else uncompleteTask(child);
        }
        updateMutation.mutate({ id: child.id, status: newStatus });
      }
    }

    // Auto-complete ancestors: recursively check up the tree
    if (marking) {
      const autoCompleteUp = (childId: string, justCompletedId: string) => {
        const child = tasks.find((t) => t.id === childId);
        if (!child?.parentTaskId) return;
        const siblings = getChildren(child.parentTaskId);
        const allDone = siblings.every(
          (s) => s.id === justCompletedId || s.status === 'done',
        );
        if (allDone) {
          const parent = tasks.find((t) => t.id === child.parentTaskId);
          if (parent && parent.status !== 'done') {
            updateMutation.mutate({ id: parent.id, status: 'done' });
            // Keep going up
            autoCompleteUp(parent.id, parent.id);
          }
        }
      };
      autoCompleteUp(task.id, task.id);
    }

    // Auto-uncomplete ancestors when unchecking a subtask
    if (!marking && task.parentTaskId) {
      const ancestors = getAncestors(task.id);
      for (const ancestor of ancestors) {
        if (ancestor.status === 'done') {
          updateMutation.mutate({ id: ancestor.id, status: 'todo' });
        }
      }
    }
  };

  const handleBreakDown = useCallback((taskTitle: string) => {
    sendChatRef.current?.(`chunk "${taskTitle}" into subtasks`);
  }, []);

  const handleDelete = useCallback((task: Task) => {
    // Delete the task and all descendants
    const descendants = getDescendants(task.id);
    for (const d of descendants) {
      if (d.status === 'done') uncompleteTask(d);
      deleteMutation.mutate(d.id);
    }
    if (task.status === 'done') uncompleteTask(task);
    deleteMutation.mutate(task.id);

    // Adjust parent score to match remaining children
    if (task.parentTaskId) {
      const deletedIds = new Set([task.id, ...descendants.map((d) => d.id)]);
      const remainingSiblings = tasks.filter(
        (t) => t.parentTaskId === task.parentTaskId && !deletedIds.has(t.id),
      );
      const newParentScore = remainingSiblings.length > 0
        ? remainingSiblings.reduce((sum, s) => sum + (s.score ?? 0), 0)
        : 1;
      updateMutation.mutate({ id: task.parentTaskId, score: newParentScore });
    }
  }, [getDescendants, uncompleteTask, deleteMutation, tasks, updateMutation]);

  const hasTasks = tasks.length > 0;

  // Single loading gate — wait for auth + tasks before showing anything
  if (!owner || !tasksFetched) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-3 lg:px-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 animate-pulse rounded bg-muted/30" />
            <div className="size-8 animate-pulse rounded-full bg-muted/30" />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <img src="/chunk-tools/chunky-avatar-thinking.svg" alt="Loading" className="size-16" />
            <p className="animate-shimmer-text text-sm font-medium">
              {sessionPending ? 'Checking your account...' : 'Getting things ready...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-3 lg:px-4">
        <img
          src="/chunk-logos/chunk-logo-horizontal-dark.svg"
          alt="Chunk"
          className="h-6"
        />
        <div className="flex items-center gap-2 lg:gap-3">
          {hasTasks && (
            <div className="hidden lg:flex">
              <XpBar xp={xp} level={level} />
            </div>
          )}
          {hasTasks && <StreakBadge streak={streak} />}
          {isGuest && <SignUpCta />}
          {hasTasks && (
            <div className="hidden lg:flex items-center rounded-lg border border-border/40">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={view === 'board' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => setView('board')}
                aria-label="Board view"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
          )}
          <AuthButtons />
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            hasTasks ? 'w-full lg:w-[70%]' : 'w-0'
          } ${hasTasks && mobileView !== 'tasks' ? 'hidden lg:block' : ''}`}
        >
          {hasTasks && view === 'list' && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 space-y-3 px-4 pt-3">
                <DailyMission tasks={tasks} />
                <div className="rounded-lg border border-border/40 bg-card/50 px-4 py-2">
                  <StreakStrip tasks={tasks} streak={streak} />
                </div>
                <ScoreSummary tasks={tasks} />
              </div>
              <div className="flex-1 overflow-hidden">
                <TaskList
                  tasks={tasks}
                  onToggleDone={handleToggleDone}
                  onBreakDown={handleBreakDown}
                  onDelete={handleDelete}
                  lastXpGain={lastXpGain}
                />
              </div>
            </div>
          )}
          {hasTasks && view === 'board' && (
            <BoardPlaceholder />
          )}
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            hasTasks ? 'w-full lg:w-[30%] lg:border-l lg:border-border/40' : 'w-full'
          } ${hasTasks && mobileView !== 'chat' ? 'hidden lg:block' : ''}`}
        >
          <ChatPanel
            owner={owner}
            onTasksChanged={() => {
              // Small delay to ensure DB write is committed before refetch
              setTimeout(() => queryClient.refetchQueries({ queryKey: ['tasks'] }), 500);
            }}
            compact={hasTasks}
            sendRef={sendChatRef}
          />
        </div>
      </main>

      {hasTasks && (
        <div className="flex lg:hidden shrink-0 border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            aria-label="View tasks"
            className={`flex-1 flex flex-col items-center gap-1 py-3.5 text-[11px] font-medium ${
              mobileView === 'tasks' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
            onClick={() => setMobileView('tasks')}
          >
            <List className="size-5" />
            Tasks
          </button>
          <button
            type="button"
            aria-label="View chat"
            className={`flex-1 flex flex-col items-center gap-1 py-3.5 text-[11px] font-medium ${
              mobileView === 'chat' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
            onClick={() => setMobileView('chat')}
          >
            <MessageCircle className="size-5" />
            Chat
          </button>
        </div>
      )}
    </div>
  );
}
