'use client';

import Link from 'next/link';
import { Files, FolderOpen, Lock, Upload, Users } from 'lucide-react';
import { DashboardRecentUploads } from '@/components/dashboard-recent-uploads';
import { RecentActivity } from '@/components/recent-activity';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { useDashboard, useProfile } from '@/hooks/use-dms';
import { roleLabels } from '@/lib/dms';

export function DashboardClient() {
  const { data: user } = useProfile();
  const { data, isLoading } = useDashboard();

  const stats = [
    { label: 'Documents', value: data?.documentCount ?? 0, icon: Files },
    { label: 'Folders', value: data?.folderCount ?? 0, icon: FolderOpen },
    { label: 'Team members', value: data?.userCount ?? 0, icon: Users },
    { label: 'Upload access', value: data?.canUpload ? 'Yes' : 'Browse only', icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1>Dashboard</h1>
          <p className="mt-1">
            A simple, searchable home for company documents and access history.
          </p>
        </div>
        {user?.profile?.companyRole && <Badge>{roleLabels[user.profile.companyRole]}</Badge>}
      </div>

      {data?.isUnavailable && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
          Dashboard data is taking longer than expected. You can still use folders, documents, and activity while it reconnects.
        </div>
      )}

      {isLoading ? (
        <Loader text="Loading dashboard..." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="rounded-lg border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p>{stat.label}</p>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</div>
              </div>
            );
          })}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          <h2 className="text-base">Recent uploads</h2>
          <DashboardRecentUploads />
        </div>
        <div className="space-y-3">
          <h2 className="text-base">Activity</h2>
          {user?.canViewActivity ? (
            <>
              <RecentActivity take={15} />
              <div className="pt-2 text-right">
                <Link href="/activity" className="text-sm font-medium text-primary hover:underline">
                  See all activity &rarr;
                </Link>
              </div>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-lg border bg-background">
              <div className="divide-y blur-sm select-none" aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3 p-3">
                    <div className="mt-0.5 size-8 shrink-0 rounded-md bg-muted" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="h-3.5 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40 p-4 text-center">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Lock className="size-4" />
                </div>
                <p className="text-sm font-medium text-foreground">Restricted</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
