import type { ActivityAction } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { documentAccessSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { logActivity } from '@/server/activity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireClerkUser();
  const { documentId } = await params;
  const parsed = documentAccessSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid action', 422);
  }

  const exists = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, title: true },
  });

  if (!exists) {
    return jsonError('Document not found', 404);
  }

  await prisma.document.update({
      where: { id: documentId },
      data: { lastAccessedAt: new Date() },
  });

  await logActivity({
    documentId,
    userId: user.id,
    action: parsed.data.action as ActivityAction,
    targetName: exists.title,
    targetType: 'DOCUMENT',
  });

  return jsonOk({ documentId, action: parsed.data.action }, { status: 201 });
}
