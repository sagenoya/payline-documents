import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  try {
    await requireClerkUser();

    const users = await withDbTimeout(
      prisma.user.findMany({
        select: { id: true, name: true, email: true, imageUrl: true },
        orderBy: { name: 'asc' },
      }),
    );

    return jsonOk(users);
  } catch (error) {
    console.error('Users list failed', error);
    if (error instanceof Response) return error;
    return jsonError('Team members are temporarily unavailable. Please try again.', 503);
  }
}
