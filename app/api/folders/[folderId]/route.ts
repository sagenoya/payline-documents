import { prisma } from '@/lib/prisma';
import { canDeleteFolder } from '@/lib/dms';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';
import { getRecursiveFolderCounts } from '@/lib/folder-utils';
import { evaluateFolderLock, getSensitiveAccessContext } from '@/server/document-access';
import { z } from 'zod';

const folderUpdateSchema = z.object({
  parentId: z.string().nullable().optional(),
  isSensitive: z.boolean().optional(),
});

async function buildBreadcrumbs(folderId: string) {
  const crumbs: Array<{ id: string; name: string }> = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder: { id: string; name: string; parentId: string | null } | null =
      await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
      });

    if (!folder) break;
    crumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return crumbs;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const user = await requireClerkUser();
  const { folderId } = await params;

  const rawFolder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      children: {
        orderBy: { name: 'asc' },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  if (!rawFolder) {
    return jsonError('Folder not found', 404);
  }

  const ctx = await getSensitiveAccessContext(user.id);
  const lock = evaluateFolderLock(folderId, { id: user.id, email: user.email }, ctx);
  const breadcrumbs = await buildBreadcrumbs(folderId);

  // A locked folder is visible but its contents are withheld until access is granted.
  if (lock.locked) {
    return jsonOk({
      id: rawFolder.id,
      name: rawFolder.name,
      parentId: rawFolder.parentId,
      isSensitive: rawFolder.isSensitive,
      createdById: rawFolder.createdById,
      createdBy: rawFolder.createdBy,
      createdAt: rawFolder.createdAt,
      updatedAt: rawFolder.updatedAt,
      children: [],
      documents: [],
      breadcrumbs,
      ...lock,
    });
  }

  const recursiveCounts = await getRecursiveFolderCounts(rawFolder.children.map(f => f.id));
  const folder = {
    ...rawFolder,
    documents: [],
    children: rawFolder.children.map(f => {
      const counts = recursiveCounts.get(f.id);
      return {
        ...f,
        _count: {
          children: counts?.folders || 0,
          documents: counts?.docs || 0,
        },
        ...evaluateFolderLock(f.id, { id: user.id, email: user.email }, ctx),
      };
    })
  };

  return jsonOk({
    ...folder,
    breadcrumbs,
    ...lock,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const user = await requireClerkUser();
  const { folderId } = await params;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      _count: {
        select: { children: true },
      },
    },
  });

  if (!folder) {
    return jsonError('Folder not found', 404);
  }

  // The folder creator can always delete their own folder; otherwise a
  // Frontend Developer or an admin may delete it.
  const isOwner = folder.createdById === user.id;
  if (!isOwner && !isAdmin(user.email) && !canDeleteFolder(user.profile?.companyRole)) {
    return jsonError('You can only delete folders you created.', 403);
  }

  const documentCount = await prisma.document.count({
    where: { folderId, deletedAt: null },
  });

  if (folder._count.children > 0 || documentCount > 0) {
    return jsonError('Only empty folders can be deleted. Move or delete nested folders and documents first.', 409);
  }

  await prisma.$transaction([
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_FOLDER',
        targetName: folder.name,
        targetType: 'FOLDER',
      },
    }),
    prisma.folder.delete({
      where: { id: folderId },
    }),
  ]);

  return jsonOk({ id: folderId });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const user = await requireClerkUser();
  const { folderId } = await params;

  const payload = await request.json();
  const parsed = folderUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid folder update', 422);
  }

  // Sensitivity toggle: handled separately from moves. Only the folder creator or
  // an admin may toggle it (an owner-less legacy folder is therefore admin-only),
  // and an owner-less folder gains the admin who marks it as its approver-owner.
  if (parsed.data.isSensitive !== undefined && parsed.data.parentId === undefined) {
    const target = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, name: true, createdById: true },
    });

    if (!target) {
      return jsonError('Folder not found', 404);
    }

    const isOwner = target.createdById === user.id;
    if (!isOwner && !isAdmin(user.email)) {
      return jsonError('Only the folder creator or an admin can change its sensitivity.', 403);
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: {
        isSensitive: parsed.data.isSensitive,
        createdById: target.createdById ?? user.id,
      },
    });

    return jsonOk(updated);
  }

  if (!canDeleteFolder(user.profile?.companyRole)) {
    return jsonError('Only a Frontend Developer can move folders.', 403);
  }

  const nextParentId = parsed.data.parentId || null;

  if (nextParentId === folderId) {
    return jsonError('A folder cannot be moved into itself.', 422);
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, name: true, parentId: true },
  });

  if (!folder) {
    return jsonError('Folder not found', 404);
  }

  if (nextParentId) {
    let currentId: string | null = nextParentId;

    while (currentId) {
      const current: { id: string; parentId: string | null } | null =
        await prisma.folder.findUnique({
          where: { id: currentId },
          select: { id: true, parentId: true },
        });

      if (!current) {
        return jsonError('Destination folder not found', 404);
      }

      if (current.id === folderId) {
        return jsonError('A folder cannot be moved into one of its nested folders.', 422);
      }

      currentId = current.parentId;
    }
  }

  try {
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { parentId: nextParentId },
    });

    if (folder.parentId !== nextParentId) {
      await logActivity({
        userId: user.id,
        folderId: updatedFolder.id,
        action: 'MOVE_FOLDER',
        targetName: updatedFolder.name,
        targetType: 'FOLDER',
      });
    }

    return jsonOk(updatedFolder);
  } catch {
    return jsonError('A folder with this name already exists in the destination.', 409);
  }
}
