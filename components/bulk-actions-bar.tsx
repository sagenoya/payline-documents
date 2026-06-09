'use client';

import * as React from 'react';
import { Download, FolderInput, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CascadingFolderSelect } from '@/components/cascading-folder-select';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import { useBulkDeleteDocuments, useBulkMoveDocuments, useAllFolders, useProfile } from '@/hooks/use-dms';
import { useDmsStore } from '@/store/dms-store';
import type { DocumentSummary } from '@/types/dms';

export function BulkActionsBar({ documents }: { documents: DocumentSummary[] }) {
  const { selectedDocumentIds, clearDocumentSelection } = useDmsStore();
  const { data: profile } = useProfile();
  const bulkDelete = useBulkDeleteDocuments();
  const bulkMove = useBulkMoveDocuments();

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [targetFolderId, setTargetFolderId] = React.useState<string | null>(null);

  const { data: allFolders = [] } = useAllFolders({ enabled: moveOpen });

  const count = selectedDocumentIds.length;

  // Move/delete are uploader-or-admin only — hide them unless the user owns every
  // selected document (or is an admin).
  const selectedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));
  const canMutateSelection =
    selectedDocs.length > 0 &&
    selectedDocs.every((d) => d.uploadedById === profile?.id || profile?.isAdmin);

  if (count === 0) return null;

  async function handleBulkDelete() {
    try {
      const result = await bulkDelete.mutateAsync(selectedDocumentIds);
      const { deletedCount, failedCount } = result.data;
      if (failedCount > 0) {
        toast.warning(`Deleted ${deletedCount} document(s). ${failedCount} skipped due to permissions.`);
      } else {
        toast.success(`Deleted ${deletedCount} document(s).`);
      }
      clearDocumentSelection();
      setDeleteOpen(false);
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  async function handleBulkMove() {
    try {
      const result = await bulkMove.mutateAsync({ documentIds: selectedDocumentIds, folderId: targetFolderId });
      const { movedCount, failedCount } = result.data;
      if (failedCount > 0) {
        toast.warning(`Moved ${movedCount} document(s). ${failedCount} skipped due to permissions.`);
      } else {
        toast.success(`Moved ${movedCount} document(s).`);
      }
      clearDocumentSelection();
      setMoveOpen(false);
    } catch {
      toast.error('Bulk move failed');
    }
  }

  async function handleBulkDownload() {
    const selected = documents.filter((d) => selectedDocumentIds.includes(d.id));
    toast.info(`Downloading ${selected.length} file(s)...`);

    for (const doc of selected) {
      try {
        const response = await fetch(doc.fileUrl);
        if (!response.ok) throw new Error('Network error');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = doc.title;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      } catch {
        toast.error(`Failed to download "${doc.title}"`);
      }
    }
  }

  return (
    <>
      <div className="sticky bottom-4 z-30 mx-auto w-fit animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="flex items-center gap-3 rounded-xl border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-sm ring-1 ring-foreground/5">
          <span className="text-sm font-medium tabular-nums">
            {count} selected
          </span>

          <div className="h-5 w-px bg-border" />

          <Button variant="ghost" size="sm" onClick={handleBulkDownload}>
            <Download className="mr-1.5 size-4" />
            Download
          </Button>
          {canMutateSelection && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMoveOpen(true)}>
                <FolderInput className="mr-1.5 size-4" />
                Move
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1.5 size-4" />
                Delete
              </Button>
            </>
          )}

          <div className="h-5 w-px bg-border" />

          <Button variant="ghost" size="icon-sm" onClick={clearDocumentSelection} aria-label="Clear selection">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <DeleteConfirmation
        open={deleteOpen}
        title="Delete selected documents?"
        description={`This will delete ${count} document(s). Documents you don't have permission to delete will be skipped.`}
        isPending={bulkDelete.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />

      <Modal
        open={moveOpen}
        onOpenChange={(o) => !o && setMoveOpen(false)}
        title="Move documents"
        description={`Move ${count} selected document(s) to another folder.`}
        size="md"
      >
        <div className="space-y-4">
          <CascadingFolderSelect
            folders={allFolders}
            value={targetFolderId}
            onChange={(newId) => setTargetFolderId(newId)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleBulkMove} disabled={bulkMove.isPending}>
              {bulkMove.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Move here
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
