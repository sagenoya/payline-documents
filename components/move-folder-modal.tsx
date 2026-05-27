'use client';

import * as React from 'react';
import { FolderInput, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CascadingFolderSelect } from '@/components/cascading-folder-select';
import { useAllFolders, useUpdateFolder } from '@/hooks/use-dms';
import type { FolderSummary } from '@/types/dms';

type MoveFolderModalProps = {
  folder: FolderSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getDescendantIds(
  folders: Pick<FolderSummary, 'id' | 'parentId'>[],
  folderId: string,
) {
  const result = new Set<string>();
  const queue = [folderId];

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId) continue;

    for (const folder of folders) {
      if (folder.parentId === currentId && !result.has(folder.id)) {
        result.add(folder.id);
        queue.push(folder.id);
      }
    }
  }

  return result;
}

export function MoveFolderModal({ folder, open, onOpenChange }: MoveFolderModalProps) {
  const { data: allFolders = [] } = useAllFolders({ enabled: open });
  const updateFolder = useUpdateFolder();
  const [parentId, setParentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setParentId(folder?.parentId || null);
  }, [folder]);

  const availableFolders = React.useMemo(() => {
    if (!folder) return allFolders;

    const blockedIds = getDescendantIds(allFolders, folder.id);
    blockedIds.add(folder.id);

    return allFolders.filter((item) => !blockedIds.has(item.id));
  }, [allFolders, folder]);

  async function handleMove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!folder) return;

    try {
      await updateFolder.mutateAsync({
        id: folder.id,
        data: { parentId },
      });
      toast.success('Folder moved');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move folder');
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Move folder"
      description={folder ? `Choose a new location for ${folder.name}.` : undefined}
      size="lg"
      disableOutsideClick
    >
      <form onSubmit={handleMove} className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-background text-primary">
              <FolderInput className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{folder?.name}</p>
              <small>Move to root or another folder</small>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Destination</label>
          <CascadingFolderSelect
            folders={availableFolders}
            value={parentId}
            onChange={setParentId}
            disabled={updateFolder.isPending}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateFolder.isPending || !folder}>
            {updateFolder.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Move folder
          </Button>
        </div>
      </form>
    </Modal>
  );
}
