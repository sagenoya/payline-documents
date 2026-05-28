import { CustomSignUpForm } from '@/components/auth-forms';
import { AuthFrame } from '@/components/auth-frame';

export default function SignUpPage() {
  return (
    <AuthFrame
      eyebrow="Create account"
      title="Join the workspace"
      description="Create your account, verify your email, then choose your company role."
    >
      <CustomSignUpForm />
    </AuthFrame>
  );
}
