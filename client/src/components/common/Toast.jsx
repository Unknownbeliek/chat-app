import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-indigo-400 shrink-0" />
  };

  const borders = {
    error: 'border-rose-500/30 bg-rose-950/40 text-rose-200',
    success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200',
    info: 'border-indigo-500/30 bg-indigo-950/40 text-indigo-200'
  };

  const type = toast.type || 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs max-w-sm ${borders[type]}`}>
        {icons[type]}
        <p className="font-medium flex-1 leading-relaxed">{toast.message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}
