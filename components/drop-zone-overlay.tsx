'use client';

import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useDmsStore } from '@/store/dms-store';
import { useProfile } from '@/hooks/use-dms';

export function DropZoneOverlay({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile();
  const setUploadModalOpen = useDmsStore((s) => s.setUploadModalOpen);
  const setPendingDropFiles = useDmsStore((s) => s.setPendingDropFiles);
  const activeFolderId = useDmsStore((s) => s.activeFolderId);

  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);

  const canUpload = profile?.canUpload ?? false;

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;

    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (!canUpload) {
      toast.error('You do not have upload access.');
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Deduplicate files by name — keep only the first occurrence
    const seen = new Set<string>();
    const uniqueFiles = droppedFiles.filter((file) => {
      if (seen.has(file.name)) return false;
      seen.add(file.name);
      return true;
    });

    const filesToUpload = uniqueFiles.slice(0, 6);
    if (uniqueFiles.length > 6) {
      toast.warning('Only the first 6 files will be uploaded.');
    }
    if (droppedFiles.length !== uniqueFiles.length) {
      toast.info('Duplicate file names were removed.');
    }

    setPendingDropFiles(filesToUpload);
    setUploadModalOpen(true);
  }

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary bg-background p-12 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Drop files to upload</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {canUpload
                  ? activeFolderId
                    ? 'Files will be uploaded to the current folder.'
                    : 'Drop up to 6 files here. Select a folder in the upload modal.'
                  : 'You do not have upload access.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
