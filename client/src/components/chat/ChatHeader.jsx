import React from 'react';
import { EyeOff, ChevronLeft, Phone, Video } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

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

  return (
    <div className="glass-header px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button (Clean Icon-Only) */}
        <button
          onClick={onBackToSidebar}
          className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 shadow-sm transition-all active:scale-95 group -ml-1 flex items-center justify-center"
          title="Back to Contacts"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-300 group-hover:text-indigo-400 transform group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <Avatar
          name={selectedUser}
          customColor={targetUserInfo?.avatarColor}
          size="md"
          isOnline={isGlobal || targetUserInfo?.isOnline}
          showBadge={!isGlobal}
        />

        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-zinc-100">{selectedUser}</h2>
            {isGlobal ? (
              <StatusBadge isOnline={true} label={`${onlineCount} Online`} />
            ) : (
              <StatusBadge isOnline={targetUserInfo?.isOnline} status={userCallStatus} />
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {isGlobal
              ? "Public broadcast channel"
              : (targetUserInfo?.bio || "Direct Message")}
          </p>
        </div>
      </div>

      {/* Call Buttons & OTR Toggle Button (only in direct messages) */}
      {!isGlobal && (
        <div className="flex items-center gap-2">
          {onStartCall && (
            <>
              <button
                onClick={() => onStartCall('voice')}
                className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 transition-all active:scale-95"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartCall('video')}
                className="p-2 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-400 border border-white/10 hover:border-indigo-500/30 transition-all active:scale-95"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          {setIsOffTheRecord && (
            <button
              onClick={() => setIsOffTheRecord(!isOffTheRecord)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                isOffTheRecord
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              }`}
              title={isOffTheRecord ? "Off-the-Record active (messages will not be saved)" : "Toggle Off-the-Record mode"}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isOffTheRecord ? "OTR Active" : "OTR Mode"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
