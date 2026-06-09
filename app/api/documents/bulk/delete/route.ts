import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  documentIds: z.array(z.string()).min(1, 'No documents selected'),
});

export async function POST(request: Request) {
  const user = await requireClerkUser();

  const payload = await request.json();
  const parsed = bulkDeleteSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request data', 422);
  }

  const { documentIds } = parsed.data;

  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds }, deletedAt: null },
    select: { id: true, title: true, uploadedById: true },
  });

  if (!documents.length) {
    return jsonError('No documents found to delete', 404);
  }

  // Only the uploader or an admin can delete a document.
  const admin = isAdmin(user.email);
  const authorizedDocs = documents.filter(
    (doc) => doc.uploadedById === user.id || admin,
  );

  if (!authorizedDocs.length) {
    return jsonError('You do not have permission to delete the selected documents', 403);
  }

  await prisma.$transaction(async (tx) => {
    // Soft delete documents
    await tx.document.updateMany({
      where: { id: { in: authorizedDocs.map((d) => d.id) } },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    });

    // Create activity logs for each deleted document
    await tx.activityLog.createMany({
      data: authorizedDocs.map((doc) => ({
        userId: user.id,
        action: 'DELETE_DOC',
        targetName: doc.title,
        targetType: 'DOCUMENT',
      })),
    });
  });

  return jsonOk({
    deletedCount: authorizedDocs.length,
    failedCount: documents.length - authorizedDocs.length,
  });
}
