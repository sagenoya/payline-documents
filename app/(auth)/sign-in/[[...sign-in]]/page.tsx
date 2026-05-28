import { CustomSignInForm } from '@/components/auth-forms';
import { AuthFrame } from '@/components/auth-frame';

export default function SignInPage() {
  return (
    <AuthFrame
      eyebrow="Sign in"
      title="Welcome back"
      description="Use your company email and password to access Payline Docs."
    >
      <CustomSignInForm />
    </AuthFrame>
  );
}
