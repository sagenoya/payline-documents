import { prisma } from '@/lib/prisma';
import { canDeleteDocument } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
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

  return jsonOk(document);
}

import type { DocumentCategory } from '@prisma/client';
import { z } from 'zod';

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

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, uploadedById: true },
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

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      ...parsed.data,
      ...(parsed.data.category ? { category: parsed.data.category as DocumentCategory } : {}),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      documentId: updatedDocument.id,
      action: 'EDIT_DOC',
    },
  });

  return jsonOk(updatedDocument);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireClerkUser();
  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, uploadedById: true },
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

  await prisma.document.delete({
    where: { id: documentId },
  });

  return jsonOk({ id: documentId });
}
