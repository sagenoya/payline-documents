import type { ActivityAction } from '@prisma/client';
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

// Actions every teammate may see. The rest (VIEW, DOWNLOAD, DELETE_DOC,
// DELETE_FOLDER) stay restricted to ACTIVITY_VIEWER_EMAILS.
const PUBLIC_ACTIONS: ActivityAction[] = [
  'CREATE_DOC',
  'CREATE_FOLDER',
  'EDIT_DOC',
  'MOVE_DOC',
  'MOVE_FOLDER',
];

export async function GET(request: Request) {
  try {
    const user = await requireClerkUser();
    const canSeeRestricted = canViewActivity(user.email);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('take') || 15)));
    const filter = searchParams.get('filter') as keyof typeof activityFilters | null;
    const skip = (page - 1) * limit;

    // Everyone can see the activity log, but VIEW/DOWNLOAD/DELETE entries are
    // limited to activity viewers. Non-viewers are clamped to PUBLIC_ACTIONS,
    // so a restricted filter (or no filter) never leaks restricted rows.
    const selected = (filter && activityFilters[filter]
      ? [...activityFilters[filter]]
      : null) as ActivityAction[] | null;
    const actions: ActivityAction[] | null = canSeeRestricted
      ? selected
      : (selected ?? PUBLIC_ACTIONS).filter((action) => PUBLIC_ACTIONS.includes(action));
    const where = actions ? { action: { in: actions } } : {};

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
                folder: { select: { id: true, name: true } },
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
