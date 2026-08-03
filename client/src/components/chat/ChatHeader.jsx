import React from 'react';
import { EyeOff, ChevronLeft, Phone, Video } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

/**
 * Format a "last seen" timestamp into a human-readable relative string.
 */
export function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Offline';
  const now = Date.now();
  const then = new Date(lastSeen).getTime();
  if (isNaN(then)) return 'Offline';

  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Last seen just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Last seen ${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Last seen yesterday';
  return `Last seen ${diffDays}d ago`;
}

export default function ChatHeader({
  selectedUser,
  onlineCount,
  onBackToSidebar,
  targetUserInfo,
  isOffTheRecord,
  setIsOffTheRecord,
  onStartCall,
  callState
}) {
  const isGlobal = selectedUser === "Global Chat";

  const isInCallWithUser = !isGlobal && callState && callState.status !== 'idle' && callState.partnerName?.toLowerCase() === selectedUser?.toLowerCase();
  const userCallStatus = isInCallWithUser ? (callState.status === 'ringing' ? 'calling' : 'in_call') : null;

  const isOnline = isGlobal || targetUserInfo?.isOnline;

  const statusLabel = isGlobal
    ? `${onlineCount} Online`
    : userCallStatus
      ? null
      : (targetUserInfo?.isOnline
          ? "Online"
          : formatLastSeen(targetUserInfo?.lastSeen));

  return (
    <div className="glass-header px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button (Clean Icon-Only) */}
        <button
          onClick={onBackToSidebar}
          className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 shadow-sm transition-all active:scale-95 group -ml-1 flex items-center justify-center cursor-pointer"
          title="Back to Contacts"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-300 group-hover:text-indigo-400 transform group-hover:-translate-x-0.5 transition-transform pointer-events-none" />
        </button>

        <Avatar
          name={selectedUser}
          customColor={targetUserInfo?.avatarColor}
          avatarUrl={targetUserInfo?.avatarUrl}
          size="md"
          isOnline={isOnline}
          showBadge={!isGlobal}
        />

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-sm text-zinc-100">{selectedUser}</h2>
            <span className="text-zinc-600 text-xs">•</span>
            {isGlobal ? (
              <StatusBadge isOnline={true} label={`${onlineCount} Online`} />
            ) : (
              <StatusBadge isOnline={targetUserInfo?.isOnline} label={statusLabel} status={userCallStatus} />
            )}
          </div>
          <p className="text-xs text-zinc-400 truncate max-w-xs">
            {isGlobal
              ? "Public broadcast channel"
              : (targetUserInfo?.bio || "Direct Message")}
          </p>
        </div>
      </div>

      {/* Grouped Segmented Control Pill Bar */}
      {!isGlobal && (
        <div className="bg-white/5 p-1 rounded-2xl flex items-center gap-1 border border-white/10 backdrop-blur-md shadow-md">
          {onStartCall && (
            <>
              <button
                onClick={() => onStartCall('voice')}
                className="p-2 rounded-xl hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 cursor-pointer"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4 pointer-events-none" />
              </button>
              <button
                onClick={() => onStartCall('video')}
                className="p-2 rounded-xl hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-400 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 cursor-pointer"
                title="Start Video Call"
              >
                <Video className="w-4 h-4 pointer-events-none" />
              </button>
            </>
          )}

          {setIsOffTheRecord && (
            <button
              onClick={() => setIsOffTheRecord(!isOffTheRecord)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                isOffTheRecord
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              }`}
              title={isOffTheRecord ? "Off-the-Record active (messages will not be saved)" : "Toggle Off-the-Record mode"}
            >
              <EyeOff className="w-3.5 h-3.5 pointer-events-none" />
              <span className="hidden sm:inline pointer-events-none">{isOffTheRecord ? "OTR Active" : "OTR Mode"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
