'use client';

import { ErrorState } from '@/components/error-state';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorState onRetry={reset} />
      </body>
    </html>
  );
}
