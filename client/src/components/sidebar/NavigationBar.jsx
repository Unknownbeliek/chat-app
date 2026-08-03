import React from 'react';
import { ChatsIcon, ContactsIcon, ProfileIcon, SettingsIcon } from '../animated-icons';

export default function NavigationBar({ activeTab, setActiveTab, unreadCount = 0 }) {
  const tabs = [
    { id: "chats", label: "Chats", Icon: ChatsIcon, badge: unreadCount },
    { id: "contacts", label: "Contacts", Icon: ContactsIcon },
    { id: "profile", label: "Profile", Icon: ProfileIcon },
    { id: "settings", label: "Settings", Icon: SettingsIcon },
  ];

  return (
    <nav className="glass-header px-3 py-2 border-t border-white/10 flex items-center justify-around">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.Icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 cursor-pointer ${
              isActive
                ? "text-indigo-400 bg-indigo-500/10 font-semibold shadow-[0_0_12px_rgba(99,102,241,0.25)] border border-indigo-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
            }`}
          >
            <IconComponent className="w-5 h-5 pointer-events-none" />
            <span className="text-[10px] font-medium pointer-events-none">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-lg">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
