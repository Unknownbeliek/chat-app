import React, { useState, useRef, useEffect } from 'react';
import { useWpmCalculator } from '../../hooks/useWpmCalculator';

const EMOJI_CATEGORIES = [
  {
    name: "Smilies",
    emojis: ["😊", "😂", "🤣", "😍", "🥰", "😎", "🥳", "😜", "🧐", "😅", "😇", "🤩", "😭", "🤯", "😴"]
  },
  {
    name: "Reactions",
    emojis: ["👍", "🙌", "👏", "🔥", "💯", "✨", "❤️", "💜", "💙", "🙏", "💪", "🤝", "✌️", "🎉", "👀"]
  },
  {
    name: "Tech & Work",
    emojis: ["💻", "⚡", "🤖", "🚀", "💬", "🛠️", "🎯", "🧠", "🔐", "🔮", "💡", "📌", "💎", "🌐", "⚡"]
  }
];

export default function MessageInput({
  inputMessage,
  setInputMessage,
  onSendMessage,
  onTyping,
  disabled = false
}) {
  const { wpm, registerKeystroke } = useWpmCalculator();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const text = e.target.value;
    setInputMessage(text);
    registerKeystroke(text.length);
    if (onTyping) {
      onTyping(wpm);
    }
  };

  const handleInsertEmoji = (emoji) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !disabled) {
      onSendMessage();
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !disabled) {
        onSendMessage();
        setShowEmojiPicker(false);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 glass-header border-t border-white/10 flex items-center gap-2 sticky bottom-0 z-20 relative"
    >
      {/* Emoji Picker Popover */}
      {showEmojiPicker && !disabled && (
        <div
          ref={pickerRef}
          className="absolute bottom-16 left-3 w-72 glass-panel p-3 rounded-2xl border border-white/15 shadow-2xl shadow-black/60 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Category Tabs */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(idx)}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  activeCategory === idx
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto chat-scroll p-1">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl hover:scale-125 active:scale-95 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Field Wrapper */}
      <div className="flex-1 relative flex items-center">
        {/* Emoji Button inside Input */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="absolute left-3 text-lg text-zinc-400 hover:text-amber-400 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all z-10"
          title="Choose Emoji"
        >
          😊
        </button>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waking up server... Please wait." : "Type a message or @PingBot..."}
          className="w-full glass-input pl-10 pr-16 py-3 rounded-2xl text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner"
        />

        {wpm > 0 && !disabled && (
          <span className="absolute right-3 text-[10px] text-indigo-400 font-mono bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30">
            {wpm} WPM
          </span>
        )}
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={disabled || !inputMessage.trim()}
        className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold flex items-center justify-center shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex-shrink-0"
        title="Send Message"
      >
        <svg className="w-5 h-5 fill-current transform rotate-45 -translate-x-0.5" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </form>
  );
}
