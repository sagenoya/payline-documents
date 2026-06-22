import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';
import { documentAllowAddSchema } from '@/lib/validations/dms';

const memberSelect = { id: true, name: true, email: true, imageUrl: true } as const;

// A document is "open to everyone" when neither it nor any ancestor folder is
// sensitive. In that case the allow list is moot — the whole team can see it.
async function isOpenToEveryone(isSensitive: boolean, folderId: string | null) {
  if (isSensitive) return false;
  if (!folderId) return true;

  const folders = await withDbTimeout(
    prisma.folder.findMany({ select: { id: true, parentId: true, isSensitive: true } }),
  );
  const byId = new Map(folders.map((f) => [f.id, f]));

  let currentId: string | null = folderId;
  while (currentId) {
    const node = byId.get(currentId);
    if (!node) break;
    if (node.isSensitive) return false;
    currentId = node.parentId;
  }
  return true;
}

// Who can see this document. For an open document that's the whole team; for a
// gated one it's the uploader's explicit allow list. Uploader/admin only.
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
        select: { id: true, uploadedById: true, isSensitive: true, folderId: true },
      }),
    );

    if (!document) {
      return jsonError('Document not found', 404);
    }

    if (document.uploadedById !== user.id && !isAdmin(user.email)) {
      return jsonError('Only the uploader can see who has access.', 403);
    }

    if (await isOpenToEveryone(document.isSensitive, document.folderId)) {
      const everyone = await withDbTimeout(
        prisma.user.findMany({ select: memberSelect, orderBy: { name: 'asc' } }),
      );
      return jsonOk({ scope: 'everyone' as const, members: everyone });
    }

    const allows = await withDbTimeout(
      prisma.documentAllow.findMany({
        where: { documentId },
        select: { user: { select: memberSelect } },
        orderBy: { user: { name: 'asc' } },
      }),
    );

    return jsonOk({ scope: 'allow-list' as const, members: allows.map((a) => a.user) });
  } catch (error) {
    console.error('Access list lookup failed', error);
    if (error instanceof Response) return error;
    return jsonError('Access list is temporarily unavailable. Please try again.', 503);
  }
}

// Add teammates to this document's allow list. Uploader/admin only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { documentId } = await params;

    const parsed = documentAllowAddSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 422);
    }

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
      return jsonError('Only the uploader can grant access.', 403);
    }

    // Only add ids that map to real users (and never the uploader, who already owns it).
    const validUsers = await withDbTimeout(
      prisma.user.findMany({
        where: { id: { in: parsed.data.userIds }, NOT: { id: document.uploadedById } },
        select: { id: true },
      }),
    );

    if (validUsers.length > 0) {
      // Figure out who is genuinely new so we only notify (and don't re-notify) them.
      const existing = await withDbTimeout(
        prisma.documentAllow.findMany({
          where: { documentId, userId: { in: validUsers.map((u) => u.id) } },
          select: { userId: true },
        }),
      );
      const existingIds = new Set(existing.map((e) => e.userId));
      const newUserIds = validUsers.map((u) => u.id).filter((id) => !existingIds.has(id));

      if (newUserIds.length > 0) {
        await withDbTimeout(
          prisma.$transaction([
            prisma.documentAllow.createMany({
              data: newUserIds.map((userId) => ({ documentId, userId })),
              skipDuplicates: true,
            }),
            prisma.notification.createMany({
              data: newUserIds.map((userId) => ({
                userId,
                type: 'DOCUMENT_SHARED' as const,
                documentId,
              })),
            }),
          ]),
        );
      }
    }

    const allows = await withDbTimeout(
      prisma.documentAllow.findMany({
        where: { documentId },
        select: { user: { select: memberSelect } },
        orderBy: { user: { name: 'asc' } },
      }),
    );

    return jsonOk({ scope: 'allow-list' as const, members: allows.map((a) => a.user) });
  } catch (error) {
    console.error('Access grant failed', error);
    if (error instanceof Response) return error;
    return jsonError('Could not grant access right now. Please try again.', 503);
  }
}

// Revoke a teammate's upload-time allow-list access to this document.
// Allowed only for the document's uploader or an admin.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { documentId } = await params;

    const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';

    if (!userId) {
      return jsonError('A userId is required to revoke access.', 422);
    }

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
      return jsonError('Only the uploader can revoke access.', 403);
    }

    await withDbTimeout(
      prisma.documentAllow.deleteMany({ where: { documentId, userId } }),
    );

    return jsonOk({ documentId, userId });
  } catch (error) {
    console.error('Access revoke failed', error);
    if (error instanceof Response) return error;
    return jsonError('Could not revoke access right now. Please try again.', 503);
  }
}
