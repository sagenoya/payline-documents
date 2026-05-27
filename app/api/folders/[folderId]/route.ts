import { prisma } from '@/lib/prisma';
import { canDeleteFolder } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { getRecursiveFolderCounts } from '@/lib/folder-utils';

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
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!rawFolder) {
    return jsonError('Folder not found', 404);
  }

  const recursiveCounts = await getRecursiveFolderCounts(rawFolder.children.map(f => f.id));
  const folder = {
    ...rawFolder,
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
        select: { children: true, documents: true },
      },
    },
  });

  if (!folder) {
    return jsonError('Folder not found', 404);
  }

  if (folder._count.children > 0 || folder._count.documents > 0) {
    return jsonError('Only empty folders can be deleted. Move or delete nested folders and documents first.', 409);
  }

  await prisma.folder.delete({
    where: { id: folderId },
  });

  return jsonOk({ id: folderId });
}
