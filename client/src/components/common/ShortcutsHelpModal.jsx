import React from 'react';
import { X, Keyboard, Smartphone, Command } from 'lucide-react';

export default function ShortcutsHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + K", label: "Focus sidebar search bar" },
    { key: "Ctrl + /", label: "Toggle slash-command palette" },
    { key: "Ctrl + Enter", label: "Send current message" },
    { key: "Escape", label: "Close active modal / clear search / cancel edit" },
    { key: "Ctrl + Shift + M", label: "Toggle mic mute (in call)" },
    { key: "Ctrl + Shift + V", label: "Toggle video camera (in call)" },
    { key: "Ctrl + Shift + E", label: "Open emoji picker" },
    { key: "Alt + ↑ / ↓", label: "Navigate active chats in sidebar" },
    { key: "Ctrl + Shift + N", label: "Start new chat (focus contact search)" },
    { key: "?", label: "Open this keyboard shortcuts guide" }
  ];

  const gestures = [
    { gesture: "Swipe Right", label: "Reply / quote chat message" },
    { gesture: "Long-Press (500ms)", label: "Open contextual action menu" },
    { gesture: "Double-Tap", label: "Quick-react with ❤️ emoji" },
    { gesture: "Swipe Left (Sidebar)", label: "Reveal quick actions (mute, clear)" },
    { gesture: "Pull Down (Chat)", label: "Sync & refresh message stream" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between glass-header">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-100">Keyboard & Gesture Shortcuts</h2>
              <p className="text-xs text-zinc-400">Quick actions for desktop and mobile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 chat-scroll">
          {/* Desktop Shortcuts */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Keyboard className="w-4 h-4" />
              <span>Desktop Shortcuts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {shortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span className="text-xs text-zinc-300 font-medium truncate mr-2">{s.label}</span>
                  <kbd className="px-2 py-1 rounded-md bg-slate-800 text-[11px] font-mono font-semibold text-indigo-300 border border-slate-700 shadow-inner flex-shrink-0">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Mobile Gestures */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>Mobile Touch Gestures</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {gestures.map((g, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span className="text-xs text-zinc-300 font-medium truncate mr-2">{g.label}</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-[11px] font-medium text-purple-300 border border-purple-800/40 flex-shrink-0">
                    {g.gesture}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-center bg-slate-950/40">
          <p className="text-[11px] text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-zinc-300 font-mono">Esc</kbd> anytime to close this modal
          </p>
        </div>
      </div>
    </div>
  );
}
