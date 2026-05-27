'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { DocumentList } from '@/components/document-list';
import { Input } from '@/components/ui/input';
import { useDocuments } from '@/hooks/use-dms';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { DOCUMENT_CATEGORIES, categoryLabels } from '@/lib/dms';

import { Loader } from '@/components/ui/loader';

export function DocumentsPageClient() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDocuments({
    search: debouncedSearch || undefined,
    category: category || undefined,
  });

  const flatDocuments = data?.pages.flatMap((p) => p.data) || [];

  return (
    <div className="space-y-5">
      <div>
        <h1>Documents</h1>
        <p className="mt-1">Browse company documents across HR, Finance, Legal, Operations, and Engineering.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents, descriptions, or uploaders"
            className="pl-9 focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
        >
          <option value="">All categories</option>
          {DOCUMENT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {categoryLabels[item]}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Loader text="Loading documents..." />
      ) : (
        <div className="space-y-4">
          <DocumentList documents={flatDocuments} />
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
