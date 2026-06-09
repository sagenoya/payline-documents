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

/**
 * Maps known people to the company role they MUST onboard as, so a user can't
 * grant themselves capabilities by picking a different role at onboarding.
 *
 *   EMAIL_ROLE_MAP="email:ROLE,email:ROLE"  (case-insensitive email, ROLE = CompanyRole)
 *
 * Emails not listed here can pick any role freely.
 */
function parseRoleMap(value?: string): Map<string, string> {
  const map = new Map<string, string>();
  (value || '')
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [email, role] = pair.split(':').map((part) => part.trim());
      if (email && role) map.set(email.toLowerCase(), role.toUpperCase());
    });
  return map;
}

const EMAIL_ROLE_MAP = parseRoleMap(process.env.EMAIL_ROLE_MAP);
const RESERVED_ROLES = new Set(EMAIL_ROLE_MAP.values());

export function getExpectedRole(email?: string | null): string | undefined {
  return email ? EMAIL_ROLE_MAP.get(email.toLowerCase()) : undefined;
}

/** A role that some specific email is mapped to — only that email may pick it. */
export function isReservedRole(role: string): boolean {
  return RESERVED_ROLES.has(role.toUpperCase());
}

/**
 * Bidirectional onboarding check. Returns false when the (email, role) pair is
 * inconsistent with the env map: a mapped email must pick its role, and a
 * reserved role may only be picked by its mapped email.
 */
export function isRoleAllowedForEmail(email: string | null | undefined, role: string): boolean {
  const expected = getExpectedRole(email);
  if (expected) return expected === role.toUpperCase();
  return !isReservedRole(role);
}
