import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  try {
    const user = await requireClerkUser();

    const [notifications, unreadCount] = await withDbTimeout(
      prisma.$transaction([
        prisma.notification.findMany({
          where: { userId: user.id },
          include: {
            accessRequest: {
              include: {
                requester: { select: { id: true, name: true, email: true, imageUrl: true } },
                document: { select: { id: true, title: true, folder: { select: { id: true, name: true } } } },
                folder: { select: { id: true, name: true } },
              },
            },
            document: { select: { id: true, title: true, folder: { select: { id: true, name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        prisma.notification.count({ where: { userId: user.id, read: false } }),
      ]),
    );

    return jsonOk({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications lookup failed', error);
    if (error instanceof Response) return error;
    return jsonError('Notifications are temporarily unavailable. Please try again.', 503);
  }
}

export async function PATCH() {
  try {
    const user = await requireClerkUser();

    await withDbTimeout(
      prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      }),
    );

    return jsonOk({ success: true });
  } catch (error) {
    console.error('Notifications mark-read failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to update notifications. Please try again.', 500);
  }
}
