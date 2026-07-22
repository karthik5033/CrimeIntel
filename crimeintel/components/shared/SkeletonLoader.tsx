import React from 'react';
import { cn } from '@/lib/utils';

export function SkeletonLoader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-panel p-4 rounded-xl space-y-3">
      <SkeletonLoader className="h-5 w-1/3" />
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-5/6" />
      <SkeletonLoader className="h-10 w-full mt-4" />
    </div>
  );
}
