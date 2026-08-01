import React from 'react';

export default function SettingsView({
  soundEnabled,
  setSoundEnabled,
  notificationsEnabled,
  onToggleNotifications,
  onOpenLogoutConfirm,
  onBackToChats
}) {
  const playTestSound = () => {
    const audio = new Audio("/pop-1.mp3");
    audio.play().catch(() => {});
  };

  return (
    <main className="flex-1 h-full glass-panel flex flex-col overflow-y-auto chat-scroll p-4 sm:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChats}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            ← Back to Chat
          </button>
          <h2 className="font-bold text-lg text-zinc-100">Settings</h2>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Notifications Section */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Notifications & Sounds
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Message Sound Alerts</p>
              <p className="text-xs text-zinc-400">Play a subtle pop sound when a new message arrives</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playTestSound}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10"
              >
                🔊 Test
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? "bg-indigo-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    soundEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Desktop Push Notifications</p>
              <p className="text-xs text-zinc-400">Show browser popups for incoming direct messages</p>
            </div>
            <button
              type="button"
              onClick={onToggleNotifications}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                notificationsEnabled ? "bg-indigo-600" : "bg-zinc-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Account & Session Section */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border-rose-500/20">
          <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
            Account & Session
          </h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Centralized Session Logout</p>
              <p className="text-xs text-zinc-400">Sign out of your active session on this device</p>
            </div>
            <button
              type="button"
              onClick={onOpenLogoutConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all shadow-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
