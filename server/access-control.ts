/**
 * Identity-based access control.
 *
 * Company roles are SELF-SELECTED at onboarding, so they cannot be trusted as a
 * security boundary — anyone could pick "CEO". For privileged capabilities we
 * gate on a hardcoded allowlist of real email addresses supplied via env, which
 * a user cannot grant themselves.
 *
 *   ACTIVITY_VIEWER_EMAILS — may view the document activity log (CEO, Compliance,
 *                            Legal Head, Frontend Developer).
 *   ADMIN_EMAILS           — always allowed to open sensitive documents (the
 *                            Frontend Developer "admin" and the CEO).
 *
 * Both are comma-separated, case-insensitive. Empty = nobody (safe default).
 */
function parseEmails(value?: string): Set<string> {
  return new Set(
    (value || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

const ACTIVITY_VIEWER_EMAILS = parseEmails(process.env.ACTIVITY_VIEWER_EMAILS);
const ADMIN_EMAILS = parseEmails(process.env.ADMIN_EMAILS);

export function canViewActivity(email?: string | null): boolean {
  return Boolean(email && ACTIVITY_VIEWER_EMAILS.has(email.toLowerCase()));
}

export function isAdmin(email?: string | null): boolean {
  return Boolean(email && ADMIN_EMAILS.has(email.toLowerCase()));
}
