import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthCard from "./components/auth/AuthCard";
import PingSidebar from "./components/sidebar/PingSidebar";
import ChatWindow from "./components/chat/ChatWindow";
import ProfileView from "./components/profile/ProfileView";
import SettingsView from "./components/settings/SettingsView";
import ConfirmModal from "./components/common/ConfirmModal";
import CallModal from "./components/calling/CallModal";
import CallScreen from "./components/calling/CallScreen";
import { useWebSocket } from "./hooks/useWebSocket";
import { useWebRTC } from "./hooks/useWebRTC";

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
    createdAt: null
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    registeredUsers,
    chatHistory,
    setChatHistory,
    typingUsers,
    sendMessage
  } = useWebSocket({
    username,
    isLoggedIn,
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
    getMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleCandidate,
    toggleAudio,
    toggleVideo,
    cleanupCall
  } = useWebRTC({ sendSignal });

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

        case 'call_accepted':
          setCallState(prev => ({ ...prev, status: 'connected' }));
          const callerStream = await getMedia(callState.callType);
          await createOffer(data.from, data.roomId, callerStream);
          break;

        case 'call_rejected':
        case 'call_ended':
          cleanupCall();
          setCallState({ status: 'idle', isCaller: false, partnerName: '', callType: 'voice', roomId: '' });
          break;

        case 'sdp_offer':
          setCallState({
            status: 'connected',
            isCaller: false,
            partnerName: data.from,
            callType: data.callType || 'voice',
            roomId: data.roomId
          });
          const calleeStream = await getMedia(data.callType || 'voice');
          await handleOffer(data.from, data.roomId, data.sdp, calleeStream);
          break;

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
  }, [getMedia, createOffer, handleOffer, handleAnswer, handleCandidate, cleanupCall, callState.callType]);

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
      if (data.success) {
        // Updated users populated via WS
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
          createdAt: data.user.createdAt
        });
      }
    } catch (e) {
      // Ignore network errors gracefully
    }
  };

  useEffect(() => {
    if (isLoggedIn && username) {
      fetchUsers();
      fetchUserProfile(username);
    }
  }, [isLoggedIn, username]);

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
          return {
            ...prev,
            [partnerKey]: data.history
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
        setIsLoggedIn(true);
        if (data.user) {
          localStorage.setItem("ping_user", JSON.stringify(data.user));
          if (data.user.bio) setProfile(prev => ({ ...prev, ...data.user }));
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
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveStatus("");

    try {
      const res = await fetch(`${getApiUrl()}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio: profile.bio,
          status: profile.status,
          location: profile.location,
          avatarColor: profile.avatarColor
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfileSaveStatus("Profile saved successfully!");
        localStorage.setItem("ping_user", JSON.stringify({ username, ...profile }));
      } else {
        setProfileSaveStatus("Error: " + (data.error || "Failed to update profile"));
      }
    } catch (err) {
      setProfileSaveStatus("Error: Network connection failed.");
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileSaveStatus(""), 4000);
    }
  };

  // Send Message Handler
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (selectedUser === "Global Chat") {
      sendMessage('global_chat', {
        sender: username,
        message: inputMessage.trim()
      });
    } else {
      sendMessage('private_chat', {
        sender: username,
        recipient: selectedUser,
        message: inputMessage.trim(),
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

  // Notification Permission Toggle
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setNotificationsEnabled(true);
        } else {
          alert("Notification permission was denied in your browser settings.");
        }
      } else {
        alert("Desktop notifications are not supported in this browser.");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

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

  const targetUserInfo = (registeredUsers || []).find(
    u => u && u.username && u.username.toLowerCase() === selectedUser?.toLowerCase()
  );

  const getMessagesForUser = (user) => {
    if (!user || user === "Global Chat") return chatHistory["Global Chat"] || [];
    const key = Object.keys(chatHistory).find(k => k && k.toLowerCase() === user.toLowerCase());
    return key ? chatHistory[key] : [];
  };

  const currentMessages = getMessagesForUser(selectedUser);

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
            onlineCount={onlineCount}
            chatHistory={chatHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Dynamic Main View Area */}
        <div className={`${activeTab !== "chat" && activeTab !== "profile" && activeTab !== "settings" ? "hidden md:flex" : "flex"} flex-1 h-full`}>
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
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
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
              onTyping={(currentWpm) => {
                sendMessage('typing_wpm', {
                  sender: username,
                  recipient: selectedUser,
                  wpm: currentWpm
                });
              }}
              onLoadOlderHistory={handleLoadOlderHistory}
              onStartCall={handleStartCall}
            />
          )}
        </div>
      </div>

      {/* Incoming / Outgoing Call Ringing Modal */}
      <CallModal
        callState={callState}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {/* Active Call Interface */}
      <CallScreen
        callState={callState}
        localStream={localStream}
        remoteStream={remoteStream}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEndCall={handleEndCall}
      />

      {/* Reusable Confirm Logout Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Sign Out"
        message="Are you sure you want to log out of your session on Ping?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Log Out"
      />
    </div>
  );
}