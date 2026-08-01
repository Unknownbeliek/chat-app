import React from 'react';
import { useWpmCalculator } from '../../hooks/useWpmCalculator';

export default function MessageInput({
  inputMessage,
  setInputMessage,
  onSendMessage,
  onTyping
}) {
  const { wpm, registerKeystroke } = useWpmCalculator();

  const handleChange = (e) => {
    const text = e.target.value;
    setInputMessage(text);
    registerKeystroke(text.length);
    if (onTyping) {
      onTyping(wpm);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim()) {
        onSendMessage();
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 glass-header border-t border-white/10 flex items-center gap-2 sticky bottom-0 z-20"
    >
      <div className="flex-1 relative flex items-center">
        <input
          type="text"
          value={inputMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or @PingBot..."
          className="w-full glass-input px-4 py-3 rounded-2xl text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
        />
        {wpm > 0 && (
          <span className="absolute right-3 text-[10px] text-indigo-400 font-mono bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30">
            {wpm} WPM
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!inputMessage.trim()}
        className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold flex items-center justify-center shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex-shrink-0"
      >
        ➢
      </button>
    </form>
  );
}
