import React, { useState, useEffect, useRef } from "react";

const getUsernameColor = (username) => {
  if (!username) return "hsl(0, 0%, 70%)";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 85%, 72%)`; 
};

const getInitials = (name) => {
  if (!name) return "?";
  if (name === "Global Chat") return "🌍";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Chat() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("Global Chat");
  const [chatHistory, setChatHistory] = useState({ "Global Chat": [] });
  const [inputMessage, setInputMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ping-style bottom navigation tab state: "chats" | "contacts" | "settings" | "profile" | "chat"
  const [activeTab, setActiveTab] = useState("chats");
  
  const ws = useRef(null);
  const chatContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const audioRef = useRef(new Audio("/pop.mp3"));

  const getApiUrl = () => {
    return window.location.hostname === "localhost"
      ? "http://localhost:9000"
      : "https://chat-app-m8ua.onrender.com";
  };

  const getWsUrl = () => {
    return window.location.hostname === "localhost"
      ? "ws://localhost:9000"
      : "wss://chat-app-m8ua.onrender.com";
  };

  // Check stored user on load for automatic login persistence
  useEffect(() => {
    const storedUser = localStorage.getItem("ping_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.username) {
          setUsername(parsed.username);
          setIsLoggedIn(true);
        }
      } catch (e) {
        localStorage.removeItem("ping_user");
      }
    }
  }, []);

  const scrollToBottom = (instant = false) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: instant ? "auto" : "smooth"
      });
    } else {
      messageEndRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
    }
  };

  // Instant scroll to bottom when switching users or tabs
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedUser, activeTab]);

  // Smooth scroll to bottom when chat history receives new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [chatHistory]);

  useEffect(() => {
    if (!isLoggedIn || !username) return;

    ws.current = new WebSocket(getWsUrl());
    
    ws.current.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnecting(false);
      ws.current.send(JSON.stringify({
        type: 'register',
        username: username.trim()
      }));
    };
    
    ws.current.onclose = () => {
      setIsConnecting(true);
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "history") {
        setChatHistory(prev => ({
          ...prev,
          "Global Chat": data.data 
        }));
      }
      else if (data.type === "userList") {
        setOnlineUsers(data.users.filter(u => u.toLowerCase() !== username.toLowerCase()));
      } 
      else if (data.type === "global_chat") {
        setChatHistory(prev => ({
          ...prev,
          "Global Chat": [...(prev["Global Chat"] || []), data]
        }));
        
        if (data.sender && data.sender.toLowerCase() !== username.toLowerCase()) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
      else if (data.type === "private_chat") {
        const isSenderMe = data.sender && data.sender.toLowerCase() === username.toLowerCase();
        const chatPartner = isSenderMe ? data.recipient : data.sender;
        setChatHistory(prev => ({
          ...prev,
          [chatPartner]: [...(prev[chatPartner] || []), data]
        }));

        if (!isSenderMe) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    };

    return () => ws.current?.close();
  }, [isLoggedIn, username]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!username.trim() || !password.trim()) {
      setAuthError("Please fill out both username and password.");
      return;
    }

    setIsAuthLoading(true);

    try {
      const endpoint = authMode === "login" ? "/api/login" : "/api/register";
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || "Authentication failed. Please try again.");
      } else {
        localStorage.setItem("ping_user", JSON.stringify({ username: data.username }));
        setUsername(data.username);
        setPassword("");
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setAuthError("Unable to connect to backend server. Please make sure the server is running.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ping_user");
    ws.current?.close();
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setChatHistory({ "Global Chat": [] });
    setSelectedUser("Global Chat");
    setActiveTab("chats");
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedUser) return;

    if (ws.current?.readyState === WebSocket.OPEN) {
      if (selectedUser === "Global Chat") {
        ws.current.send(JSON.stringify({
          type: "global_chat",
          sender: username.trim(),
          message: inputMessage.trim(),
        }));
      } else {
        ws.current.send(JSON.stringify({
          type: "private_chat",
          sender: username.trim(),
          recipient: selectedUser,
          message: inputMessage.trim(),
        }));
      }
      setInputMessage("");
    }
  };

  const handleSelectContact = (user) => {
    setSelectedUser(user);
    setActiveTab("chat");
  };

  // Filter contacts by search query
  const filteredUsers = onlineUsers.filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()));

  // ---------------- AUTHENTICATION VIEW (Glassmorphism) ----------------
  if (!isLoggedIn) {
    return (
      <div className="relative h-screen h-dvh w-screen flex items-center justify-center p-4 font-sans select-none overflow-hidden bg-[#0d0b18]">
        {/* Background Glowing Blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="relative z-10 w-full max-w-sm glass-panel rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-1 drop-shadow">
              ping
            </h1>
            <p className="text-xs text-zinc-300 font-medium">
              {authMode === "login" ? "Sign in to access your ping chats" : "Create an account to start chatting"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                authMode === "login"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                authMode === "register"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 text-xs text-center font-medium animate-pulse">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 px-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input text-zinc-100 placeholder-zinc-400 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 px-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input text-zinc-100 placeholder-zinc-400 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/50 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-[0.98] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-xl shadow-purple-900/40 text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAuthLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{authMode === "login" ? "Sign In" : "Create Account"}</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-zinc-400 text-center mt-6 font-medium">
            🔒 Protected with bcrypt password hashing
          </p>
        </div>
      </div>
    );
  }

  // ---------------- CONNECTING STATE ----------------
  if (isConnecting) {
    return (
      <div className="relative h-screen h-dvh w-screen flex flex-col items-center justify-center gap-4 text-white select-none overflow-hidden bg-[#0d0b18]">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="relative z-10 w-12 h-12 rounded-full border-4 border-white/20 border-t-purple-400 animate-spin"></div>
        <h2 className="relative z-10 text-sm font-semibold text-zinc-300 tracking-wide">Connecting to ping...</h2>
      </div>
    );
  }

  const currentMessages = chatHistory[selectedUser] || [];

  // ping SIDEBAR / CHATS LIST COMPONENT
  const PingSidebarContent = () => (
    <div className="h-full flex flex-col relative bg-black/20">
      {/* ping Top Header */}
      <div className="px-5 py-3.5 glass-header flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight">ping</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-300 max-w-[90px] truncate">{username}</span>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ping Search Bar */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2">
          <span className="text-zinc-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search Chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-400 outline-none font-medium"
          />
        </div>
      </div>

      {/* ping Chats & Contacts List */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 space-y-1 chat-scroll">
        
        {/* Global Chat Item */}
        <button
          onClick={() => handleSelectContact("Global Chat")}
          className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${
            selectedUser === "Global Chat"
              ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-600/30 border border-white/20'
              : 'hover:bg-white/10 text-zinc-300'
          }`}
        >
          {/* Avatar Circle */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0">
            🌍
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white truncate">Global Chat</span>
              <span className="text-[10px] text-zinc-400 font-medium">Public</span>
            </div>
            <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium">
              {chatHistory["Global Chat"]?.length > 0
                ? `${chatHistory["Global Chat"].slice(-1)[0].sender}: ${chatHistory["Global Chat"].slice(-1)[0].message}`
                : "Public community chat"}
            </p>
          </div>
        </button>

        <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-indigo-300 uppercase tracking-[0.14em]">
          Your contacts on ping ({onlineUsers.length})
        </div>

        {filteredUsers.length === 0 ? (
          <p className="px-3 py-4 text-xs text-zinc-400 italic text-center">
            {searchQuery ? "No matching contacts" : "No other contacts online right now"}
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUser === user;
            const userMessages = chatHistory[user] || [];
            const lastMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

            return (
              <button
                key={user}
                onClick={() => handleSelectContact(user)}
                className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600/35 text-white border border-purple-400/40 shadow-md shadow-purple-600/20'
                    : 'hover:bg-white/10 text-zinc-300'
                }`}
              >
                {/* Contact Avatar Circle with Presence Badge */}
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-md"
                    style={{ backgroundColor: getUsernameColor(user) }}
                  >
                    {getInitials(user)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white truncate">{user}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {lastMsg ? lastMsg.timestamp : "online"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium">
                    {lastMsg ? lastMsg.message : "Active now · tap to chat"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ping FLOATING BOTTOM NAVIGATION BAR */}
      <div className="absolute bottom-3 left-4 right-4 z-30">
        <div className="glass-panel backdrop-blur-2xl bg-black/60 rounded-3xl p-1.5 border border-white/15 flex items-center justify-around shadow-2xl">
          
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
              activeTab === "chats"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-600/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="text-base">💬</span>
            <span className="text-[10px] font-semibold mt-0.5">Chats</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
              activeTab === "contacts"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-600/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="text-base">👥</span>
            <span className="text-[10px] font-semibold mt-0.5">Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-600/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="text-base">⚙️</span>
            <span className="text-[10px] font-semibold mt-0.5">Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-600/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-purple-500 text-[10px] font-bold text-white flex items-center justify-center">
              {getInitials(username)}
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Profile</span>
          </button>

        </div>
      </div>
    </div>
  );

  // ---------------- MAIN GLASS CHAT INTERFACE ----------------
  return (
    <div className="h-screen h-dvh w-screen flex items-center justify-center p-3 sm:p-6 md:p-8 bg-[#0d0b18] overflow-hidden font-sans relative">
      {/* Background Floating Glowing Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Main Glass Container Card — Centered vertically & horizontally */}
      <div className="relative z-10 w-full max-w-5xl h-[85vh] max-h-[820px] min-h-[480px] glass-panel rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* TWO-COLUMN VIEWPORT CONTAINER */}
        <div className="flex-1 flex overflow-hidden relative w-full h-full min-h-0">
          
          {/* LEFT SIDEBAR (ping Chats List) */}
          <div className={`
            w-full md:w-80 lg:w-96 shrink-0 h-full border-r border-white/10 flex flex-col
            transition-all duration-300 ease-out
            ${activeTab !== "chat" ? "flex" : "hidden md:flex"}
          `}>
            <PingSidebarContent />
          </div>

          {/* RIGHT CHAT CANVAS */}
          <div className={`
            flex-1 min-w-0 flex flex-col h-full bg-black/10
            transition-all duration-300 ease-out
            ${activeTab === "chat" ? "flex" : "hidden md:flex"}
          `}>
            
            {/* ping Sticky Chat Header */}
            <header className="px-4 sm:px-6 py-3.5 glass-header flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Button to Return to ping Contacts */}
                <button
                  onClick={() => setActiveTab("chats")}
                  className="md:hidden px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  ← Back
                </button>

                {/* Contact Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md shrink-0"
                  style={{ backgroundColor: selectedUser === "Global Chat" ? "#6366f1" : getUsernameColor(selectedUser) }}
                >
                  {getInitials(selectedUser)}
                </div>

                <div className="min-w-0">
                  <h2 className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                    {selectedUser === "Global Chat" ? "🌍 Global Chat" : selectedUser}
                  </h2>
                  <p className="text-[11px] text-emerald-400 font-medium mt-px truncate">
                    {selectedUser === "Global Chat"
                      ? "Public community channel"
                      : "online · tap for info"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* Messages Thread Container */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-3.5 chat-scroll">
              {currentMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 select-none">
                  <span className="text-5xl opacity-50">💬</span>
                  <p className="text-sm font-semibold text-zinc-300">No messages yet.</p>
                  <p className="text-xs text-zinc-400">Say hello to start the conversation!</p>
                </div>
              )}
              
              {currentMessages.map((msg, index) => {
                // CASE-INSENSITIVE CHECK: Ensure current user's sent messages align to the RIGHT!
                const isMe = Boolean(msg.sender) && (
                  msg.sender.toLowerCase() === username.toLowerCase() || 
                  msg.sender === "Me"
                );
                
                const senderDisplayName = isMe ? username : (msg.sender || "Anonymous");

                return (
                  <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} msg-enter`}>
                    {/* Username above bubble in Global Chat */}
                    {selectedUser === "Global Chat" && (
                      <span 
                        className={`text-[11px] font-bold mb-1 ${isMe ? 'mr-1' : 'ml-1'}`}
                        style={{ color: isMe ? "#a5b4fc" : getUsernameColor(msg.sender) }}
                      >
                        {senderDisplayName}
                      </span>
                    )}

                    <p className={`text-[14px] leading-relaxed break-words px-4 py-2.5 max-w-[85%] sm:max-w-[72%] ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl rounded-br-xs shadow-lg shadow-indigo-950/50'
                        : 'glass-card text-zinc-100 rounded-2xl rounded-bl-xs border border-white/10'
                    }`}>
                      {msg.message}
                    </p>
                    
                    <span className={`text-[10px] font-medium text-zinc-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            {/* Floating Glass Input Bar */}
            <div className="shrink-0 px-4 sm:px-6 py-4 glass-header border-t border-white/10">
              <div className="flex items-center gap-2 glass-input rounded-2xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-purple-400/60 focus-within:border-purple-400/50 transition-all duration-200">
                <input
                  type="text"
                  placeholder={`Message ${selectedUser}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-400 text-xs sm:text-sm px-2 py-1.5 outline-none font-medium"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all duration-150 shadow-md shadow-purple-900/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  Send
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}