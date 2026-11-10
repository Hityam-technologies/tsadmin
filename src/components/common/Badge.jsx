import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'default', className, size = 'sm' }) {
  const variantStyles = {
    default: 'bg-sand-200 text-charcoal-700 border-sand-300',
    gold: 'bg-gold-50 text-gold-900 border-gold-300 font-semibold',
    saffron: 'bg-saffron-50 text-saffron-900 border-saffron-300 font-semibold',
    maroon: 'bg-maroon-50 text-maroon-900 border-maroon-300 font-semibold',
    emerald: 'bg-gold-50 text-gold-900 border-gold-300 font-semibold', // mapped to brand gold
    blue: 'bg-[#F0F5FA] text-[#084B87] border-[#BCD4E6] font-semibold',
    amber: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
    purple: 'bg-purple-50 text-purple-900 border-purple-200 font-semibold',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors',
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.sm,
        className
      )}
    >
      {children}
    </span>
  );
}

