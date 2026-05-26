'use client';

import { Download, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogDocumentAccess, useProfile } from '@/hooks/use-dms';
import { useDmsStore } from '@/store/dms-store';
import type { DocumentSummary } from '@/types/dms';
import { toast } from 'sonner';

export function DocumentActions({ document }: { document: DocumentSummary }) {
  const logAccess = useLogDocumentAccess();
  const { data: user } = useProfile();
  const setEditingDocumentId = useDmsStore((s) => s.setEditingDocumentId);

  const canEdit = user?.id === document.uploadedById || user?.profile?.companyRole === 'CEO';

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

  return (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${document.title}`}
          onClick={() => setEditingDocumentId(document.id)}
        >
          <Pencil className="size-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Preview ${document.title}`}
        onClick={() => openDocument('VIEW')}
      >
        <Eye className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Download ${document.title}`}
        onClick={() => openDocument('DOWNLOAD')}
      >
        <Download className="size-4" />
      </Button>
    </div>
  );
}
