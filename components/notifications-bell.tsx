'use client';

import * as React from 'react';
import { Bell, Check, Loader2, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useMarkNotificationsRead,
  useNotificationCount,
  useNotifications,
  useRespondToAccessRequest,
} from '@/hooks/use-dms';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types/dms';

function notificationText(n: NotificationItem) {
  const doc = n.accessRequest?.document.title ?? 'a document';
  const who = n.accessRequest?.requester.name ?? 'A teammate';
  if (n.type === 'ACCESS_REQUEST') return `${who} requested access to “${doc}”.`;
  if (n.type === 'ACCESS_GRANTED') return `Your access to “${doc}” was approved for 2 hours.`;
  return `Your access request for “${doc}” was denied.`;
}

export function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { data: countData } = useNotificationCount();
  const { data, isLoading } = useNotifications({ enabled: open });
  const markRead = useMarkNotificationsRead();
  const respond = useRespondToAccessRequest();

  const notifications = data?.notifications ?? [];
  const unreadCount = countData?.unreadCount ?? 0;

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) markRead.mutate();
  }

  async function handleRespond(id: string, decision: 'APPROVE' | 'DENY') {
    try {
      await respond.mutateAsync({ id, decision });
      toast.success(decision === 'APPROVE' ? 'Access granted for 2 hours' : 'Request denied');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to respond');
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={handleToggle}
        className="relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border bg-background shadow-xl ring-1 ring-foreground/5">
          <div className="border-b bg-muted/20 px-4 py-2.5">
            <p className="text-sm font-semibold">Notifications</p>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y">
            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-8 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                You’re all caught up.
              </p>
            ) : (
              notifications.map((n) => {
                const isPendingRequest =
                  n.type === 'ACCESS_REQUEST' && n.accessRequest?.status === 'PENDING';
                return (
                  <div key={n.id} className={cn('px-4 py-3', !n.read && 'bg-brand-subtle/40')}>
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                          n.type === 'ACCESS_DENIED'
                            ? 'bg-red-500/10 text-red-600'
                            : n.type === 'ACCESS_GRANTED'
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {n.type === 'ACCESS_GRANTED' ? (
                          <Check className="size-3.5" />
                        ) : n.type === 'ACCESS_DENIED' ? (
                          <X className="size-3.5" />
                        ) : (
                          <Lock className="size-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground">{notificationText(n)}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatDate(n.createdAt)}
                        </p>

                        {isPendingRequest && n.accessRequest && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 bg-green-600 px-2.5 text-xs hover:bg-green-700"
                              disabled={respond.isPending}
                              onClick={() => handleRespond(n.accessRequest!.id, 'APPROVE')}
                            >
                              {respond.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                'Allow'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={respond.isPending}
                              onClick={() => handleRespond(n.accessRequest!.id, 'DENY')}
                            >
                              Deny
                            </Button>
                          </div>
                        )}

                        {n.type === 'ACCESS_REQUEST' &&
                          n.accessRequest &&
                          n.accessRequest.status !== 'PENDING' && (
                            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                              {n.accessRequest.status === 'APPROVED' ? 'Allowed' : 'Denied'}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
