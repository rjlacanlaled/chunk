'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { migrateGuestData } from '@/server/actions/migrate-guest';

const GUEST_ID_KEY = 'chunk-guest-id';

export function useAuthWithMigration() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const hasMigrated = useRef(false);

  useEffect(() => {
    if (!session?.user || hasMigrated.current) return;

    const guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) return;

    hasMigrated.current = true;

    migrateGuestData(guestId, session.user.id).then(() => {
      localStorage.removeItem(GUEST_ID_KEY);
      // Clear all cached queries so UI refreshes with signed-in user's data
      queryClient.invalidateQueries();
      // Force a page reload to reset chat state (useChat holds messages in memory)
      window.location.reload();
    });
  }, [session, queryClient]);

  return session;
}
