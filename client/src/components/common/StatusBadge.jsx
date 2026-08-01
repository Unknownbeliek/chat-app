import React from 'react';

export default function StatusBadge({ isOnline, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-500'}`} />
      {label || (isOnline ? 'Online' : 'Offline')}
    </span>
  );
}
