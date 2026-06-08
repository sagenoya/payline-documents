'use client';

import * as React from 'react';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useRequestDocumentAccess, useRequestFolderAccess } from '@/hooks/use-dms';

export type AccessTarget = {
  kind: 'DOCUMENT' | 'FOLDER';
  id: string;
  name: string;
  ownerName?: string | null;
};

export function RequestAccessModal({
  target,
  open,
  onOpenChange,
}: {
  target: AccessTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const requestDoc = useRequestDocumentAccess();
  const requestFolder = useRequestFolderAccess();
  const [requested, setRequested] = React.useState(false);

  const pending = requestDoc.isPending || requestFolder.isPending;
  const noun = target.kind === 'FOLDER' ? 'folder' : 'document';

  React.useEffect(() => {
    if (!open) setRequested(false);
  }, [open]);

  async function handleRequest() {
    setRequested(true);
    try {
      if (target.kind === 'FOLDER') {
        await requestFolder.mutateAsync(target.id);
      } else {
        await requestDoc.mutateAsync(target.id);
      }
      toast.success(
        target.ownerName ? `Access requested from ${target.ownerName}` : 'Access requested',
      );
    } catch (error) {
      setRequested(false);
      toast.error(error instanceof Error ? error.message : 'Unable to request access');
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Restricted ${noun}`} size="md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              You’re not allowed to open “{target.name}”.
            </p>
            <p className="text-sm text-muted-foreground">
              This {noun} is marked sensitive. Request access
              {target.ownerName ? (
                <>
                  {' '}from <span className="font-medium text-foreground">{target.ownerName}</span>
                </>
              ) : null}
              . If approved, you’ll be able to open it for 2 hours.
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
            disabled={requested || pending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {requested ? 'Request sent' : 'Request access'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
