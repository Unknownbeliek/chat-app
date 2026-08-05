import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, Sparkles } from 'lucide-react';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed the app in the last 7 days
    const dismissedTime = localStorage.getItem('ping_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Check if app is already running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    // Detect iOS user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // On iOS Safari, show the prompt after 3 seconds
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome / Android / Edge beforeinstallprompt event listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User installed Ping PWA app!');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('ping_pwa_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-slate-100 flex flex-col gap-3 relative overflow-hidden group">
        {/* Ambient Glassmorphic Background Glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <span>Install Ping App</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-400 leading-tight mt-0.5">
                Add to your home screen for full-screen view & instant push alerts!
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Section */}
        {isIOS ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-xs text-zinc-300 flex items-center gap-2.5">
            <Share className="w-4 h-4 text-indigo-400 flex-shrink-0 animate-bounce" />
            <span>
              Tap <strong className="text-white">Share</strong> in Safari, then select <strong className="text-indigo-300">'Add to Home Screen'</strong> ➕
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install Ping App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs active:scale-95 transition-colors cursor-pointer"
            >
              Not Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
