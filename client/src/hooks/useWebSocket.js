import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket({ username, isLoggedIn, getWsUrl, onNotification, onOtrToggle }) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [chatHistory, setChatHistory] = useState({ "Global Chat": [] });
  const [typingUsers, setTypingUsers] = useState({});
  const ws = useRef(null);

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
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'history':
            setChatHistory(prev => ({
              ...prev,
              "Global Chat": data.data
            }));
            break;

          case 'userList':
            setRegisteredUsers(data.users);
            if (data.onlineCount !== undefined) {
              setOnlineCount(data.onlineCount);
            }
            break;

          case 'private_history':
            if (data.partner) {
              setChatHistory(prev => {
                const partnerKey = Object.keys(prev).find(
                  k => k.toLowerCase() === data.partner.toLowerCase()
                ) || data.partner;
                return {
                  ...prev,
                  [partnerKey]: data.data
                };
              });
            }
            break;

          case 'older_history':
            if (data.data) {
              const rawPartner = data.recipient || "Global Chat";
              setChatHistory(prev => {
                const partnerKey = Object.keys(prev).find(
                  k => k.toLowerCase() === rawPartner.toLowerCase()
                ) || rawPartner;
                const existing = prev[partnerKey] || [];
                const existingTimestamps = new Set(existing.map(m => m.timestamp));
                const newOlder = data.data.filter(m => !existingTimestamps.has(m.timestamp));
                return {
                  ...prev,
                  [partnerKey]: [...newOlder, ...existing]
                };
              });
            }
            break;

          case 'global_chat':
            setChatHistory(prev => ({
              ...prev,
              "Global Chat": [...(prev["Global Chat"] || []), data]
            }));
            if (data.sender && data.sender.toLowerCase() !== username.toLowerCase()) {
              onNotification?.("Global Chat", `${data.sender}: ${data.message}`);
            }
            break;

          case 'private_chat': {
            const isMe = data.sender && data.sender.toLowerCase() === username.toLowerCase();
            const rawPartner = isMe ? data.recipient : data.sender;
            if (!rawPartner) break;

            setChatHistory(prev => {
              const partnerKey = Object.keys(prev).find(
                k => k.toLowerCase() === rawPartner.toLowerCase()
              ) || rawPartner;
              const existing = prev[partnerKey] || [];
              return {
                ...prev,
                [partnerKey]: [...existing, data]
              };
            });

            if (!isMe) {
              onNotification?.(data.sender, data.message);
            }
            break;
          }

          case 'typing_wpm':
            if (data.sender && data.sender.toLowerCase() !== username.toLowerCase()) {
              setTypingUsers(prev => ({
                ...prev,
                [data.sender]: data.wpm
              }));
              setTimeout(() => {
                setTypingUsers(prev => {
                  const copy = { ...prev };
                  delete copy[data.sender];
                  return copy;
                });
              }, 2500);
            }
            break;

          case 'otr_toggle':
            if (data.sender && onOtrToggle) {
              onOtrToggle(data.sender, data.enabled);
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [isLoggedIn, username, getWsUrl, onNotification]);

  const sendMessage = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  return {
    isConnecting,
    onlineCount,
    registeredUsers,
    chatHistory,
    setChatHistory,
    typingUsers,
    sendMessage
  };
}
