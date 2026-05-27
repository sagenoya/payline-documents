import Link from 'next/link';
import { Files, FolderOpen, Upload, Users } from 'lucide-react';
import { DashboardRecentUploads } from '@/components/dashboard-recent-uploads';
import { RecentActivity } from '@/components/recent-activity';
import { Badge } from '@/components/ui/badge';
import { canUpload, roleLabels } from '@/lib/dms';
import { prisma } from '@/lib/prisma';
import { requireClerkUser } from '@/server/auth';

async function getDashboardData() {
  try {
    const [documentCount, folderCount, userCount] = await prisma.$transaction([
      prisma.document.count(),
      prisma.folder.count(),
      prisma.user.count(),
    ]);

    return {
      documentCount,
      folderCount,
      userCount,
      isUnavailable: false,
    };
  } catch (error) {
    console.error('Dashboard data failed to load', error);

    return {
      documentCount: 0,
      folderCount: 0,
      userCount: 0,
      isUnavailable: true,
    };
  }
}

export default async function DashboardPage() {
  const user = await requireClerkUser();
  const {
    documentCount,
    folderCount,
    userCount,
    isUnavailable,
  } = await getDashboardData();

  const stats = [
    { label: 'Documents', value: documentCount, icon: Files },
    { label: 'Folders', value: folderCount, icon: FolderOpen },
    { label: 'Team members', value: userCount, icon: Users },
    { label: 'Upload access', value: canUpload(user.profile?.companyRole) ? 'Yes' : 'Browse only', icon: Upload },
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
        {user.profile?.companyRole && <Badge>{roleLabels[user.profile.companyRole]}</Badge>}
      </div>

      {isUnavailable && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
          Dashboard data is taking longer than expected. You can still use folders, documents, and activity while it reconnects.
        </div>
      )}

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

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          <h2 className="text-base">Recent uploads</h2>
          <DashboardRecentUploads />
        </div>
        <div className="space-y-3">
          <h2 className="text-base">Activity</h2>
          <RecentActivity take={15} />
          <div className="pt-2 text-right">
            <Link href="/activity" className="text-sm font-medium text-primary hover:underline">
              See all activity &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
