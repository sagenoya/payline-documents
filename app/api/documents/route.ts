import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canUpload } from '@/lib/dms';
import { documentCreateSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';
import { maskSensitiveDocuments } from '@/server/document-access';
import { withDbTimeout } from '@/server/db';

export async function GET(request: Request) {
  try {
    const user = await requireClerkUser();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category');
    const folderId = searchParams.get('folderId');
    const uploadedById = searchParams.get('uploadedById');
    const recent = searchParams.get('recent') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('take') || 15)));
    const sortBy = searchParams.get('sortBy') || (recent ? 'createdAt' : 'updatedAt');
    const sortDirection = searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    const orderBy: Prisma.DocumentOrderByWithRelationInput =
      sortBy === 'title'
        ? { title: sortDirection }
        : sortBy === 'size'
          ? { size: sortDirection }
          : sortBy === 'createdAt'
            ? { createdAt: sortDirection }
            : { updatedAt: sortDirection };

    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(folderId ? { folderId } : {}),
      ...(uploadedById ? { uploadedById } : {}),
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

    const [total, documents] = await withDbTimeout(
      prisma.$transaction([
        prisma.document.count({ where }),
        prisma.document.findMany({
          where,
          include: {
            uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
            folder: { select: { id: true, name: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
      ]),
    );

    const totalPages = Math.ceil(total / limit);

    const maskedDocuments = await maskSensitiveDocuments(documents, {
      id: user.id,
      email: user.email,
    });

    return jsonOk({
      data: maskedDocuments,
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

  const document = await withDbTimeout(
    prisma.document.create({
      data: {
        ...parsed.data,
        description: parsed.data.description || null,
        folderId: parsed.data.folderId || null,
        category: parsed.data.category,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
        folder: { select: { id: true, name: true } },
      },
    }),
  );

  await logActivity({
    userId: user.id,
    documentId: document.id,
    action: 'CREATE_DOC',
    targetName: document.title,
    targetType: 'DOCUMENT',
  });

  return jsonOk(document, { status: 201 });
}
