import { Loader } from '@/components/ui/loader';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-96 max-w-full rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg border bg-background p-4">
            <div className="h-4 w-24 rounded-md bg-muted" />
            <div className="mt-5 h-7 w-16 rounded-md bg-muted/70" />
          </div>
        ))}
      </div>
      <Loader text="Loading dashboard..." />
    </div>
  );
}
