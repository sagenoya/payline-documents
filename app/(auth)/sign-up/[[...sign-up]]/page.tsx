import { SignUp } from '@clerk/nextjs';
import { AuthFrame } from '@/components/auth-frame';

export default function SignUpPage() {
  return (
    <AuthFrame eyebrow="Create account">
      <SignUp
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
