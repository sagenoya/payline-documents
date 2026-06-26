'use client';

import * as React from 'react';
import { Download, Eye, FileInput, FilePlus, FolderInput, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import { useActivityPage } from '@/hooks/use-dms';
import { formatDateTime } from '@/lib/formatters';
import { Loader } from '@/components/ui/loader';
import type { ActivityFilter } from '@/types/dms';

const activityFilterLabels: Array<{ value: ActivityFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'views', label: 'Views' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'uploads', label: 'Uploads' },
  { value: 'deletes', label: 'Deletes' },
];

// Filters that surface restricted actions — only shown to activity viewers.
const restrictedFilters = new Set<ActivityFilter>(['views', 'downloads', 'deletes']);

export function RecentActivity({
  take = 15,
  showFilters = false,
  canViewRestricted = false,
}: {
  take?: number;
  showFilters?: boolean;
  canViewRestricted?: boolean;
}) {
  const visibleFilters = canViewRestricted
    ? activityFilterLabels
    : activityFilterLabels.filter((item) => !restrictedFilters.has(item.value));
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState<ActivityFilter>('all');
  const { data, isLoading, isFetching } = useActivityPage(take, page, filter);

  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  if (isLoading) {
    return <Loader text="Loading activity..." />;
  }

  const activity = data?.data || [];

  if (!activity.length) {
    return (
      <div className="space-y-3">
        {showFilters && (
          <ActivityFilterControl value={filter} onChange={setFilter} filters={visibleFilters} />
        )}
        <div className="rounded-lg border border-dashed bg-background p-8 text-center">
          <p>{filter === 'all' ? 'No document activity yet.' : 'No activity matches this filter.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <ActivityFilterControl value={filter} onChange={setFilter} filters={visibleFilters} />
      )}
      <div className="divide-y rounded-lg border bg-background">
        {activity.map((item) => {
          let Icon = Eye;
          let actionText = 'viewed';
          let targetName = item.targetName || item.document?.title || item.folder?.name || 'unknown item';

          if (item.action === 'DOWNLOAD') {
            Icon = Download;
            actionText = 'downloaded';
          } else if (item.action === 'CREATE_DOC') {
            Icon = FilePlus;
            actionText = 'uploaded';
          } else if (item.action === 'EDIT_DOC') {
            Icon = Pencil;
            actionText = 'edited';
          } else if (item.action === 'MOVE_DOC') {
            Icon = FileInput;
            actionText = 'moved';
          } else if (item.action === 'DELETE_DOC') {
            Icon = Trash2;
            actionText = 'deleted';
          } else if (item.action === 'CREATE_FOLDER') {
            Icon = FolderPlus;
            actionText = 'created folder';
          } else if (item.action === 'MOVE_FOLDER') {
            Icon = FolderInput;
            actionText = 'moved folder';
          } else if (item.action === 'DELETE_FOLDER') {
            Icon = Trash2;
            actionText = 'deleted folder';
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
                  {item.document?.folder?.name && (
                    <span className="text-muted-foreground"> in {item.document.folder.name}</span>
                  )}
                </p>
                <small>{formatDateTime(item.timestamp)}</small>
              </div>
            </div>
          );
        })}
      </div>
      {data && <PaginationControls meta={data.meta} onPageChange={setPage} />}
      {isFetching && <p className="text-sm text-muted-foreground">Refreshing activity...</p>}
    </div>
  );
}

function ActivityFilterControl({
  value,
  onChange,
  filters,
}: {
  value: ActivityFilter;
  onChange: (value: ActivityFilter) => void;
  filters: Array<{ value: ActivityFilter; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`rounded-md border px-3 py-1.5 text-sm transition ${
            value === item.value
              ? 'border-primary bg-brand-subtle text-primary'
              : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
