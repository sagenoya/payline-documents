// One-off DB flush. KEEPS: users, profiles, and the department/brand folder
// scaffold (the seven departments + their CURRENPAY/PAYLINE/WINGTIP sub-folders).
// WIPES everything else: documents (+ versions/allows), activity logs,
// notifications, access requests, categories, trusted viewers, and every
// user-created folder.
//
// Run with:  node --env-file=.env scripts/flush-db.mjs
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const DEPARTMENTS = ['Frontend', 'Backend', 'Compliance', 'Legal', 'Product', 'Finance', 'Trading'];
const DEPARTMENT_BRANDS = ['CURRENPAY', 'PAYLINE', 'WINGTIP'];

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 1. Build the keep-set of scaffold folder ids (oldest of each, so any leftover
  //    duplicates get pruned too).
  const depts = await prisma.folder.findMany({
    where: { parentId: null, name: { in: DEPARTMENTS } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  const keepDeptByName = new Map();
  for (const d of depts) if (!keepDeptByName.has(d.name)) keepDeptByName.set(d.name, d.id);
  const keepDeptIds = [...keepDeptByName.values()];

  const brands = keepDeptIds.length
    ? await prisma.folder.findMany({
        where: { parentId: { in: keepDeptIds }, name: { in: DEPARTMENT_BRANDS } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, parentId: true },
      })
    : [];
  const keepBrandByKey = new Map();
  for (const b of brands) {
    const key = `${b.parentId}:${b.name}`;
    if (!keepBrandByKey.has(key)) keepBrandByKey.set(key, b.id);
  }
  const keepIds = [...keepDeptIds, ...keepBrandByKey.values()];

  // 2. Wipe content tables (Document cascades versions/allows/requests/notifications,
  //    but we clear them explicitly first for a clean, deterministic order).
  await prisma.notification.deleteMany();
  await prisma.accessRequest.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentAllow.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.category.deleteMany();
  await prisma.trustedViewer.deleteMany();

  // 3. Delete every folder except the scaffold keep-set.
  const deletedFolders = await prisma.folder.deleteMany(
    keepIds.length ? { where: { id: { notIn: keepIds } } } : {},
  );

  // 4. Report final state — users/profiles are untouched.
  const report = {
    keptDepartments: keepDeptIds.length,
    keptBrandFolders: keepBrandByKey.size,
    deletedFolders: deletedFolders.count,
    remaining: {
      users: await prisma.user.count(),
      profiles: await prisma.profile.count(),
      folders: await prisma.folder.count(),
      documents: await prisma.document.count(),
      categories: await prisma.category.count(),
      notifications: await prisma.notification.count(),
      activityLogs: await prisma.activityLog.count(),
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
