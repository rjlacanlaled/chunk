'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { List, LayoutGrid } from 'lucide-react';
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
import { SignUpCta } from '@/components/auth/sign-up-cta';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/task';

type ViewMode = 'list' | 'board';

export default function Home() {
  const { data: session } = useSession();
  const guestId = useGuestId();
  const [view, setView] = useState<ViewMode>('list');
  const sendChatRef = useRef<(text: string) => void>(null);

  useAuthWithMigration();
  const isGuest = !session?.user;

  const owner = useMemo(() => {
    if (session?.user) return { userId: session.user.id };
    if (guestId) return { guestId };
    return null;
  }, [session?.user, guestId]);

  const queryClient = useQueryClient();
  const { data: tasks = [] } = useTasksQuery(owner ?? {});
  const { updateMutation } = useTaskMutations(owner ?? {});
  const { xp, level, streak, lastXpGain, completeTask } = useGamification(tasks);

  const getDescendants = useCallback((parentId: string): Task[] => {
    const children = tasks.filter((t) => t.parentTaskId === parentId);
    return children.flatMap((c) => [c, ...getDescendants(c.id)]);
  }, [tasks]);

  const handleToggleDone = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const marking = newStatus === 'done';

    if (marking) {
      completeTask(task);
      if ((task.score ?? 0) >= 20) {
        confetti({
          particleCount: 80 + (task.score ?? 0),
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#4945FF', '#9593FF', '#5CB176', '#F5CF0D'],
        });
      }
    }

    // Update this task
    updateMutation.mutate({ id: task.id, status: newStatus });

    // Also update all descendants
    const descendants = getDescendants(task.id);
    for (const child of descendants) {
      if (child.status !== newStatus) {
        if (marking) completeTask(child);
        updateMutation.mutate({ id: child.id, status: newStatus });
      }
    }
  };

  const handleBreakDown = useCallback((taskTitle: string) => {
    sendChatRef.current?.(`break down "${taskTitle}" into subtasks`);
  }, []);

  const hasTasks = tasks.length > 0;

  // Wait for owner to be ready (guest ID from localStorage)
  if (!owner) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <img src="/chunk-logos/chunk-mascot.svg" alt="Chunk" className="size-8 animate-breathe" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <img
          src="/chunk-logos/chunk-logo-horizontal-dark.svg"
          alt="Chunk"
          className="h-6"
        />
        <div className="flex items-center gap-3">
          {hasTasks && <XpBar xp={xp} level={level} />}
          {hasTasks && <StreakBadge streak={streak} />}
          {isGuest && <SignUpCta />}
          {hasTasks && (
            <div className="flex items-center rounded-lg border border-border/40">
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
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ width: hasTasks ? '70%' : '0%' }}
        >
          {hasTasks && view === 'list' && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 px-4 pt-3">
                <ScoreSummary tasks={tasks} />
              </div>
              <div className="flex-1 overflow-hidden">
                <TaskList
                  tasks={tasks}
                  onToggleDone={handleToggleDone}
                  onBreakDown={handleBreakDown}
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
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            width: hasTasks ? '30%' : '100%',
            borderLeft: hasTasks ? '1px solid oklch(1 0 0 / 8%)' : 'none',
          }}
        >
          <ChatPanel
            owner={owner}
            onTasksChanged={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
            compact={hasTasks}
            sendRef={sendChatRef}
          />
        </div>
      </main>
    </div>
  );
}
