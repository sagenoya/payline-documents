import { FileImage, FileSpreadsheet, FileText, FileType, UploadCloud } from 'lucide-react';
import { DocumentActions } from '@/components/document-actions';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatBytes, formatDate } from '@/lib/formatters';
import { useDmsStore } from '@/store/dms-store';
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
  const { selectedDocumentIds, selectAllDocuments, clearDocumentSelection } = useDmsStore();

  if (!documents.length) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-background">
        <div className="flex max-w-sm flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <p>{emptyText}</p>
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
            <UploadCloud className="size-3" />
            You can drag and drop files here to upload.
          </p>
        </div>
      </div>
    );
  }

  // Locked documents have no checkbox, so they're excluded from Select All.
  const selectableDocuments = documents.filter((doc) => !doc.locked);
  const allSelected =
    selectableDocuments.length > 0 &&
    selectableDocuments.every((doc) => selectedDocumentIds.includes(doc.id));

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                selectAllDocuments(Array.from(new Set([...selectedDocumentIds, ...selectableDocuments.map((d) => d.id)])));
              } else {
                const remainingIds = selectedDocumentIds.filter(
                  (id) => !selectableDocuments.some((doc) => doc.id === id),
                );
                selectAllDocuments(remainingIds);
              }
            }}
            aria-label="Select all"
          />
          <span className="text-sm font-medium text-muted-foreground">Select All</span>
        </div>
        <div className="divide-y">
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </div>
      </div>
      <BulkActionsBar documents={documents} />
    </>
  );
}

function DocumentRow({ document }: { document: DocumentSummary }) {
  const Icon = getFileIcon(document.mimeType);
  const { selectedDocumentIds, toggleDocumentSelection } = useDmsStore();

  return (
    <div className="flex flex-col gap-2 px-4 py-3 text-sm w-full md:grid md:grid-cols-[2.5fr_1fr_1fr_auto] md:gap-4 md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {document.locked ? (
          <span className="inline-block size-4 shrink-0" aria-hidden />
        ) : (
          <Checkbox
            checked={selectedDocumentIds.includes(document.id)}
            onCheckedChange={() => toggleDocumentSelection(document.id)}
            aria-label={`Select ${document.title}`}
          />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-primary cursor-pointer" tabIndex={0}>
              <Icon className="size-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{getFileTypeName(document.mimeType)}</TooltipContent>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground break-words leading-snug" title={document.title}>
            {document.title}
            {new Date(document.updatedAt).getTime() - new Date(document.createdAt).getTime() > 1000 && (
              <span className="inline-block align-middle ml-2 shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">Edited</span>
            )}
          </p>
          <small className="block text-muted-foreground mt-0.5">
            {formatBytes(document.size)} {document.folder?.name ? `· ${document.folder.name}` : ''}
          </small>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 md:contents">
        <span className="truncate text-muted-foreground md:max-w-[200px]" title={document.uploadedBy.name}>{document.uploadedBy.name}</span>
        <span className="text-muted-foreground text-xs md:text-sm" title={formatDate(document.updatedAt)}>{formatDate(document.updatedAt)}</span>
        <DocumentActions document={document} />
      </div>
    </div>
  );
}
