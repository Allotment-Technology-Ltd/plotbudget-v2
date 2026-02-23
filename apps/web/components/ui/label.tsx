'use client';

/* eslint-disable react/prop-types */

import * as React from 'react';
import { cn } from '@repo/ui';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'font-heading text-label-sm uppercase tracking-widest text-foreground',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
