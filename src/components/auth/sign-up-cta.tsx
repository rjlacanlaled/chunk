'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function SignUpCta() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b bg-card px-4 py-2 text-sm">
      <p className="text-muted-foreground">
        Sign up to save your stuff across visits
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
        >
          Later
        </Button>
        <Button
          size="sm"
          onClick={() => signIn.social({ provider: 'google' })}
        >
          Sign up
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
}
