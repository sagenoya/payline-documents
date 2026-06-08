'use client';

import { Lock } from 'lucide-react';
import { RecentActivity } from '@/components/recent-activity';
import { Loader } from '@/components/ui/loader';
import { useProfile } from '@/hooks/use-dms';

export function ActivityPageClient() {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className="space-y-5">
      <div>
        <h1>Recent Activity</h1>
        <p className="mt-1">Track who viewed or downloaded company documents.</p>
      </div>
      {isLoading ? (
        <Loader text="Loading activity..." />
      ) : profile?.canViewActivity ? (
        <RecentActivity take={15} showFilters />
      ) : (
        <div className="relative overflow-hidden rounded-lg border bg-background">
          <div className="divide-y blur-sm select-none" aria-hidden>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 p-3">
                <div className="mt-0.5 size-8 shrink-0 rounded-md bg-muted" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Restricted</p>
          </div>
        </div>
      )}
    </div>
  );
}
