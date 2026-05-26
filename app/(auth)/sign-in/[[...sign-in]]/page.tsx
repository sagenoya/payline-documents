import { SignIn } from '@clerk/nextjs';
import { AuthFrame } from '@/components/auth-frame';

export default function SignInPage() {
  return (
    <AuthFrame eyebrow="Sign in">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full',
          },
        }}
      />
    </AuthFrame>
  );
}
