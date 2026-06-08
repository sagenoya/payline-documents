import { prisma } from '@/lib/prisma';
import { accessResponseSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { id } = await params;
    const payload = await request.json();
    const parsed = accessResponseSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid decision', 422);
    }

    const accessRequest = await withDbTimeout(
      prisma.accessRequest.findUnique({ where: { id } }),
    );

    if (!accessRequest) {
      return jsonError('Access request not found', 404);
    }

    if (accessRequest.ownerId !== user.id) {
      return jsonError('Only the document owner can respond to this request.', 403);
    }

    const approved = parsed.data.decision === 'APPROVE';

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'DENIED',
        expiresAt: approved ? new Date(Date.now() + TWO_HOURS_MS) : null,
      },
    });

    await prisma.$transaction([
      prisma.notification.updateMany({
        where: { accessRequestId: id, userId: user.id },
        data: { read: true },
      }),
      prisma.notification.create({
        data: {
          userId: accessRequest.requesterId,
          type: approved ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
          accessRequestId: id,
        },
      }),
    ]);

    return jsonOk(updated);
  } catch (error) {
    console.error('Access response failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to respond to request. Please try again.', 500);
  }
}
