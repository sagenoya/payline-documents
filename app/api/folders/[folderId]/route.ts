import { prisma } from '@/lib/prisma';
import { canDeleteFolder } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';
import { getRecursiveFolderCounts } from '@/lib/folder-utils';
import { z } from 'zod';

const folderUpdateSchema = z.object({
  parentId: z.string().nullable().optional(),
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
  await requireClerkUser();
  const { folderId } = await params;

  const rawFolder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      children: {
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!rawFolder) {
    return jsonError('Folder not found', 404);
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
        }
      };
    })
  };

  return jsonOk({
    ...folder,
    breadcrumbs: await buildBreadcrumbs(folderId),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const user = await requireClerkUser();
  const { folderId } = await params;

  if (!canDeleteFolder(user.profile?.companyRole)) {
    return jsonError('Only a Frontend Developer can delete folders.', 403);
  }

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

  if (!canDeleteFolder(user.profile?.companyRole)) {
    return jsonError('Only a Frontend Developer can move folders.', 403);
  }

  const payload = await request.json();
  const parsed = folderUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid folder update', 422);
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
