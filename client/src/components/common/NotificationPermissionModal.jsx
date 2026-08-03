import React from 'react';
import { Bell, Sparkles } from 'lucide-react';

export default function NotificationPermissionModal({ isOpen, onEnable, onSkip }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="glass-card p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Background Glow Blobs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner relative pointer-events-none">
          <Bell className="w-8 h-8 animate-bounce pointer-events-none" />
          <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 pointer-events-none" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Enable Notifications</h3>
        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          Never miss an incoming voice call, video call, or direct message when Ping is minimized or running in the background.
        </p>

        <p className="text-[11px] text-zinc-400 mb-6 bg-white/5 py-1.5 px-3 rounded-xl border border-white/10">
          💡 You can change your preference anytime in Settings.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onEnable}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Enable Notifications
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
