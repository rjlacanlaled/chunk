'use client';

import { useState, useEffect } from 'react';
import { GUEST_ID_KEY } from '@/lib/storage-keys';

export function useGuestId() {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    setGuestId(id);
  }, []);

  return guestId;
}
