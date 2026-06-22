import { prisma } from '@/lib/prisma';
import { canUpload, DEPARTMENTS, DEPARTMENT_BRANDS } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  const user = await requireClerkUser();

  try {
    const [documentCount, totalFolderCount, userCount, seededDeptCount, seededBrandCount] =
      await withDbTimeout(
        prisma.$transaction([
          prisma.document.count({ where: { deletedAt: null } }),
          prisma.folder.count(),
          prisma.user.count(),
          // Auto-seeded department scaffold: top-level departments and their brand
          // sub-folders. Excluded so the headline count reflects only folders people
          // actually create.
          prisma.folder.count({ where: { parentId: null, name: { in: DEPARTMENTS } } }),
          prisma.folder.count({
            where: {
              name: { in: DEPARTMENT_BRANDS },
              parent: { parentId: null, name: { in: DEPARTMENTS } },
            },
          }),
        ]),
      );

    const folderCount = Math.max(0, totalFolderCount - seededDeptCount - seededBrandCount);

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
