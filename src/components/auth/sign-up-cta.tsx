'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { signIn } from '@/lib/auth-client';

export function SignUpCta() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground">
      <span className="opacity-60">Guest session</span>
      <span className="opacity-30">·</span>
      <button
        type="button"
        onClick={() => signIn.social({ provider: 'google', callbackURL: '/dashboard' })}
        className="text-primary/80 underline-offset-2 transition-colors hover:text-primary hover:underline"
      >
        Sign up to save
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-1 rounded-full p-0.5 opacity-40 transition-opacity hover:opacity-80"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
