import React from 'react';
import { Sparkles } from 'lucide-react';

export function EmptyState({
  icon: Icon = Sparkles,
  title = 'No records found',
  description = 'Try modifying your search criteria or filter selections to uncover matching items.',
  action,
}) {
  return (
    <div className="py-16 px-6 text-center bg-white rounded-2xl border border-dashed border-sand-400 my-4 flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-full bg-sand-100 border border-gold-200 flex items-center justify-center mb-4 text-gold-600 shadow-sm">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-1.5">{title}</h3>
      <p className="text-xs text-charcoal-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

