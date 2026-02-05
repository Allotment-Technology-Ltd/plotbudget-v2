'use client';

import * as React from 'react';
import { cn } from '@repo/ui';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'secondary' | 'outline';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'btn-primary',
      ghost: 'btn-ghost',
      secondary:
        'inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 font-heading text-cta uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      outline:
        'inline-flex items-center justify-center rounded-md border border-input bg-transparent px-6 py-3 font-heading text-cta uppercase tracking-widest transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    };

    return (
      <button
        ref={ref}
        className={cn(variantClasses[variant], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span>Please wait...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
