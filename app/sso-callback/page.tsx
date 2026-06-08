'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SsoCallbackPage() {
  return (
    <>
      <div className="grid min-h-screen place-items-center bg-muted/40 px-4 py-20">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-background p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Signing you in…</p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              One moment while we verify your account.
            </p>
          </div>
        </div>
      </div>
      <AuthenticateWithRedirectCallback />
    </>
  );
}
