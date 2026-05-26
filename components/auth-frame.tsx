import type * as React from 'react';
import { FileText, LockKeyhole } from 'lucide-react';

export function AuthFrame({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow: string;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(520px,1.1fr)_minmax(420px,0.9fr)]">
      {/* Details Section (Left) */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-10 py-12 text-white lg:flex">
        {/* Decorative background elements */}
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/10">
              <FileText className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Payline Docs</span>
          </div>
          <div className="flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium backdrop-blur-md">
            <LockKeyhole className="size-4" />
            Private Workspace
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Secure, organized, and accessible.
          </h2>
          <p className="mt-6 text-lg text-indigo-100 leading-relaxed">
            Built exclusively for our internal team. Access the latest HR policies, financial records, engineering docs, and more in one centralized hub.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-sm font-medium text-indigo-200">
            Internal Document Management System
          </p>
          <p className="text-sm font-medium text-indigo-200/60">
            Protected internal data
          </p>
        </div>
      </section>

      {/* Form Section (Right) */}
      <section className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8 relative shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] z-10">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <FileText className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Payline Docs</span>
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">{eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          </div>

          <div className="[&_.cl-card]:border [&_.cl-card]:border-border [&_.cl-card]:shadow-sm [&_.cl-card]:rounded-xl [&_.cl-footerActionLink]:text-primary [&_.cl-formButtonPrimary]:bg-primary [&_.cl-formButtonPrimary]:text-primary-foreground [&_.cl-formButtonPrimary]:shadow-sm [&_.cl-formButtonPrimary]:hover:bg-primary/90 [&_.cl-headerTitle]:hidden [&_.cl-headerSubtitle]:hidden [&_.cl-rootBox]:w-full [&_.cl-socialButtonsBlockButton]:border-border">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
