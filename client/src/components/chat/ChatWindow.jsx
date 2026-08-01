import React, { useRef, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

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
  onTyping
}) {
  const chatContainerRef = useRef(null);
  const messageEndRef = useRef(null);

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

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(true), 50);
    return () => clearTimeout(timer);
  }, [selectedUser]);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(false), 50);
    return () => clearTimeout(timer);
  }, [chatMessages]);

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
      />

      {/* Messages Canvas */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto chat-scroll p-4 space-y-2 relative"
      >
        {chatMessages.length === 0 ? (
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
          chatMessages.map((msg, idx) => (
            <MessageBubble
              key={msg._id || idx}
              messageData={msg}
              currentUsername={currentUsername}
            />
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Live WPM Typing Indicator Banner */}
      {activeTypers.length > 0 && (
        <div className="px-4 py-1.5 bg-indigo-950/40 border-t border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>
            {activeTypers.map(([user, speed]) => `${user} typing... (${speed || 0} WPM)`).join(", ")}
          </span>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <MessageInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        wpm={wpm}
      />
    </main>
  );
}
