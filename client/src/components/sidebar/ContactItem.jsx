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
  avatarColor
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
        isSelected
          ? "bg-indigo-600/30 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 backdrop-blur-md"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <Avatar
        name={name}
        customColor={avatarColor}
        size="md"
        isOnline={isOnline}
        showBadge={true}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-semibold text-sm text-zinc-100 truncate">{name}</span>
          {lastMessage?.timestamp && (
            <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">
              {formatTimestamp(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 truncate">
          {lastMessage ? lastMessage.message : (bio || "Available")}
        </p>
      </div>
    </button>
  );
}
