import React from 'react';
import ContactItem from './ContactItem';
import NavigationBar from './NavigationBar';

export default function PingSidebar({
  currentUsername,
  selectedUser,
  onSelectContact,
  registeredUsers,
  onlineCount,
  chatHistory,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab
}) {
  const filteredUsers = (registeredUsers || []).filter(u =>
    u && u.username && u.username.toLowerCase().includes((searchQuery || '').toLowerCase()) &&
    u.username.toLowerCase() !== (currentUsername || '').toLowerCase()
  );

  const getLastMsg = (channelName) => {
    const list = chatHistory[channelName] || [];
    return list[list.length - 1];
  };

  return (
    <aside className="w-full md:w-80 h-full flex flex-col glass-panel border-r border-white/10 overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 glass-header border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="font-bold text-lg tracking-wide text-zinc-100">ping</h1>
            <span className="text-[10px] text-emerald-400 font-medium block">
              🟢 {onlineCount} online
            </span>
          </div>
        </div>
        <span className="text-xs text-zinc-400 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">
          v1.0
        </span>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input px-3.5 py-2 pl-9 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">🔍</span>
        </div>
      </div>

      {/* Channel / Contact List */}
      <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-1">
        {/* Global Chat Item */}
        <ContactItem
          name="Global Chat"
          isOnline={true}
          isSelected={selectedUser === "Global Chat"}
          onClick={() => onSelectContact("Global Chat")}
          lastMessage={getLastMsg("Global Chat")}
          bio="Public global chat channel"
        />

        <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Direct Messages ({filteredUsers.length})
        </div>

        {filteredUsers.map((u) => (
          <ContactItem
            key={u._id || u.username}
            name={u.username}
            isOnline={u.isOnline}
            isSelected={selectedUser === u.username}
            onClick={() => onSelectContact(u.username)}
            lastMessage={getLastMsg(u.username)}
            bio={u.bio}
            avatarColor={u.avatarColor}
          />
        ))}
      </div>

      {/* Floating Bottom Navigation Tabs */}
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </aside>
  );
}
