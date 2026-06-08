import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { documentId } = await params;

    const document = await withDbTimeout(
      prisma.document.findFirst({
        where: { id: documentId, deletedAt: null },
        select: { id: true, title: true, isSensitive: true, uploadedById: true },
      }),
    );

    if (!document) {
      return jsonError('Document not found', 404);
    }

    if (!document.isSensitive) {
      return jsonError('This document does not require access approval.', 400);
    }

    if (document.uploadedById === user.id) {
      return jsonError('You already own this document.', 400);
    }

    const existingPending = await withDbTimeout(
      prisma.accessRequest.findFirst({
        where: { documentId, requesterId: user.id, status: 'PENDING' },
      }),
    );

    if (existingPending) {
      return jsonOk(existingPending);
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        documentId,
        requesterId: user.id,
        ownerId: document.uploadedById,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: document.uploadedById,
        type: 'ACCESS_REQUEST',
        accessRequestId: accessRequest.id,
      },
    });

    return jsonOk(accessRequest, { status: 201 });
  } catch (error) {
    console.error('Access request failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to request access. Please try again.', 500);
  }
}
