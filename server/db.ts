export class DbTimeoutError extends Error {
  constructor(message = 'Database request timed out') {
    super(message);
    this.name = 'DbTimeoutError';
  }
}

export function isDbTimeoutError(error: unknown) {
  return error instanceof DbTimeoutError;
}

// Local dev runs far from Neon's region, so a cold compute plus the long-haul
// round-trip can legitimately exceed the production budget. Be lenient off-prod.
const DEFAULT_DB_TIMEOUT_MS = process.env.NODE_ENV === 'production' ? 5_000 : 20_000;

export async function withDbTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_DB_TIMEOUT_MS,
  message = 'Database request timed out',
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new DbTimeoutError(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
