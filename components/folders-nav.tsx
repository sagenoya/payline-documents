'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Folder, FolderOpen, Loader2 } from 'lucide-react';
import { useDepartments } from '@/hooks/use-dms';
import { cn } from '@/lib/utils';

export function FoldersNav() {
  const pathname = usePathname();
  const onFolders = pathname.startsWith('/folders');
  const [open, setOpen] = React.useState(onFolders);

  const { data: departments, isLoading } = useDepartments({ enabled: open });

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground',
          onFolders && 'text-foreground',
        )}
      >
        <FolderOpen className="size-4" />
        <span className="flex-1 text-left">Folders</span>
        <ChevronRight className={cn('size-4 transition-transform', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="mt-1 space-y-0.5 pl-3">
          {isLoading && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading departments...
            </div>
          )}

          {!isLoading &&
            (departments || []).map((department) => {
              const active = pathname === `/folders/${department.id}`;
              return (
                <Link
                  key={department.id}
                  href={`/folders/${department.id}`}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-md px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground',
                    active && 'bg-muted text-foreground',
                  )}
                >
                  <Folder className="size-3.5" />
                  <span className="truncate">{department.name}</span>
                </Link>
              );
            })}

          {!isLoading && !departments?.length && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground/70">No departments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
