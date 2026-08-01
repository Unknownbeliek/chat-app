import React from 'react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

export default function ChatHeader({
  selectedUser,
  onlineCount,
  onBackToSidebar,
  targetUserInfo,
  isOffTheRecord,
  setIsOffTheRecord
}) {
  const isGlobal = selectedUser === "Global Chat";

  return (
    <div className="glass-header px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={onBackToSidebar}
          className="md:hidden p-2 -ml-1 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm flex items-center gap-1"
        >
          ← <span className="text-xs">Contacts</span>
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
              <StatusBadge isOnline={targetUserInfo?.isOnline} />
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {isGlobal
              ? "Public broadcast channel"
              : (targetUserInfo?.bio || "Direct Message")}
          </p>
        </div>
      </div>

      {/* OTR Toggle Button (only in direct messages) */}
      {!isGlobal && setIsOffTheRecord && (
        <button
          onClick={() => setIsOffTheRecord(!isOffTheRecord)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
            isOffTheRecord
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
          }`}
          title={isOffTheRecord ? "Off-the-Record active (messages will not be saved)" : "Toggle Off-the-Record mode"}
        >
          <span>🕵️</span>
          <span className="hidden sm:inline">{isOffTheRecord ? "OTR Active" : "OTR Mode"}</span>
        </button>
      )}
    </div>
  );
}
