'use client';

import * as React from 'react';
import Link from 'next/link';
import { Copy, Download, Eye, FolderOpen, History, Lock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import { DocumentVersionsModal } from '@/components/document-versions-modal';
import { RequestAccessModal } from '@/components/request-access-modal';
import { useDeleteDocument, useLogDocumentAccess, useProfile, useRestoreDocument } from '@/hooks/use-dms';
import { useDmsStore } from '@/store/dms-store';
import type { DocumentSummary } from '@/types/dms';
import { toast } from 'sonner';

export function DocumentActions({ document }: { document: DocumentSummary }) {
  const logAccess = useLogDocumentAccess();
  const deleteDocument = useDeleteDocument();
  const restoreDocument = useRestoreDocument();
  const { data: user } = useProfile();
  const setEditingDocument = useDmsStore((s) => s.setEditingDocument);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [requestOpen, setRequestOpen] = React.useState(false);

  if (document.locked) {
    const target = {
      kind: document.lockKind ?? 'DOCUMENT',
      id: document.lockTargetId ?? document.id,
      name: document.lockTargetName ?? document.title,
      ownerName: document.lockOwnerName ?? document.uploadedBy.name,
    } as const;
    return (
      <>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setRequestOpen(true)}
          >
            <Lock className="size-3.5 text-red-600" />
            Request access
          </Button>
        </div>
        <RequestAccessModal target={target} open={requestOpen} onOpenChange={setRequestOpen} />
      </>
    );
  }

  // Edit/move/delete is restricted to the uploader or an admin for every
  // document — roles are self-selected and therefore not trusted.
  const canEdit = Boolean(user && (user.id === document.uploadedById || user.isAdmin));
  const canDelete = canEdit;

  async function downloadBlob() {
    try {
      logAccess.mutate({ documentId: document.id, action: 'DOWNLOAD' });
      const response = await fetch(document.fileUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download document');
    }
  }

  function openDocument(action: 'VIEW' | 'DOWNLOAD') {
    if (action === 'DOWNLOAD') {
      downloadBlob();
      return;
    }
    logAccess.mutate({ documentId: document.id, action });
    window.open(document.fileUrl, '_blank');
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(document.fileUrl);
      toast.success('File link copied');
    } catch {
      toast.error('Unable to copy file link');
    }
  }

  async function handleDelete() {
    try {
      await deleteDocument.mutateAsync(document.id);
      toast.success('Document deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            restoreDocument.mutate(document.id, {
              onSuccess: () => toast.success('Document restored'),
              onError: () => toast.error('Unable to restore document'),
            });
          },
        },
      });
      setDeleteOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {document.folderId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/folders/${document.folderId}`}
                aria-label={`Open folder for ${document.title}`}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FolderOpen className="size-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Open containing folder</TooltipContent>
          </Tooltip>
        )}
        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${document.title}`}
                onClick={() => setEditingDocument(document)}
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${document.title}`}
              onClick={() => openDocument('VIEW')}
            >
              <Eye className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Copy link for ${document.title}`}
              onClick={copyLink}
            >
              <Copy className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy link</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Version history for ${document.title}`}
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Version history</TooltipContent>
        </Tooltip>
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${document.title}`}
              onClick={() => openDocument('DOWNLOAD')}
            >
              <Download className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip> */}
        {/* {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${document.title}`}
                onClick={() => setDeleteOpen(true)}
                disabled={deleteDocument.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )} */}
      </div>

      <DeleteConfirmation
        open={deleteOpen}
        title="Delete document?"
        description={`Delete "${document.title}"? This removes the file record from Payline Docs and cannot be undone.`}
        isPending={deleteDocument.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <DocumentVersionsModal
        documentId={document.id}
        documentTitle={document.title}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
