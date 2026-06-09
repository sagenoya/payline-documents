import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/server/access-control';

type FolderNode = {
  id: string;
  name: string;
  parentId: string | null;
  isSensitive: boolean;
  ownerId: string | null;
  ownerName: string | null;
};

export type SensitiveAccessContext = {
  trustedByOwnerIds: Set<string>;
  approvedDocIds: Set<string>;
  approvedFolderIds: Set<string>;
  folders: Map<string, FolderNode>;
};

type Viewer = { id: string; email?: string | null };

export type LockInfo = {
  kind: 'DOCUMENT' | 'FOLDER';
  targetId: string;
  targetName: string;
  ownerName: string | null;
};

/**
 * Loads everything needed to decide which sensitive documents/folders the given
 * user may open: owners who trust them, their live approvals (per-doc and
 * per-folder), and the full folder tree so folder sensitivity can cascade.
 */
export async function getSensitiveAccessContext(userId: string): Promise<SensitiveAccessContext> {
  const [trusted, approved, folders] = await Promise.all([
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
      select: { documentId: true, folderId: true },
    }),
    prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        isSensitive: true,
        createdById: true,
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  const approvedDocIds = new Set<string>();
  const approvedFolderIds = new Set<string>();
  approved.forEach((a) => {
    if (a.documentId) approvedDocIds.add(a.documentId);
    if (a.folderId) approvedFolderIds.add(a.folderId);
  });

  const folderMap = new Map<string, FolderNode>(
    folders.map((f) => [
      f.id,
      {
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        isSensitive: f.isSensitive,
        ownerId: f.createdById,
        ownerName: f.createdBy?.name ?? null,
      },
    ]),
  );

  return {
    trustedByOwnerIds: new Set(trusted.map((t) => t.ownerId)),
    approvedDocIds,
    approvedFolderIds,
    folders: folderMap,
  };
}

function canAccessFolderNode(node: FolderNode, user: Viewer, ctx: SensitiveAccessContext) {
  if (node.ownerId && node.ownerId === user.id) return true;
  if (isAdmin(user.email)) return true;
  if (node.ownerId && ctx.trustedByOwnerIds.has(node.ownerId)) return true;
  return ctx.approvedFolderIds.has(node.id);
}

/**
 * Walks a folder and its ancestors; if any sensitive folder in that chain is not
 * accessible to the user, the item is locked. Returns the nearest blocking
 * folder so the UI can route a request to the right owner.
 */
export function evaluateFolderGate(
  folderId: string | null | undefined,
  user: Viewer,
  ctx: SensitiveAccessContext,
): { locked: boolean; gate?: FolderNode; hasSensitiveAncestor: boolean } {
  let currentId = folderId ?? null;
  let gate: FolderNode | undefined;
  let hasSensitiveAncestor = false;

  while (currentId) {
    const node = ctx.folders.get(currentId);
    if (!node) break;
    if (node.isSensitive) {
      hasSensitiveAncestor = true;
      if (!canAccessFolderNode(node, user, ctx) && !gate) {
        gate = node;
      }
    }
    currentId = node.parentId;
  }

  return { locked: Boolean(gate), gate, hasSensitiveAncestor };
}

type AccessDoc = {
  id: string;
  title: string;
  isSensitive: boolean;
  uploadedById: string;
  folderId?: string | null;
  uploadedBy?: { name: string } | null;
};

function canAccessDocSelf(doc: AccessDoc, user: Viewer, ctx: SensitiveAccessContext) {
  if (!doc.isSensitive) return true;
  if (doc.uploadedById === user.id) return true;
  if (isAdmin(user.email)) return true;
  if (ctx.trustedByOwnerIds.has(doc.uploadedById)) return true;
  return ctx.approvedDocIds.has(doc.id);
}

function lockForDocument(doc: AccessDoc, user: Viewer, ctx: SensitiveAccessContext): LockInfo | null {
  // A sensitive ancestor folder takes precedence: unlocking the folder is the path in.
  const folderGate = evaluateFolderGate(doc.folderId, user, ctx);
  if (folderGate.locked && folderGate.gate) {
    return {
      kind: 'FOLDER',
      targetId: folderGate.gate.id,
      targetName: folderGate.gate.name,
      ownerName: folderGate.gate.ownerName,
    };
  }
  // Having access to a sensitive folder grants access to everything inside it —
  // documents in such a folder are never separately locked.
  if (folderGate.hasSensitiveAncestor) {
    return null;
  }
  if (doc.isSensitive && !canAccessDocSelf(doc, user, ctx)) {
    return {
      kind: 'DOCUMENT',
      targetId: doc.id,
      targetName: doc.title,
      ownerName: doc.uploadedBy?.name ?? null,
    };
  }
  return null;
}

export function maskDocument<
  T extends AccessDoc & { fileUrl: string; fileKey: string },
>(doc: T, user: Viewer, ctx: SensitiveAccessContext) {
  const lock = lockForDocument(doc, user, ctx);
  if (!lock) {
    return { ...doc, locked: false as const };
  }
  return {
    ...doc,
    fileUrl: '',
    fileKey: '',
    locked: true as const,
    lockKind: lock.kind,
    lockTargetId: lock.targetId,
    lockTargetName: lock.targetName,
    lockOwnerName: lock.ownerName,
  };
}

export async function maskSensitiveDocuments<
  T extends AccessDoc & { fileUrl: string; fileKey: string },
>(documents: T[], user: Viewer) {
  const ctx = await getSensitiveAccessContext(user.id);
  return documents.map((d) => maskDocument(d, user, ctx));
}

/**
 * Lock metadata for a folder itself (folder cards / folder detail page).
 */
export function evaluateFolderLock(folderId: string, user: Viewer, ctx: SensitiveAccessContext) {
  const { locked, gate } = evaluateFolderGate(folderId, user, ctx);
  if (!locked || !gate) {
    return { locked: false as const };
  }
  return {
    locked: true as const,
    lockTargetId: gate.id,
    lockTargetName: gate.name,
    lockOwnerName: gate.ownerName,
  };
}
