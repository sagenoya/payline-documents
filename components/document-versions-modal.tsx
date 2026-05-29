'use client';

import * as React from 'react';
import { Download, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useDocumentVersions } from '@/hooks/use-dms';
import { formatBytes, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

type Props = {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DocumentVersionsModal({ documentId, documentTitle, open, onOpenChange }: Props) {
  const { data, isLoading } = useDocumentVersions(documentId, { enabled: open });

  async function downloadVersion(fileUrl: string, title: string, version: number) {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${title} (v${version})`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch {
      toast.error('Failed to download version');
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Version History"
      description={`Previous versions of "${documentTitle}"`}
      size="lg"
    >
      {isLoading ? (
        <Loader text="Loading versions..." />
      ) : !data?.versions?.length ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <FileText className="size-8 opacity-50" />
          <p>No previous versions found.</p>
          <p className="text-sm">Versions are created when you replace a document&apos;s file.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/20 px-4 py-2.5 text-sm font-medium text-muted-foreground">
            Current version: <span className="text-foreground">v{data.currentVersion}</span>
          </div>

          <div className="divide-y rounded-lg border">
            {data.versions.map((version: any) => (
              <div key={version.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    Version {version.version}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(version.createdAt)} · {formatBytes(version.size)} · {version.uploadedBy?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(version.fileUrl, '_blank')}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadVersion(version.fileUrl, documentTitle, version.version)}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
