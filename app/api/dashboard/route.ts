import { prisma } from '@/lib/prisma';
import { canUpload } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  const user = await requireClerkUser();

  try {
    const [documentCount, folderCount, userCount] = await withDbTimeout(
      prisma.$transaction([
        prisma.document.count({ where: { deletedAt: null } }),
        prisma.folder.count(),
        prisma.user.count(),
      ]),
    );

    return jsonOk({
      documentCount,
      folderCount,
      userCount,
      canUpload: canUpload(user.profile?.companyRole),
      isUnavailable: false,
    });
  } catch (error) {
    console.error('Dashboard data failed to load', error);

    return jsonOk({
      documentCount: 0,
      folderCount: 0,
      userCount: 0,
      canUpload: canUpload(user.profile?.companyRole),
      isUnavailable: true,
    });
  }
}
