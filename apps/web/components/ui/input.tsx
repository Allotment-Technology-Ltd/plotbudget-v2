'use client';

import * as React from 'react';
import { cn } from '@repo/ui';
import { Label } from './label';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, label, error, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <input
          type={type}
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 font-body text-base text-foreground',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error &&
              'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="font-body text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
