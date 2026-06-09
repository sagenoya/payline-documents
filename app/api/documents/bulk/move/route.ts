import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { z } from 'zod';

const bulkMoveSchema = z.object({
  documentIds: z.array(z.string()).min(1, 'No documents selected'),
  folderId: z.string().nullable(),
});

export async function POST(request: Request) {
  const user = await requireClerkUser();

  const payload = await request.json();
  const parsed = bulkMoveSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request data', 422);
  }

  const { documentIds, folderId } = parsed.data;

  // Validate that folder exists if not moving to root
  if (folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return jsonError('Target folder not found', 404);
    }
  }

  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds }, deletedAt: null },
    select: { id: true, title: true, uploadedById: true },
  });

  if (!documents.length) {
    return jsonError('No documents found to move', 404);
  }

  // Only the uploader or an admin can move a document.
  const admin = isAdmin(user.email);
  const authorizedDocs = documents.filter(
    (doc) => doc.uploadedById === user.id || admin,
  );

  if (!authorizedDocs.length) {
    return jsonError('You do not have permission to move the selected documents', 403);
  }

  await prisma.$transaction(async (tx) => {
    await tx.document.updateMany({
      where: { id: { in: authorizedDocs.map((d) => d.id) } },
      data: { folderId },
    });

    await tx.activityLog.createMany({
      data: authorizedDocs.map((doc) => ({
        userId: user.id,
        action: 'MOVE_DOC',
        targetName: doc.title,
        targetType: 'DOCUMENT',
      })),
    });
  });

  return jsonOk({
    movedCount: authorizedDocs.length,
    failedCount: documents.length - authorizedDocs.length,
  });
}
