import type { ActivityAction } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { documentAccessSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';

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
    select: { id: true },
  });

  if (!exists) {
    return jsonError('Document not found', 404);
  }

  const [log] = await prisma.$transaction([
    prisma.activityLog.create({
      data: {
        documentId,
        userId: user.id,
        action: parsed.data.action as ActivityAction,
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { lastAccessedAt: new Date() },
    }),
  ]);

  return jsonOk(log, { status: 201 });
}
