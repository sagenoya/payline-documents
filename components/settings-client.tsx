'use client';

import * as React from 'react';
import { Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useProfile, useSaveTrustedViewers, useTrustedViewers, useUsers } from '@/hooks/use-dms';
import { cn } from '@/lib/utils';

export function SettingsClient() {
  const { data: profile } = useProfile();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: trusted, isLoading: trustedLoading } = useTrustedViewers();
  const saveTrustedViewers = useSaveTrustedViewers();

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (trusted && !initialized) {
      setSelected(new Set(trusted.viewerIds));
      setInitialized(true);
    }
  }, [trusted, initialized]);

  const otherUsers = users.filter((u) => u.id !== profile?.id);
  const filtered = otherUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    try {
      await saveTrustedViewers.mutateAsync([...selected]);
      toast.success('Trusted viewers updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save settings');
    }
  }

  const loading = usersLoading || trustedLoading;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage how your sensitive documents are shared.</p>
      </div>

      <section className="rounded-lg border bg-background">
        <div className="flex items-start gap-3 border-b bg-muted/20 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="size-3.5 text-red-600" />
              Sensitive document access
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose the teammates who can open any document you mark as sensitive without having to
              request access. Everyone else will have to request access from you each time.
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <Input
            placeholder="Search teammates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
          />

          {loading ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No teammates found.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {filtered.map((user) => {
                const isSelected = selected.has(user.id);
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => toggle(user.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-md border',
                          isSelected
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-input bg-background',
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/20 p-4">
          <span className="text-xs text-muted-foreground">
            {selected.size} teammate{selected.size === 1 ? '' : 's'} trusted
          </span>
          <Button onClick={handleSave} disabled={saveTrustedViewers.isPending || loading}>
            {saveTrustedViewers.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </section>
    </div>
  );
}
