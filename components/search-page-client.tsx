'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { DocumentList } from '@/components/document-list';
import { PaginationControls } from '@/components/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDocumentsPage } from '@/hooks/use-dms';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Loader } from '@/components/ui/loader';

export function SearchPageClient() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const searchEnabled = debouncedSearch.length > 0;
  const { data, isLoading } = useDocumentsPage(
    { search: debouncedSearch || undefined, take: 15, page, sortBy: 'updatedAt', sortDirection: 'desc' },
    { enabled: searchEnabled },
  );

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-5">
      <div>
        <h1>Search</h1>
        <p className="mt-1">Find files by title, description, or uploader.</p>
      </div>

      <div className="flex gap-2 rounded-lg border bg-background p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Start typing to search documents"
            className="pl-9 focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>
        <Button type="button" variant="outline" disabled={!search} onClick={() => setSearch('')}>
          Clear
        </Button>
      </div>

      {searchEnabled && isLoading ? (
        <Loader text="Searching..." />
      ) : (
        <div className="space-y-4">
          <DocumentList
            documents={searchEnabled ? data?.data || [] : []}
            emptyText={search ? 'No matching documents found.' : 'Search for a document to begin.'}
          />
          {data && <PaginationControls meta={data.meta} onPageChange={setPage} />}
        </div>
      )}
    </div>
  );
}
