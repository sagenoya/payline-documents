import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

// Who the uploader explicitly allow-listed for this document at upload time.
// Visible only to the document's uploader or an admin.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { documentId } = await params;

    const document = await withDbTimeout(
      prisma.document.findFirst({
        where: { id: documentId, deletedAt: null },
        select: { id: true, uploadedById: true },
      }),
    );

    if (!document) {
      return jsonError('Document not found', 404);
    }

    if (document.uploadedById !== user.id && !isAdmin(user.email)) {
      return jsonError('Only the uploader can see who has access.', 403);
    }

    const allows = await withDbTimeout(
      prisma.documentAllow.findMany({
        where: { documentId },
        select: {
          user: { select: { id: true, name: true, email: true, imageUrl: true } },
        },
        orderBy: { user: { name: 'asc' } },
      }),
    );

    return jsonOk(allows.map((a) => a.user));
  } catch (error) {
    console.error('Access list lookup failed', error);
    if (error instanceof Response) return error;
    return jsonError('Access list is temporarily unavailable. Please try again.', 503);
  }
}
