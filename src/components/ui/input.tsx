'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        'w-full rounded-lg border border-border-subtle bg-bg-secondary/50 px-4 py-2 text-white placeholder-gray-500 focus:border-polygon focus:outline-none focus:ring-1 focus:ring-polygon/50 transition-colors',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export { Input };
