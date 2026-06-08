import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  try {
    const user = await requireClerkUser();

    const unreadCount = await withDbTimeout(
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    );

    return jsonOk({ unreadCount });
  } catch (error) {
    console.error('Notification count failed', error);
    if (error instanceof Response) return error;
    return jsonError('Notifications are temporarily unavailable. Please try again.', 503);
  }
}
