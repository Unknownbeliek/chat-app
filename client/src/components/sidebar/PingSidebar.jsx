import React from 'react';
import { Search, X } from 'lucide-react';
import ContactItem from './ContactItem';
import NavigationBar from './NavigationBar';

export default function PingSidebar({
  currentUsername,
  selectedUser,
  onSelectContact,
  registeredUsers = [],
  historicalChats = [],
  onlineCount,
  chatHistory = {},
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  unreadCounts = {}
}) {
  // Case-insensitive multi-field search matcher
  const matchesQuery = (u, q) => {
    if (!q || !q.trim()) return true;
    const query = q.toLowerCase().trim();
    if (!u) return false;

    const username = (u.username || u.partner || '').toLowerCase();
    const displayName = (u.displayName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const bio = (u.bio || '').toLowerCase();

    return (
      username.includes(query) ||
      displayName.includes(query) ||
      email.includes(query) ||
      bio.includes(query)
    );
  };

  const filteredUsers = (registeredUsers || []).filter(u =>
    u && u.username &&
    u.username.toLowerCase() !== (currentUsername || '').toLowerCase() &&
    matchesQuery(u, searchQuery)
  );

  const getLastMsg = (channelName) => {
    const list = chatHistory[channelName] || [];
    return list[list.length - 1];
  };

  // Sort active chats by latest message timestamp (most recent first)
  const getActiveChats = () => {
    const userMap = new Map();

    // 1. Add historical chats from DB
    (historicalChats || []).forEach(h => {
      if (h && (h.partner || h.username)) {
        const name = h.partner || h.username;
        if (name.toLowerCase() === (currentUsername || '').toLowerCase()) return;

        const regMatch = (registeredUsers || []).find(r => r.username.toLowerCase() === name.toLowerCase());

        userMap.set(name.toLowerCase(), {
          _id: regMatch?._id || name,
          username: name,
          displayName: regMatch?.displayName || name,
          email: regMatch?.email || '',
          isOnline: name.toLowerCase() === 'pingbot' ? true : (regMatch ? regMatch.isOnline : !!h.isOnline),
          lastSeen: regMatch ? regMatch.lastSeen : h.lastSeen,
          bio: regMatch?.bio || h.bio || '',
          avatarColor: regMatch?.avatarColor || h.avatarColor || '#6366f1',
          avatarUrl: regMatch?.avatarUrl || h.avatarUrl || '',
          lastMessage: getLastMsg(name) || h.lastMessage,
          lastMessageSnippet: h.lastMessage,
          lastMessageSender: h.lastMessageSender,
          lastMessageAt: getLastMsg(name)?.timestamp || h.lastMessageAt,
          unreadCount: unreadCounts[name.toLowerCase()] ?? h.unreadCount ?? 0
        });
      }
    });

    // 2. Add registered users with active in-memory chat history or unread messages
    (registeredUsers || []).forEach(u => {
      if (!u || !u.username || u.username.toLowerCase() === (currentUsername || '').toLowerCase()) return;
      const uLower = u.username.toLowerCase();
      const hasInMemoryHistory = chatHistory[u.username] && chatHistory[u.username].length > 0;
      const hasUnread = (unreadCounts[uLower] || 0) > 0;

      if (hasInMemoryHistory || hasUnread) {
        const existing = userMap.get(uLower) || {};
        const lastInMemory = getLastMsg(u.username);

        userMap.set(uLower, {
          ...existing,
          _id: u._id || u.username,
          username: u.username,
          displayName: u.displayName || u.username,
          email: u.email || existing.email || '',
          isOnline: uLower === 'pingbot' ? true : u.isOnline,
          lastSeen: u.lastSeen,
          bio: u.bio || existing.bio || '',
          avatarColor: u.avatarColor || existing.avatarColor || '#6366f1',
          avatarUrl: u.avatarUrl || existing.avatarUrl || '',
          lastMessage: lastInMemory || existing.lastMessage,
          lastMessageSnippet: existing.lastMessageSnippet || (typeof lastInMemory === 'string' ? lastInMemory : lastInMemory?.message),
          lastMessageSender: existing.lastMessageSender || lastInMemory?.sender,
          lastMessageAt: lastInMemory?.timestamp || existing.lastMessageAt,
          unreadCount: unreadCounts[uLower] ?? existing.unreadCount ?? 0
        });
      }
    });

    // Filter by search query
    const list = Array.from(userMap.values()).filter(u => matchesQuery(u, searchQuery));

    // Sort by latest message timestamp descending
    return list.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  };

  const activeChats = activeTab === "chats" ? getActiveChats() : [];
  const contactsList = activeTab === "contacts" ? filteredUsers : [];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const hasSearch = searchQuery && searchQuery.trim().length > 0;
  const isGlobalChatVisible = !hasSearch || matchesQuery({ username: "Global Chat", bio: "Public global chat channel" }, searchQuery);

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

      {/* Search Input Bar */}
      <div className="p-3 border-b border-white/5">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-2 pl-9 pr-8 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
          />
          {hasSearch && (
            <button
              onClick={() => setSearchQuery('')}
              title="Clear search (Esc)"
              className="absolute right-2.5 p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Channel / Contact List */}
      <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-1">
        {/* Global Chat Item (Visible if matches search query or no search query active) */}
        {isGlobalChatVisible && (
          <ContactItem
            name="Global Chat"
            currentUsername={currentUsername}
            isOnline={true}
            isSelected={selectedUser === "Global Chat"}
            onClick={() => onSelectContact("Global Chat")}
            lastMessage={getLastMsg("Global Chat")}
            bio="Public global chat channel"
          />
        )}

        {/* PingBot (Always-visible AI assistant shortcut) */}
        {(!hasSearch || matchesQuery({ username: "PingBot", bio: "AI Assistant & Coding Companion" }, searchQuery)) && (
          <ContactItem
            name="PingBot"
            currentUsername={currentUsername}
            isOnline={true}
            isSelected={selectedUser === "PingBot"}
            onClick={() => onSelectContact("PingBot")}
            lastMessage={getLastMsg("PingBot")}
            bio="🤖 AI Assistant & Coding Companion"
            avatarColor="#8b5cf6"
          />
        )}

        {/* Section Header */}
        <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span>{activeTab === "chats" ? "Active Chats" : "All Contacts"}</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {activeTab === "chats" ? activeChats.length : contactsList.length}
          </span>
        </div>

        {/* Active Chats List */}
        {activeTab === "chats" && activeChats.map((u) => (
          <ContactItem
            key={u._id || u.username}
            name={u.username}
            currentUsername={currentUsername}
            isOnline={u.isOnline}
            isSelected={selectedUser === u.username}
            onClick={() => onSelectContact(u.username)}
            lastMessage={u.lastMessage}
            lastMessageSnippet={u.lastMessageSnippet}
            lastMessageSender={u.lastMessageSender}
            lastMessageAt={u.lastMessageAt}
            bio={u.bio}
            avatarColor={u.avatarColor}
            avatarUrl={u.avatarUrl}
            unreadCount={u.unreadCount}
            lastSeen={u.lastSeen}
          />
        ))}

        {/* Contacts List */}
        {activeTab === "contacts" && contactsList.map((u) => (
          <ContactItem
            key={u._id || u.username}
            name={u.username}
            currentUsername={currentUsername}
            isOnline={u.isOnline}
            isSelected={selectedUser === u.username}
            onClick={() => onSelectContact(u.username)}
            lastMessage={getLastMsg(u.username)}
            bio={u.bio}
            avatarColor={u.avatarColor}
            avatarUrl={u.avatarUrl}
            unreadCount={unreadCounts[u.username.toLowerCase()] || 0}
            lastSeen={u.lastSeen}
          />
        ))}

        {/* Empty state for search query with zero matches */}
        {hasSearch && (activeTab === "chats" ? activeChats.length === 0 : contactsList.length === 0) && (
          <div className="p-6 text-center text-xs text-zinc-400 space-y-3 glass-card rounded-2xl my-4 mx-2 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Search className="w-5 h-5 pointer-events-none" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200 text-sm">No contacts found</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                No results matching "<span className="text-indigo-300 font-medium">{searchQuery}</span>"
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white text-xs font-semibold border border-white/10 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              Clear search (Esc)
            </button>
          </div>
        )}

        {/* Empty state for Chats tab when no active DMs exist at all */}
        {!hasSearch && activeTab === "chats" && activeChats.length === 0 && (
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
