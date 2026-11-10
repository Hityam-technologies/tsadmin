import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-sand-200/80', className)}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full divide-y divide-sand-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-6">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className={`h-4 ${
                j === 0 ? 'w-10' : j === 1 ? 'w-48' : j === 2 ? 'w-24' : 'w-20'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

