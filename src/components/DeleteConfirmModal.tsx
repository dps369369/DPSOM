import React from 'react';
import { Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  name?: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Delete Item?',
  name,
  description,
  message = 'Are you sure you want to permanently delete this item? This action cannot be undone.',
  confirmLabel = 'Confirm Delete',
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {name && (
          <div className="mb-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
            <p className="font-semibold text-stone-900 mb-0.5">{name}</p>
            {description && (
              <p className="text-stone-500 text-[11px] line-clamp-2">{description}</p>
            )}
          </div>
        )}

        <p className="text-xs text-stone-600 mb-5 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
