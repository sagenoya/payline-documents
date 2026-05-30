'use client';

import * as React from 'react';
import { Loader2, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CascadingFolderSelect } from '@/components/cascading-folder-select';
import { useUploadThing } from '@/lib/uploadthing';
import { DOCUMENT_CATEGORIES, categoryLabels } from '@/lib/dms';
import { useCreateDocument, useCreateFolder, useAllFolders } from '@/hooks/use-dms';
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
  const { data: allFolders = [], refetch: refetchFolders } = useAllFolders({ enabled: open });
  const createDocument = useCreateDocument();
  const createFolder = useCreateFolder(activeFolderId);

  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  
  // Folder creation state
  const [creatingParentId, setCreatingParentId] = React.useState<string | null | undefined>(undefined);
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
      if (!files?.length) return;
      const uploaded = files.map((file) => ({
        url: file.ufsUrl || file.url,
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      }));
      setUploadedFiles((prev) => {
        const filteredNew = uploaded.filter((newF) => !prev.some((oldF) => oldF.key === newF.key));
        const combined = [...prev, ...filteredNew];
        if (combined.length === 1) {
          setForm((current) => ({ ...current, title: current.title || combined[0].name }));
        }
        return combined;
      });
      setUploadProgress(100);
      toast.success(`Successfully uploaded ${files.length} file(s)`);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onUploadError: (error) => {
      setUploadProgress(0);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  function reset() {
    setUploadedFiles([]);
    setUploadProgress(0);
    setForm({ title: '', description: '', category: 'OPERATIONS', folderId: activeFolderId || '' });
    setFolderName('');
    setCreatingParentId(undefined);
  }

  async function handleCreateFolder(parentId: string | null) {
    if (!folderName.trim()) return;
    try {
      const response = await createFolder.mutateAsync({ name: folderName.trim(), parentId });
      await refetchFolders();
      setForm((current) => ({ ...current, folderId: response.data.id }));
      toast.success('Folder created successfully');
      setFolderName('');
      setCreatingParentId(undefined);
    } catch (error) {
      toast.error('Failed to create folder');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadedFiles.length === 0) return;

    try {
      await Promise.all(
        uploadedFiles.map((file) =>
          createDocument.mutateAsync({
            title: uploadedFiles.length === 1 && form.title.trim() ? form.title.trim() : file.name,
            description: form.description || null,
            category: form.category,
            folderId: form.folderId || null,
            fileUrl: file.url,
            fileKey: file.key,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
          })
        )
      );
      toast.success(`Saved ${uploadedFiles.length} document(s) successfully`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error('Failed to save document(s)');
    }
  }

  const isSubmitDisabled =
    uploadedFiles.length === 0 ||
    !form.folderId ||
    (uploadedFiles.length === 1 && !form.title.trim()) ||
    createDocument.isPending;

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
          <div className="flex items-center justify-between">
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Title</label>
            {uploadedFiles.length > 1 && (
              <span className="text-xs text-muted-foreground mb-1.5">(Note: File title in bulk files uses file names)</span>
            )}
          </div>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder={uploadedFiles.length > 1 ? "File title in bulk files uses file names" : "Board minutes, employee handbook, vendor agreement"}
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
            disabled={uploadedFiles.length > 1}
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
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
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
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
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
            <CascadingFolderSelect
              folders={allFolders}
              value={form.folderId || null}
              onChange={(newId) => setForm((c) => ({ ...c, folderId: newId || '' }))}
              creatingParentId={creatingParentId}
              createFolderName={folderName}
              isCreatingFolder={createFolder.isPending}
              onStartCreate={(parentId) => {
                setCreatingParentId(parentId);
                setFolderName('');
              }}
              onCancelCreate={() => {
                setCreatingParentId(undefined);
                setFolderName('');
              }}
              onCreateFolderNameChange={setFolderName}
              onCreateFolder={handleCreateFolder}
            />
          </div>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center transition-colors">
          {uploadedFiles.length > 0 ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="w-full max-w-md">
                <p className="font-medium text-foreground">{uploadedFiles.length} file(s) uploaded successfully</p>
                <ul className="mt-2 text-xs text-muted-foreground divide-y border rounded bg-background p-2 text-left max-h-36 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <li key={file.key} className="py-1 flex justify-between gap-2 items-center">
                      <span className="truncate font-medium">{file.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px]">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded hover:bg-muted"
                          onClick={() => setUploadedFiles((prev) => prev.filter((f) => f.key !== file.key))}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  type="button" 
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                  className="relative overflow-hidden"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Add files'
                  )}
                  {!isUploading && (
                    <input 
                      type="file" 
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const currentCount = uploadedFiles.length;
                          const remainingCount = 6 - currentCount;
                          if (remainingCount <= 0) {
                            toast.error('You can only upload up to 6 files at a time. Please remove some first.');
                            return;
                          }
                          const filesToUpload = files.slice(0, remainingCount);
                          if (files.length > remainingCount) {
                            toast.warning(`Only the first ${remainingCount} file(s) will be uploaded to keep the total under 6.`);
                          }
                          startUpload(filesToUpload);
                        }
                      }} 
                    />
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setUploadedFiles([])}
                >
                  Clear all
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-subtle text-primary">
                <UploadCloud className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Select files to upload</p>
                <p className="text-sm text-muted-foreground">PDF, Word, Excel, Images (up to 6 files, max 16MB each)</p>
              </div>
              <Button 
                type="button" 
                disabled={isUploading}
                className="mt-2 relative overflow-hidden"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Uploading {Math.max(1, Math.round(uploadProgress))}%
                  </>
                ) : (
                  'Browse files'
                )}
                {!isUploading && (
                  <input 
                    type="file" 
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const currentCount = uploadedFiles.length;
                        const remainingCount = 6 - currentCount;
                        if (remainingCount <= 0) {
                          toast.error('You can only upload up to 6 files at a time. Please remove some first.');
                          return;
                        }
                        const filesToUpload = files.slice(0, remainingCount);
                        if (files.length > remainingCount) {
                          toast.warning(`Only the first ${remainingCount} file(s) will be uploaded to keep the total under 6.`);
                        }
                        startUpload(filesToUpload);
                      }
                    }} 
                  />
                )}
              </Button>
              {isUploading && (
                <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(4, uploadProgress)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitDisabled}>
            {createDocument.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save {uploadedFiles.length > 1 ? `${uploadedFiles.length} documents` : 'document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
