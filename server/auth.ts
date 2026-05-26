import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function requireClerkUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Response('Clerk user is missing an email address', { status: 422 });
  }

  const name =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    email.split('@')[0];

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email,
          name,
          imageUrl: clerkUser.imageUrl,
        },
        include: { profile: true },
      });
    } else {
      user = await prisma.user.update({
        where: { clerkUserId: userId },
        data: {
          name,
          imageUrl: clerkUser.imageUrl,
        },
        include: { profile: true },
      });
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: { profile: true },
      });
    } else {
      throw error;
    }
  }

  if (!user) {
    throw new Response('Authentication error: User record could not be established', { status: 500 });
  }

  return user;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ success: false, message }, { status });
}
