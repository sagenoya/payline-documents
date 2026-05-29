'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types/dms';

function getPages(current: number, total: number) {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}

export function PaginationControls<T>({
  meta,
  onPageChange,
}: {
  meta: Paginated<T>['meta'];
  onPageChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;

  const pages = getPages(meta.page, meta.totalPages);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          const showGap = previous && page - previous > 1;

          return (
            <span key={page} className="flex items-center gap-1">
              {showGap && <span className="px-1 text-sm text-muted-foreground">...</span>}
              <Button
                type="button"
                variant={page === meta.page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-current={page === meta.page ? 'page' : undefined}
              >
                {page}
              </Button>
            </span>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!meta.hasMore}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
