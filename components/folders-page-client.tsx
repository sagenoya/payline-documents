'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FolderGrid } from '@/components/folder-grid';
import { DocumentList } from '@/components/document-list';
import { CreateFolderButton } from '@/components/create-folder-button';
import { useDocuments, useFolders } from '@/hooks/use-dms';
import { Loader } from '@/components/ui/loader';

export function FoldersPageClient() {
  const { 
    data: foldersData, 
    isLoading: foldersLoading,
    fetchNextPage: fetchNextFolders,
    hasNextPage: hasNextFolders,
    isFetchingNextPage: isFetchingFolders
  } = useFolders(null);
  
  const { 
    data: documentsData, 
    isLoading: documentsLoading,
    fetchNextPage: fetchNextDocuments,
    hasNextPage: hasNextDocuments,
    isFetchingNextPage: isFetchingDocuments
  } = useDocuments({ recent: true, take: 15 });
  
  const [search, setSearch] = React.useState('');

  const flatFolders = foldersData?.pages.flatMap((p) => p.data) || [];
  const flatDocuments = documentsData?.pages.flatMap((p) => p.data) || [];

  const filteredFolders = React.useMemo(() => {
    if (!search.trim()) return flatFolders;
    const lower = search.toLowerCase();
    return flatFolders.filter((f) => f.name.toLowerCase().includes(lower));
  }, [flatFolders, search]);

  const filteredDocuments = React.useMemo(() => {
    if (!search.trim()) return flatDocuments;
    const lower = search.toLowerCase();
    return flatDocuments.filter((d) => 
      d.title.toLowerCase().includes(lower) || 
      (d.description && d.description.toLowerCase().includes(lower))
    );
  }, [flatDocuments, search]);

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
            {hasNextFolders && (
              <button
                onClick={() => fetchNextFolders()}
                disabled={isFetchingFolders}
                className="w-full rounded-md border bg-muted/50 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isFetchingFolders ? 'Loading more...' : 'Load more'}
              </button>
            )}
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
            <DocumentList documents={filteredDocuments} />
            {hasNextDocuments && (
              <button
                onClick={() => fetchNextDocuments()}
                disabled={isFetchingDocuments}
                className="w-full rounded-md border bg-muted/50 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isFetchingDocuments ? 'Loading more...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
