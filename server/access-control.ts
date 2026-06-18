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
 * Maps known people to the company role(s) they MUST onboard as, so a user can't
 * grant themselves capabilities by picking a different role at onboarding.
 *
 *   EMAIL_ROLE_MAP="email:ROLE,email:ROLE_A|ROLE_B"
 *     (case-insensitive email, ROLE = CompanyRole; "|" lists several allowed roles)
 *
 * Emails not listed here can pick any non-reserved role freely.
 */
function parseRoleMap(value?: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  (value || '')
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [email, roles] = pair.split(':').map((part) => part.trim());
      if (!email || !roles) return;
      const roleSet = new Set(
        roles
          .split('|')
          .map((role) => role.trim().toUpperCase())
          .filter(Boolean),
      );
      if (roleSet.size) map.set(email.toLowerCase(), roleSet);
    });
  return map;
}

const EMAIL_ROLE_MAP = parseRoleMap(process.env.EMAIL_ROLE_MAP);
const RESERVED_ROLES = new Set<string>(
  [...EMAIL_ROLE_MAP.values()].flatMap((roles) => [...roles]),
);

/**
 * The full set of people allowed to use the app at all. Anyone whose email is not
 * present in one of the identity env lists is not a Payline member and is bounced
 * at sign-in before any record is stored.
 */
const KNOWN_EMAILS = new Set<string>([
  ...EMAIL_ROLE_MAP.keys(),
  ...ADMIN_EMAILS,
  ...ACTIVITY_VIEWER_EMAILS,
]);

export function isKnownUser(email?: string | null): boolean {
  return Boolean(email && KNOWN_EMAILS.has(email.toLowerCase()));
}

/** The role(s) a mapped email is allowed to onboard as (empty if unmapped). */
export function getExpectedRoles(email?: string | null): Set<string> {
  return (email && EMAIL_ROLE_MAP.get(email.toLowerCase())) || new Set<string>();
}

/** A role that some specific email is mapped to — only those emails may pick it. */
export function isReservedRole(role: string): boolean {
  return RESERVED_ROLES.has(role.toUpperCase());
}

/**
 * Bidirectional onboarding check. Returns false when the (email, role) pair is
 * inconsistent with the env map: a mapped email must pick one of its roles, and a
 * reserved role may only be picked by an email mapped to it.
 */
export function isRoleAllowedForEmail(email: string | null | undefined, role: string): boolean {
  const expected = getExpectedRoles(email);
  if (expected.size) return expected.has(role.toUpperCase());
  return !isReservedRole(role);
}
