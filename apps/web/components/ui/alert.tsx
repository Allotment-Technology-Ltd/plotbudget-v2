'use client';

import * as React from 'react';
import { cn } from '@repo/ui';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-card text-foreground border-border',
      destructive:
        'border-destructive/50 bg-destructive/10 text-destructive [&>svg]:text-destructive',
      warning:
        'border-warning/50 bg-warning/10 text-warning [&>svg]:text-warning',
    };
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex w-full gap-3 rounded-lg border p-4 items-start [&>svg]:mt-1 [&>svg]:shrink-0 [&>svg]:text-foreground [&>svg~*]:min-w-0 [&>svg~*]:flex-1',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref as React.Ref<HTMLParagraphElement>}
    className={cn('font-heading text-sm font-medium uppercase tracking-wider', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref as React.Ref<HTMLParagraphElement>}
    className={cn('text-sm text-muted-foreground [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
