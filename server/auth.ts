import { auth, currentUser } from '@clerk/nextjs/server';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { withDbTimeout } from '@/server/db';
import { isKnownUser } from '@/server/access-control';

/**
 * Marker thrown when a signed-in identity is not a Payline member. The status is
 * 403 and the `x-payline-bounce` header lets server components route the user to
 * the "not in Payline" screen instead of a generic error.
 */
function bounceResponse() {
  return new Response('Not a Payline member', {
    status: 403,
    headers: { 'x-payline-bounce': '1' },
  });
}

export function isBounceResponse(error: unknown): boolean {
  return error instanceof Response && error.headers.get('x-payline-bounce') === '1';
}

export const requireClerkUser = cache(async function requireClerkUser() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const existingUser = await withDbTimeout(
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { profile: true },
    }),
  );

  if (existingUser) {
    // A previously-recorded user whose email is no longer (or never was) on the
    // allow list is bounced and their record removed — we keep no outsider data.
    if (!isKnownUser(existingUser.email)) {
      await withDbTimeout(
        prisma.user.delete({ where: { id: existingUser.id } }),
      ).catch(() => undefined);
      throw bounceResponse();
    }
    return existingUser;
  }

  const claims = sessionClaims as Record<string, unknown> | null;
  let email =
    (claims?.email as string | undefined) ||
    (claims?.primary_email_address as string | undefined);
  let name =
    (claims?.full_name as string | undefined) ||
    [claims?.first_name, claims?.last_name].filter(Boolean).join(' ') ||
    undefined;
  let imageUrl =
    (claims?.image_url as string | undefined) ||
    (claims?.picture as string | undefined);

  if (!email) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Response('Unauthorized', { status: 401 });
    }

    email = clerkUser.emailAddresses[0]?.emailAddress;
    name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      undefined;
    imageUrl = clerkUser.imageUrl;
  }

  if (!email) {
    throw new Response('Clerk user is missing an email address', { status: 422 });
  }

  // Bounce non-members before any record is created — outsiders are never stored.
  if (!isKnownUser(email)) {
    throw bounceResponse();
  }

  const resolvedName = name || email.split('@')[0];

  let user;
  try {
    user = await withDbTimeout(
      prisma.user.create({
        data: {
          clerkUserId: userId,
          email,
          name: resolvedName,
          imageUrl,
        },
        include: { profile: true },
      }),
    );
  } catch (error: any) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      user = await withDbTimeout(
        prisma.user.findUnique({
          where: { clerkUserId: userId },
          include: { profile: true },
        }),
      );
    } else {
      throw error;
    }
  }

  if (!user) {
    throw new Response('Authentication error: User record could not be established', { status: 500 });
  }

  return user;
});

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ success: false, message }, { status });
}
