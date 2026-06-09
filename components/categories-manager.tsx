'use client';

import * as React from 'react';
import { Check, Loader2, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useProfile,
  useUpdateCategory,
} from '@/hooks/use-dms';
import type { Category } from '@/types/dms';

export function CategoriesManager() {
  const { data: profile } = useProfile();
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createCategory.mutateAsync(name);
      setNewName('');
      toast.success('Category created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  }

  async function handleRename(category: Category) {
    const name = editingName.trim();
    if (!name || name === category.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateCategory.mutateAsync({ id: category.id, name });
      setEditingId(null);
      toast.success('Category renamed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rename category');
    }
  }

  async function handleDelete() {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success('Category deleted');
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }

  return (
    <section className="rounded-lg border bg-background">
      <div className="flex items-start gap-3 border-b bg-muted/20 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-primary">
          <Tag className="size-4" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">Document categories</h2>
          <p className="text-sm text-muted-foreground">
            Create, rename, or remove the categories used when uploading documents. A category
            that still has documents can’t be deleted.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="New category name"
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
          />
          <Button onClick={handleCreate} disabled={createCategory.isPending || !newName.trim()}>
            {createCategory.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-1 size-4" />
            )}
            Add
          </Button>
        </div>

        {isLoading ? (
          <Loader />
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {categories.map((category) => {
              const isEditing = editingId === category.id;
              const canManage = Boolean(profile?.isAdmin || category.createdById === profile?.id);
              return (
                <li key={category.id} className="flex items-center gap-3 px-3 py-2.5">
                  {isEditing ? (
                    <>
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRename(category);
                          }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-8 focus-visible:ring-0 focus-visible:border-foreground/30"
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Save"
                        disabled={updateCategory.isPending}
                        onClick={() => handleRename(category)}
                      >
                        <Check className="size-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Cancel"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.documentCount ?? 0} document{category.documentCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      {canManage && (
                        <>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Rename ${category.name}`}
                            onClick={() => {
                              setEditingId(category.id);
                              setEditingName(category.name);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Delete ${category.name}`}
                            disabled={deleteCategory.isPending}
                            onClick={() => setCategoryToDelete(category)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DeleteConfirmation
        open={!!categoryToDelete}
        title="Delete category?"
        description={
          categoryToDelete
            ? `Delete the “${categoryToDelete.name}” category? This can’t be undone.`
            : ''
        }
        isPending={deleteCategory.isPending}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
