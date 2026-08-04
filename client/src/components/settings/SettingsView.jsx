import React, { useState, useEffect } from 'react';
import { Volume2, ChevronLeft, ExternalLink, ShieldAlert, CheckCircle, Bell, AlertTriangle } from 'lucide-react';
import { BellIcon, InfoIcon, GithubIcon, LogOutIcon } from '../animated-icons';
import { subscribeUserToPush, unsubscribeUserFromPush } from '../../utils/push';

export default function SettingsView({
  username,
  soundEnabled,
  setSoundEnabled,
  notificationsEnabled,
  setNotificationsEnabled,
  onOpenLogoutConfirm,
  onBackToChats
}) {
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  }, [setNotificationsEnabled]);

  const playTestSound = () => {
    const audio = new Audio("/pop-1.mp3");
    audio.play().catch(() => {});
  };

  const handleTogglePush = async () => {
    if (isSubscribing) return;
    setIsSubscribing(true);
    setStatusMessage(null);

    try {
      if (notificationsEnabled) {
        // Unsubscribe
        await unsubscribeUserFromPush(username);
        setNotificationsEnabled(false);
        setStatusMessage({ type: 'info', text: 'Push notifications disabled on this device.' });
      } else {
        // Subscribe
        const result = await subscribeUserToPush(username);
        if (result.success) {
          setNotificationsEnabled(true);
          setPermissionStatus('granted');
          setStatusMessage({ type: 'success', text: 'Successfully subscribed to Web Push Notifications!' });
        } else {
          setPermissionStatus(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
          setStatusMessage({ type: 'error', text: result.error || 'Failed to enable push notifications.' });
        }
      }
    } catch (err) {
      console.error('Error toggling push:', err);
      setStatusMessage({ type: 'error', text: 'An error occurred while toggling push notifications.' });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <main className="flex-1 h-full glass-panel flex flex-col overflow-y-auto chat-scroll p-4 sm:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChats}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 group cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transform group-hover:-translate-x-0.5 transition-transform pointer-events-none" />
            <span className="pointer-events-none">Back to Chat</span>
          </button>
          <h2 className="font-bold text-lg text-zinc-100">Settings</h2>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Notifications & Sounds Section */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-indigo-400 pointer-events-none" />
            Notifications & Sounds
          </h3>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Message Sound Alerts</p>
              <p className="text-xs text-zinc-400">Play a subtle pop sound when a new message arrives</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playTestSound}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <span className="pointer-events-none">Test</span>
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  soundEnabled ? "bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform pointer-events-none ${
                    soundEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Web Push Notifications Toggle */}
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-200">Desktop & Background Push</p>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    permissionStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : permissionStatus === 'denied'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {permissionStatus === 'granted' ? 'Granted' : permissionStatus === 'denied' ? 'Blocked' : 'Action Needed'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Receive instant alerts for offline direct messages even when app tab is closed
                </p>
              </div>

              <button
                type="button"
                disabled={isSubscribing || permissionStatus === 'denied'}
                onClick={handleTogglePush}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  notificationsEnabled ? "bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform pointer-events-none ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Status Alert Banner */}
            {statusMessage && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Instruction Banner if Permission Denied */}
            {permissionStatus === 'denied' && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Notifications are blocked in your browser</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  To enable background push alerts, click the 🔒 lock/settings icon next to the URL bar in your browser, set <strong>Notifications</strong> to <strong>Allow</strong>, and refresh the page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* About & Info Section */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-indigo-400 pointer-events-none" />
            About & System Info
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-semibold text-zinc-200">App Version</p>
              <p className="text-xs text-zinc-400">Current build version</p>
            </div>
            <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
              v3.4.1
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-zinc-200">GitHub Repository</p>
              <p className="text-xs text-zinc-400">View source code and issue tracker</p>
            </div>
            <a
              href="https://github.com/Unknownbeliek/chat-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.35)] active:scale-95 group backdrop-blur-md cursor-pointer"
            >
              <GithubIcon className="w-4 h-4 text-purple-400 pointer-events-none" />
              <span className="pointer-events-none">GitHub</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform pointer-events-none" />
            </a>
          </div>
        </div>

        {/* Account & Session Section */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border-rose-500/20">
          <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-2">
            <LogOutIcon className="w-4 h-4 text-rose-400 pointer-events-none" />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 shadow-md cursor-pointer"
            >
              <LogOutIcon className="w-3.5 h-3.5 pointer-events-none" />
              <span className="pointer-events-none">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
