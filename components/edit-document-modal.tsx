'use client';

import * as React from 'react';
import { Loader2, CheckCircle2, Lock, UploadCloud, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CascadingFolderSelect } from '@/components/cascading-folder-select';
import { useUploadThing } from '@/lib/uploadthing';
import { useDmsStore } from '@/store/dms-store';
import {
  useCategories,
  useProfile,
  useUpdateDocument,
  useAllFolders,
  useUsers,
  useDocumentAccessList,
} from '@/hooks/use-dms';

type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

export function EditDocumentModal() {
  const { editingDocument, setEditingDocument } = useDmsStore();
  const isOpen = !!editingDocument;
  const { data: allFolders = [] } = useAllFolders({ enabled: isOpen });
  const { data: categories = [] } = useCategories({ enabled: isOpen });
  const { data: profile } = useProfile();
  const { data: teamMembers = [] } = useUsers();
  const updateDocument = useUpdateDocument();
  const canToggleSensitive = Boolean(
    profile && (profile.isAdmin || editingDocument?.uploadedById === profile.id),
  );

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [folderId, setFolderId] = React.useState<string | null>(null);
  const [isSensitive, setIsSensitive] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | null>(null);

  // Per-document allow list: teammates who may always open/download the file.
  const [allowedUserIds, setAllowedUserIds] = React.useState<string[]>([]);
  const selectableMembers = teamMembers.filter((member) => member.id !== editingDocument?.uploadedById);

  // Pull the document's saved allow list (only meaningful while it's sensitive).
  const { data: accessList } = useDocumentAccessList(editingDocument?.id ?? '', {
    enabled: isOpen && Boolean(editingDocument?.isSensitive),
  });

  function toggleAllowedUser(id: string) {
    setAllowedUserIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id],
    );
  }

  React.useEffect(() => {
    if (editingDocument) {
      setTitle(editingDocument.title);
      setDescription(editingDocument.description || '');
      setCategory(editingDocument.category);
      setFolderId(editingDocument.folderId || null);
      setIsSensitive(Boolean(editingDocument.isSensitive));
      setUploadedFile(null); // Reset when a new document is selected
      setAllowedUserIds([]);
    }
  }, [editingDocument]);

  // Pre-tick the people already on the saved allow list.
  React.useEffect(() => {
    if (accessList?.scope === 'allow-list') {
      setAllowedUserIds(accessList.members.map((member) => member.id));
    }
  }, [accessList]);

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
    if (!editingDocument) return;

    try {
      await updateDocument.mutateAsync({
        id: editingDocument.id,
        data: {
          title,
          description: description || null,
          category,
          folderId,
          isSensitive,
          allowedUserIds: isSensitive ? allowedUserIds : [],
          ...(uploadedFile && {
            fileUrl: uploadedFile.url,
            fileKey: uploadedFile.key,
            mimeType: uploadedFile.type,
            size: uploadedFile.size,
          }),
        },
      });

      toast.success('Document updated successfully');
      setEditingDocument(null);
    } catch (error) {
      toast.error('Failed to update document');
    }
  }

  const close = () => setEditingDocument(null);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => !o && close()}
      title="Edit or move document"
      description="Update document details, replace the file, or move it to another folder."
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
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-category" className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
            >
              {/* Preserve the document's current category even if it was renamed/removed from the catalog */}
              {category && !categories.some((c) => c.name === category) && (
                <option value={category}>{category}</option>
              )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-folder" className="mb-1.5 block text-sm font-medium">Move to folder</label>
              <CascadingFolderSelect
                folders={allFolders}
                value={folderId}
                onChange={(newId) => setFolderId(newId)}
              />
          </div>
        </div>

        <label className={`flex items-start gap-3 rounded-lg border bg-muted/20 p-4 ${canToggleSensitive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
          <input
            type="checkbox"
            checked={isSensitive}
            disabled={!canToggleSensitive}
            onChange={(e) => {
              setIsSensitive(e.target.checked);
              if (!e.target.checked) setAllowedUserIds([]);
            }}
            className="mt-0.5 size-4 accent-red-600"
          />
          <span className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Lock className="size-3.5 text-red-600" />
              Mark as sensitive
            </span>
            <span className="block text-xs text-muted-foreground">
              When on, teammates must request access; only people on your trusted list can open it
              without asking. Uncheck to make it openable by everyone again.
            </span>
          </span>
        </label>

        {isSensitive && (
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
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
