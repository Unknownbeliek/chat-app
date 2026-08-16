import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import AuthCard from "./components/auth/AuthCard";
import PingSidebar from "./components/sidebar/PingSidebar";
import ChatWindow from "./components/chat/ChatWindow";
import ConfirmModal from "./components/common/ConfirmModal";
import InstallAppPrompt from "./components/common/InstallAppPrompt";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useWebSocket, appendDeduplicatedMessages } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { subscribeUserToPush } from "./utils/push";

import Toast from "./components/common/Toast";

const ProfileView = lazy(() => import("./components/profile/ProfileView"));
const SettingsView = lazy(() => import("./components/settings/SettingsView"));
const NotificationPermissionModal = lazy(() => import("./components/common/NotificationPermissionModal"));
const CallModal = lazy(() => import("./components/calling/CallModal"));
const CallScreen = lazy(() => import("./components/calling/CallScreen"));
const ShortcutsHelpModal = lazy(() => import("./components/common/ShortcutsHelpModal"));

export default function Chat() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState("Global Chat");
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [otrStates, setOtrStates] = useState({}); // { username_lowercase: boolean }

  const isOffTheRecord = selectedUser !== "Global Chat" && !!otrStates[selectedUser.toLowerCase()];

  const handleToggleOtr = (val) => {
    if (!selectedUser || selectedUser === "Global Chat") return;
    const targetKey = selectedUser.toLowerCase();
    const newStatus = typeof val === 'boolean' ? val : !otrStates[targetKey];
    setOtrStates(prev => ({ ...prev, [targetKey]: newStatus }));
    sendMessage('otr_toggle', {
      sender: username,
      recipient: selectedUser,
      enabled: newStatus
    });
  };

  const handleOtrToggleFromPeer = useCallback((sender, enabled) => {
    if (!sender) return;
    setOtrStates(prev => ({ ...prev, [sender.toLowerCase()]: !!enabled }));
  }, []);

  // Profile State
  const [profile, setProfile] = useState({
    bio: "Hey there! I am using ping.",
    status: "Available",
    location: "",
    avatarColor: "#6366f1",
    avatarUrl: "",
    createdAt: null
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [historicalChats, setHistoricalChats] = useState([]);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Notification Permission Onboarding State & Handlers
  const [showNotifModal, setShowNotifModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const prompted = localStorage.getItem("ping_notif_prompted");
      if (!prompted && typeof Notification !== "undefined" && Notification.permission === "default") {
        setShowNotifModal(true);
      }
    }
  }, [isLoggedIn]);

  const handleEnableNotif = async () => {
    setShowNotifModal(false);
    localStorage.setItem("ping_notif_prompted", "true");
    if (typeof Notification !== "undefined") {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          setNotificationsEnabled(true);
          if (username) {
            subscribeUserToPush(username);
          }
        }
      } catch (err) {
        console.error('Notification permission error:', err);
      }
    }
  };

  const handleSkipNotif = () => {
    setShowNotifModal(false);
    localStorage.setItem("ping_notif_prompted", "true");
  };

  // Layout Tab Navigation: "chats" | "contacts" | "settings" | "profile" | "chat"
  const [activeTab, setActiveTab] = useState("chats");

  const audioRef = useRef(new Audio("/pop-1.mp3"));

  const getApiUrl = useCallback(() => {
    if (import.meta.env.VITE_SERVER_URL) {
      return import.meta.env.VITE_SERVER_URL;
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:9000";
    }
    return "https://chat-app-m8ua.onrender.com";
  }, []);

  const getWsUrl = useCallback(() => {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "ws://localhost:9000";
    }
    return "wss://chat-app-m8ua.onrender.com";
  }, []);

  const handleNotification = useCallback((title, body) => {
    if (soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (notificationsEnabled && Notification.permission === "granted") {
      new Notification(`ping - ${title}`, {
        body: body,
        icon: "/favicon.svg"
      });
    }
  }, [soundEnabled, notificationsEnabled]);

  // WebRTC Calling State
  const [callState, setCallState] = useState({
    status: 'idle', // 'idle' | 'ringing' | 'connected'
    isCaller: false,
    partnerName: '',
    callType: 'voice', // 'voice' | 'video'
    roomId: ''
  });

  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const handleCallSignalRef = useRef(null);

  const handleCallSignal = useCallback(async (data) => {
    if (handleCallSignalRef.current) {
      handleCallSignalRef.current(data);
    }
  }, []);

  // Use Custom Hook for WebSocket Connection
  const {
    isConnecting,
    onlineCount,
    setOnlineCount,
    registeredUsers,
    setRegisteredUsers,
    chatHistory,
    setChatHistory,
    typingUsers,
    sendMessage,
    unreadCounts,
    setUnreadCounts,
    clearUnread
  } = useWebSocket({
    username,
    isLoggedIn,
    selectedUser,
    getWsUrl,
    onNotification: handleNotification,
    onOtrToggle: handleOtrToggleFromPeer,
    onCallSignal: handleCallSignal
  });

  const sendSignal = useCallback((payload) => {
    sendMessage(payload.type, payload);
  }, [sendMessage]);

  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    isNoiseCancellationEnabled,
    iceState,
    mediaError,
    getMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleCandidate,
    toggleAudio,
    toggleVideo,
    toggleNoiseCancellation,
    cleanupCall
  } = useWebRTC({ sendSignal });

  // Cleanup WebRTC call on component unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  // Handle incoming WebSocket WebRTC signals
  useEffect(() => {
    handleCallSignalRef.current = async (data) => {
      switch (data.type) {
        case 'call_invite':
          setCallState({
            status: 'ringing',
            isCaller: false,
            partnerName: data.from,
            callType: data.callType || 'voice',
            roomId: data.roomId
          });
          break;

        case 'call_accepted': {
          setCallState(prev => ({ ...prev, status: 'connected' }));
          const currentCallType = callStateRef.current.callType;
          const callerStream = await getMedia(currentCallType);
          await createOffer(data.from, data.roomId, callerStream, currentCallType);
          break;
        }

        case 'call_rejected':
        case 'call_ended':
          cleanupCall();
          setCallState({ status: 'idle', isCaller: false, partnerName: '', callType: 'voice', roomId: '' });
          break;

        case 'sdp_offer': {
          const currentCallType = data.callType || callStateRef.current.callType || 'voice';
          setCallState({
            status: 'connected',
            isCaller: false,
            partnerName: data.from,
            callType: currentCallType,
            roomId: data.roomId
          });
          const calleeStream = await getMedia(currentCallType);
          await handleOffer(data.from, data.roomId, data.sdp, calleeStream, currentCallType);
          break;
        }

        case 'sdp_answer':
          await handleAnswer(data.sdp);
          break;

        case 'ice_candidate':
          await handleCandidate(data.candidate);
          break;

        default:
          break;
      }
    };
  }, [getMedia, createOffer, handleOffer, handleAnswer, handleCandidate, cleanupCall]);

  const handleStartCall = async (type) => {
    if (!selectedUser || selectedUser === "Global Chat") return;
    const roomId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setCallState({
      status: 'ringing',
      isCaller: true,
      partnerName: selectedUser,
      callType: type,
      roomId
    });
    sendMessage('call_invite', {
      to: selectedUser,
      callType: type,
      roomId
    });
  };

  const handleAcceptCall = async () => {
    await getMedia(callState.callType);
    sendMessage('call_accepted', {
      to: callState.partnerName,
      roomId: callState.roomId
    });
    setCallState(prev => ({ ...prev, status: 'connected' }));
  };

  const handleRejectCall = () => {
    sendMessage('call_rejected', {
      to: callState.partnerName,
      roomId: callState.roomId
    });
    cleanupCall();
    setCallState({ status: 'idle', isCaller: false, partnerName: '', callType: 'voice', roomId: '' });
  };

  const handleEndCall = () => {
    sendMessage('call_ended', {
      to: callState.partnerName,
      roomId: callState.roomId
    });
    cleanupCall();
    setCallState({ status: 'idle', isCaller: false, partnerName: '', callType: 'voice', roomId: '' });
  };

  // Check stored user session on load
  useEffect(() => {
    const storedUser = localStorage.getItem("ping_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.username) {
          setUsername(parsed.username);
          setIsLoggedIn(true);
          if (parsed.bio) setProfile(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        localStorage.removeItem("ping_user");
      }
    }
  }, []);

  // Fetch Users & User Profile on Login
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/users`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setRegisteredUsers(data.users);
        if (data.onlineCount !== undefined) {
          setOnlineCount(data.onlineCount);
        }
      }
    } catch (e) {
      // Ignore network errors gracefully
    }
  };

  const fetchUserProfile = async (uname) => {
    if (!uname) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/profile/${encodeURIComponent(uname)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.user) {
        setProfile({
          bio: data.user.bio || "Hey there! I am using ping.",
          status: data.user.status || "Available",
          location: data.user.location || "",
          avatarColor: data.user.avatarColor || "#6366f1",
          avatarUrl: data.user.avatarUrl || "",
          createdAt: data.user.createdAt
        });
      }
    } catch (e) {
      // Ignore network errors gracefully
    }
  };
  const fetchHistoricalChats = useCallback(async (uname) => {
    const target = uname || username;
    if (!target) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/chats/history?username=${encodeURIComponent(target)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.chats)) {
        setHistoricalChats(data.chats);
      }
    } catch (e) {
      // Ignore network errors gracefully
    }
  }, [username, getApiUrl]);

  const fetchActiveChats = async () => {
    if (!username) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/chats/active?username=${encodeURIComponent(username)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.conversations) {
        const countsMap = {};
        data.conversations.forEach(c => {
          if (c.partner && c.unreadCount > 0) {
            countsMap[c.partner.toLowerCase()] = c.unreadCount;
          }
        });
        setUnreadCounts(prev => ({ ...prev, ...countsMap }));
      }
    } catch (e) {
      // Ignore network errors gracefully
    }
  };

  useEffect(() => {
    if (isLoggedIn && username) {
      fetchUsers();
      fetchUserProfile(username);
      fetchActiveChats();
      fetchHistoricalChats(username);
    }
  }, [isLoggedIn, username, fetchHistoricalChats]);

  // Fetch DM History on select contact
  const fetchPrivateHistory = async (targetUser) => {
    if (!targetUser || targetUser === "Global Chat") return;
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/private?user1=${encodeURIComponent(username)}&user2=${encodeURIComponent(targetUser)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.history) {
        setChatHistory(prev => {
          const partnerKey = Object.keys(prev).find(
            k => k.toLowerCase() === targetUser.toLowerCase()
          ) || targetUser;
          const existing = prev[partnerKey] || [];
          return {
            ...prev,
            [partnerKey]: appendDeduplicatedMessages(existing, data.history)
          };
        });
      }
    } catch (e) {
      // Ignore network errors gracefully
    }
  };

  const handleSelectContact = (user) => {
    setSelectedUser(user);
    setActiveTab("chat");
    if (user !== "Global Chat") {
      fetchPrivateHistory(user);
      clearUnread(user);
    }
  };

  // Auth Submit Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    const endpoint = authMode === "login" ? "/api/login" : "/api/register";
    try {
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.success) {
        const sessionUser = {
          username: data.username || username.trim(),
          token: data.token || "",
          bio: data.bio || "Hey there! I am using ping.",
          status: data.status || "Available",
          location: data.location || "",
          avatarColor: data.avatarColor || "#6366f1",
          avatarUrl: data.avatarUrl || ""
        };
        setIsLoggedIn(true);
        localStorage.setItem("ping_user", JSON.stringify(sessionUser));
        if (sessionUser.bio) {
          setProfile(prev => ({ ...prev, ...sessionUser }));
        }
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogoutConfirm = () => {
    setIsLoggedIn(false);
    setShowLogoutConfirm(false);
    localStorage.removeItem("ping_user");
    setUsername("");
    setPassword("");
    setActiveTab("chats");
  };

  // Save Profile Handler
  const handleSaveProfile = async (updatedProfile) => {
    const profileToSave = updatedProfile || profile;
    setIsSavingProfile(true);
    setProfileSaveStatus("");

    try {
      const res = await fetch(`${getApiUrl()}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username
        },
        body: JSON.stringify({
          username,
          bio: profileToSave.bio,
          status: profileToSave.status,
          location: profileToSave.location,
          avatarColor: profileToSave.avatarColor,
          avatarUrl: profileToSave.avatarUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile(profileToSave);
        setProfileSaveStatus("Profile saved successfully!");
        localStorage.setItem("ping_user", JSON.stringify({ username, ...profileToSave }));
        setIsSavingProfile(false);
        setTimeout(() => setProfileSaveStatus(""), 4000);
        return true;
      } else {
        setProfileSaveStatus("Error: " + (data.error || "Failed to update profile"));
        setIsSavingProfile(false);
        return false;
      }
    } catch (err) {
      setProfileSaveStatus("Error: Network connection failed.");
      setIsSavingProfile(false);
      return false;
    }
  };

  // Send Message Handler
  const handleSendMessage = (textToSend, extraPayload) => {
    // Support both direct text passing and legacy payload object
    let msgText = typeof textToSend === 'string' ? textToSend : (textToSend?.message || inputMessage);
    let payloadExtra = typeof textToSend === 'string' ? extraPayload : textToSend;

    if (!msgText || !msgText.trim()) return;

    const basePayload = {
      sender: username,
      message: msgText.trim(),
      ...(payloadExtra || {})
    };

    if (selectedUser === "Global Chat") {
      sendMessage('global_chat', basePayload);
    } else {
      const optimisticMsg = {
        type: 'private_chat',
        sender: username,
        recipient: selectedUser,
        message: msgText.trim(),
        status: 'sent',
        timestamp: new Date().toISOString(),
        ...(payloadExtra || {})
      };

      setChatHistory(prev => {
        const partnerKey = Object.keys(prev).find(
          k => k.toLowerCase() === selectedUser.toLowerCase()
        ) || selectedUser;
        const existing = prev[partnerKey] || [];
        return {
          ...prev,
          [partnerKey]: appendDeduplicatedMessages(existing, optimisticMsg)
        };
      });

      sendMessage('private_chat', {
        ...basePayload,
        recipient: selectedUser,
        isOffTheRecord: isOffTheRecord
      });
    }
    setInputMessage("");
  };

  // Load Older Messages Handler (Cursor-Based Pagination)
  const handleLoadOlderHistory = (oldestTimestamp) => {
    sendMessage('load_older_history', {
      oldestTimestamp,
      recipient: selectedUser
    });
  };

  const [toast, setToast] = useState(null);

  // Notification Permission Toggle
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setNotificationsEnabled(true);
          setToast({ message: "Desktop notifications enabled!", type: "success" });
        } else {
          setToast({ message: "Notification permission was denied in browser settings.", type: "error" });
        }
      } else {
        setToast({ message: "Desktop notifications are not supported in this browser.", type: "error" });
      }
    } else {
      setNotificationsEnabled(false);
      setToast({ message: "Desktop notifications disabled.", type: "info" });
    }
  };

  // Clear Local Chat Handler (/clear command)
  const handleClearLocalChat = useCallback(() => {
    if (!selectedUser) return;
    setChatHistory(prev => {
      const key = Object.keys(prev).find(k => k.toLowerCase() === selectedUser.toLowerCase()) || selectedUser;
      return {
        ...prev,
        [key]: []
      };
    });
  }, [selectedUser, setChatHistory]);

  // Keyboard & Touch Gesture Shortcuts Hook
  useKeyboardShortcuts({
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedUser,
    setSelectedUser,
    registeredUsers,
    historicalChats,
    chatHistory,
    showShortcutsHelp,
    setShowShortcutsHelp,
    callState,
    toggleMute: toggleAudio,
    toggleVideo,
    onSendMessage: handleSendMessage
  });

  const currentMessages = React.useMemo(() => {
    if (!selectedUser || selectedUser === "Global Chat") return chatHistory["Global Chat"] || [];
    const key = Object.keys(chatHistory).find(k => k && k.toLowerCase() === selectedUser.toLowerCase());
    return key ? chatHistory[key] : [];
  }, [selectedUser, chatHistory]);

  const handleTypingSignal = useCallback((currentWpm) => {
    sendMessage('typing_wpm', {
      sender: username,
      recipient: selectedUser,
      wpm: currentWpm
    });
  }, [username, selectedUser, sendMessage]);

  const targetUserInfo = React.useMemo(() => {
    if (!selectedUser) return null;
    if (selectedUser.toLowerCase() === 'pingbot') {
      return {
        username: 'PingBot',
        bio: 'AI Assistant & Coding Companion 🤖',
        status: 'Online ⚡',
        location: 'Cloud',
        avatarColor: '#8b5cf6',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PingBot',
        isOnline: true
      };
    }
    return (registeredUsers || []).find(
      u => u && u.username && u.username.toLowerCase() === selectedUser.toLowerCase()
    );
  }, [selectedUser, registeredUsers]);

  if (!isLoggedIn) {
    return (
      <AuthCard
        authMode={authMode}
        setAuthMode={setAuthMode}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        authError={authError}
        isLoading={isAuthLoading}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className="h-dvh w-full p-0 sm:p-4 flex items-center justify-center relative overflow-hidden bg-[#0d0b18] text-zinc-100 font-sans select-none">
      {/* Background Animated Glow Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Main Container Canvas */}
      <div className="w-full h-full max-w-7xl rounded-none sm:rounded-3xl shadow-2xl flex relative z-10 overflow-hidden border-0 sm:border border-white/10 backdrop-blur-2xl">
        {/* Sidebar View (always visible on desktop, tab-toggle on mobile) */}
        <div className={`${activeTab === "chat" || activeTab === "profile" || activeTab === "settings" ? "hidden md:flex" : "flex"} w-full md:w-80`}>
          <PingSidebar
            currentUsername={username}
            selectedUser={selectedUser}
            onSelectContact={handleSelectContact}
            registeredUsers={registeredUsers}
            historicalChats={historicalChats}
            onlineCount={onlineCount}
            chatHistory={chatHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadCounts={unreadCounts}
          />
        </div>

        {/* Dynamic Main View Area */}
        <div className={`${activeTab !== "chat" && activeTab !== "profile" && activeTab !== "settings" ? "hidden md:flex" : "flex"} flex-1 h-full min-h-0 min-w-0`}>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-950/50">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {activeTab === "profile" ? (
              <ProfileView
                username={username}
                profile={profile}
                setProfile={setProfile}
                onSaveProfile={handleSaveProfile}
                isSaving={isSavingProfile}
                saveStatus={profileSaveStatus}
                onBackToChats={() => setActiveTab("chats")}
              />
            ) : activeTab === "settings" ? (
              <SettingsView
                username={username}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                onOpenLogoutConfirm={() => setShowLogoutConfirm(true)}
                onBackToChats={() => setActiveTab("chats")}
              />
            ) : (
              <ChatWindow
                selectedUser={selectedUser}
                currentUsername={username}
                onlineCount={onlineCount}
                chatMessages={currentMessages}
                onBackToSidebar={() => setActiveTab("chats")}
                targetUserInfo={targetUserInfo}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                onSendMessage={handleSendMessage}
                isOffTheRecord={isOffTheRecord}
                setIsOffTheRecord={handleToggleOtr}
                typingUsers={typingUsers}
                isConnecting={isConnecting}
                onTyping={handleTypingSignal}
                onLoadOlderHistory={handleLoadOlderHistory}
                onStartCall={handleStartCall}
                registeredUsers={registeredUsers}
                onClearLocalChat={handleClearLocalChat}
                sendMessage={sendMessage}
              />
            )}
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        {/* Incoming / Outgoing Call Ringing Modal */}
        <CallModal
          callState={callState}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          mediaError={mediaError}
        />

        {/* Active Call Interface */}
        <CallScreen
          callState={callState}
          localStream={localStream}
          remoteStream={remoteStream}
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          isNoiseCancellationEnabled={isNoiseCancellationEnabled}
          iceState={iceState}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleNoiseCancellation={toggleNoiseCancellation}
          onEndCall={handleEndCall}
        />

        {/* Onboarding Notification Permission Modal */}
        <NotificationPermissionModal
          isOpen={showNotifModal}
          onEnable={handleEnableNotif}
          onSkip={handleSkipNotif}
        />

        {/* Keyboard & Touch Gesture Shortcuts Cheat Sheet Modal */}
        <ShortcutsHelpModal
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />
      </Suspense>

      {/* Reusable Confirm Logout Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Sign Out"
        message="Are you sure you want to log out of your session on Ping?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Log Out"
      />

      {/* PWA Mobile & Desktop App Install Pop-Up Notification */}
      <InstallAppPrompt />

      {/* Global Glassmorphic Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}