'use client';

import * as React from 'react';
import { DocumentList } from '@/components/document-list';
import { PaginationControls } from '@/components/pagination-controls';
import { Loader } from '@/components/ui/loader';
import { useDocumentsPage } from '@/hooks/use-dms';

export function DashboardRecentUploads() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useDocumentsPage({
    recent: true,
    take: 15,
    page,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  if (isLoading) {
    return <Loader text="Loading recent uploads..." />;
  }

  return (
    <div className="space-y-4">
      <DocumentList documents={data?.data || []} emptyText="No documents have been uploaded yet." />
      {data && <PaginationControls meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
