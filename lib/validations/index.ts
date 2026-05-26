// Global Zod primitives and reusable field schemas.
// Import from here, never redefine these in individual schemas.

import { z } from 'zod';

// ── Primitives ──────────────────────────────────────────────
export const zEmail = z
  .string({ required_error: 'Email is required' })
  .email('Enter a valid email address')
  .toLowerCase();

export const zPassword = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters');


export const zPhone = z
  .string({ required_error: 'Phone number is required' })
  .refine((val) => /^(\+234|0)[789][01]\d{8}$/.test(val.replace(/\s/g, '')), {
    message: 'Enter a valid Nigerian phone number (e.g. 090... or +234...)',
  });

export const zName = z
  .string({ required_error: 'This field is required' })
  .min(2, 'Must be at least 2 characters')
  .max(64, 'Must be 64 characters or fewer');

export const zOtp = z
  .string({ required_error: 'OTP is required' })
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

export const zAmount = z
  .number({ required_error: 'Enter a valid amount' })
  .positive('Amount must be greater than 0');

export const zRequiredString = z
  .string({ required_error: 'This field is required' })
  .min(1, 'This field is required');

export const zOptionalString = z.string().optional();

export const zUrl = z.string().url('Enter a valid URL').optional();

// ── Helpers ─────────────────────────────────────────────────

/** Extracts a flat error map from a ZodError for easy form display */
export function getZodErrors<T>(
  error: z.ZodError,
): Partial<Record<keyof T, string>> {
  return error.issues.reduce(
    (acc: Partial<Record<keyof T, string>>, issue: z.ZodIssue) => {
      const key = issue.path[0] as keyof T;
      if (key && !acc[key]) acc[key] = issue.message;
      return acc;
    },
    {} as Partial<Record<keyof T, string>>,
  );
}

/** Safe parse wrapper — returns data or a flat error map */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Partial<Record<string, string>> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: getZodErrors(result.error) };
}
