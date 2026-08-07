import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Reply, Copy, Check, Trash2, CheckCheck, Code, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatTimestamp } from '../../utils/dateUtils';
import { renderAppleEmojis } from '../../utils/emojiUtils';

// Helper to copy text to clipboard with feedback
function CodeBlockContainer({ language, codeString }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl bg-slate-950/95 border border-indigo-500/30 overflow-hidden shadow-2xl text-left font-mono max-w-full group/code">
      <div className="bg-white/5 px-3 py-1.5 text-[10px] text-indigo-300 font-medium uppercase tracking-wider border-b border-white/10 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5">
          <Code className="w-3 h-3 text-indigo-400" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors text-[10px] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto max-h-64 sm:max-h-72 overflow-y-auto chat-scroll p-3 text-xs leading-relaxed">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language || 'javascript'}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '0.82rem',
            lineHeight: '1.45'
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function processChildrenWithEmojis(children) {
  if (typeof children === 'string') {
    return renderAppleEmojis(children);
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return renderAppleEmojis(child);
      }
      return child;
    });
  }
  return children;
}

// Custom Markdown components for clean Stitch glassmorphic dark theme
const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (!inline) {
      const language = match ? match[1] : 'javascript';
      return <CodeBlockContainer language={language} codeString={codeString} />;
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono text-[12px] border border-indigo-500/30 font-medium select-all" {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  p({ children }) {
    return <div className="mb-1.5 last:mb-0 leading-relaxed text-[13px] break-words whitespace-pre-wrap text-slate-100">{processChildrenWithEmojis(children)}</div>;
  },
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto max-h-52 overflow-y-auto chat-scroll rounded-xl border border-indigo-500/20 max-w-full shadow-lg">
        <table className="min-w-full divide-y divide-white/10 text-xs text-left">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-indigo-950/50 text-indigo-200 font-semibold">{children}</thead>;
  },
  th({ children }) {
    return <th className="px-3.5 py-2 border-b border-indigo-500/20 font-medium">{processChildrenWithEmojis(children)}</th>;
  },
  td({ children }) {
    return <td className="px-3.5 py-2 border-b border-white/5 text-zinc-300">{processChildrenWithEmojis(children)}</td>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-1.5 pl-3 border-l-2 border-indigo-400 italic text-indigo-200/90 bg-indigo-950/40 py-1 pr-2 rounded-r-lg text-xs">
        {processChildrenWithEmojis(children)}
      </blockquote>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-indigo-200 underline font-medium">
        {processChildrenWithEmojis(children)}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="list-disc list-inside my-1.5 space-y-0.5 text-[13px] text-slate-100">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-inside my-1.5 space-y-0.5 text-[13px] text-slate-100">{children}</ol>;
  },
  li({ children }) {
    return <li className="ml-1 leading-relaxed">{processChildrenWithEmojis(children)}</li>;
  },
  h1({ children }) {
    return <h1 className="text-xs font-bold text-indigo-200 my-1 border-b border-indigo-500/25 pb-0.5">{processChildrenWithEmojis(children)}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xs font-bold text-indigo-300 my-1">{processChildrenWithEmojis(children)}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-xs font-semibold text-slate-200 my-0.5">{processChildrenWithEmojis(children)}</h3>;
  }
};

// Check if raw text looks like code (e.g. multiline code without backticks)
function isLikelyRawCode(text) {
  if (!text || typeof text !== 'string') return false;
  if (text.startsWith('```')) return false;

  const lines = text.split('\n');
  if (lines.length < 2) return false;

  const codeKeywords = /^\s*(import |export |const |let |var |function |class |if |for |while |switch |return |def |public |private |protected |struct |package |select |insert |update |delete |<[a-z0-9]+)/i;
  const codeSyntax = /[{};=>()]/;

  let matchingLines = 0;
  for (const line of lines) {
    if (codeKeywords.test(line) || (codeSyntax.test(line) && line.includes(';'))) {
      matchingLines++;
    }
  }

  return matchingLines >= 2;
}

export default function MessageBubble({
  messageData,
  currentUsername,
  registeredUsers = [],
  isGrouped = false,
  onReply,
  onDelete
}) {
  const isMe = messageData.sender && messageData.sender.toLowerCase() === currentUsername.toLowerCase();
  const senderName = messageData.sender || "System";
  const isOtr = messageData.isOffTheRecord || false;
  const isBot = messageData.isBotResponse || senderName === "PingBot";

  const senderUser = (registeredUsers || []).find(
    u => u && u.username && u.username.toLowerCase() === senderName.toLowerCase()
  );

  // Touch & Mouse Drag Gesture States
  const [isFocusSpotlight, setIsFocusSpotlight] = useState(false);
  const [reaction, setReaction] = useState(messageData.reaction || null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const startPos = useRef({ x: 0, y: 0 });
  const touchTimer = useRef(null);
  const lastTapTime = useRef(0);
  const lastTouchTime = useRef(0);

  const rawMessageText = messageData.message || '';
  const isAutoCode = isLikelyRawCode(rawMessageText);
  const hasCodeBlocks = rawMessageText.includes('```') || isAutoCode;

  // Determine if content is considered a long message (> 12 lines or > 400 chars)
  const lineCount = rawMessageText.split('\n').length;
  const isLongMessage = rawMessageText.length > 400 || lineCount > 12;

  // Drag / Press Start Handler
  const handleStart = (clientX, clientY, isTouch = false) => {
    const now = Date.now();
    if (isTouch) {
      lastTouchTime.current = now;
    } else if (now - lastTouchTime.current < 800) {
      // Ignore synthetic mouse event generated by mobile browsers after touch
      return;
    }

    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);

    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      setIsFocusSpotlight(true);
      if (window.navigator.vibrate) window.navigator.vibrate(40);
    }, 550); // 550ms long press delay
  };

  // Drag Move Handler
  const handleMove = (clientX, clientY, isTouch = false) => {
    if (!isDragging) return;
    if (!isTouch && Date.now() - lastTouchTime.current < 800) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = Math.abs(clientY - startPos.current.y);

    if (deltaY > 15 || Math.abs(deltaX) > 10) {
      if (touchTimer.current) clearTimeout(touchTimer.current);
    }

    if (deltaX > 0 && deltaY < 30) {
      // Rubberband physics
      const maxDrag = 120;
      const resistance = deltaX > 50 ? 50 + (deltaX - 50) * 0.35 : deltaX;
      setSwipeOffset(Math.min(resistance, maxDrag));
    }
  };

  // Drag / Press End Handler
  const handleEnd = (isTouch = false) => {
    const now = Date.now();
    if (!isTouch && now - lastTouchTime.current < 800) return;

    if (!isDragging) {
      if (touchTimer.current) clearTimeout(touchTimer.current);
      return;
    }

    setIsDragging(false);
    if (touchTimer.current) clearTimeout(touchTimer.current);

    if (swipeOffset >= 40) {
      if (onReply) onReply(messageData);
      if (window.navigator.vibrate) window.navigator.vibrate(35);
    }
    setSwipeOffset(0);

    // Double Tap spotlight trigger (must be two distinct taps between 80ms and 350ms)
    const timeSinceLastTap = now - lastTapTime.current;
    if (lastTapTime.current > 0 && timeSinceLastTap >= 80 && timeSinceLastTap <= 350) {
      setIsFocusSpotlight(true);
      if (window.navigator.vibrate) window.navigator.vibrate([25, 25]);
      lastTapTime.current = 0; // reset
    } else {
      lastTapTime.current = now;
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(rawMessageText);
    setIsFocusSpotlight(false);
  };

  return (
    <>
      <div
        onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY, true)}
        onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY, true)}
        onTouchEnd={() => handleEnd(true)}
        onMouseDown={e => handleStart(e.clientX, e.clientY, false)}
        onMouseMove={e => isDragging && handleMove(e.clientX, e.clientY, false)}
        onMouseUp={() => handleEnd(false)}
        onMouseLeave={() => handleEnd(false)}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className={`flex items-end gap-2 text-left msg-enter relative group select-none cursor-grab active:cursor-grabbing ${
          isGrouped ? "mt-1 mb-0.5" : "mt-2.5 mb-1"
        } ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Swipe Reply Circular Badge Indicator */}
        {swipeOffset > 8 && (
          <div
            style={{
              opacity: Math.min(swipeOffset / 40, 1),
              transform: `scale(${Math.min(0.6 + swipeOffset / 80, 1.1)})`
            }}
            className={`absolute left-[-42px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              swipeOffset >= 40
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-2 ring-indigo-400"
                : "bg-slate-800 text-indigo-300 border border-white/10"
            }`}
          >
            <Reply className="w-4 h-4" />
          </div>
        )}

        {/* Sender Avatar */}
        {!isGrouped && !isMe ? (
          <Avatar
            name={isBot ? "PingBot" : senderName}
            customColor={isBot ? "#8b5cf6" : senderUser?.avatarColor}
            avatarUrl={isBot ? undefined : senderUser?.avatarUrl}
            size="sm"
          />
        ) : !isMe ? (
          <div className="w-7 flex-shrink-0" />
        ) : null}

        {/* Message Bubble Container */}
        <div className={`${hasCodeBlocks ? "max-w-[92%] sm:max-w-[85%] md:max-w-[78%]" : "max-w-[85%] sm:max-w-[70%]"} flex flex-col relative ${isMe ? "items-end" : "items-start"}`}>
          {/* Sender Name Label */}
          {!isGrouped && !isMe && (
            <div className="flex items-center gap-1.5 mb-1 px-1 select-none">
              <span className="text-[11px] font-semibold text-indigo-300/90 tracking-wide">
                {isBot ? "🤖 PingBot" : senderName}
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
            className={`px-3.5 py-2 rounded-2xl text-[13.5px] leading-relaxed break-words transition-all relative overflow-hidden select-text shadow-md w-full ${
              messageData.isWhisper || messageData.whisper
                ? "bg-gradient-to-br from-purple-950/90 via-slate-900/90 to-purple-950/90 border border-purple-400/50 text-purple-100 rounded-tl-xs shadow-purple-950/40"
                : messageData.isAction
                ? "bg-amber-950/40 border border-amber-500/30 text-amber-200 italic rounded-tl-xs"
                : hasCodeBlocks
                ? isMe
                  ? "bg-slate-950/95 border border-indigo-500/40 text-slate-100 rounded-tr-xs shadow-2xl backdrop-blur-2xl ring-1 ring-indigo-500/20"
                  : "bg-slate-950/95 border border-slate-700/60 text-slate-100 rounded-tl-xs shadow-2xl backdrop-blur-2xl"
                : isMe
                ? "bg-gradient-to-br from-indigo-600/95 via-indigo-500/95 to-violet-600/95 text-white rounded-tr-xs shadow-indigo-500/25 border border-indigo-400/30 backdrop-blur-md"
                : isBot
                ? "bg-gradient-to-br from-purple-950/90 via-slate-900/90 to-purple-950/90 border border-purple-500/40 text-purple-100 rounded-tl-xs shadow-purple-900/40"
                : "bg-slate-900/85 border border-white/12 text-slate-100 rounded-tl-xs shadow-black/30 backdrop-blur-xl"
            } ${isOtr ? "border-dashed border-amber-400/50 bg-amber-950/30" : ""}`}
          >
            {/* WhatsApp-Style Quoted Reply Box */}
            {messageData.replyTo && (
              <div className="border-l-4 border-indigo-300 bg-black/40 rounded-r-xl px-2.5 py-1.5 mb-2 text-xs backdrop-blur-xs select-none">
                <div className="font-semibold text-indigo-300 text-[11px] mb-0.5">
                  Replying to {messageData.replyTo.sender}
                </div>
                <div className="text-zinc-200/90 text-[12px] truncate line-clamp-1">
                  {renderAppleEmojis(messageData.replyTo.message)}
                </div>
              </div>
            )}

            {(messageData.isWhisper || messageData.whisper) && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 border-b border-purple-500/30 pb-1 mb-1.5">
                <span>🤫 Ephemeral Whisper</span>
                <span className="text-[9px] bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-200 font-mono">10s TTL</span>
              </div>
            )}

            <div className="text-[13.5px] font-normal leading-relaxed text-slate-100">
              {isLongMessage && !isExpanded ? (
                <div className="relative overflow-hidden max-h-[260px] transition-all duration-300">
                  {isAutoCode ? (
                    <CodeBlockContainer language="javascript" codeString={rawMessageText} />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {rawMessageText}
                    </ReactMarkdown>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
                </div>
              ) : (
                isAutoCode ? (
                  <CodeBlockContainer language="javascript" codeString={rawMessageText} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {rawMessageText}
                  </ReactMarkdown>
                )
              )}
            </div>

            {/* Collapsible Expand / Collapse Button */}
            {isLongMessage && (
              <div className="mt-1.5 mb-0.5 flex justify-start">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer select-none bg-indigo-500/20 hover:bg-indigo-500/30 px-2.5 py-1 rounded-lg border border-indigo-500/30"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Show more ({Math.max(1, lineCount - 8)} more lines)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Bottom Right Timestamp & Status Indicator */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75 font-mono select-none tracking-wider">
              <span>{formatTimestamp(messageData.timestamp)}</span>
              {isMe && (
                messageData.status === 'read' || messageData.isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline-block drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" title="Read" />
                ) : messageData.status === 'delivered' || messageData.isDelivered ? (
                  <CheckCheck className="w-3.5 h-3.5 text-white/80 inline-block" title="Delivered" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white/60 inline-block" title="Sent" />
                )
              )}
            </div>
          </div>

          {/* Dynamic Spring Reaction Badge */}
          {reaction && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 16 }}
              className="absolute -bottom-2.5 right-2 bg-slate-900/95 border border-indigo-500/40 text-xs px-2 py-0.5 rounded-full shadow-lg font-medium select-none text-slate-100 ring-1 ring-indigo-500/20"
            >
              {reaction}
            </motion.span>
          )}
        </div>
      </div>

      {/* Double-Tap / Focus Spotlight Backdrop Overlay */}
      <AnimatePresence mode="wait">
        {isFocusSpotlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setIsFocusSpotlight(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className="w-full max-w-sm flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Quick Emoji Reaction Pill Bar — Liquid Glass Style */}
              <div className="bg-slate-900/85 border-t border-white/30 border-b border-black/60 rounded-full px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 backdrop-blur-2xl ring-1 ring-white/10">
                {['❤️', '👍', '🔥', '😂', '😮', '👏'].map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.3, y: -2 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    onClick={() => {
                      setReaction(emoji);
                      setIsFocusSpotlight(false);
                      if (window.navigator.vibrate) window.navigator.vibrate(30);
                    }}
                    className="text-2xl cursor-pointer select-none"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>

              {/* Elevated Focused Message Spotlight Card */}
              <div
                className={`w-full p-4 rounded-2xl text-[14px] leading-relaxed shadow-2xl border max-h-[65vh] overflow-y-auto chat-scroll ${
                  isMe
                    ? "bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white border-indigo-300/40 ring-4 ring-indigo-500/30"
                    : "bg-slate-900/95 border-white/20 text-slate-100 ring-4 ring-slate-700/50"
                }`}
              >
                {!isMe && (
                  <div className="text-xs font-semibold text-indigo-300 mb-1.5">
                    {senderName}
                  </div>
                )}
                {messageData.replyTo && (
                  <div className="border-l-4 border-indigo-300 bg-black/40 rounded-r-xl px-2.5 py-1.5 mb-2 text-xs backdrop-blur-xs select-none">
                    <div className="font-semibold text-indigo-300 text-[11px] mb-0.5">
                      Replying to {messageData.replyTo.sender}
                    </div>
                    <div className="text-zinc-200/90 text-[12px] truncate">
                      {messageData.replyTo.message}
                    </div>
                  </div>
                )}
                <div className="text-[14px] leading-relaxed select-text">
                  {isAutoCode ? (
                    <CodeBlockContainer language="javascript" codeString={rawMessageText} />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {rawMessageText}
                    </ReactMarkdown>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-[11px] opacity-75 font-mono">
                  <span>{formatTimestamp(messageData.timestamp)}</span>
                </div>
              </div>

              {/* Contextual Action Menu Options */}
              <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-2 shadow-2xl backdrop-blur-xl space-y-1">
                <motion.button
                  whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyMessage}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs text-zinc-200 flex items-center justify-between cursor-pointer font-medium transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Copy className="w-4 h-4 text-indigo-400" /> Copy Text
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (onReply) onReply(messageData);
                    setIsFocusSpotlight(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs text-zinc-200 flex items-center justify-between cursor-pointer font-medium transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Reply className="w-4 h-4 text-purple-400" /> Reply to Message
                  </span>
                </motion.button>
                {isMe && onDelete && (
                  <motion.button
                    whileHover={{ x: 4, backgroundColor: "rgba(225,29,72,0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onDelete(messageData);
                      setIsFocusSpotlight(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs text-rose-400 flex items-center justify-between cursor-pointer font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-rose-400" /> Delete Message
                    </span>
                  </motion.button>
                )}
              </div>
              
              <div className="text-[11px] text-zinc-400 font-sans tracking-wide">
                Tap anywhere outside to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
