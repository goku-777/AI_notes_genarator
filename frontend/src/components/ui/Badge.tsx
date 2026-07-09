import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        neutral: 'bg-[var(--color-silver-soft)] text-[var(--color-charcoal)]',
        accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]',
        success: 'bg-green-50 text-[var(--color-success)]',
        warning: 'bg-amber-50 text-[var(--color-warning)]',
        danger: 'bg-red-50 text-[var(--color-danger)]',
        dark: 'bg-[var(--color-charcoal)] text-white',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

export const statusToBadgeVariant: Record<string, BadgeProps['variant']> = {
  pending: 'neutral',
  processing: 'warning',
  completed: 'success',
  failed: 'danger',
  deleted: 'danger',
  'in-progress': 'warning',
  low: 'neutral',
  medium: 'accent',
  high: 'danger',
};
