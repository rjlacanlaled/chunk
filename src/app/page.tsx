'use client';

import { useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useGuestId } from '@/hooks/use-guest';
import { useAuthWithMigration } from '@/hooks/use-auth-with-migration';
import { useTasksQuery, useTaskMutations } from '@/hooks/use-tasks';
import { ChatPanel } from '@/components/chat/chat-panel';
import { TaskList } from '@/components/tasks/task-list';
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
      <header className="flex h-14 items-center justify-between border-b px-4">
        <img
          src="/chunk-logos/chunk-logo-horizontal-dark.svg"
          alt="Chunk"
          className="h-7"
        />
        <div className="flex items-center gap-2">
          {hasTasks && (
            <div className="flex items-center rounded-lg border">
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

      {isGuest && <SignUpCta />}

      <main className="flex flex-1 overflow-hidden">
        <div
          className="transition-all duration-300 overflow-hidden"
          style={{ width: hasTasks ? '70%' : '0%' }}
        >
          {hasTasks && view === 'list' && (
            <TaskList tasks={tasks} onToggleDone={handleToggleDone} />
          )}
          {hasTasks && view === 'board' && (
            <div className="flex h-full items-center justify-center p-6">
              <p className="text-muted-foreground">
                Board view coming soon!
              </p>
            </div>
          )}
        </div>

        <div
          className="transition-all duration-300 border-l"
          style={{ width: hasTasks ? '30%' : '100%' }}
        >
          <ChatPanel owner={owner} onTasksChanged={() => refetch()} />
        </div>
      </main>
    </div>
  );
}
