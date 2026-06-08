import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ folderId: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { folderId } = await params;

    const folder = await withDbTimeout(
      prisma.folder.findUnique({
        where: { id: folderId },
        select: { id: true, name: true, isSensitive: true, createdById: true },
      }),
    );

    if (!folder) {
      return jsonError('Folder not found', 404);
    }

    if (!folder.isSensitive) {
      return jsonError('This folder does not require access approval.', 400);
    }

    if (!folder.createdById) {
      return jsonError('This folder has no owner to approve access.', 409);
    }

    if (folder.createdById === user.id) {
      return jsonError('You already own this folder.', 400);
    }

    const existingPending = await withDbTimeout(
      prisma.accessRequest.findFirst({
        where: { folderId, requesterId: user.id, status: 'PENDING' },
      }),
    );

    if (existingPending) {
      return jsonOk(existingPending);
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        folderId,
        requesterId: user.id,
        ownerId: folder.createdById,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: folder.createdById,
        type: 'ACCESS_REQUEST',
        accessRequestId: accessRequest.id,
      },
    });

    return jsonOk(accessRequest, { status: 201 });
  } catch (error) {
    console.error('Folder access request failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to request access. Please try again.', 500);
  }
}
