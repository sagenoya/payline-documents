import { prisma } from '@/lib/prisma';
import { DEFAULT_CATEGORIES } from '@/lib/dms';
import { categorySchema } from '@/lib/validations/dms';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function GET() {
  try {
    await requireClerkUser();

    // Seed the default catalog ONLY when the table is empty (first run). After
    // that we never re-add defaults, so renaming/deleting a default sticks.
    // Categories actually in use by a document are always ensured to exist.
    const [existingCount, usedCategories] = await withDbTimeout(
      prisma.$transaction([
        prisma.category.count(),
        prisma.document.findMany({
          where: { deletedAt: null },
          distinct: ['category'],
          select: { category: true },
        }),
      ]),
    );

    const seedNames = Array.from(
      new Set([
        ...(existingCount === 0 ? DEFAULT_CATEGORIES : []),
        ...usedCategories.map((d) => d.category),
      ]),
    ).filter(Boolean);

    if (seedNames.length) {
      await prisma.category.createMany({
        data: seedNames.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    const [categories, counts] = await withDbTimeout(
      prisma.$transaction([
        prisma.category.findMany({ orderBy: { name: 'asc' } }),
        prisma.document.groupBy({
          by: ['category'],
          where: { deletedAt: null },
          _count: { _all: true },
        }),
      ]),
    );

    const countByName = new Map(counts.map((c) => [c.category, c._count._all]));

    return jsonOk(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        createdById: c.createdById,
        documentCount: countByName.get(c.name) ?? 0,
      })),
    );
  } catch (error) {
    console.error('Categories list failed', error);
    if (error instanceof Response) return error;
    return jsonError('Categories are temporarily unavailable. Please try again.', 503);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireClerkUser();
    const payload = await request.json();
    const parsed = categorySchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid category', 422);
    }

    const name = parsed.data.name.trim();

    // Case-insensitive duplicate guard ("Finance" and "finance" collide).
    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });

    if (duplicate) {
      return jsonError(`A category named “${name}” already exists.`, 409);
    }

    try {
      const category = await prisma.category.create({ data: { name, createdById: user.id } });
      return jsonOk(category, { status: 201 });
    } catch {
      return jsonError('A category with this name already exists.', 409);
    }
  } catch (error) {
    console.error('Category create failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to create category. Please try again.', 500);
  }
}
