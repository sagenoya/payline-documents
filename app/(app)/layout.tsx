import type * as React from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { requireClerkUser } from '@/server/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClerkUser();

  if (!user.onboarded || !user.profile) {
    redirect('/onboarding');
  }

  return <AppShell>{children}</AppShell>;
}
