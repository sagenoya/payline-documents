import type * as React from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { isBounceResponse, requireClerkUser } from '@/server/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireClerkUser();
  } catch (error) {
    if (isBounceResponse(error)) redirect('/not-authorized');
    throw error;
  }

  if (!user.onboarded || !user.profile) {
    redirect('/onboarding');
  }

  return <AppShell>{children}</AppShell>;
}
