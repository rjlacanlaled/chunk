'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { migrateGuestData } from '@/server/actions/migrate-guest';

const GUEST_ID_KEY = 'chunk-guest-id';
const MIGRATED_KEY = 'chunk-migrated';
const XP_STORAGE_KEY = 'chunk-xp';

export function useAuthWithMigration() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user) return;

    // Already migrated this session
    if (sessionStorage.getItem(MIGRATED_KEY)) return;

    const guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) return;

    // Mark as migrated immediately to prevent re-runs
    sessionStorage.setItem(MIGRATED_KEY, '1');

    // Read guest XP from localStorage before migration
    const guestXp = Number(localStorage.getItem(XP_STORAGE_KEY) || '0');

    migrateGuestData(guestId, session.user.id, guestXp).then(() => {
      localStorage.removeItem(GUEST_ID_KEY);
      localStorage.removeItem(XP_STORAGE_KEY);
      queryClient.invalidateQueries();
    });
  }, [session?.user?.id, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  return session;
}
