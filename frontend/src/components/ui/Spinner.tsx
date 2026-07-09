import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('h-5 w-5 animate-spin text-[var(--color-accent)]', className)} />
);

export const FullPageSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[var(--color-surface-soft)]">
    <Spinner className="h-8 w-8" />
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton h-4 w-full', className)} />
);
