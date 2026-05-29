export class DbTimeoutError extends Error {
  constructor(message = 'Database request timed out') {
    super(message);
    this.name = 'DbTimeoutError';
  }
}

export function isDbTimeoutError(error: unknown) {
  return error instanceof DbTimeoutError;
}

export async function withDbTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5_000,
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
