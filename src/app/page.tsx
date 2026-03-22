'use client';

import { useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useGuestId } from '@/hooks/use-guest';
import { useAuthWithMigration } from '@/hooks/use-auth-with-migration';
import { useTasksQuery, useTaskMutations } from '@/hooks/use-tasks';
import { ChatPanel } from '@/components/chat/chat-panel';
import { TaskList } from '@/components/tasks/task-list';
import { BoardPlaceholder } from '@/components/tasks/board-placeholder';
import { SignUpCta } from '@/components/auth/sign-up-cta';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/task';

type ViewMode = 'list' | 'board';

export default function Home() {
  const { data: session } = useSession();
  const guestId = useGuestId();
  const [view, setView] = useState<ViewMode>('list');

  useAuthWithMigration();
  const isGuest = !session?.user;

  const owner = session?.user
    ? { userId: session.user.id }
    : { guestId: guestId ?? undefined };

  const { data: tasks = [], refetch } = useTasksQuery(owner);
  const { updateMutation } = useTaskMutations(owner);

  const handleToggleDone = (task: Task) => {
    updateMutation.mutate({
      id: task.id,
      status: task.status === 'done' ? 'todo' : 'done',
    });
  };

  const hasTasks = tasks.length > 0;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <img
          src="/chunk-logos/chunk-logo-horizontal-dark.svg"
          alt="Chunk"
          className="h-6"
        />
        <div className="flex items-center gap-3">
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
            <TaskList tasks={tasks} onToggleDone={handleToggleDone} />
          )}
          {hasTasks && view === 'board' && (
            <BoardPlaceholder />
          )}
        </div>

        <div
          className="transition-all duration-500 ease-in-out"
          style={{
            width: hasTasks ? '30%' : '100%',
            borderLeft: hasTasks ? '1px solid oklch(1 0 0 / 8%)' : 'none',
          }}
        >
          <ChatPanel
            owner={owner}
            onTasksChanged={() => refetch()}
            compact={hasTasks}
          />
        </div>
      </main>
    </div>
  );
}
