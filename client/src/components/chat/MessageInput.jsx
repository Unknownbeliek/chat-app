import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Terminal, CheckCircle, Reply, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import SlashCommandPalette, { COMMANDS } from './SlashCommandPalette';
import { useWpmCalculator } from '../../hooks/useWpmCalculator';
import { SendIcon } from '../animated-icons';
import { renderAppleEmojis, hasEmoji } from '../../utils/emojiUtils';

export default function MessageInput({
  inputMessage,
  setInputMessage,
  onSendMessage,
  onTyping,
  disabled = false,
  selectedUser,
  currentUsername,
  onClearLocalChat,
  sendMessage,
  registeredUsers = [],
  replyTo = null,
  setReplyTo = () => {}
}) {
  const { wpm, registerKeystroke } = useWpmCalculator();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const emojiBtnRef = useRef(null);

  // Focus input field when replyTo is selected
  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const showSlashPalette = inputMessage.startsWith('/') && !disabled;
  const filterQuery = showSlashPalette ? inputMessage : '';
  const isWhisperMode = filterQuery.toLowerCase().startsWith('/whisper');

  // Compute candidate whisper users including registered users, active chat user, and self
  const combinedMap = new Map();
  (registeredUsers || []).forEach(u => {
    if (u && u.username) combinedMap.set(u.username.toLowerCase(), u);
  });
  if (selectedUser && selectedUser !== "Global Chat" && !combinedMap.has(selectedUser.toLowerCase())) {
    combinedMap.set(selectedUser.toLowerCase(), { username: selectedUser, isOnline: true });
  }
  if (currentUsername && !combinedMap.has(currentUsername.toLowerCase())) {
    combinedMap.set(currentUsername.toLowerCase(), { username: currentUsername, isOnline: true });
  }
  const allWhisperCandidates = Array.from(combinedMap.values());

  const whisperTargetQuery = isWhisperMode
    ? filterQuery.replace(/^\/whisper\s*/i, '').trim().toLowerCase().split(/\s+/)[0]
    : '';

  const whisperUsers = isWhisperMode
    ? (whisperTargetQuery ? allWhisperCandidates.filter(u => u.username.toLowerCase().includes(whisperTargetQuery)) : allWhisperCandidates)
    : [];

  const filteredCommands = COMMANDS.filter(c =>
    c.cmd.toLowerCase().includes(filterQuery.toLowerCase().replace(/^\//, '')) ||
    c.description.toLowerCase().includes(filterQuery.toLowerCase().replace(/^\//, ''))
  );

  const currentList = isWhisperMode ? whisperUsers : filteredCommands;

  // Check if typed recipient matches a valid candidate user
  const whisperMatch = isWhisperMode ? inputMessage.match(/^\/whisper\s+([^\s]+)/i) : null;
  const typedWhisperTarget = whisperMatch ? whisperMatch[1] : null;
  const matchedRecipient = typedWhisperTarget
    ? allWhisperCandidates.find(u => u.username.toLowerCase() === typedWhisperTarget.toLowerCase())
    : null;

  // Close emoji picker popover when clicking/touching outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Reset palette selection index when query changes
  useEffect(() => {
    setPaletteIndex(0);
  }, [inputMessage]);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
    // Picker remains open for multi-emoji selection until clicking/touching outside
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectCommand = (syntax) => {
    setInputMessage(syntax);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const executeSlashCommand = (cmdText) => {
    const trimmed = cmdText.trim();

    // 1. /clear
    if (trimmed.toLowerCase() === '/clear') {
      onClearLocalChat?.();
      showToast("Chat cleared locally");
      setInputMessage("");
      return true;
    }

    // 2. /whisper [username] [message]
    if (trimmed.toLowerCase().startsWith('/whisper')) {
      const match = trimmed.match(/^\/whisper\s+([^\s]+)\s+(.+)/i);
      if (match) {
        const targetUser = match[1];
        const whisperText = match[2];
        sendMessage?.('whisper', {
          sender: currentUsername,
          recipient: targetUser,
          message: whisperText,
          whisper: true,
          ttl: 10
        });
        showToast(`🤫 Ephemeral whisper sent to ${targetUser} (10s TTL)`);
        setInputMessage("");
        return true;
      } else {
        showToast("Usage: /whisper [username] [message]");
        return true;
      }
    }

    // 3. /me [action]
    if (trimmed.toLowerCase().startsWith('/me')) {
      const match = trimmed.match(/^\/me\s+(.+)/i);
      if (match) {
        const actionText = match[1];
        const formattedAction = `*${currentUsername} ${actionText}*`;

        if (selectedUser === "Global Chat") {
          sendMessage?.('global_chat', {
            sender: currentUsername,
            message: formattedAction,
            isAction: true
          });
        } else {
          sendMessage?.('private_chat', {
            sender: currentUsername,
            recipient: selectedUser,
            message: formattedAction,
            isAction: true
          });
        }
        setInputMessage("");
        return true;
      } else {
        showToast("Usage: /me [action]");
        return true;
      }
    }

    showToast("Unknown command. Type / for command palette.");
    return false;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || disabled) return;

    if (inputMessage.startsWith('/')) {
      executeSlashCommand(inputMessage);
      setShowEmojiPicker(false);
    } else {
      onSendMessage(replyTo ? { replyTo: { id: replyTo._id, sender: replyTo.sender, message: replyTo.message } } : null);
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showSlashPalette && currentList.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPaletteIndex(prev => (prev + 1) % currentList.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPaletteIndex(prev => (prev - 1 + currentList.length) % currentList.length);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const selected = currentList[paletteIndex];
        if (selected) {
          if (isWhisperMode) {
            handleSelectCommand(`/whisper ${selected.username} `);
          } else {
            handleSelectCommand(selected.syntax);
          }
        }
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        if (isWhisperMode) {
          const selectedUserItem = currentList[paletteIndex];
          const hasMessageContent = inputMessage.match(/^\/whisper\s+[^\s]+\s+.+/i);

          if (hasMessageContent) {
            e.preventDefault();
            handleSubmit();
            return;
          } else if (selectedUserItem) {
            e.preventDefault();
            handleSelectCommand(`/whisper ${selectedUserItem.username} `);
            return;
          }
        }

        // Standard command mode
        const currentCmd = currentList[paletteIndex];
        if (inputMessage.trim() === '/clear' || inputMessage.match(/^\/(whisper|me)\s+.+/i)) {
          e.preventDefault();
          handleSubmit();
          return;
        } else if (currentCmd) {
          e.preventDefault();
          handleSelectCommand(currentCmd.syntax);
          return;
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 glass-header border-t border-white/10 flex flex-col gap-2 flex-shrink-0 z-20 relative"
    >
      {/* WhatsApp-Style Replying-To Preview Banner */}
      {replyTo && (
        <div className="w-full bg-slate-900/95 border border-indigo-500/40 rounded-xl px-3 py-2 flex items-center justify-between text-xs backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 select-none">
          <div className="flex items-center gap-2.5 overflow-hidden border-l-4 border-indigo-400 pl-2">
            <Reply className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="truncate">
              <div className="font-semibold text-indigo-300 text-[11px]">
                Replying to <span className="text-white">{replyTo.sender}</span>
              </div>
              <div className="text-zinc-300 text-[12px] truncate line-clamp-1">
                {replyTo.message}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Cancel Reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 w-full">
      {/* Verified Whisper Recipient Blue Badge */}
      {matchedRecipient && (
        <div className="absolute -top-9 left-3 z-40 px-3 py-1 rounded-xl bg-blue-950/90 border border-blue-500/50 text-xs font-semibold text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.35)] backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Verified Recipient: <strong className="text-blue-100">{matchedRecipient.username}</strong></span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-xs font-semibold text-indigo-300 shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-indigo-400 pointer-events-none" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Slash Command Palette Popover */}
      {showSlashPalette && (
        <SlashCommandPalette
          filterQuery={filterQuery}
          selectedIndex={paletteIndex}
          onSelectCommand={handleSelectCommand}
          onClose={() => setInputMessage('')}
          registeredUsers={registeredUsers}
          currentUsername={currentUsername}
          selectedUser={selectedUser}
        />
      )}

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
      <div className="flex-1 min-w-0 relative flex items-center">
        {/* Live Apple Emoji Input Overlay */}
        {hasEmoji(inputMessage) && (
          <div className="absolute inset-0 pointer-events-none pl-22 sm:pl-24 pr-12 sm:pr-16 py-3 flex items-center overflow-hidden whitespace-pre text-xs sm:text-sm font-sans z-10">
            <span className="text-zinc-100 flex items-center">
              {renderAppleEmojis(inputMessage)}
            </span>
          </div>
        )}

        {/* Attachment, Emoji & Slash Trigger Buttons */}
        <div className="absolute left-2.5 sm:left-3 flex items-center gap-1 sm:gap-1.5 z-20">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSelectCommand('/')}
            className="p-1 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            title="Slash Commands (/)"
          >
            <Terminal className="w-4 h-4 pointer-events-none" />
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => alert("Attachment upload coming soon!")}
            className="p-1 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            title="Attach Files / Media"
          >
            <Paperclip className="w-4 h-4 pointer-events-none" />
          </button>

          <button
            ref={emojiBtnRef}
            type="button"
            disabled={disabled}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-base text-zinc-400 hover:text-amber-400 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all leading-none cursor-pointer"
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
          placeholder={disabled ? "Waking up server..." : "Type a message or / for commands..."}
          className={`w-full bg-white/5 pl-22 sm:pl-24 pr-12 sm:pr-16 py-3 rounded-2xl text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-inner backdrop-blur-md font-sans ${
            hasEmoji(inputMessage) ? "text-transparent caret-white" : "text-zinc-100"
          } ${
            matchedRecipient
              ? "border border-blue-500/80 focus:ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              : "border border-white/10 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          }`}
        />

        {wpm > 0 && !disabled && (
          <span className="absolute right-3 text-[10px] text-indigo-400 font-mono bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30 select-none pointer-events-none hidden sm:inline-block">
            {wpm} WPM
          </span>
        )}
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={disabled || !inputMessage.trim()}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold flex items-center justify-center shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 flex-shrink-0 cursor-pointer"
        title="Send Message"
      >
        <SendIcon className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
      </button>
      </div>
    </form>
  );
}
