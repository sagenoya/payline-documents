'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FolderGrid } from '@/components/folder-grid';
import { DocumentList } from '@/components/document-list';
import { PaginationControls } from '@/components/pagination-controls';
import { CreateFolderButton } from '@/components/create-folder-button';
import { Button } from '@/components/ui/button';
import { useDocumentsPage, useFoldersPage } from '@/hooks/use-dms';
import { Loader } from '@/components/ui/loader';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export function FoldersPageClient() {
  const [search, setSearch] = React.useState('');
  const [folderPage, setFolderPage] = React.useState(1);
  const [documentPage, setDocumentPage] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const {
    data: foldersData,
    isLoading: foldersLoading,
  } = useFoldersPage(null, folderPage, 15);
  const {
    data: documentsData,
    isLoading: documentsLoading,
  } = useDocumentsPage({
    recent: true,
    take: 15,
    page: documentPage,
    search: debouncedSearch || undefined,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  React.useEffect(() => {
    setDocumentPage(1);
  }, [debouncedSearch]);

  const filteredFolders = React.useMemo(() => {
    const folders = foldersData?.data || [];
    if (!search.trim()) return folders;
    const lower = search.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(lower));
  }, [foldersData?.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Folders</h1>
          <p className="mt-1">Open a folder to see nested folders and grouped documents.</p>
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
          {search && (
            <Button type="button" variant="outline" onClick={() => setSearch('')}>
              Clear
            </Button>
          )}
          <CreateFolderButton parentId={null} />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base">Top-level folders</h2>
        {foldersLoading ? (
          <Loader text="Loading folders..." />
        ) : (
          <div className="space-y-4">
            <FolderGrid folders={filteredFolders} />
            {foldersData && <PaginationControls meta={foldersData.meta} onPageChange={setFolderPage} />}
          </div>
        )}
        {!foldersLoading && !filteredFolders.length && (
          <div className="rounded-lg border border-dashed bg-background p-8 text-center">
            <p>{search ? 'No folders match your filter.' : 'No folders yet. Uploaders can create folders from the upload modal.'}</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base">Recent documents</h2>
        {documentsLoading ? (
          <Loader text="Loading documents..." />
        ) : (
          <div className="space-y-4">
            <DocumentList documents={documentsData?.data || []} emptyText={search ? 'No documents match your filter.' : 'No recent documents yet.'} />
            {documentsData && <PaginationControls meta={documentsData.meta} onPageChange={setDocumentPage} />}
          </div>
        )}
      </section>
    </div>
  );
}
