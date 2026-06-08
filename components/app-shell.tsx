'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Files, FolderOpen, LayoutDashboard, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { NotificationsBell } from '@/components/notifications-bell';
import { useProfile } from '@/hooks/use-dms';
import { cn } from '@/lib/utils';
import { useDmsStore } from '@/store/dms-store';
import { DropZoneOverlay } from '@/components/drop-zone-overlay';

const UploadDocumentModal = dynamic(
  () => import('@/components/upload-document-modal').then((mod) => mod.UploadDocumentModal),
  { ssr: false },
);

const EditDocumentModal = dynamic(
  () => import('@/components/edit-document-modal').then((mod) => mod.EditDocumentModal),
  { ssr: false },
);

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
  { href: '/documents', label: 'Documents', icon: Files },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const setUploadModalOpen = useDmsStore((state) => state.setUploadModalOpen);
  const uploadModalOpen = useDmsStore((state) => state.uploadModalOpen);
  const editingDocument = useDmsStore((state) => state.editingDocument);

  React.useEffect(() => {
    if (!profileLoading && profile && !profile.onboarded) {
      router.replace('/onboarding');
    }
  }, [profile, profileLoading, router]);

  return (
    <DropZoneOverlay>
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background px-3 py-4 lg:block">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Files className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Payline Docs</p>
            <small>Internal DMS</small>
          </div>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground',
                  active && 'bg-muted text-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <Files className="size-5 text-primary" />
            <span className="font-semibold">Payline Docs</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            {profile?.canUpload && (
              <Button onClick={() => setUploadModalOpen(true)} className="w-32 bg-red-600 hover:bg-red-700 text-white">
                <Plus className="size-4 mr-1" />
                Upload
              </Button>
            )}
            <NotificationsBell />
            <UserMenu profile={profile} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-20 lg:pb-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground',
                active && 'text-primary',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {uploadModalOpen && <UploadDocumentModal />}
      {editingDocument && <EditDocumentModal />}
    </div>
    </DropZoneOverlay>
  );
}
