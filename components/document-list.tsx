import { FileImage, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { DocumentActions } from '@/components/document-actions';
import { Badge } from '@/components/ui/badge';
import { categoryLabels } from '@/lib/dms';
import { formatBytes, formatDate } from '@/lib/formatters';
import type { DocumentSummary } from '@/types/dms';

function getFileIcon(mimeType: string) {
  if (mimeType.includes('image')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet;
  if (mimeType.includes('word')) return FileType;
  return FileText;
}

function getFileTypeName(mimeType: string) {
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('image')) return 'Image File';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'Spreadsheet';
  if (mimeType.includes('word')) return 'Word Document';
  return 'Text Document';
}

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
        <div className="flex max-w-sm flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <p>{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="divide-y">
        {documents.map((document) => (
          <DocumentRow key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}

function DocumentRow({ document }: { document: DocumentSummary }) {
  const Icon = getFileIcon(document.mimeType);

  return (
    <div className="grid gap-3 px-3 py-3 text-sm lg:grid-cols-[1fr_120px_150px_120px_150px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div
          title={getFileTypeName(document.mimeType)}
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-primary"
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate font-medium text-foreground" title={document.title}>
            {document.title}
            {new Date(document.updatedAt).getTime() - new Date(document.createdAt).getTime() > 1000 && (
              <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">Edited</span>
            )}
          </p>
          <small className="block truncate">
            {formatBytes(document.size)} {document.folder?.name ? `· ${document.folder.name}` : ''}
          </small>
        </div>
      </div>
      <Badge>{categoryLabels[document.category]}</Badge>
      <span className="truncate text-muted-foreground" title={document.uploadedBy.name}>{document.uploadedBy.name}</span>
      <span className="text-muted-foreground" title={formatDate(document.updatedAt)}>{formatDate(document.updatedAt)}</span>
      <DocumentActions document={document} />
    </div>
  );
}
