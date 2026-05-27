'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FolderSummary } from '@/types/dms';

type Props = {
  folders: Pick<FolderSummary, 'id' | 'name' | 'parentId'>[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  disabled?: boolean;
  creatingParentId?: string | null;
  createFolderName?: string;
  isCreatingFolder?: boolean;
  onStartCreate?: (parentId: string | null) => void;
  onCancelCreate?: () => void;
  onCreateFolderNameChange?: (name: string) => void;
  onCreateFolder?: (parentId: string | null) => void;
};

export function CascadingFolderSelect({
  folders,
  value,
  onChange,
  disabled,
  creatingParentId,
  createFolderName = '',
  isCreatingFolder = false,
  onStartCreate,
  onCancelCreate,
  onCreateFolderNameChange,
  onCreateFolder,
}: Props) {
  const folderNameById = React.useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder.name]));
  }, [folders]);

  const path = React.useMemo(() => {
    const p: string[] = [];
    let curr = value;
    const seen = new Set<string>();
    while (curr && !seen.has(curr)) {
      seen.add(curr);
      p.unshift(curr);
      curr = folders.find((f) => f.id === curr)?.parentId || null;
    }
    return p;
  }, [value, folders]);

  const dropdownsToRender = React.useMemo(() => [null, ...path], [path]);

  return (
    <div className="space-y-3">
      {dropdownsToRender.map((parentId, index) => {
        const levelFolders = folders.filter((f) => f.parentId === parentId);
        const selectedValue = path[index] || '';
        const parentLabel = parentId ? folderNameById.get(parentId) || 'selected folder' : 'root';
        const showCreate = Boolean(onStartCreate && onCreateFolder && onCreateFolderNameChange);
        const isCreatingThisLevel = creatingParentId === parentId;

        return (
          <div key={parentId || 'root'} className="space-y-2">
            {(levelFolders.length > 0 || parentId === null) && (
              <select
                disabled={disabled}
                value={selectedValue}
                onChange={(e) => {
                  const newId = e.target.value;
                  onChange(newId || parentId);
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30 disabled:opacity-50"
              >
                <option value="">
                  {parentId === null ? 'No folder (Root)' : `${parentLabel} (selected)`}
                </option>
                {levelFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}

            {showCreate && (
              <div>
                {isCreatingThisLevel ? (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      value={createFolderName}
                      onChange={(event) => onCreateFolderNameChange?.(event.target.value)}
                      placeholder={`New folder inside ${parentLabel}`}
                      className="focus-visible:ring-0 focus-visible:border-foreground/30"
                    />
                    <Button
                      type="button"
                      onClick={() => onCreateFolder?.(parentId)}
                      disabled={isCreatingFolder || !createFolderName.trim()}
                    >
                      {isCreatingFolder ? <Loader2 className="size-4 animate-spin" /> : 'Create'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={onCancelCreate}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartCreate?.(parentId)}
                    className="text-sm font-semibold text-muted-foreground transition hover:text-foreground focus:outline-none"
                  >
                    + Create new folder inside {parentLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
