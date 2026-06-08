'use client';

import * as React from 'react';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useRequestDocumentAccess } from '@/hooks/use-dms';
import type { DocumentSummary } from '@/types/dms';

export function RequestAccessModal({
  document,
  open,
  onOpenChange,
}: {
  document: DocumentSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const requestAccess = useRequestDocumentAccess();
  const [requested, setRequested] = React.useState(false);

  React.useEffect(() => {
    if (!open) setRequested(false);
  }, [open]);

  async function handleRequest() {
    // Optimistically flip the UI before the server confirms.
    setRequested(true);
    try {
      await requestAccess.mutateAsync(document.id);
      toast.success(`Access requested from ${document.uploadedBy.name}`);
    } catch (error) {
      setRequested(false);
      toast.error(error instanceof Error ? error.message : 'Unable to request access');
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Restricted document" size="md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              You’re not allowed to view “{document.title}”.
            </p>
            <p className="text-sm text-muted-foreground">
              This document is marked sensitive. Request access from{' '}
              <span className="font-medium text-foreground">{document.uploadedBy.name}</span>. If
              approved, you’ll be able to open it for 2 hours.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleRequest}
            disabled={requested || requestAccess.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {requestAccess.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {requested ? 'Request sent' : 'Request access'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
