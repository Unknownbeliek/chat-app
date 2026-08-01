import React from 'react';

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl space-y-4">
        <h3 className="font-bold text-base text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
