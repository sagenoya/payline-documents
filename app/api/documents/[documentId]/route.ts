import { prisma } from '@/lib/prisma';
import { canDeleteDocument } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';
import { getSensitiveAccessContext, maskDocument } from '@/server/document-access';
import type { DocumentCategory } from '@prisma/client';
import { z } from 'zod';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
      folder: { select: { id: true, name: true } },
      activityLogs: {
        include: { user: { select: { id: true, name: true, email: true, imageUrl: true } } },
        orderBy: { timestamp: 'desc' },
        take: 20,
      },
    },
  });

  if (!document) {
    return jsonError('Document not found', 404);
  }

  const ctx = await getSensitiveAccessContext(user.id);

  return jsonOk(maskDocument(document, { id: user.id, email: user.email }, ctx));
}

const documentEditSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  category: z.enum(['HR', 'FINANCE', 'LEGAL', 'OPERATIONS', 'ENGINEERING']).optional(),
  folderId: z.string().nullable().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().int().positive().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: { id: true, title: true, folderId: true, uploadedById: true, version: true, fileUrl: true, fileKey: true, mimeType: true, size: true },
  });

  if (!document) {
    return jsonError('Document not found', 404);
  }

  if (document.uploadedById !== user.id && user.profile?.companyRole !== 'CEO') {
    return jsonError('Only the original uploader or CEO can edit this document', 403);
  }

  const payload = await request.json();
  const parsed = documentEditSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid update data', 422);
  }

  const isMoving =
    Object.prototype.hasOwnProperty.call(parsed.data, 'folderId') &&
    parsed.data.folderId !== document.folderId;

  const isUpdatingFile =
    Object.prototype.hasOwnProperty.call(parsed.data, 'fileUrl') &&
    parsed.data.fileUrl !== document.fileUrl;

  const updatedDocument = await prisma.$transaction(async (tx) => {
    if (isUpdatingFile) {
      await tx.documentVersion.create({
        data: {
          documentId: document.id,
          version: document.version,
          fileUrl: document.fileUrl,
          fileKey: document.fileKey,
          mimeType: document.mimeType,
          size: document.size,
          uploadedById: document.uploadedById,
        },
      });
    }

    return tx.document.update({
      where: { id: documentId },
      data: {
        ...parsed.data,
        ...(parsed.data.category ? { category: parsed.data.category as DocumentCategory } : {}),
        ...(isUpdatingFile ? { version: { increment: 1 } } : {}),
      },
    });
  });

  await logActivity({
    userId: user.id,
    documentId: updatedDocument.id,
    action: isMoving ? 'MOVE_DOC' : 'EDIT_DOC',
    targetName: updatedDocument.title,
    targetType: 'DOCUMENT',
  });

  return jsonOk(updatedDocument);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: { id: true, title: true, uploadedById: true },
  });

  if (!document) {
    return jsonError('Document not found', 404);
  }

  if (
    !canDeleteDocument({
      userId: user.id,
      uploadedById: document.uploadedById,
      role: user.profile?.companyRole,
    })
  ) {
    return jsonError('Only the uploader or a Frontend Developer can delete this document.', 403);
  }

  await prisma.$transaction([
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_DOC',
        targetName: document.title,
        targetType: 'DOCUMENT',
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    }),
  ]);

  return jsonOk({ id: documentId });
}
