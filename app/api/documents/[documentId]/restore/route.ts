import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, uploadedById: true },
  });

  if (!document) {
    return jsonError('Document not found', 404);
  }

  if (document.uploadedById !== user.id && !isAdmin(user.email)) {
    return jsonError('Only the uploader or an admin can restore this document.', 403);
  }

  const restored = await prisma.document.update({
    where: { id: documentId },
    data: {
      deletedAt: null,
      deletedById: null,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
      folder: { select: { id: true, name: true } },
    },
  });

  return jsonOk(restored);
}
