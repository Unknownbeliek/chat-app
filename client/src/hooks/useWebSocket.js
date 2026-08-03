import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket({ username, isLoggedIn, selectedUser, getWsUrl, onNotification, onOtrToggle, onCallSignal }) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [chatHistory, setChatHistory] = useState({ "Global Chat": [] });
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({}); // { partnerUsername: count }
  const ws = useRef(null);

  // Keep ref to selectedUser to avoid stale closure in WebSocket listener
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

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

          case 'userStatusChanged':
            if (data.username) {
              setRegisteredUsers(prev =>
                prev.map(u =>
                  u.username.toLowerCase() === data.username.toLowerCase()
                    ? { ...u, isOnline: data.isOnline, lastSeen: data.lastSeen }
                    : u
                )
              );
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

            // Increment unread count locally if it's an incoming message and sender is NOT the currently active chat
            if (!isMe) {
              if (rawPartner.toLowerCase() !== selectedUserRef.current?.toLowerCase()) {
                setUnreadCounts(prev => ({
                  ...prev,
                  [rawPartner.toLowerCase()]: (prev[rawPartner.toLowerCase()] || 0) + 1
                }));
              }
              onNotification?.(data.sender, data.message);
            }
            break;
          }

          case 'unread_update':
            if (data.partner && typeof data.unreadCount === 'number') {
              // If the partner is currently open in active chat, keep unread at 0
              const isCurrentlyOpen = data.partner.toLowerCase() === selectedUserRef.current?.toLowerCase();
              setUnreadCounts(prev => ({
                ...prev,
                [data.partner.toLowerCase()]: isCurrentlyOpen ? 0 : data.unreadCount
              }));
            }
            break;

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

          case 'call_invite':
          case 'call_accepted':
          case 'call_rejected':
          case 'call_ended':
          case 'sdp_offer':
          case 'sdp_answer':
          case 'ice_candidate':
            onCallSignal?.(data);
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
  }, [isLoggedIn, username, getWsUrl, onNotification, onCallSignal]);

  const sendMessage = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  const clearUnread = useCallback((partner) => {
    if (!partner) return;
    setUnreadCounts(prev => {
      const copy = { ...prev };
      delete copy[partner.toLowerCase()];
      return copy;
    });
    sendMessage('mark_read', { recipient: partner });
  }, [sendMessage]);

  return {
    isConnecting,
    onlineCount,
    registeredUsers,
    chatHistory,
    setChatHistory,
    typingUsers,
    sendMessage,
    unreadCounts,
    setUnreadCounts,
    clearUnread
  };
}
