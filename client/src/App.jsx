import React, { useState, useEffect, useRef } from "react";

const getUsernameColor = (username) => {
  if (!username) return "hsl(0, 0%, 50%)";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 65%)`; 
};

export default function Chat() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("Global Chat"); // Default to global
  
  // Chat history now stores arrays for private users AND "Global Chat"
  const [chatHistory, setChatHistory] = useState({ "Global Chat": [] });
  const [inputMessage, setInputMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  
  const ws = useRef(null);
  const messageEndRef = useRef(null);
  const audioRef = useRef(new Audio("/pop.mp3"));

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, selectedUser]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const wsUrl = window.location.hostname === "localhost"
      ? "ws://localhost:9000"
      : "wss://chat-app-m8ua.onrender.com";

    ws.current = new WebSocket(wsUrl);
    
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
      if (data.type === "userList") {
        setOnlineUsers(data.users.filter(u => u !== username));
      } 
      else if (data.type === "global_chat") {
        setChatHistory(prev => ({
          ...prev,
          "Global Chat": [...(prev["Global Chat"] || []), data]
        }));
        
        if (data.sender !== username) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
      else if (data.type === "private_chat") {
        const chatPartner = data.sender === username ? data.recipient : data.sender;
        setChatHistory(prev => ({
          ...prev,
          [chatPartner]: [...(prev[chatPartner] || []), data]
        }));

        if (data.sender !== username) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    };

    return () => ws.current?.close();
  }, [isLoggedIn, username]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) setIsLoggedIn(true);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedUser) return;

    if (ws.current?.readyState === WebSocket.OPEN) {
      if (selectedUser === "Global Chat") {
        ws.current.send(JSON.stringify({
          type: "global_chat",
          message: inputMessage.trim(),
        }));
      } else {
        ws.current.send(JSON.stringify({
          type: "private_chat",
          recipient: selectedUser,
          message: inputMessage.trim(),
        }));
      }
      setInputMessage("");
    }
  };

  // ---------------- RENDERING ----------------

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 font-sans select-none overflow-hidden">
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="blob blob-1 absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/40 blur-3xl" />
          <div className="blob blob-2 absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="blob blob-3 absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-purple-300 via-pink-300 to-indigo-400 bg-clip-text text-transparent mb-1">
              Ping
            </h1>
            <p className="text-sm text-white/50">Sign in to continue chatting</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/8 backdrop-blur-sm border border-white/15 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/50 transition-all duration-200"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/8 backdrop-blur-sm border border-white/15 text-white placeholder-white/30 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/50 transition-all duration-200"
            />
            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-semibold py-3 rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/30 text-sm cursor-pointer"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center gap-5 text-white select-none overflow-hidden">
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="blob blob-1 absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/40 blur-3xl" />
          <div className="blob blob-2 absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-blue-500/30 blur-3xl" />
        </div>

        <div className="w-11 h-11 rounded-full border-4 border-white/20 border-t-purple-400 animate-spin"></div>
        <h2 className="text-lg font-semibold text-white/70 tracking-wide">Connecting to server...</h2>
      </div>
    );
  }

  const currentMessages = chatHistory[selectedUser] || [];

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob blob-1 absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/40 blur-3xl" />
        <div className="blob blob-2 absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="blob blob-3 absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="w-full max-w-5xl h-[90vh] bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* SIDEBAR: Online Users */}
        <div className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-black/20">
          <div className="px-5 py-5 border-b border-white/10">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400/80"></span>
              Ping
            </h2>
            <p className="text-xs text-white/40 mt-0.5">Logged in as <span className="font-medium text-white/70">{username}</span></p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 chat-scroll">
            
            {/* Dedicated Global Chat Button */}
            <button
              onClick={() => setSelectedUser("Global Chat")}
              className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-3 font-semibold text-sm cursor-pointer ${
                selectedUser === "Global Chat"
                  ? 'bg-violet-500/25 text-purple-200 border border-violet-400/40 shadow-sm shadow-violet-500/20'
                  : 'hover:bg-white/8 text-purple-300/80'
              }`}
            >
              <span className="text-base">🌍</span> Global Chat
            </button>

            <div className="my-3 mx-2 border-t border-white/10"></div>
            
            <h3 className="px-3 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Online Contacts</h3>
            
            {onlineUsers.length === 0 ? (
              <p className="px-3 text-xs text-white/25 italic">Waiting for others...</p>
            ) : (
              onlineUsers.map(user => (
                <button
                  key={user}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-3 text-sm cursor-pointer ${
                    selectedUser === user
                      ? 'bg-indigo-500/25 text-white border border-indigo-400/40 shadow-sm shadow-indigo-500/20'
                      : 'hover:bg-white/8 text-white/70'
                  }`}
                >
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0 shadow-sm shadow-emerald-400/80"></span>
                  <span className="truncate">{user}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col bg-transparent min-w-0">
          <header className="px-6 py-4 border-b border-white/10 flex items-center gap-3 shrink-0 bg-white/5 backdrop-blur-sm">
            {selectedUser !== "Global Chat" && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/60"></span>
            )}
            <div>
              <h2 className="font-semibold text-white text-base leading-tight">
                {selectedUser === "Global Chat" ? "🌍 Global Public Chat" : selectedUser}
              </h2>
              <p className={`text-xs mt-0.5 ${selectedUser === "Global Chat" ? 'text-white/40' : 'text-emerald-400/80'}`}>
                {selectedUser === "Global Chat" ? "Public channel · Everyone can see messages" : "Direct Message · Private 1-on-1"}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 chat-scroll">
            {currentMessages.length === 0 && (
              <div className="flex flex-col justify-center items-center h-full text-white/20 gap-2 select-none">
                <span className="text-3xl opacity-50">💬</span>
                <p className="text-sm">No messages yet. Say hello!</p>
              </div>
            )}
            
            {currentMessages.map((msg, index) => {
              const isMe = msg.sender === username;
              return (
                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} msg-enter`}>
                  
                  {/* Show who sent the message if we are in Global Chat */}
                  {selectedUser === "Global Chat" && !isMe && (
                    <span 
                      className="text-[11px] font-bold mb-1 px-1" 
                      style={{ color: getUsernameColor(msg.sender) }}
                    >
                      {msg.sender}
                    </span>
                  )}

                  <span className="text-[10px] text-white/30 mb-1 px-1">{msg.timestamp}</span>
                  <p className={`text-sm leading-relaxed break-words px-4 py-2.5 max-w-[75%] ${
                    isMe
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-l-2xl rounded-tr-2xl shadow-lg shadow-indigo-700/40'
                      : 'bg-white/10 backdrop-blur-md text-white/90 rounded-r-2xl rounded-bl-2xl border border-white/15'
                  }`}>
                    {msg.message}
                  </p>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>

          <div className="px-4 py-4 border-t border-white/10 shrink-0 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-purple-400/50 focus-within:border-purple-400/40 transition-all duration-200">
              <input
                type="text"
                placeholder={`Message ${selectedUser}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-transparent text-white placeholder-white/30 text-sm px-3 py-2 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-150 ease-out shadow-md shadow-indigo-600/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}