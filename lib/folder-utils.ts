import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Calculates recursive document and folder counts for a list of root folder IDs.
 * Because the workspace has a small number of total folders, we fetch the whole tree
 * and compute recursive counts in memory.
 */
export async function getRecursiveFolderCounts(folderIds: string[]) {
  const result = new Map<string, { docs: number; folders: number }>();
  if (!folderIds.length) return result;

  const rows = await prisma.$queryRaw<Array<{ rootId: string; docs: number; folders: number }>>`
    WITH RECURSIVE folder_tree AS (
      SELECT
        f.id,
        f."parentId",
        f.id AS "rootId",
        0 AS depth
      FROM "Folder" f
      WHERE f.id IN (${Prisma.join(folderIds)})

      UNION ALL

      SELECT
        child.id,
        child."parentId",
        folder_tree."rootId",
        folder_tree.depth + 1 AS depth
      FROM "Folder" child
      INNER JOIN folder_tree ON child."parentId" = folder_tree.id
    )
    SELECT
      folder_tree."rootId",
      COALESCE(COUNT(doc.id), 0)::int AS docs,
      COUNT(*) FILTER (WHERE folder_tree.depth > 0)::int AS folders
    FROM folder_tree
    LEFT JOIN "Document" doc ON doc."folderId" = folder_tree.id AND doc."deletedAt" IS NULL
    GROUP BY folder_tree."rootId"
  `;

  for (const id of folderIds) {
    result.set(id, { docs: 0, folders: 0 });
  }

  for (const row of rows) {
    result.set(row.rootId, {
      docs: Number(row.docs),
      folders: Number(row.folders),
    });
  }

  return result;
}
