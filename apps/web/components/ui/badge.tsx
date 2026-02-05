'use client';

import * as React from 'react';
import { cn } from '@repo/ui';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default:
        'bg-primary text-primary-foreground border-transparent',
      secondary:
        'bg-secondary text-secondary-foreground border-transparent',
      outline:
        'border border-input bg-transparent text-foreground',
      destructive:
        'bg-destructive text-destructive-foreground border-transparent',
    };
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-heading uppercase tracking-wider transition-colors duration-200',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
