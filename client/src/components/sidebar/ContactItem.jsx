import React, { useState, useRef } from 'react';
import { VolumeX, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatTimestamp } from '../../utils/dateUtils';
import { formatLastSeen } from '../chat/ChatHeader';
import { renderAppleEmojis } from '../../utils/emojiUtils';

export default function ContactItem({
  name,
  currentUsername,
  isOnline,
  isSelected,
  onClick,
  lastMessage,
  lastMessageSnippet,
  lastMessageSender,
  lastMessageAt,
  bio,
  avatarColor,
  avatarUrl,
  unreadCount = 0,
  lastSeen,
  onMuteContact,
  onClearChat
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Extract text message content
  const snippetText = typeof lastMessage === 'string'
    ? lastMessage
    : (lastMessage?.message || lastMessageSnippet || '');

  const sender = lastMessageSender || lastMessage?.sender;
  const timestamp = lastMessageAt || lastMessage?.timestamp;

  const getSubtext = () => {
    if (snippetText) {
      if (sender) {
        const isSelf = currentUsername && sender.toLowerCase() === currentUsername.toLowerCase();
        return `${isSelf ? 'You: ' : ''}${snippetText}`;
      }
      return snippetText;
    }
    if (isOnline) return bio || "Available";
    return formatLastSeen(lastSeen) || bio || "Offline";
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Swipe left (negative deltaX) to reveal quick actions
    if (deltaX < 0 && deltaX > -120 && deltaY < 20) {
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -50) {
      setSwipeOffset(-100); // Lock open quick action menu
    } else {
      setSwipeOffset(0);
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden rounded-xl my-0.5 group"
    >
      {/* Swipe Left Quick Action Buttons (Behind item - hidden by default unless swiping) */}
      <div className={`absolute right-0 top-0 bottom-0 flex items-center bg-slate-900 border border-white/10 rounded-xl overflow-hidden z-0 transition-opacity duration-150 ${
        swipeOffset < 0 ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(prev => !prev);
            if (onMuteContact) onMuteContact(name);
            setSwipeOffset(0);
          }}
          className={`h-full px-3 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            isMuted ? "bg-amber-600/60 text-amber-200" : "bg-indigo-600/60 text-indigo-100 hover:bg-indigo-600"
          }`}
          title="Mute Notifications"
        >
          <VolumeX className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClearChat) onClearChat(name);
            setSwipeOffset(0);
          }}
          className="h-full px-3 bg-rose-600/60 hover:bg-rose-600 text-rose-100 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Contact Card */}
      <button
        onClick={() => {
          if (swipeOffset !== 0) {
            setSwipeOffset(0);
            return;
          }
          onClick();
        }}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-transform duration-150 ease-out border-l-2 relative z-10 cursor-pointer ${
          isSelected
            ? "border-indigo-500 bg-slate-900/95 text-white shadow-lg shadow-indigo-500/10 backdrop-blur-md border-t border-r border-b border-indigo-500/30"
            : hasUnread
            ? "border-purple-500 bg-slate-900/95 text-zinc-100 border-t border-r border-b border-purple-500/20 hover:bg-slate-850"
            : "border-transparent bg-slate-900/95 text-zinc-300 opacity-90 hover:opacity-100 hover:bg-slate-800/80 border-t border-r border-b border-transparent"
        }`}
      >
        <Avatar
          name={name}
          customColor={avatarColor}
          avatarUrl={avatarUrl}
          size="md"
          isOnline={isOnline}
          showBadge={true}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <span className={`font-semibold text-sm truncate ${hasUnread ? "text-white font-bold" : "text-zinc-100"}`}>
                {name}
              </span>
              {isMuted && (
                <VolumeX className="w-3 h-3 text-zinc-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {timestamp && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatTimestamp(timestamp)}
                </span>
              )}
              {hasUnread && (
                <span className="bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse shadow-sm shadow-purple-500/50">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <p className={`text-xs truncate max-w-[180px] ${hasUnread ? "text-purple-200 font-medium" : "text-zinc-400"}`}>
            {renderAppleEmojis(getSubtext())}
          </p>
        </div>
      </button>
    </div>
  );
}
