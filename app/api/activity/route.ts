import { prisma } from '@/lib/prisma';
import { jsonOk, requireClerkUser } from '@/server/auth';

export async function GET(request: Request) {
  await requireClerkUser();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.max(1, Number(searchParams.get('take') || 15));
  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.findMany({
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
  ]);

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
}
