'use client';

import * as React from 'react';
import { FileUp, FolderPlus, Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadThing } from '@/lib/uploadthing';
import { DOCUMENT_CATEGORIES, categoryLabels } from '@/lib/dms';
import { useCreateDocument, useCreateFolder, useFolders } from '@/hooks/use-dms';
import { useDmsStore } from '@/store/dms-store';
import type { DocumentCategory } from '@prisma/client';

type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

export function UploadDocumentModal() {
  const open = useDmsStore((state) => state.uploadModalOpen);
  const setOpen = useDmsStore((state) => state.setUploadModalOpen);
  const activeFolderId = useDmsStore((state) => state.activeFolderId);
  const { data: foldersData, refetch: refetchFolders } = useFolders(activeFolderId);
  const flatFolders = foldersData?.pages.flatMap((p) => p.data) || [];
  const createDocument = useCreateDocument();
  const createFolder = useCreateFolder(activeFolderId);

  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | null>(null);
  
  // Folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [folderName, setFolderName] = React.useState('');

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: 'OPERATIONS' as DocumentCategory,
    folderId: activeFolderId || '',
  });

  // Keep form in sync when activeFolderId changes
  React.useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, folderId: activeFolderId || '' }));
    }
  }, [activeFolderId, open]);

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
      setForm((current) => ({ ...current, title: current.title || file.name }));
      toast.success('File uploaded successfully');
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  function reset() {
    setUploadedFile(null);
    setForm({ title: '', description: '', category: 'OPERATIONS', folderId: activeFolderId || '' });
    setFolderName('');
    setIsCreatingFolder(false);
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    try {
      const response = await createFolder.mutateAsync({ name: folderName.trim(), parentId: activeFolderId });
      await refetchFolders();
      setForm((current) => ({ ...current, folderId: response.data.id }));
      toast.success('Folder created successfully');
      setFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      toast.error('Failed to create folder');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadedFile) return;

    try {
      await createDocument.mutateAsync({
        title: form.title || uploadedFile.name,
        description: form.description || null,
        category: form.category,
        folderId: form.folderId || null,
        fileUrl: uploadedFile.url,
        fileKey: uploadedFile.key,
        mimeType: uploadedFile.type || 'application/octet-stream',
        size: uploadedFile.size,
      });
      toast.success('Document saved successfully');
      reset();
      setOpen(false);
    } catch (error) {
      toast.error('Failed to save document');
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
      title="Upload document"
      size="xl"
      disableOutsideClick
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Title</label>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Board minutes, employee handbook, vendor agreement"
            className="focus-visible:ring-0 focus-visible:border-primary/70"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70"
            placeholder="Optional context for teammates"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              id="category"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as DocumentCategory,
                }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70"
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="folder" className="mb-1.5 block text-sm font-medium">Folder</label>
            {!isCreatingFolder ? (
              <select
                id="folder"
                value={form.folderId === 'CREATE_NEW' ? '' : form.folderId}
                onChange={(event) => {
                  if (event.target.value === 'CREATE_NEW') {
                    setIsCreatingFolder(true);
                  } else {
                    setForm((current) => ({ ...current, folderId: event.target.value }));
                  }
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70"
              >
                <option value="">No folder (Root)</option>
                <option value="CREATE_NEW" className="font-semibold text-primary">+ Create new folder</option>
                {flatFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={folderName}
                  onChange={(event) => setFolderName(event.target.value)}
                  placeholder="New folder name"
                  className="focus-visible:ring-0 focus-visible:border-primary/70"
                />
                <Button 
                  type="button" 
                  onClick={handleCreateFolder}
                  disabled={createFolder.isPending || !folderName.trim()}
                >
                  {createFolder.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setFolderName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
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
                  Ready to save ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
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
                <p className="font-medium text-foreground">Select a file to upload</p>
                <p className="text-sm text-muted-foreground">PDF, Word, Excel, Images up to 16MB</p>
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

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!uploadedFile || createDocument.isPending}>
            {createDocument.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save document
          </Button>
        </div>
      </form>
    </Modal>
  );
}
