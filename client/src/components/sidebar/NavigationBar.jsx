import React from 'react';

export default function NavigationBar({ activeTab, setActiveTab, unreadCount = 0 }) {
  const tabs = [
    { id: "chats", label: "Chats", icon: "💬", badge: unreadCount },
    { id: "contacts", label: "Contacts", icon: "👥" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="glass-header px-3 py-2 border-t border-white/10 flex items-center justify-around">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "text-indigo-400 bg-indigo-500/10 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
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
