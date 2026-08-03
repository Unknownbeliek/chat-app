import React, { useState, useRef, useEffect } from 'react';
import { Paperclip } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useWpmCalculator } from '../../hooks/useWpmCalculator';

export default function MessageInput({
  inputMessage,
  setInputMessage,
  onSendMessage,
  onTyping,
  disabled = false
}) {
  const { wpm, registerKeystroke } = useWpmCalculator();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  // Close emoji picker popover when clicking outside
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

  const handleEmojiSelect = (emojiChar) => {
    if (emojiChar) {
      setInputMessage(prev => prev + emojiChar);
    }
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
      {/* Native Glassmorphic Emoji Picker Floating Popover */}
      {showEmojiPicker && !disabled && (
        <div
          ref={pickerRef}
          className="absolute bottom-16 left-3 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Input Field Wrapper */}
      <div className="flex-1 relative flex items-center">
        {/* Attachment & Emoji Trigger Buttons */}
        <div className="absolute left-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            disabled={disabled}
            onClick={() => alert("Attachment upload coming soon!")}
            className="p-1 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="Attach Files / Media"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-base text-zinc-400 hover:text-amber-400 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all leading-none"
            title="Choose Emoji"
          >
            😀
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waking up server... Please wait." : "Type a message or @PingBot..."}
          className="w-full bg-white/5 border border-white/10 pl-16 pr-16 py-3 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner backdrop-blur-md"
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
        className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold flex items-center justify-center shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 flex-shrink-0"
        title="Send Message"
      >
        <svg className="w-5 h-5 fill-current transform rotate-45 -translate-x-0.5" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </form>
  );
}
