'use client';

import * as React from 'react';
import { cn } from '@repo/ui';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full min-w-0 rounded-md border border-input bg-background pl-5 pr-4 py-2 font-body text-base text-foreground uppercase placeholder:normal-case',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-body',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
