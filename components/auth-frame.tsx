import type * as React from 'react';
import { FileText, LockKeyhole } from 'lucide-react';

export function AuthFrame({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(520px,1.05fr)_minmax(420px,0.95fr)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-zinc-950 px-10 py-12 text-white lg:flex">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white shadow-sm">
              <FileText className="size-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Payline Docs</span>
          </div>
          <div className="flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-medium">
            <LockKeyhole className="size-4" />
            Private Workspace
          </div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Your company documents, organized.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
            Browse files by folder, find policies fast, and keep a clear activity trail for uploads, previews, downloads, delete or move files and folders.
          </p>

        
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">
            Internal Document Management System
          </p>
          <p className="text-sm font-medium text-zinc-500">
            Protected internal data
          </p>
        </div>
      </section>

      <section className="relative z-10 flex min-h-screen items-center justify-center bg-background px-4 py-10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <FileText className="size-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground">Payline Docs</span>
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
