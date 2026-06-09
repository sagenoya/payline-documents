'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { DocumentList } from '@/components/document-list';
import { PaginationControls } from '@/components/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useDocumentsPage, useUsers } from '@/hooks/use-dms';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { DocumentSortBy, SortDirection } from '@/types/dms';

import { Loader } from '@/components/ui/loader';

export function DocumentsPageClient() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [uploadedById, setUploadedById] = React.useState('');
  const [sortBy, setSortBy] = React.useState<DocumentSortBy>('updatedAt');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();
  const { data, isLoading, isFetching } = useDocumentsPage({
    search: debouncedSearch || undefined,
    category: category || undefined,
    uploadedById: uploadedById || undefined,
    take: 15,
    page,
    sortBy,
    sortDirection,
  });

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, uploadedById, sortBy, sortDirection]);

  const hasFilters = search || category || uploadedById || sortBy !== 'updatedAt' || sortDirection !== 'desc';

  function clearFilters() {
    setSearch('');
    setCategory('');
    setUploadedById('');
    setSortBy('updatedAt');
    setSortDirection('desc');
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1>Documents</h1>
        <p className="mt-1">Browse company documents across HR, Finance, Legal, Operations, and Engineering.</p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-background p-3 lg:grid-cols-[1fr_180px_180px_170px_150px_auto]">
        <div className="relative min-w-0">
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
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={uploadedById}
          onChange={(event) => setUploadedById(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
        >
          <option value="">All uploaders</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as DocumentSortBy)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
        >
          <option value="updatedAt">Modified</option>
          <option value="createdAt">Uploaded</option>
          <option value="title">Name</option>
          <option value="size">Size</option>
        </select>
        <select
          value={sortDirection}
          onChange={(event) => setSortDirection(event.target.value as SortDirection)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-0 focus-visible:border-foreground/30"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <Button type="button" variant="outline" disabled={!hasFilters} onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {isLoading ? (
        <Loader text="Loading documents..." />
      ) : (
        <div className="space-y-4">
          <DocumentList
            documents={data?.data || []}
            emptyText={hasFilters ? 'No documents match your filters.' : 'No documents found.'}
          />
          {data && <PaginationControls meta={data.meta} onPageChange={setPage} />}
          {isFetching && <p className="text-sm text-muted-foreground">Refreshing documents...</p>}
        </div>
      )}
    </div>
  );
}
