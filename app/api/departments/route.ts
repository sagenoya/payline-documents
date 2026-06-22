import { prisma } from '@/lib/prisma';
import { DEPARTMENTS, DEPARTMENT_BRANDS } from '@/lib/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

// Departments are real top-level folders; each holds the same three brand
// sub-folders (CURRENPAY / PAYLINE / WINGTIP). This tree is global and constant
// for everyone and self-seeds via the existing Folder model — no separate entity
// and no schema migration. Documents inside each brand stay unique.
//
// Postgres treats NULL as distinct in the `[name, parentId]` unique constraint,
// so a naive createMany on top-level (parentId = null) folders can't dedupe and
// would pile up copies. `ensureSingle` is therefore the source of truth: it keeps
// exactly one folder per (name, parent) and self-heals any empty duplicates.
async function ensureSingle(
  name: string,
  parentId: string | null,
  createdById: string,
): Promise<string> {
  const matches = await prisma.folder.findMany({
    where: { name, parentId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (matches.length === 0) {
    const created = await prisma.folder.create({ data: { name, parentId, createdById } });
    return created.id;
  }

  const keepId = matches[0].id;

  // Remove duplicate copies, but only when their subtree holds no documents — we
  // never want to delete a folder someone has actually uploaded into.
  for (const dupe of matches.slice(1)) {
    const docCount = await prisma.document.count({
      where: { OR: [{ folderId: dupe.id }, { folder: { parentId: dupe.id } }] },
    });
    if (docCount === 0) {
      await prisma.folder.delete({ where: { id: dupe.id } });
    }
  }

  return keepId;
}

export async function GET() {
  try {
    const user = await requireClerkUser();

    const departmentIds: { id: string; name: string }[] = [];
    for (const name of DEPARTMENTS) {
      const deptId = await ensureSingle(name, null, user.id);
      departmentIds.push({ id: deptId, name });
      for (const brand of DEPARTMENT_BRANDS) {
        await ensureSingle(brand, deptId, user.id);
      }
    }

    const brands = await withDbTimeout(
      prisma.folder.findMany({
        where: { parentId: { in: departmentIds.map((d) => d.id) } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, parentId: true },
      }),
    );

    const brandsByParent = new Map<string, { id: string; name: string }[]>();
    for (const brand of brands) {
      if (!brand.parentId) continue;
      const list = brandsByParent.get(brand.parentId) ?? [];
      list.push({ id: brand.id, name: brand.name });
      brandsByParent.set(brand.parentId, list);
    }

    return jsonOk(
      departmentIds.map((dept) => ({
        id: dept.id,
        name: dept.name,
        folders: brandsByParent.get(dept.id) ?? [],
      })),
    );
  } catch (error) {
    console.error('Departments list failed', error);
    if (error instanceof Response) return error;
    return jsonError('Departments are temporarily unavailable. Please try again.', 503);
  }
}
