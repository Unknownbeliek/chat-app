import React from 'react';

export default function StatusBadge({ isOnline, label, status }) {
  if (status === 'calling') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span>{label || 'Calling...'}</span>
      </span>
    );
  }

  if (status === 'in_call') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
        <span>{label || 'In Call'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-500'}`} />
      {label || (isOnline ? 'Online' : 'Offline')}
    </span>
  );
}
