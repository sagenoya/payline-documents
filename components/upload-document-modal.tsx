'use client';

import * as React from 'react';
import { Loader2, CheckCircle2, Lock, UploadCloud, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CascadingFolderSelect } from '@/components/cascading-folder-select';
import { useUploadThing } from '@/lib/uploadthing';
import { useCategories, useCreateCategory, useCreateDocument, useCreateFolder, useAllFolders, useProfile, useUsers } from '@/hooks/use-dms';
import { useDmsStore } from '@/store/dms-store';

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
  const pendingDropFiles = useDmsStore((state) => state.pendingDropFiles);
  const setPendingDropFiles = useDmsStore((state) => state.setPendingDropFiles);
  const { data: allFolders = [], refetch: refetchFolders } = useAllFolders({ enabled: open });
  const { data: categories = [] } = useCategories({ enabled: open });
  const { data: teamMembers = [] } = useUsers();
  const { data: currentUser } = useProfile();
  const createDocument = useCreateDocument();
  const createFolder = useCreateFolder(activeFolderId);
  const createCategory = useCreateCategory();

  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Per-document allow list: teammates who may always open/download the file(s).
  const [allowedUserIds, setAllowedUserIds] = React.useState<string[]>([]);
  const selectableMembers = teamMembers.filter((member) => member.id !== currentUser?.id);

  function toggleAllowedUser(id: string) {
    setAllowedUserIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id],
    );
  }

  // Folder creation state
  const [creatingParentId, setCreatingParentId] = React.useState<string | null | undefined>(undefined);
  const [folderName, setFolderName] = React.useState('');

  // Inline category creation
  const [creatingCategory, setCreatingCategory] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: '',
    folderId: activeFolderId || '',
    isSensitive: false,
  });

  // Default the category to the first available one once loaded
  React.useEffect(() => {
    if (open && !form.category && categories.length) {
      setForm((f) => ({ ...f, category: categories[0].name }));
    }
  }, [open, categories, form.category]);

  async function handleCreateCategory() {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const response = await createCategory.mutateAsync(name);
      setForm((f) => ({ ...f, category: response.data.name }));
      setNewCategory('');
      setCreatingCategory(false);
      toast.success('Category created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  }

  // Keep form in sync when activeFolderId changes
  React.useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, folderId: activeFolderId || '' }));
    }
  }, [activeFolderId, open]);

  // Auto-upload dropped files when modal opens with pending files
  const startUploadRef = React.useRef<((files: File[]) => void) | null>(null);

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

  // Keep ref in sync so drag-and-drop effect can call it
  startUploadRef.current = startUpload;

  const dragUploadTriggered = React.useRef(false);

  // Trigger upload for files dropped before modal opened
  React.useEffect(() => {
    if (open && pendingDropFiles.length > 0 && !isUploading && !dragUploadTriggered.current) {
      dragUploadTriggered.current = true;
      const filesToUpload = pendingDropFiles.slice(0, 6);
      startUpload(filesToUpload);
      setPendingDropFiles([]);
    }
  }, [open, pendingDropFiles, isUploading, startUpload, setPendingDropFiles]);

  // Reset the trigger guard when modal closes
  React.useEffect(() => {
    if (!open) {
      dragUploadTriggered.current = false;
    }
  }, [open]);

  function reset() {
    setUploadedFiles([]);
    setUploadProgress(0);
    setAllowedUserIds([]);
    setForm({ title: '', description: '', category: categories[0]?.name || '', folderId: activeFolderId || '', isSensitive: false });
    setFolderName('');
    setCreatingParentId(undefined);
    setCreatingCategory(false);
    setNewCategory('');
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
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
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
            isSensitive: form.isSensitive,
            allowedUserIds,
          })
        )
      );
      toast.success(`Saved ${uploadedFiles.length} document(s) successfully`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save document(s)');
    }
  }

  const isSubmitDisabled =
    uploadedFiles.length === 0 ||
    !form.folderId ||
    !form.category ||
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
            {creatingCategory ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  placeholder="New category name"
                  className="focus-visible:ring-0 focus-visible:border-foreground/30"
                />
                <Button type="button" size="sm" onClick={handleCreateCategory} disabled={createCategory.isPending}>
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreatingCategory(false);
                    setNewCategory('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <select
                id="category"
                value={form.category}
                onChange={(event) => {
                  if (event.target.value === '__new__') {
                    setCreatingCategory(true);
                    return;
                  }
                  setForm((current) => ({ ...current, category: event.target.value }));
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
              >
                {categories.length === 0 && <option value="">No categories yet</option>}
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value="__new__">+ Create new category…</option>
              </select>
            )}
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

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-4">
          <input
            type="checkbox"
            checked={form.isSensitive}
            onChange={(event) => {
              setForm((current) => ({ ...current, isSensitive: event.target.checked }));
              if (!event.target.checked) setAllowedUserIds([]);
            }}
            className="mt-0.5 size-4 accent-red-600"
          />
          <span className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Lock className="size-3.5 text-red-600" />
              Mark as sensitive
            </span>
            <span className="block text-xs text-muted-foreground">
              The document stays visible to everyone but stays locked. Teammates must request
              access from you, and only people on your{' '}
              <a href="/settings" className="underline hover:text-foreground">trusted list</a> can open it without asking.
            </span>
          </span>
        </label>

        {form.isSensitive && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Users className="size-3.5 text-primary" />
              Allow list
            </span>
            {selectableMembers.length > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() =>
                  setAllowedUserIds(
                    allowedUserIds.length === selectableMembers.length
                      ? []
                      : selectableMembers.map((member) => member.id),
                  )
                }
              >
                {allowedUserIds.length === selectableMembers.length ? 'Clear all' : 'Select all'}
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Anyone you tick can always open and download this document — even when it sits in a
            sensitive folder. They still won&apos;t see the rest of that folder.
          </p>
          <div className="mt-3 max-h-44 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
            {selectableMembers.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No other team members yet.
              </p>
            ) : (
              selectableMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={allowedUserIds.includes(member.id)}
                    onChange={() => toggleAllowedUser(member.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{member.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
        )}

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
