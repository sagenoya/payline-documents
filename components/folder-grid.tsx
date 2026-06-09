'use client';

import * as React from 'react';
import Link from 'next/link';
import { Folder, FolderInput, Lock, LockOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import { MoveFolderModal } from '@/components/move-folder-modal';
import { RequestAccessModal } from '@/components/request-access-modal';
import { useDeleteFolder, useProfile, useSetFolderSensitive } from '@/hooks/use-dms';
import { canDeleteFolder } from '@/lib/dms';
import { useDmsStore } from '@/store/dms-store';
import { cn } from '@/lib/utils';
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
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            canDelete={canDelete}
            deleteFolderPending={deleteFolder.isPending}
            onDelete={setFolderToDelete}
            onMove={setFolderToMove}
          />
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

function FolderCard({
  folder,
  canDelete,
  deleteFolderPending,
  onDelete,
  onMove,
}: {
  folder: FolderSummary;
  canDelete: boolean;
  deleteFolderPending: boolean;
  onDelete: (folder: FolderSummary) => void;
  onMove: (folder: FolderSummary) => void;
}) {
  const { data: profile } = useProfile();
  const setUploadModalOpen = useDmsStore((s) => s.setUploadModalOpen);
  const setPendingDropFiles = useDmsStore((s) => s.setPendingDropFiles);
  const setActiveFolderId = useDmsStore((s) => s.setActiveFolderId);
  const setFolderSensitive = useSetFolderSensitive();

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [requestOpen, setRequestOpen] = React.useState(false);
  const canUpload = profile?.canUpload ?? false;
  const locked = Boolean(folder.locked);
  const canManageSensitive =
    Boolean(profile) && (profile!.isAdmin || folder.createdById === profile!.id);

  function handleCardClick(e: React.MouseEvent) {
    if (locked) {
      e.preventDefault();
      setRequestOpen(true);
    }
  }

  async function toggleSensitive(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await setFolderSensitive.mutateAsync({ id: folder.id, isSensitive: !folder.isSensitive });
      toast.success(folder.isSensitive ? 'Folder unmarked' : 'Folder marked sensitive');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update folder');
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (locked) {
      toast.error('This folder is restricted. Request access to upload here.');
      return;
    }

    if (!canUpload) {
      toast.error('You do not have upload access.');
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Deduplicate files by name
    const seen = new Set<string>();
    const uniqueFiles = droppedFiles.filter((file) => {
      if (seen.has(file.name)) return false;
      seen.add(file.name);
      return true;
    });

    const filesToUpload = uniqueFiles.slice(0, 6);
    if (uniqueFiles.length > 6) {
      toast.warning('Only the first 6 files will be uploaded.');
    }
    if (droppedFiles.length !== uniqueFiles.length) {
      toast.info('Duplicate file names were removed.');
    }

    setActiveFolderId(folder.id);
    setPendingDropFiles(filesToUpload);
    setUploadModalOpen(true);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'group relative rounded-lg border bg-background transition duration-200',
        isDragOver
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02] shadow-sm'
          : 'hover:border-primary/50 hover:bg-brand-subtle'
      )}
    >
      <Link
        href={`/folders/${folder.id}`}
        onClick={handleCardClick}
        className="flex items-center gap-3 p-3 pr-11"
      >
        <div className={cn(
          'flex size-10 items-center justify-center rounded-md bg-muted text-primary transition duration-200',
          isDragOver && 'bg-primary text-primary-foreground'
        )}>
          {locked ? <Lock className="size-5 text-red-600" /> : <Folder className="size-5" />}
        </div>
        <div className="min-w-0">
          <p className="truncate uppercase font-bold text-foreground flex items-center gap-1.5">
            {folder.name}
            {(folder.isSensitive || locked) && (
              locked ? (
                <span className="inline-flex items-center gap-1 shrink-0 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] uppercase text-red-600">
                  <Lock className="size-2.5" />
                  Locked
                </span>
              ) : canManageSensitive ? (
                <span className="inline-flex items-center gap-1 shrink-0 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] uppercase text-red-600">
                  <Lock className="size-2.5" />
                  Sensitive
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 shrink-0 rounded-sm bg-green-500/10 px-1.5 py-0.5 text-[10px] uppercase text-green-600">
                  <LockOpen className="size-2.5" />
                  Access granted
                </span>
              )
            )}
          </p>
          {folder._count && (
            <small>
              {folder._count.documents} docs · {folder._count.children} folders
            </small>
          )}
        </div>
      </Link>

      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        {canManageSensitive && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={folder.isSensitive ? `Unmark ${folder.name} as sensitive` : `Mark ${folder.name} as sensitive`}
            disabled={setFolderSensitive.isPending}
            onClick={toggleSensitive}
          >
            {folder.isSensitive ? (
              <LockOpen className="size-4 text-red-600" />
            ) : (
              <Lock className="size-4" />
            )}
          </Button>
        )}
        {canDelete && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${folder.name}`}
              onClick={() => onMove(folder)}
            >
              <FolderInput className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${folder.name}`}
              disabled={deleteFolderPending}
              onClick={() => onDelete(folder)}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>

      <RequestAccessModal
        target={{
          kind: 'FOLDER',
          id: folder.lockTargetId ?? folder.id,
          name: folder.lockTargetName ?? folder.name,
          ownerName: folder.lockOwnerName,
        }}
        open={requestOpen}
        onOpenChange={setRequestOpen}
      />
    </div>
  );
}
