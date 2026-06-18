'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotAuthorizedScreen() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLeaving, setIsLeaving] = React.useState(false);

  async function handleLeave() {
    setIsLeaving(true);
    try {
      await signOut();
    } finally {
      router.replace('/sign-in');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/10 text-red-600">
          <ShieldX className="size-7" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">You&apos;re not in Payline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workspace is limited to Payline team members. The account you signed in with
          isn&apos;t on our list, so access has been declined and no profile was created.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          If you believe this is a mistake, reach out to your administrator.
        </p>
        <Button className="mt-6 w-full" onClick={handleLeave} disabled={isLeaving}>
          {isLeaving ? 'Signing out…' : 'Back to sign in'}
        </Button>
      </div>
    </main>
  );
}
