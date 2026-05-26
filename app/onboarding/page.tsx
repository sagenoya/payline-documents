import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { requireClerkUser } from '@/server/auth';

export default async function OnboardingPage() {
  const user = await requireClerkUser();

  if (user.onboarded) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <OnboardingForm />
    </main>
  );
}
