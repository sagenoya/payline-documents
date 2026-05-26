'use client';

import { Download, Eye, FilePlus, FolderPlus, Pencil } from 'lucide-react';
import { useActivity } from '@/hooks/use-dms';
import { formatDateTime } from '@/lib/formatters';
import { Loader } from '@/components/ui/loader';

export function RecentActivity({ take = 8 }: { take?: number }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivity(take);

  if (isLoading) {
    return <Loader text="Loading activity..." />;
  }

  const activity = data?.pages.flatMap((p) => p.data) || [];

  if (!activity.length) {
    return <p>No document activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border bg-background">
        {activity.map((item) => {
          let Icon = Eye;
          let actionText = 'viewed';
          let targetName = item.document?.title || item.folder?.name || 'unknown item';

          if (item.action === 'DOWNLOAD') {
            Icon = Download;
            actionText = 'downloaded';
          } else if (item.action === 'CREATE_DOC') {
            Icon = FilePlus;
            actionText = 'uploaded';
          } else if (item.action === 'EDIT_DOC') {
            Icon = Pencil;
            actionText = 'edited';
          } else if (item.action === 'CREATE_FOLDER') {
            Icon = FolderPlus;
            actionText = 'created folder';
          }

          return (
            <div key={item.id} className="flex items-start gap-3 p-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">
                  <span className="font-medium">{item.user.name}</span>{' '}
                  {actionText}{' '}
                  <span className="font-medium">{targetName}</span>
                </p>
                <small>{formatDateTime(item.timestamp)}</small>
              </div>
            </div>
          );
        })}
      </div>
      
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
  );
}
