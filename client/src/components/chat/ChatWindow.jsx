import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Loader2, Server, ChevronDown } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { ScrollBottomIcon } from '../animated-icons';

export default function ChatWindow({
  selectedUser,
  currentUsername,
  onlineCount,
  chatMessages = [],
  onBackToSidebar,
  targetUserInfo,
  inputMessage,
  setInputMessage,
  onSendMessage,
  isOffTheRecord,
  setIsOffTheRecord,
  typingUsers = {},
  wpm,
  onTyping,
  isConnecting = false,
  onLoadOlderHistory,
  onStartCall,
  callState,
  registeredUsers = []
}) {
  const chatContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const isFetchingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAtBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(chatMessages.length);

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

  const handleScrollToBottom = () => {
    scrollToBottom(false);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    setUnreadCount(0);
  };

  useEffect(() => {
    prevScrollHeightRef.current = 0;
    isFetchingRef.current = false;
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    setUnreadCount(0);
    prevMessagesLengthRef.current = chatMessages.length;
    const timer = setTimeout(() => scrollToBottom(true), 50);
    return () => clearTimeout(timer);
  }, [selectedUser]);

  // Preserve scroll position when older messages are prepended to the top
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current > 0 && chatContainerRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      chatContainerRef.current.scrollTop = scrollDiff;
      prevScrollHeightRef.current = 0;
    }
    isFetchingRef.current = false;
  }, [chatMessages]);

  // Auto-scroll to bottom on new messages only if isAtBottom is true
  useEffect(() => {
    if (prevScrollHeightRef.current === 0) {
      if (isAtBottomRef.current) {
        const timer = setTimeout(() => scrollToBottom(false), 50);
        return () => clearTimeout(timer);
      } else {
        if (chatMessages.length > prevMessagesLengthRef.current) {
          setUnreadCount(prev => prev + 1);
        }
      }
    }
    prevMessagesLengthRef.current = chatMessages.length;
  }, [chatMessages]);

  const handleScroll = (e) => {
    const container = e.target;
    // Check if scrolled to top for pagination/history loading
    if (container.scrollTop === 0 && !isFetchingRef.current && chatMessages.length > 0) {
      const oldestMsg = chatMessages[0];
      if (oldestMsg && oldestMsg.timestamp && onLoadOlderHistory) {
        isFetchingRef.current = true;
        prevScrollHeightRef.current = container.scrollHeight;
        onLoadOlderHistory(oldestMsg.timestamp);
      }
    }

    // Scroll bottom proximity detection
    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < 100) {
      setIsAtBottom(true);
      isAtBottomRef.current = true;
      setUnreadCount(0);
    } else {
      setIsAtBottom(false);
      isAtBottomRef.current = false;
    }
  };

  const activeTypers = Object.entries(typingUsers).filter(
    ([user]) => selectedUser === "Global Chat" || user.toLowerCase() === selectedUser.toLowerCase()
  );

  return (
    <main className="flex-1 h-full flex flex-col glass-panel relative overflow-hidden">
      {/* Top Navigation Header */}
      <ChatHeader
        selectedUser={selectedUser}
        onlineCount={onlineCount}
        onBackToSidebar={onBackToSidebar}
        targetUserInfo={targetUserInfo}
        isOffTheRecord={isOffTheRecord}
        setIsOffTheRecord={setIsOffTheRecord}
        onStartCall={onStartCall}
        callState={callState}
      />

      {/* Messages Canvas */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-scroll p-4 space-y-2 relative flex flex-col"
      >
        {/* Server Connecting Banner Overlay */}
        {isConnecting && (
          <div className="my-auto py-8 px-6 text-center flex flex-col items-center justify-center max-w-sm mx-auto glass-card rounded-3xl border border-indigo-500/20 shadow-2xl space-y-3 animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                <Server className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-zinc-100 mb-1">
                Waking Up Ping Server...
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Establishing WebSocket connection with Render backend. On cold starts, this may take 15–30 seconds.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Settings, Profile & Contacts are ready</span>
            </div>
          </div>
        )}

        {!isConnecting && chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-3 border border-white/10">
              💬
            </div>
            <h3 className="font-semibold text-sm text-zinc-300 mb-1">No messages yet</h3>
            <p className="text-xs max-w-xs">
              Be the first to start the conversation in {selectedUser}!
            </p>
          </div>
        ) : (
          !isConnecting && chatMessages.map((msg, idx) => {
            const prevMsg = chatMessages[idx - 1];
            const isSameSender = prevMsg && prevMsg.sender && msg.sender && prevMsg.sender.toLowerCase() === msg.sender.toLowerCase();
            const timeDiff = prevMsg && msg.timestamp && prevMsg.timestamp ? Math.abs(new Date(msg.timestamp) - new Date(prevMsg.timestamp)) : Infinity;
            const isGrouped = isSameSender && timeDiff < 180000; // within 3 minutes

            return (
              <MessageBubble
                key={msg._id || idx}
                messageData={msg}
                currentUsername={currentUsername}
                registeredUsers={registeredUsers}
                isGrouped={isGrouped}
              />
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Live WPM Typing Indicator Banner */}
      {activeTypers.length > 0 && !isConnecting && (
        <div className="px-4 py-1.5 bg-indigo-950/40 border-t border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>
            {activeTypers.map(([user, speed]) => `${user} typing... (${speed || 0} WPM)`).join(", ")}
          </span>
        </div>
      )}

      {/* Floating Scroll-to-Bottom Button with Unread Badge */}
      {!isAtBottom && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-20 right-6 z-20 w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700/90 shadow-xl flex items-center justify-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 animate-in fade-in slide-in-from-bottom-2 group cursor-pointer"
          title="Scroll to bottom"
        >
          <ScrollBottomIcon className="w-5 h-5 pointer-events-none" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md border border-slate-900 animate-bounce pointer-events-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Bottom Message Input Bar */}
      <MessageInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        wpm={wpm}
        disabled={isConnecting}
      />
    </main>
  );
}
