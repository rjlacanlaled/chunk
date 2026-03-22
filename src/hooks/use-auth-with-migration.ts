'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { migrateGuestData } from '@/server/actions/migrate-guest';

export function useAuthWithMigration() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const hasMigrated = useRef(false);

  useEffect(() => {
    if (!session?.user || hasMigrated.current) return;

    const guestId = localStorage.getItem('chunk-guest-id');
    if (!guestId) return;

    hasMigrated.current = true;

    migrateGuestData(guestId, session.user.id).then(() => {
      localStorage.removeItem('chunk-guest-id');
      queryClient.invalidateQueries();
    });
  }, [session, queryClient]);

  return session;
}
