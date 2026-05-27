'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateProfile } from '@/hooks/use-dms';
import { COMPANY_ROLES, canUpload, roleLabels } from '@/lib/dms';
import { cn } from '@/lib/utils';

export function OnboardingForm() {
  const router = useRouter();
  const [isTransitionPending, startTransition] = React.useTransition();
  const mutation = useUpdateProfile();
  const [selectedRole, setSelectedRole] = React.useState<string>('FRONTEND_DEVELOPER');
  const [error, setError] = React.useState<string | null>(null);
  const isSubmitting = mutation.isPending || isTransitionPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await mutation.mutateAsync(selectedRole);
      startTransition(() => {
        router.push('/dashboard');
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to complete onboarding. Please try again.',
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-2xl overflow-hidden rounded-lg border bg-background p-6 shadow-sm"
    >
      {isSubmitting && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-background/90">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            <div>
              <p className="font-medium text-foreground">Opening dashboard</p>
              <small>Finishing your workspace setup...</small>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1>Set your company role</h1>
        <p className="mt-2">
          This keeps upload access simple while everyone can still browse, preview, and download documents.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {COMPANY_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={cn(
              'flex min-h-14 items-center justify-between rounded-md border bg-background px-3 text-left text-sm transition hover:bg-muted',
              selectedRole === role && 'border-primary bg-brand-subtle',
            )}
          >
            <span>
              <span className="block font-medium text-foreground">{roleLabels[role]}</span>
              <small>{canUpload(role) ? 'Can upload documents' : 'Browse and download access'}</small>
            </span>
            {selectedRole === role && <CheckCircle2 className="size-4 text-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        {error && (
          <p className="mr-auto max-w-md text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
