import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page = 1, totalPages = 1, total = 0, limit = 10, onPageChange }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-sand-300 bg-sand-50/50 text-xs text-charcoal-500">
      <div>
        Showing <span className="font-semibold text-charcoal-900">{start}</span> to{' '}
        <span className="font-semibold text-charcoal-900">{end}</span> of{' '}
        <span className="font-semibold text-charcoal-900">{total}</span> handloom records
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-sand-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-charcoal-700 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          // Display current, first, last, and neighbors
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-medium transition-colors ${
                  p === page
                    ? 'bg-gold-600 text-white shadow-sm'
                    : 'border border-sand-300 hover:bg-white text-charcoal-700'
                }`}
              >
                {p}
              </button>
            );
          }
          if (p === page - 2 || p === page + 2) {
            return (
              <span key={p} className="px-1 text-charcoal-400">
                ...
              </span>
            );
          }
          return null;
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-sand-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-charcoal-700 transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

