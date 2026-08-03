import React from 'react';
import { Search } from 'lucide-react';
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
  setActiveTab,
  unreadCounts = {}
}) {
  const filteredUsers = (registeredUsers || []).filter(u =>
    u && u.username && u.username.toLowerCase().includes((searchQuery || '').toLowerCase()) &&
    u.username.toLowerCase() !== (currentUsername || '').toLowerCase()
  );

  const getLastMsg = (channelName) => {
    const list = chatHistory[channelName] || [];
    return list[list.length - 1];
  };

  // Sort active chats by latest message timestamp (most recent first)
  const getActiveChats = () => {
    return filteredUsers
      .filter(u => chatHistory[u.username] && chatHistory[u.username].length > 0)
      .sort((a, b) => {
        const lastA = getLastMsg(a.username);
        const lastB = getLastMsg(b.username);
        const timeA = lastA?.timestamp ? new Date(lastA.timestamp).getTime() : 0;
        const timeB = lastB?.timestamp ? new Date(lastB.timestamp).getTime() : 0;
        return timeB - timeA;
      });
  };

  const activeChats = activeTab === "chats" ? getActiveChats() : [];
  const contactsList = activeTab === "contacts" ? filteredUsers : [];

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
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-2 pl-9 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
        </div>
      </div>

      {/* Channel / Contact List */}
      <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-1">
        {/* Global Chat Item (Always available) */}
        <ContactItem
          name="Global Chat"
          isOnline={true}
          isSelected={selectedUser === "Global Chat"}
          onClick={() => onSelectContact("Global Chat")}
          lastMessage={getLastMsg("Global Chat")}
          bio="Public global chat channel"
        />

        {/* Section Header */}
        <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span>{activeTab === "chats" ? "Active Chats" : "All Contacts"}</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {activeTab === "chats" ? activeChats.length : contactsList.length}
          </span>
        </div>

        {/* User Items */}
        {activeTab === "chats" && activeChats.map((u) => (
          <ContactItem
            key={u._id || u.username}
            name={u.username}
            isOnline={u.isOnline}
            isSelected={selectedUser === u.username}
            onClick={() => onSelectContact(u.username)}
            lastMessage={getLastMsg(u.username)}
            bio={u.bio}
            avatarColor={u.avatarColor}
            avatarUrl={u.avatarUrl}
            unreadCount={unreadCounts[u.username.toLowerCase()] || 0}
          />
        ))}

        {activeTab === "contacts" && contactsList.map((u) => (
          <ContactItem
            key={u._id || u.username}
            name={u.username}
            isOnline={u.isOnline}
            isSelected={selectedUser === u.username}
            onClick={() => onSelectContact(u.username)}
            lastMessage={getLastMsg(u.username)}
            bio={u.bio}
            avatarColor={u.avatarColor}
            avatarUrl={u.avatarUrl}
            unreadCount={unreadCounts[u.username.toLowerCase()] || 0}
          />
        ))}

        {/* Empty state for Chats tab when no active DMs exist */}
        {activeTab === "chats" && activeChats.length === 0 && (
          <div className="p-4 text-center text-xs text-zinc-500 space-y-1">
            <p>No active direct chats yet.</p>
            <button
              onClick={() => setActiveTab("contacts")}
              className="text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              Explore Contacts →
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Tabs */}
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </aside>
  );
}
