import { prisma } from '@/lib/prisma';
import { canViewActivity } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

const activityFilters = {
  views: ['VIEW'],
  downloads: ['DOWNLOAD'],
  uploads: ['CREATE_DOC', 'CREATE_FOLDER'],
  deletes: ['DELETE_DOC', 'DELETE_FOLDER'],
} as const;

export async function GET(request: Request) {
  try {
    const user = await requireClerkUser();

    if (!canViewActivity(user.email)) {
      return jsonError('You do not have permission to view activity.', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('take') || 15)));
    const filter = searchParams.get('filter') as keyof typeof activityFilters | null;
    const skip = (page - 1) * limit;
    const where = filter && activityFilters[filter]
      ? { action: { in: [...activityFilters[filter]] } }
      : {};

    const [total, logs] = await withDbTimeout(
      prisma.$transaction([
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, imageUrl: true } },
            document: {
              select: {
                id: true,
                title: true,
                category: true,
                fileUrl: true,
                mimeType: true,
              },
            },
            folder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
      ]),
    );

    const totalPages = Math.ceil(total / limit);

    return jsonOk({
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Activity list failed', error);
    if (error instanceof Response) return error;
    return jsonError('Activity is temporarily unavailable. Please try again.', 503);
  }
}
