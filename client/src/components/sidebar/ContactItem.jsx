import React from 'react';
import Avatar from '../common/Avatar';
import { formatTimestamp } from '../../utils/dateUtils';

export default function ContactItem({
  name,
  isOnline,
  isSelected,
  onClick,
  lastMessage,
  bio,
  avatarColor,
  avatarUrl,
  unreadCount = 0
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-slate-800/60 hover:border-slate-600/50 border-l-2 ${
        isSelected
          ? "border-indigo-500 bg-indigo-600/30 text-white shadow-lg shadow-indigo-500/10 backdrop-blur-md border-t border-r border-b border-t-white/10 border-r-white/10 border-b-white/10"
          : "border-transparent border-t border-r border-b border-transparent"
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
          <span className="font-semibold text-sm text-zinc-100 truncate">{name}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lastMessage?.timestamp && (
              <span className="text-[10px] text-zinc-400 font-mono">
                {formatTimestamp(lastMessage.timestamp)}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-400 truncate max-w-[180px]">
          {lastMessage ? lastMessage.message : (bio || "Available")}
        </p>
      </div>
    </button>
  );
}
