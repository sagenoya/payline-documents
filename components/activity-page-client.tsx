'use client';

import { RecentActivity } from '@/components/recent-activity';

export function ActivityPageClient() {
  return (
    <div className="space-y-5">
      <div>
        <h1>Recent Activity</h1>
        <p className="mt-1">Track who viewed or downloaded company documents.</p>
      </div>
      <RecentActivity take={50} />
    </div>
  );
}
