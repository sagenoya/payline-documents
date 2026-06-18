import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { isBounceResponse, requireClerkUser } from '@/server/auth';

export default async function OnboardingPage() {
  try {
    await requireClerkUser();
  } catch (error) {
    if (isBounceResponse(error)) redirect('/not-authorized');
    throw error;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <OnboardingForm />
    </main>
  );
}
