import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Destructive Action',
  description = 'Are you sure you wish to proceed? This operation cannot be easily undone.',
  confirmText = 'Confirm & Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="text-center pt-2 pb-1">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            variant === 'danger'
              ? 'bg-maroon-50 border border-maroon-200 text-maroon-600'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}
        >
          {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-2">
          {title}
        </h3>
        <p className="text-xs text-charcoal-500 mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-sand-300 text-charcoal-700 hover:bg-sand-100 font-medium text-xs transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium text-xs transition-colors shadow-sm ${
              variant === 'danger'
                ? 'bg-maroon-600 hover:bg-maroon-700 disabled:bg-maroon-400'
                : 'bg-gold-600 hover:bg-gold-700 disabled:bg-gold-400'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
