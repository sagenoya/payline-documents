import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: { id: true, title: true, version: true },
  });

  if (!document) {
    return jsonError('Document not found', 404);
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
    },
    orderBy: { version: 'desc' },
  });

  return jsonOk({
    currentVersion: document.version,
    versions,
  });
}
