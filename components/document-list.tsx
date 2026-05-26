import { FileText } from 'lucide-react';
import { DocumentActions } from '@/components/document-actions';
import { Badge } from '@/components/ui/badge';
import { categoryLabels } from '@/lib/dms';
import { formatBytes, formatDate } from '@/lib/formatters';
import type { DocumentSummary } from '@/types/dms';

export function DocumentList({
  documents,
  emptyText = 'No documents found.',
}: {
  documents: DocumentSummary[];
  emptyText?: string;
}) {
  if (!documents.length) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-background">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="grid grid-cols-[1fr_120px_150px_120px_90px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground max-lg:hidden">
        <span>Name</span>
        <span>Category</span>
        <span>Uploaded by</span>
        <span>Modified</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y">
        {documents.map((document) => (
          <div
            key={document.id}
            className="grid gap-3 px-3 py-3 text-sm lg:grid-cols-[1fr_120px_150px_120px_90px] lg:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground flex items-center gap-2">
                  {document.title}
                  {new Date(document.updatedAt).getTime() - new Date(document.createdAt).getTime() > 1000 && (
                    <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm shrink-0">Edited</span>
                  )}
                </p>
                <small className="block truncate">
                  {formatBytes(document.size)} {document.folder?.name ? `· ${document.folder.name}` : ''}
                </small>
              </div>
            </div>
            <Badge>{categoryLabels[document.category]}</Badge>
            <span className="truncate text-muted-foreground">{document.uploadedBy.name}</span>
            <span className="text-muted-foreground">{formatDate(document.updatedAt)}</span>
            <DocumentActions document={document} />
          </div>
        ))}
      </div>
    </div>
  );
}
