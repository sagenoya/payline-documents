import type { DocumentCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canUpload } from '@/lib/dms';
import { documentCreateSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';

export async function GET(request: Request) {
  try {
    await requireClerkUser();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category') as DocumentCategory | null;
    const folderId = searchParams.get('folderId');
    const recent = searchParams.get('recent') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('take') || 15));
    const skip = (page - 1) * limit;

    const where = {
      ...(category ? { category } : {}),
      ...(folderId ? { folderId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { uploadedBy: { name: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [total, documents] = await prisma.$transaction([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: recent ? { createdAt: 'desc' } : { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return jsonOk({
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Documents list failed', error);
    if (error instanceof Response) return error;
    return jsonError('Documents are temporarily unavailable. Please try again.', 503);
  }
}

export async function POST(request: Request) {
  const user = await requireClerkUser();

  if (!canUpload(user.profile?.companyRole)) {
    return jsonError('Your role can browse and download documents, but cannot upload yet.', 403);
  }

  const payload = await request.json();
  const parsed = documentCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid document', 422);
  }

  const document = await prisma.document.create({
    data: {
      ...parsed.data,
      description: parsed.data.description || null,
      folderId: parsed.data.folderId || null,
      category: parsed.data.category as DocumentCategory,
      uploadedById: user.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
      folder: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    userId: user.id,
    documentId: document.id,
    action: 'CREATE_DOC',
    targetName: document.title,
    targetType: 'DOCUMENT',
  });

  return jsonOk(document, { status: 201 });
}
