'use client';

import * as React from 'react';
import type { FolderSummary } from '@/types/dms';

type Props = {
  folders: Pick<FolderSummary, 'id' | 'name' | 'parentId'>[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  disabled?: boolean;
};

export function CascadingFolderSelect({ folders, value, onChange, disabled }: Props) {
  const path = React.useMemo(() => {
    const p: string[] = [];
    let curr = value;
    while (curr) {
      p.unshift(curr);
      curr = folders.find((f) => f.id === curr)?.parentId || null;
    }
    return p;
  }, [value, folders]);

  const dropdownsToRender = React.useMemo(() => {
    const list = [null, ...path];
    return list.filter((parentId) => parentId === null || folders.some((f) => f.parentId === parentId));
  }, [path, folders]);

  return (
    <div className="space-y-2">
      {dropdownsToRender.map((parentId, index) => {
        const levelFolders = folders.filter((f) => f.parentId === parentId);
        // The currently selected value for THIS dropdown is the item in the path at the same index
        const selectedValue = path[index] || '';

        return (
          <div key={parentId || 'root'} className="relative">
            <select
              disabled={disabled}
              value={selectedValue}
              onChange={(e) => {
                const newId = e.target.value;
                if (!newId) {
                  // If they select "None", the new value becomes the parentId of this level
                  onChange(parentId);
                } else {
                  onChange(newId);
                }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-primary/70 disabled:opacity-50"
            >
              <option value="">
                {parentId === null ? 'No folder (Root)' : '-- None --'}
              </option>
              {levelFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
