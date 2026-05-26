import Link from 'next/link';
import { Folder } from 'lucide-react';
import type { FolderSummary } from '@/types/dms';

export function FolderGrid({ folders }: { folders: FolderSummary[] }) {
  if (!folders.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {folders.map((folder) => (
        <Link
          key={folder.id}
          href={`/folders/${folder.id}`}
          className="flex items-center gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/50 hover:bg-brand-subtle"
        >
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-primary">
            <Folder className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{folder.name}</p>
            {folder._count && (
              <small>
                {folder._count.documents} docs · {folder._count.children} folders
              </small>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
