import { useState, useEffect, useRef, useCallback } from 'react';

// Helper to append messages without duplicates and cap list length at MAX_MESSAGES
const MAX_MESSAGES = 200;

function appendDeduplicatedMessages(existingList = [], newMsgOrList) {
  const newItems = Array.isArray(newMsgOrList) ? newMsgOrList : [newMsgOrList];
  const existingSet = new Set(
    existingList.map(m => m._id || `${m.sender}_${m.timestamp}_${m.message?.slice(0, 15)}`)
  );

  const freshItems = newItems.filter(m => {
    const key = m._id || `${m.sender}_${m.timestamp}_${m.message?.slice(0, 15)}`;
    return !existingSet.has(key);
  });

  if (freshItems.length === 0) return existingList;
  const merged = [...existingList, ...freshItems];
  return merged.length > MAX_MESSAGES ? merged.slice(merged.length - MAX_MESSAGES) : merged;
}

export function useWebSocket({ username, isLoggedIn, selectedUser, getWsUrl, onNotification, onOtrToggle, onCallSignal }) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [chatHistory, setChatHistory] = useState({ "Global Chat": [] });
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({}); // { partnerUsername: count }
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(1000);
  const isIntentionalCloseRef = useRef(false);

  // Keep refs to dynamic callbacks to prevent socket tearing down on parent re-renders
  const selectedUserRef = useRef(selectedUser);
  const onNotificationRef = useRef(onNotification);
  const onOtrToggleRef = useRef(onOtrToggle);
  const onCallSignalRef = useRef(onCallSignal);
  const getWsUrlRef = useRef(getWsUrl);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    onNotificationRef.current = onNotification;
    onOtrToggleRef.current = onOtrToggle;
    onCallSignalRef.current = onCallSignal;
    getWsUrlRef.current = getWsUrl;
  });

  useEffect(() => {
    if (!isLoggedIn || !username) return;

    isIntentionalCloseRef.current = false;

    function connect() {
      if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
        return;
      }

      const socketUrl = getWsUrlRef.current ? getWsUrlRef.current() : '';
      if (!socketUrl) return;

      ws.current = new WebSocket(socketUrl);

      ws.current.onopen = () => {
        console.log("Connected to WebSocket server");
        setIsConnecting(false);
        reconnectDelayRef.current = 1000; // Reset reconnect backoff on success
        ws.current.send(JSON.stringify({
          type: 'register',
          username: username.trim()
        }));
      };

      ws.current.onclose = (event) => {
        console.log(`WebSocket connection closed (code: ${event.code})`);
        setIsConnecting(true);

        // Auto-reconnect with exponential backoff if closed unexpectedly (mobile network switches/sleep)
        if (!isIntentionalCloseRef.current) {
          const delay = reconnectDelayRef.current;
          console.log(`Attempting auto-reconnect in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 15000);
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'history':
              setChatHistory(prev => ({
                ...prev,
                "Global Chat": appendDeduplicatedMessages([], data.data)
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
                    [partnerKey]: appendDeduplicatedMessages([], data.data)
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
                "Global Chat": appendDeduplicatedMessages(prev["Global Chat"] || [], data)
              }));
              if (data.sender && data.sender.toLowerCase() !== username.toLowerCase()) {
                onNotificationRef.current?.("Global Chat", `${data.sender}: ${data.message}`);
              }
              break;

            case 'message_delivered':
              if (data.partner) {
                setChatHistory(prev => {
                  const partnerKey = Object.keys(prev).find(
                    k => k.toLowerCase() === data.partner.toLowerCase()
                  ) || data.partner;
                  const existing = prev[partnerKey] || [];
                  return {
                    ...prev,
                    [partnerKey]: existing.map(m =>
                      (m.sender && m.sender.toLowerCase() === username.toLowerCase() && m.status !== 'read')
                        ? { ...m, status: 'delivered' }
                        : m
                    )
                  };
                });
              }
              break;

            case 'messages_read':
              if (data.partner) {
                setChatHistory(prev => {
                  const partnerKey = Object.keys(prev).find(
                    k => k.toLowerCase() === data.partner.toLowerCase()
                  ) || data.partner;
                  const existing = prev[partnerKey] || [];
                  return {
                    ...prev,
                    [partnerKey]: existing.map(m =>
                      (m.sender && m.sender.toLowerCase() === username.toLowerCase())
                        ? { ...m, status: 'read' }
                        : m
                    )
                  };
                });
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
                  [partnerKey]: appendDeduplicatedMessages(existing, data)
                };
              });

              // Increment unread count locally if it's an incoming message and sender is NOT the currently active chat
              if (!isMe) {
                if (rawPartner.toLowerCase() !== selectedUserRef.current?.toLowerCase()) {
                  setUnreadCounts(prev => ({
                    ...prev,
                    [rawPartner.toLowerCase()]: (prev[rawPartner.toLowerCase()] || 0) + 1
                  }));
                } else {
                  // If chat is currently open, mark read immediately
                  if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'mark_read', recipient: rawPartner }));
                  }
                }
                onNotificationRef.current?.(data.sender, data.message);
              }
              break;
            }

            case 'whisper': {
              const isMe = data.sender && data.sender.toLowerCase() === username.toLowerCase();
              const rawPartner = isMe ? data.recipient : data.sender;
              if (!rawPartner) break;

              const whisperId = `whisper_${Date.now()}_${Math.random()}`;
              const whisperMsg = {
                ...data,
                id: whisperId,
                isWhisper: true,
                timestamp: data.timestamp || new Date().toISOString()
              };

              setChatHistory(prev => {
                const partnerKey = Object.keys(prev).find(
                  k => k.toLowerCase() === rawPartner.toLowerCase()
                ) || rawPartner;
                const existing = prev[partnerKey] || [];
                return {
                  ...prev,
                  [partnerKey]: [...existing, whisperMsg]
                };
              });

              // Auto-expire and remove whisper message after TTL (default 10s)
              const ttlMs = (data.ttl || 10) * 1000;
              setTimeout(() => {
                setChatHistory(prev => {
                  const partnerKey = Object.keys(prev).find(
                    k => k.toLowerCase() === rawPartner.toLowerCase()
                  ) || rawPartner;
                  const existing = prev[partnerKey] || [];
                  return {
                    ...prev,
                    [partnerKey]: existing.filter(m => m.id !== whisperId && m.timestamp !== whisperMsg.timestamp)
                  };
                });
              }, ttlMs);

              if (!isMe) {
                onNotificationRef.current?.(`🤫 Whisper from ${data.sender}`, data.message);
              }
              break;
            }

            case 'unread_update':
              if (data.partner && typeof data.unreadCount === 'number') {
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
              onCallSignalRef.current?.(data);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
    }

    connect();

    return () => {
      isIntentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      ws.current?.close();
    };
  }, [isLoggedIn, username]);

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
