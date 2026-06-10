'use client';

import * as React from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateFolder } from '@/hooks/use-dms';

export function CreateFolderButton({ 
  parentId, 
  parentName 
}: { 
  parentId: string | null;
  parentName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  
  const createFolder = useCreateFolder(parentId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      await createFolder.mutateAsync({ name: name.trim(), parentId });
      toast.success('Folder created successfully');
      setOpen(false);
      setName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <FolderPlus className="size-4" />
        {parentName ? `New Folder in ${parentName}` : 'New Folder'}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Create New Folder"
        description="Organize your documents with folders."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folder-name" className="mb-1.5 block text-sm font-medium">Folder Name</label>
            <Input
              id="folder-name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Financials"
              className="focus-visible:ring-0 focus-visible:border-foreground/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFolder.isPending || !name.trim()}>
              {createFolder.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
