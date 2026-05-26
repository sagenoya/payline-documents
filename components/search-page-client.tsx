'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { DocumentList } from '@/components/document-list';
import { Input } from '@/components/ui/input';
import { useDocuments } from '@/hooks/use-dms';
import { Loader } from '@/components/ui/loader';

export function SearchPageClient() {
  const [search, setSearch] = React.useState('');
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDocuments({ search: search || undefined });

  const flatDocuments = data?.pages.flatMap((p) => p.data) || [];

  return (
    <div className="space-y-5">
      <div>
        <h1>Search</h1>
        <p className="mt-1">Find files by title, description, or uploader.</p>
      </div>

      <div className="relative rounded-lg border bg-background p-3">
        <Search className="pointer-events-none absolute left-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Start typing to search documents"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Loader text="Searching..." />
      ) : (
        <div className="space-y-4">
          <DocumentList
            documents={flatDocuments}
            emptyText={search ? 'No matching documents found.' : 'Search for a document to begin.'}
          />
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full rounded-md border bg-muted/50 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {isFetchingNextPage ? 'Loading more...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
