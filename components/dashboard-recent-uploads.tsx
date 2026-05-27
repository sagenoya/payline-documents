'use client';

import { DocumentList } from '@/components/document-list';
import { Loader } from '@/components/ui/loader';
import { useDocuments } from '@/hooks/use-dms';

export function DashboardRecentUploads() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDocuments({
    recent: true,
    take: 15,
  });

  const documents = data?.pages.flatMap((page) => page.data) || [];

  if (isLoading) {
    return <Loader text="Loading recent uploads..." />;
  }

  return (
    <div className="space-y-4">
      <DocumentList documents={documents} emptyText="No documents have been uploaded yet." />
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full rounded-md border bg-muted/50 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
