import { prisma } from './prisma';

/**
 * Calculates recursive document and folder counts for a list of root folder IDs.
 * Because the workspace has a small number of total folders, we fetch the whole tree
 * and compute recursive counts in memory.
 */
export async function getRecursiveFolderCounts(folderIds: string[]) {
  const allFolders = await prisma.folder.findMany({
    select: {
      id: true,
      parentId: true,
      _count: {
        select: { documents: true },
      },
    },
  });

  const childrenMap = new Map<string, string[]>();
  const folderMap = new Map<string, typeof allFolders[0]>();

  for (const f of allFolders) {
    folderMap.set(f.id, f);
    if (f.parentId) {
      if (!childrenMap.has(f.parentId)) childrenMap.set(f.parentId, []);
      childrenMap.get(f.parentId)!.push(f.id);
    }
  }

  function compute(id: string): { docs: number; folders: number } {
    const f = folderMap.get(id);
    let docs = f?._count.documents || 0;
    let folders = 0;

    const children = childrenMap.get(id) || [];
    folders += children.length;

    for (const childId of children) {
      const childCounts = compute(childId);
      docs += childCounts.docs;
      folders += childCounts.folders;
    }

    return { docs, folders };
  }

  const result = new Map<string, { docs: number; folders: number }>();
  for (const id of folderIds) {
    result.set(id, compute(id));
  }

  return result;
}
