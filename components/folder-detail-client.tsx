'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Lock, LockOpen, Search, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DocumentList } from '@/components/document-list';
import { FolderGrid } from '@/components/folder-grid';
import { PaginationControls } from '@/components/pagination-controls';
import { CreateFolderButton } from '@/components/create-folder-button';
import { RequestAccessModal } from '@/components/request-access-modal';
import { useDocumentsPage, useFolder, useProfile, useSetFolderSensitive } from '@/hooks/use-dms';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Loader } from '@/components/ui/loader';
import { useDmsStore } from '@/store/dms-store';

export function FolderDetailClient({ folderId }: { folderId: string }) {
  const { data: folder, isLoading } = useFolder(folderId);
  const { data: profile } = useProfile();
  const setFolderSensitive = useSetFolderSensitive();
  const setActiveFolderId = useDmsStore((s) => s.setActiveFolderId);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [requestOpen, setRequestOpen] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const {
    data: documentsData,
    isLoading: documentsLoading,
  } = useDocumentsPage({
    folderId,
    search: debouncedSearch || undefined,
    take: 15,
    page,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
  });

  // Sync the active folder so drag-and-drop + upload modal auto-select it
  React.useEffect(() => {
    setActiveFolderId(folderId);
    return () => setActiveFolderId(null);
  }, [folderId, setActiveFolderId]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, folderId]);

  const filteredFolders = React.useMemo(() => {
    if (!folder?.children) return [];
    if (!search.trim()) return folder.children;
    const lower = search.toLowerCase();
    return folder.children.filter((f) => f.name.toLowerCase().includes(lower));
  }, [folder?.children, search]);

  if (isLoading) {
    return <Loader text="Loading folder..." />;
  }

  if (!folder) {
    return <p>Folder not found.</p>;
  }

  const canManageSensitive =
    Boolean(profile) && (profile!.isAdmin || folder.createdById === profile!.id);

  const breadcrumbsNav = (
    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <Link href="/folders" className="inline-flex items-center gap-1 hover:text-foreground">
        <Home className="size-4" />
        Folders
      </Link>
      {folder.breadcrumbs.map((crumb) => (
        <span key={crumb.id} className="inline-flex items-center gap-1">
          <ChevronRight className="size-4" />
          <Link href={`/folders/${crumb.id}`} className="hover:text-foreground">
            {crumb.name}
          </Link>
        </span>
      ))}
    </div>
  );

  async function toggleSensitive() {
    if (!folder) return;
    try {
      await setFolderSensitive.mutateAsync({ id: folder.id, isSensitive: !folder.isSensitive });
      toast.success(folder.isSensitive ? 'Folder unmarked' : 'Folder marked sensitive');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update folder');
    }
  }

  if (folder.locked) {
    return (
      <div className="space-y-6">
        {breadcrumbsNav}
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-background p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <Lock className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">“{folder.name}” is restricted</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This folder is marked sensitive. Request access
              {folder.lockOwnerName ? ` from ${folder.lockOwnerName}` : ''} to view its contents.
              Approved access lasts 2 hours.
            </p>
          </div>
          <Button
            onClick={() => setRequestOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Lock className="mr-1.5 size-4" />
            Request access
          </Button>
        </div>
        <RequestAccessModal
          target={{
            kind: 'FOLDER',
            id: folder.lockTargetId ?? folder.id,
            name: folder.lockTargetName ?? folder.name,
            ownerName: folder.lockOwnerName,
          }}
          open={requestOpen}
          onOpenChange={setRequestOpen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {breadcrumbsNav}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 capitalize">
            {folder.name}
            {canManageSensitive && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={folder.isSensitive ? 'Unmark folder as sensitive' : 'Mark folder as sensitive'}
                disabled={setFolderSensitive.isPending}
                onClick={toggleSensitive}
              >
                {folder.isSensitive ? (
                  <LockOpen className="size-4 text-red-600" />
                ) : (
                  <Lock className="size-4" />
                )}
              </Button>
            )}
          </h1>
          <p className="mt-1">
            Nested folders and documents in this workspace.
            {folder.createdBy?.name ? (
              <span className="text-muted-foreground"> · Created by {folder.createdBy.name}</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70 flex items-center gap-1">
            <UploadCloud className="size-3" />
            Tip: Drag and drop files anywhere on this page to upload directly to this folder.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Filter folders & files..." 
              className="pl-9 focus-visible:ring-0 focus-visible:border-foreground/30" 
            />
          </div>
          <CreateFolderButton parentId={folderId} parentName={folder.name} />
        </div>
      </div>

      <FolderGrid folders={filteredFolders} />
      {documentsLoading ? (
        <Loader text="Loading documents..." />
      ) : (
        <div className="space-y-4">
          <DocumentList documents={documentsData?.data || []} emptyText={search ? 'No documents match your filter.' : 'No documents in this folder yet.'} />
          {documentsData && <PaginationControls meta={documentsData.meta} onPageChange={setPage} />}
        </div>
      )}
    </div>
  );
}
