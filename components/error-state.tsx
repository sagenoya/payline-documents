'use client';

import { Button } from '@/components/ui/button';

export function ErrorState({
  title = 'Something took too long',
  message = 'The database connection did not respond in time. Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2">{message}</p>
        {onRetry && (
          <Button type="button" className="mt-5" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
