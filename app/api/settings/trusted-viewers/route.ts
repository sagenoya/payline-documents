import { prisma } from '@/lib/prisma';
import { trustedViewersSchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  try {
    const user = await requireClerkUser();

    const rows = await withDbTimeout(
      prisma.trustedViewer.findMany({
        where: { ownerId: user.id },
        select: { viewerId: true },
      }),
    );

    return jsonOk({ viewerIds: rows.map((r) => r.viewerId) });
  } catch (error) {
    console.error('Trusted viewers lookup failed', error);
    if (error instanceof Response) return error;
    return jsonError('Settings are temporarily unavailable. Please try again.', 503);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireClerkUser();
    const payload = await request.json();
    const parsed = trustedViewersSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid selection', 422);
    }

    const viewerIds = [...new Set(parsed.data.viewerIds)].filter((id) => id !== user.id);

    await withDbTimeout(
      prisma.$transaction([
        prisma.trustedViewer.deleteMany({ where: { ownerId: user.id } }),
        prisma.trustedViewer.createMany({
          data: viewerIds.map((viewerId) => ({ ownerId: user.id, viewerId })),
          skipDuplicates: true,
        }),
      ]),
    );

    return jsonOk({ viewerIds });
  } catch (error) {
    console.error('Trusted viewers update failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to save settings. Please try again.', 500);
  }
}
