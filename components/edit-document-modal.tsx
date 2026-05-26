'use client';

import * as React from 'react';
import { Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadThing } from '@/lib/uploadthing';
import { useDmsStore } from '@/store/dms-store';
import { useUpdateDocument, useDocuments, useFolders } from '@/hooks/use-dms';
import { categoryLabels, DOCUMENT_CATEGORIES } from '@/lib/dms';
import type { DocumentCategory } from '@prisma/client';

type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

export function EditDocumentModal() {
  const { editingDocumentId, setEditingDocumentId } = useDmsStore();
  const { data: documents } = useDocuments();
  const { data: folders } = useFolders(); // Top level folders
  const updateDocument = useUpdateDocument();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<DocumentCategory>('HR');
  const [folderId, setFolderId] = React.useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | null>(null);

  const documentToEdit = React.useMemo(() => {
    const flatDocs = documents?.pages.flatMap((p) => p.data) || [];
    return flatDocs.find((d) => d.id === editingDocumentId);
  }, [documents, editingDocumentId]);

  const flatFolders = folders?.pages.flatMap((p) => p.data) || [];

  React.useEffect(() => {
    if (documentToEdit) {
      setTitle(documentToEdit.title);
      setDescription(documentToEdit.description || '');
      setCategory(documentToEdit.category);
      setFolderId(documentToEdit.folderId || null);
      setUploadedFile(null); // Reset when a new document is selected
    }
  }, [documentToEdit]);

  const { startUpload, isUploading } = useUploadThing('documentUploader', {
    onClientUploadComplete: (files) => {
      const file = files[0];
      if (!file) return;
      setUploadedFile({
        url: file.ufsUrl || file.url,
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
      toast.success('File uploaded successfully');
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDocumentId) return;

    try {
      await updateDocument.mutateAsync({
        id: editingDocumentId,
        data: {
          title,
          description: description || null,
          category,
          folderId,
          ...(uploadedFile && {
            fileUrl: uploadedFile.url,
            fileKey: uploadedFile.key,
            mimeType: uploadedFile.type,
            size: uploadedFile.size,
          }),
        },
      });

      toast.success('Document updated successfully');
      setEditingDocumentId(null);
    } catch (error) {
      toast.error('Failed to update document');
    }
  }

  const isOpen = !!editingDocumentId;
  const close = () => setEditingDocumentId(null);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => !o && close()}
      title="Edit Document"
      description="Update document details."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-title" className="mb-1.5 block text-sm font-medium">Title</label>
          <Input
            id="edit-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="focus-visible:ring-0 focus-visible:border-primary/70"
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-category" className="mb-1.5 block text-sm font-medium">Category</label>
            <select 
              id="edit-category"
              value={category} 
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-folder" className="mb-1.5 block text-sm font-medium">Folder</label>
            <select
              id="edit-folder"
              value={folderId || 'unfiled'}
              onChange={(e) => setFolderId(e.target.value === 'unfiled' ? null : e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70"
            >
              <option value="unfiled">No folder (Root)</option>
              {flatFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center transition-colors">
          {uploadedFile ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <p className="font-medium text-foreground">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ready to replace existing file ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setUploadedFile(null)}
              >
                Choose a different file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-subtle text-primary">
                <UploadCloud className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Replace existing file (Optional)</p>
                <p className="text-sm text-muted-foreground">Select a new PDF, Word, Excel, or Image to overwrite the current file</p>
              </div>
              <Button 
                type="button" 
                disabled={isUploading}
                className="mt-2 relative overflow-hidden"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Browse files'
                )}
                {!isUploading && (
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        startUpload([file]);
                      }
                    }} 
                  />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateDocument.isPending}>
            {updateDocument.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
