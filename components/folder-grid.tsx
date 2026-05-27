'use client';

import * as React from 'react';
import Link from 'next/link';
import { Folder, FolderInput, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import { MoveFolderModal } from '@/components/move-folder-modal';
import { useDeleteFolder, useProfile } from '@/hooks/use-dms';
import { canDeleteFolder } from '@/lib/dms';
import type { FolderSummary } from '@/types/dms';

export function FolderGrid({ folders }: { folders: FolderSummary[] }) {
  const { data: user } = useProfile();
  const deleteFolder = useDeleteFolder();
  const canDelete = canDeleteFolder(user?.profile?.companyRole);
  const [folderToDelete, setFolderToDelete] = React.useState<FolderSummary | null>(null);
  const [folderToMove, setFolderToMove] = React.useState<FolderSummary | null>(null);

  if (!folders.length) return null;

  async function handleDelete() {
    if (!folderToDelete) return;

    try {
      await deleteFolder.mutateAsync(folderToDelete.id);
      toast.success('Folder deleted');
      setFolderToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group relative rounded-lg border bg-background transition hover:border-primary/50 hover:bg-brand-subtle"
          >
            <Link href={`/folders/${folder.id}`} className="flex items-center gap-3 p-3 pr-11">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted text-primary">
                <Folder className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{folder.name}</p>
                {folder._count && (
                  <small>
                    {folder._count.documents} docs · {folder._count.children} folders
                  </small>
                )}
              </div>
            </Link>

            {canDelete && (
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${folder.name}`}
                  onClick={() => setFolderToMove(folder)}
                >
                  <FolderInput className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${folder.name}`}
                  disabled={deleteFolder.isPending}
                  onClick={() => setFolderToDelete(folder)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <DeleteConfirmation
        open={!!folderToDelete}
        title="Delete folder?"
        description={
          folderToDelete
            ? `Delete "${folderToDelete.name}"? Only empty folders can be deleted.`
            : ''
        }
        isPending={deleteFolder.isPending}
        onCancel={() => setFolderToDelete(null)}
        onConfirm={handleDelete}
      />

      <MoveFolderModal
        folder={folderToMove}
        open={!!folderToMove}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setFolderToMove(null);
        }}
      />
    </>
  );
}
