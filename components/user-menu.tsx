'use client';

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { ChevronDown, LogOut } from 'lucide-react';
import { roleLabels } from '@/lib/dms';
import { maskEmail } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CurrentProfile } from '@/types/dms';

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split('@')[0] || 'User';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function UserMenu({ profile }: { profile?: CurrentProfile }) {
  const { signOut } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const role = profile?.profile?.companyRole;
  const initials = getInitials(profile?.name, profile?.email);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setOpen(false);

    try {
      await signOut(() => {
        window.location.assign('/sign-in');
      });
    } catch {
      window.location.assign('/sign-in');
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center  gap-2 rounded-full border bg-background px-1.5 pr-2 text-left shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="relative flex size-7 shrink-0 overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {profile?.imageUrl ? (
            <img src={profile.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">{initials}</span>
          )}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium text-foreground sm:block">
          {profile?.name || 'Account'}
        </span>
        <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="flex items-center gap-3 border-b p-3">
            <div className="flex size-10 shrink-0 overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {profile?.imageUrl ? (
                <img src={profile.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{profile?.name || 'Team member'}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email ? maskEmail(profile.email) : 'Signed in'}</p>
              {role && (
                <p className="mt-1 truncate text-xs font-medium text-primary">{roleLabels[role]}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-foreground transition hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="size-4 cursor-pointer text-muted-foreground" />
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
