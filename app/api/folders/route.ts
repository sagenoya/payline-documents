import { prisma } from '@/lib/prisma';
import { folderCreateSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';
import { getRecursiveFolderCounts } from '@/lib/folder-utils';
import { evaluateFolderLock, getSensitiveAccessContext } from '@/server/document-access';
import { withDbTimeout } from '@/server/db';

export async function GET(request: Request) {
  try {
    const user = await requireClerkUser();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const parentId = searchParams.get('parentId');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('take') || 15));
    const skip = (page - 1) * limit;

    if (all) {
      const folders = await withDbTimeout(
        prisma.folder.findMany({
          select: { id: true, name: true, parentId: true },
          orderBy: { name: 'asc' },
        }),
      );
      return jsonOk(folders);
    }

    const where = { parentId: parentId || null };

    const [total, rawFolders] = await withDbTimeout(
      prisma.$transaction([
        prisma.folder.count({ where }),
        prisma.folder.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
      ]),
    );

    const recursiveCounts = await getRecursiveFolderCounts(rawFolders.map(f => f.id));
    const ctx = await getSensitiveAccessContext(user.id);
    const viewer = { id: user.id, email: user.email };
    const folders = rawFolders.map(f => {
      const counts = recursiveCounts.get(f.id);
      return {
        ...f,
        _count: {
          children: counts?.folders || 0,
          documents: counts?.docs || 0,
        },
        ...evaluateFolderLock(f.id, viewer, ctx),
      };
    });

    const totalPages = Math.ceil(total / limit);

    return jsonOk({
      data: folders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Folders list failed', error);
    if (error instanceof Response) return error;
    return jsonError('Folders are temporarily unavailable. Please try again.', 503);
  }
}

export async function POST(request: Request) {
  const user = await requireClerkUser();

  const payload = await request.json();
  const parsed = folderCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid folder', 422);
  }

  let folder;
  try {
    folder = await withDbTimeout(
      prisma.folder.create({
        data: {
          name: parsed.data.name.trim(),
          parentId: parsed.data.parentId || null,
          createdById: user.id,
        },
      }),
    );
  } catch {
    return jsonError('A folder with this name already exists here.', 409);
  }

  await logActivity({
    userId: user.id,
    folderId: folder.id,
    action: 'CREATE_FOLDER',
    targetName: folder.name,
    targetType: 'FOLDER',
  });

  return jsonOk(folder, { status: 201 });
}
