'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DocumentList } from '@/components/document-list';
import { FolderGrid } from '@/components/folder-grid';
import { PaginationControls } from '@/components/pagination-controls';
import { CreateFolderButton } from '@/components/create-folder-button';
import { useDocumentsPage, useFolder } from '@/hooks/use-dms';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Loader } from '@/components/ui/loader';

export function FolderDetailClient({ folderId }: { folderId: string }) {
  const { data: folder, isLoading } = useFolder(folderId);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
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

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>{folder.name}</h1>
          <p className="mt-1">Nested folders and documents in this workspace.</p>
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
