import React, { useState, useEffect, useRef } from "react";

// Helper function to generate HSL color based on username
const getUsernameColor = (username) => {
  if (!username) return "hsl(0, 0%, 50%)";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`; // Lightened the color slightly for better dark mode contrast
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);

  const usernameRef = useRef(username);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const ws = useRef(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(
    new Audio("/pop-1.mp3")
  );

  // Auto-scroll to bottom on new message
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to WebSocket Server on Component Mount
  useEffect(() => {
    const wsUrl = window.location.hostname === "localhost"
      ? "ws://localhost:9000"
      : "wss://chat-app-m8ua.onrender.com";

    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnecting(false);
    };
    
    ws.current.onclose = () => {
      console.log("Disconnected from server");
      setIsConnecting(true);
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "history") {
        setMessages(data.data);
      } else if (data.type === "chat") {
        setMessages((prev) => [...prev, data]);

        // Play sound if message is from another user
        if (data.username !== usernameRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {
            console.log("Audio playback requires user interaction first.");
          });
        }
      } else if (data.type === "userCount") {
        setOnlineCount(data.count);
      } else if (data.type === "typing") {
        setTypingUser(data.username);

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser("");
        }, 1200);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  // Handle typing notification
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (username.trim() && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "typing",
          username: username.trim(),
        })
      );
    }
  };

  // Send Message
  const sendMessage = () => {
    if (!username.trim()) {
      alert("Please enter a username before sending a message!");
      return;
    }
    if (!inputMessage.trim()) return;

    const dataToSend = {
      type: "chat",
      username: username.trim(),
      message: inputMessage.trim(),
    };

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(dataToSend));
      setInputMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ---------------- RENDERING ----------------

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-gray-200 font-sans p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Waking up the server... 😴</h2>
        <p className="text-gray-400 text-center max-w-md">
          Because we are using a free hosting tier, it might take up to 50 seconds for the server to wake up. Please hang tight!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
      
      {/* Main Chat App Card */}
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header Section */}
        <header className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Global Chat
          </h2>
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 shadow-inner">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-gray-200">
              {onlineCount} Online
            </span>
          </div>
        </header>

        {/* Username Input Area */}
        <div className="px-5 py-4 border-b border-gray-800 bg-gray-900">
          <input
            type="text"
            placeholder="Choose your username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent p-3 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth">
          {messages.map((msg, index) => (
            <div key={index} className="flex flex-col animate-fade-in-up">
              <div className="flex items-baseline gap-2 mb-1">
                <span 
                  className="font-bold text-sm tracking-wide" 
                  style={{ color: getUsernameColor(msg.username) }}
                >
                  {msg.username}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {msg.timestamp}
                </span>
              </div>
              <p className="text-gray-200 text-[15px] leading-relaxed break-words bg-gray-800/40 p-3 rounded-r-xl rounded-bl-xl border border-gray-700/50 inline-block max-w-[90%]">
                {msg.message}
              </p>
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/* Typing Indicator */}
        <div className="h-8 px-5 flex items-center bg-gray-900 border-t border-gray-800/50">
          <span className="text-xs font-medium text-gray-500 italic transition-opacity duration-300">
            {typingUser ? `${typingUser} is typing...` : ""}
          </span>
        </div>

        {/* Message Input & Send Button */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3 rounded-b-2xl">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent p-4 outline-none transition-all shadow-inner"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center"
          >
            Send
          </button>
        </div>
        
      </div>
    </div>
  );
}