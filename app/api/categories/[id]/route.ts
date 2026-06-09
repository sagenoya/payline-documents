import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations/dms';
import { isAdmin } from '@/server/access-control';
import { jsonError, jsonOk, requireClerkUser } from '@/server/auth';
import { withDbTimeout } from '@/server/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { id } = await params;
    const payload = await request.json();
    const parsed = categorySchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid category', 422);
    }

    const category = await withDbTimeout(prisma.category.findUnique({ where: { id } }));
    if (!category) {
      return jsonError('Category not found', 404);
    }

    if (category.createdById !== user.id && !isAdmin(user.email)) {
      return jsonError('Only the category creator or an admin can edit it.', 403);
    }

    const name = parsed.data.name.trim();
    if (name === category.name) {
      return jsonOk(category);
    }

    try {
      // Rename the catalog entry and re-tag every document using the old name so
      // existing documents follow the rename (category is stored by name).
      const [updated] = await prisma.$transaction([
        prisma.category.update({ where: { id }, data: { name } }),
        prisma.document.updateMany({ where: { category: category.name }, data: { category: name } }),
      ]);
      return jsonOk(updated);
    } catch {
      return jsonError('A category with this name already exists.', 409);
    }
  } catch (error) {
    console.error('Category update failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to update category. Please try again.', 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireClerkUser();
    const { id } = await params;

    const category = await withDbTimeout(prisma.category.findUnique({ where: { id } }));
    if (!category) {
      return jsonError('Category not found', 404);
    }

    if (category.createdById !== user.id && !isAdmin(user.email)) {
      return jsonError('Only the category creator or an admin can delete it.', 403);
    }

    const inUse = await withDbTimeout(
      prisma.document.count({ where: { category: category.name, deletedAt: null } }),
    );

    if (inUse > 0) {
      return jsonError(
        `“${category.name}” still has ${inUse} document${inUse === 1 ? '' : 's'}. Reassign them before deleting.`,
        409,
      );
    }

    await prisma.category.delete({ where: { id } });
    return jsonOk({ id });
  } catch (error) {
    console.error('Category delete failed', error);
    if (error instanceof Response) return error;
    return jsonError('Unable to delete category. Please try again.', 500);
  }
}
