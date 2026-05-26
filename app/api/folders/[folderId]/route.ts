import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';

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

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      children: {
        include: {
          _count: { select: { children: true, documents: true } },
        },
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

  if (!folder) {
    return jsonError('Folder not found', 404);
  }

  return jsonOk({
    ...folder,
    breadcrumbs: await buildBreadcrumbs(folderId),
  });
}
