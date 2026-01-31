'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-polygon text-white hover:bg-polygon/90 hover:shadow-lg hover:shadow-polygon/30',
        secondary: 'border border-border-subtle bg-bg-secondary/50 text-white hover:bg-bg-tertiary',
        success: 'bg-profit text-white hover:bg-profit/90 hover:shadow-lg hover:shadow-profit/30',
        danger: 'bg-loss text-white hover:bg-loss/90 hover:shadow-lg hover:shadow-loss/30',
        ghost: 'bg-transparent text-white hover:bg-bg-secondary/50',
        outline: 'border border-white/20 text-white hover:bg-white/5',
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => (
    <button
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
