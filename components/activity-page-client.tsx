'use client';

import { RecentActivity } from '@/components/recent-activity';
import { Loader } from '@/components/ui/loader';
import { useProfile } from '@/hooks/use-dms';

export function ActivityPageClient() {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className="space-y-5">
      <div>
        <h1>Recent Activity</h1>
        <p className="mt-1">
          {profile?.canViewActivity
            ? 'Track who viewed, downloaded, uploaded, or removed company documents.'
            : 'Track uploads, edits, and document moves across the team.'}
        </p>
      </div>
      {isLoading ? (
        <Loader text="Loading activity..." />
      ) : (
        <RecentActivity take={15} showFilters canViewRestricted={profile?.canViewActivity} />
      )}
    </div>
  );
}
