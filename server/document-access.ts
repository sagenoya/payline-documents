import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';

export type SensitiveAccessContext = {
  trustedByOwnerIds: Set<string>;
  approvedDocIds: Set<string>;
};

/**
 * Loads everything needed to decide which sensitive documents the given user
 * may open: the owners who have placed this user on their trusted-viewer list,
 * and the documents this user currently has a live (non-expired) approval for.
 */
export async function getSensitiveAccessContext(
  userId: string,
): Promise<SensitiveAccessContext> {
  const [trusted, approved] = await Promise.all([
    prisma.trustedViewer.findMany({
      where: { viewerId: userId },
      select: { ownerId: true },
    }),
    prisma.accessRequest.findMany({
      where: {
        requesterId: userId,
        status: 'APPROVED',
        expiresAt: { gt: new Date() },
      },
      select: { documentId: true },
    }),
  ]);

  return {
    trustedByOwnerIds: new Set(trusted.map((t) => t.ownerId)),
    approvedDocIds: new Set(approved.map((a) => a.documentId)),
  };
}

type AccessDoc = { id: string; isSensitive: boolean; uploadedById: string };

export function canAccessSensitiveDoc(
  doc: AccessDoc,
  user: { id: string; email?: string | null },
  ctx: SensitiveAccessContext,
) {
  if (!doc.isSensitive) return true;
  if (doc.uploadedById === user.id) return true;
  if (isAdmin(user.email)) return true;
  if (ctx.trustedByOwnerIds.has(doc.uploadedById)) return true;
  return ctx.approvedDocIds.has(doc.id);
}

/**
 * Strips the file location from documents the user is not allowed to open so a
 * locked sensitive document can be listed but never fetched. Adds `locked` so
 * the client can render the request-access flow.
 */
export function maskSensitiveDocument<T extends AccessDoc & { fileUrl: string; fileKey: string }>(
  doc: T,
  accessible: boolean,
): T & { locked: boolean } {
  if (accessible) {
    return { ...doc, locked: false };
  }
  return { ...doc, fileUrl: '', fileKey: '', locked: true };
}

export async function maskSensitiveDocuments<
  T extends AccessDoc & { fileUrl: string; fileKey: string },
>(documents: T[], user: { id: string; email?: string | null }) {
  const hasSensitive = documents.some((d) => d.isSensitive);
  if (!hasSensitive) {
    return documents.map((d) => ({ ...d, locked: false }));
  }

  const ctx = await getSensitiveAccessContext(user.id);
  return documents.map((d) => maskSensitiveDocument(d, canAccessSensitiveDoc(d, user, ctx)));
}
