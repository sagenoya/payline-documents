import { prisma } from '@/lib/prisma';
import { canDeleteDocument } from '@/lib/dms';
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

  if (
    !canDeleteDocument({
      userId: user.id,
      uploadedById: document.uploadedById,
      role: user.profile?.companyRole,
    })
  ) {
    return jsonError('Only the uploader or a Frontend Developer can restore this document.', 403);
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
