import React from 'react';
import { Terminal, Trash2, EyeOff, UserCheck, CheckCircle2 } from 'lucide-react';
import Avatar from '../common/Avatar';

export const COMMANDS = [
  {
    cmd: '/clear',
    label: '/clear',
    description: 'Wipe local chat history for current conversation (does not delete from server)',
    icon: Trash2,
    syntax: '/clear'
  },
  {
    cmd: '/whisper',
    label: '/whisper [username] [message]',
    description: 'Send a private ephemeral message that auto-deletes after 10 seconds',
    icon: EyeOff,
    syntax: '/whisper '
  },
  {
    cmd: '/me',
    label: '/me [action]',
    description: 'Send a third-person action message formatted in italics',
    icon: UserCheck,
    syntax: '/me '
  }
];

export default function SlashCommandPalette({
  filterQuery = '',
  selectedIndex = 0,
  onSelectCommand,
  onClose,
  registeredUsers = [],
  currentUsername = '',
  selectedUser = ''
}) {
  const isWhisperMode = filterQuery.toLowerCase().startsWith('/whisper');

  // Handle Username Autocomplete when typing /whisper [user...]
  if (isWhisperMode) {
    const userSearch = filterQuery.replace(/^\/whisper\s*/i, '').trim().toLowerCase();

    // Combine registeredUsers with selectedUser (if valid direct chat partner) and current user
    const combinedMap = new Map();

    (registeredUsers || []).forEach(u => {
      if (u && u.username) {
        combinedMap.set(u.username.toLowerCase(), u);
      }
    });

    if (selectedUser && selectedUser !== "Global Chat" && !combinedMap.has(selectedUser.toLowerCase())) {
      combinedMap.set(selectedUser.toLowerCase(), {
        username: selectedUser,
        isOnline: true
      });
    }

    if (currentUsername && !combinedMap.has(currentUsername.toLowerCase())) {
      combinedMap.set(currentUsername.toLowerCase(), {
        username: currentUsername,
        isOnline: true
      });
    }

    const allCandidates = Array.from(combinedMap.values());

    const availableUsers = userSearch
      ? allCandidates.filter(u => u.username.toLowerCase().includes(userSearch))
      : allCandidates;

    if (availableUsers.length === 0) {
      return (
        <div className="absolute bottom-16 left-3 right-3 sm:right-auto sm:w-96 z-50 glass-card p-3 rounded-2xl border border-blue-500/30 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <EyeOff className="w-4 h-4 text-blue-400" />
            <span>No users found matching "<strong className="text-blue-300">{userSearch}</strong>"</span>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute bottom-16 left-3 right-3 sm:right-auto sm:w-96 z-50 glass-card rounded-2xl border border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.25)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-3.5 py-2 bg-blue-950/80 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
            <EyeOff className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Select Whisper Recipient</span>
          </div>
          <span className="text-[10px] text-blue-200/70 font-mono">Use ↑↓ & Enter</span>
        </div>

        <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto chat-scroll">
          {availableUsers.map((u, index) => {
            const isSelected = index === selectedIndex;
            const isSelf = u.username.toLowerCase() === currentUsername?.toLowerCase();
            const isExactMatch = userSearch && u.username.toLowerCase() === userSearch;

            return (
              <button
                key={u.username}
                type="button"
                onClick={() => onSelectCommand(`/whisper ${u.username} `)}
                className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected || isExactMatch
                    ? 'bg-blue-600/40 border border-blue-400 text-white shadow-md shadow-blue-500/20'
                    : 'hover:bg-blue-500/10 border border-transparent text-zinc-300'
                }`}
              >
                <Avatar
                  name={u.username}
                  customColor={u.avatarColor}
                  avatarUrl={u.avatarUrl}
                  size="sm"
                />

                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-xs text-blue-100 truncate">{u.username}</span>
                    {isSelf && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/30 text-blue-200 rounded font-mono">
                        You
                      </span>
                    )}
                    {isExactMatch && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${u.isOnline !== false ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-500'}`} />
                    <span className="text-[10px] text-zinc-400 capitalize">{u.isOnline !== false ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard Command Palette Mode (/clear, /whisper, /me)
  const query = filterQuery.toLowerCase().replace(/^\//, '');
  const filteredCommands = COMMANDS.filter(c =>
    c.cmd.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
  );

  if (filteredCommands.length === 0) {
    return (
      <div className="absolute bottom-16 left-3 right-3 sm:right-auto sm:w-96 z-50 glass-card p-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>No matching slash commands found for "<strong className="text-zinc-200">/{query}</strong>"</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-16 left-3 right-3 sm:right-auto sm:w-96 z-50 glass-card rounded-2xl border border-indigo-500/30 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95">
      <div className="px-3.5 py-2 bg-indigo-950/60 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Terminal Slash Commands</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">Use ↑↓ & Enter</span>
      </div>

      <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto chat-scroll">
        {filteredCommands.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;

          return (
            <button
              key={item.cmd}
              type="button"
              onClick={() => onSelectCommand(item.syntax)}
              className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/30 border border-indigo-500/50 text-white'
                  : 'hover:bg-white/5 border border-transparent text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-500/40 text-indigo-200' : 'bg-white/5 text-zinc-400'}`}>
                <Icon className="w-4 h-4 pointer-events-none" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-indigo-300">{item.label}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
