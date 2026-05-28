'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getAuthError(error: unknown) {
  if (error && typeof error === 'object' && 'errors' in error) {
    const clerkError = error as { errors?: Array<{ longMessage?: string; message?: string }> };
    return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || 'Authentication failed.';
  }

  return 'Authentication failed. Please try again.';
}

function isAlreadySignedInError(error: unknown) {
  if (error && typeof error === 'object' && 'errors' in error) {
    const clerkError = error as { errors?: Array<{ longMessage?: string; message?: string }> };
    const message = clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || '';
    return message.toLowerCase().includes('already signed in');
  }

  return false;
}

function goToApp(destination = '/dashboard') {
  window.location.assign(destination);
}

function GoogleMark() {
  return (
    <span className="flex size-5 items-center justify-center rounded-full border bg-background text-xs font-semibold text-foreground">
      G
    </span>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="pr-10 focus-visible:ring-0 focus-visible:border-foreground/30"
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function CustomSignInForm() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  async function handleGoogleSignIn() {
    if (!isLoaded || googleSubmitting) return;

    setError('');
    setGoogleSubmitting(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (authError) {
      if (isAlreadySignedInError(authError)) {
        goToApp();
        return;
      }

      setGoogleSubmitting(false);
      setError(getAuthError(authError));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || submitting || googleSubmitting) return;

    setError('');
    setSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }

        goToApp();
        return;
      }

      setError('This account needs another verification step before signing in.');
    } catch (authError) {
      if (isAlreadySignedInError(authError)) {
        goToApp();
        return;
      }

      setError(getAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-background p-5 shadow-sm">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={!isLoaded || submitting || googleSubmitting}
        onClick={() => void handleGoogleSignIn()}
        className="h-11 w-full bg-green-500 text-white hover:text-white hover:bg-green-600 focus-visible:ring-green-500/50"
      >
        {googleSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <GoogleMark />}
        Continue with Google
      </Button>

      <AuthDivider />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          className="focus-visible:ring-0 focus-visible:border-foreground/30"
        />
      </div>

      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder="Enter your password"
      />

      <Button type="submit" disabled={!isLoaded || submitting || googleSubmitting} className="h-11 w-full">
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Payline Docs?{' '}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function CustomSignUpForm() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  async function handleGoogleSignUp() {
    if (!isLoaded || googleSubmitting) return;

    setError('');
    setGoogleSubmitting(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
      });
    } catch (authError) {
      if (isAlreadySignedInError(authError)) {
        goToApp();
        return;
      }

      setGoogleSubmitting(false);
      setError(getAuthError(authError));
    }
  }

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || submitting || googleSubmitting) return;

    setError('');
    setSubmitting(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }

        goToApp('/onboarding');
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (authError) {
      if (isAlreadySignedInError(authError)) {
        goToApp();
        return;
      }

      setError(getAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }

        goToApp('/onboarding');
        return;
      }

      setError('We could not finish verification. Please check the code and try again.');
    } catch (authError) {
      if (isAlreadySignedInError(authError)) {
        goToApp();
        return;
      }

      setError(getAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingVerification) {
    return (
      <form onSubmit={handleVerifyEmail} className="space-y-4 rounded-lg border bg-background p-5 shadow-sm">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium text-foreground">
            Verification code
          </label>
          <Input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter the code from your email"
            required
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>

        <Button type="submit" disabled={!isLoaded || submitting} className="h-11 w-full">
          {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
          Verify and continue
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCreateAccount} className="space-y-4 rounded-lg border bg-background p-5 shadow-sm">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={!isLoaded || submitting || googleSubmitting}
        onClick={() => void handleGoogleSignUp()}
        className="h-11 w-full bg-green-500 text-white hover:text-white hover:bg-green-600 focus-visible:ring-green-500/50"
      >
        {googleSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <GoogleMark />}
        Continue with Google
      </Button>

      <AuthDivider />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">
            First name
          </label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Last name
          </label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
            className="focus-visible:ring-0 focus-visible:border-foreground/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="signUpEmail" className="text-sm font-medium text-foreground">
          Email address
        </label>
        <Input
          id="signUpEmail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          className="focus-visible:ring-0 focus-visible:border-foreground/30"
        />
      </div>

      <PasswordField
        id="signUpPassword"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        placeholder="Create a secure password"
      />

      <Button type="submit" disabled={!isLoaded || submitting || googleSubmitting} className="h-11 w-full">
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have access?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
