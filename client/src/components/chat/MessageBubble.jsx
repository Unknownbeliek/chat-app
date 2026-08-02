import React from 'react';
import Avatar from '../common/Avatar';
import { formatTimestamp } from '../../utils/dateUtils';

// Helper function for formatting code blocks and markdown elements
function renderFormattedMessage(text) {
  if (!text) return null;

  // Split by code blocks ```code```
  const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    const language = match[1] || 'code';
    const codeContent = match[2];
    parts.push({
      type: 'code',
      language,
      content: codeContent
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return parts.map((part, index) => {
    if (part.type === 'code') {
      return (
        <div key={index} className="my-2 rounded-xl bg-zinc-950/80 border border-indigo-500/30 overflow-hidden shadow-xl text-left font-mono">
          <div className="bg-white/5 px-3 py-1 text-[10px] text-indigo-300 font-semibold uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
            <span>{part.language}</span>
            <span className="text-zinc-500 text-[9px]">code snippet</span>
          </div>
          <pre className="p-3 text-xs text-emerald-300 overflow-x-auto whitespace-pre font-mono leading-relaxed">
            <code>{part.content.trim()}</code>
          </pre>
        </div>
      );
    }

    // Process inline markdown (**bold**, `inline code`)
    const inlineContent = part.content;
    return (
      <span key={index} className="whitespace-pre-wrap">
        {inlineContent.split('\n').map((line, lineIdx) => (
          <React.Fragment key={lineIdx}>
            {lineIdx > 0 && <br />}
            {renderInlineMarkdown(line)}
          </React.Fragment>
        ))}
      </span>
    );
  });
}

function renderInlineMarkdown(line) {
  // Replace `code` and **bold**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const tokens = line.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-indigo-950/60 text-indigo-300 font-mono text-[12px] border border-indigo-500/20">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{token.slice(2, -2)}</strong>;
    }
    return token;
  });
}

export default function MessageBubble({ messageData, currentUsername, registeredUsers = [], isGrouped = false }) {
  const isMe = messageData.sender && messageData.sender.toLowerCase() === currentUsername.toLowerCase();
  const senderName = messageData.sender || "System";
  const isOtr = messageData.isOffTheRecord || false;
  const isBot = messageData.isBotResponse || senderName === "PingBot";

  const senderUser = (registeredUsers || []).find(
    u => u && u.username && u.username.toLowerCase() === senderName.toLowerCase()
  );

  return (
    <div className={`flex items-end gap-2 text-left msg-enter ${isGrouped ? "mt-1 mb-0.5" : "mt-3 mb-1"} ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* Sender Avatar - shown only for initial message in group */}
      {!isGrouped ? (
        <Avatar
          name={isBot ? "PingBot" : senderName}
          customColor={isBot ? "#8b5cf6" : senderUser?.avatarColor}
          avatarUrl={isBot ? undefined : senderUser?.avatarUrl}
          size="sm"
        />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {/* Sender Name Label - shown only for non-grouped messages */}
        {!isGrouped && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-[11px] font-semibold text-zinc-300">
              {isMe ? "You" : (isBot ? "🤖 PingBot" : senderName)}
            </span>
            {isOtr && (
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-mono">
                🕵️ OTR
              </span>
            )}
          </div>
        )}

        {/* Message Content Bubble */}
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-md transition-all relative overflow-hidden ${
            isMe
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-xs shadow-indigo-500/20"
              : isBot
              ? "bg-purple-950/80 border border-purple-500/40 text-purple-100 rounded-tl-xs shadow-purple-900/40"
              : "bg-slate-800/80 border border-slate-700/50 text-slate-100 rounded-tl-xs shadow-md backdrop-blur-md"
          } ${isOtr ? "border-dashed border-amber-400/50 bg-amber-950/30" : ""}`}
        >
          <div className="inline">
            {renderFormattedMessage(messageData.message)}
          </div>

          {/* Inline Bottom-Right Timestamp */}
          <span className={`float-right inline-block text-[10px] opacity-60 font-mono select-none ml-3 mt-1.5 ${isMe ? "text-indigo-100" : "text-slate-400"}`}>
            {formatTimestamp(messageData.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
