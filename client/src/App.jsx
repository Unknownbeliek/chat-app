import React, { useState, useEffect, useRef } from "react";

// Helper function to generate HSL color based on username
const getUsernameColor = (username) => {
  if (!username) return "hsl(0, 0%, 50%)";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const ws = useRef(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    ),
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
    // 1. Pick the full URL directly based on where the app is running
    const wsUrl = window.location.hostname === 'localhost'
      ? 'ws://localhost:9000'
      : 'wss://chat-app-m8ua.onrender.com';

    // 2. Pass it directly into the WebSocket constructor
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
        if (data.username !== username) {
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
  }, [username]);

  // Handle typing notification
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (username.trim() && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "typing",
          username: username.trim(),
        }),
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

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Global Chat</h2>
      <div>
        Online Users: <strong>{onlineCount}</strong>
      </div>

      {/* Username Input */}
      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
        />
      </div>

      {/* Message Container */}
      <div
        style={{
          border: "1px solid #ccc",
          height: "350px",
          overflowY: "auto",
          padding: "10px",
          borderRadius: "8px",
          background: "#1e1e1e",
          color: "#fff",
        }}
      >
        <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
          {messages.map((msg, index) => (
            <li key={index} style={{ marginBottom: "8px" }}>
              <strong style={{ color: getUsernameColor(msg.username) }}>
                {msg.username}
              </strong>
              : {msg.message}{" "}
              <span style={{ fontSize: "0.75rem", color: "#888" }}>
                [{msg.timestamp}]
              </span>
            </li>
          ))}
        </ul>
        <div ref={messageEndRef} />
      </div>

      {/* Typing Indicator */}
      <div
        style={{
          height: "20px",
          fontStyle: "italic",
          color: "#888",
          marginTop: "5px",
        }}
      >
        {typingUser ? `${typingUser} is typing...` : ""}
      </div>

      {/* Message Input & Send Button */}
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
          type="text"
          placeholder="Enter your message..."
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          style={{ flex: 1, padding: "10px" }}
        />
        <button
          onClick={sendMessage}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
