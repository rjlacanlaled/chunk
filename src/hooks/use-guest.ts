'use client';

import { useMemo } from 'react';

function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('chunk-guest-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('chunk-guest-id', id);
  }
  return id;
}

export function useGuestId() {
  // Synchronous — no useEffect delay, no null flash
  return useMemo(getOrCreateGuestId, []);
}
