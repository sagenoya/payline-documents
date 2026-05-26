'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  text?: string;
  className?: string;
}

export function Loader({ text = 'Loading...', className }: LoaderProps) {
  return (
    <div className={cn("w-full space-y-3 animate-pulse py-4", className)}>
      <div className="h-16 w-full rounded-lg bg-muted/60" />
      <div className="h-16 w-full rounded-lg bg-muted/60" />
      <div className="h-16 w-full rounded-lg bg-muted/60 opacity-60" />
      <span className="sr-only">{text}</span>
    </div>
  );
}
