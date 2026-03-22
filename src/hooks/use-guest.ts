'use client';

import { useState, useEffect } from 'react';

export function useGuestId() {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('chunk-guest-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('chunk-guest-id', id);
    }
    setGuestId(id);
  }, []);

  return guestId;
}
