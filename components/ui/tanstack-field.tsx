import type * as React from 'react';
import { cn } from '@/lib/utils';

export function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-xs font-medium text-destructive mt-1">
          {field.state.meta.errors.map((e: any) => typeof e === 'string' ? e : e.message).join(', ')}
        </p>
      ) : null}
      {field.state.meta.isValidating ? (
        <p className="text-xs font-medium text-muted-foreground mt-1">Validating...</p>
      ) : null}
    </>
  );
}

export function FieldWrapper({
  label,
  description,
  children,
  field,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  field: any;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={field.name}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          field.state.meta.isTouched && field.state.meta.errors.length && 'text-destructive'
        )}
      >
        {label}
      </label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <FieldInfo field={field} />
    </div>
  );
}
