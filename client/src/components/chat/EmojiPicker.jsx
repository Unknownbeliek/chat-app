import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export function getAppleEmojiUrl(emojiStr) {
  const hexes = [];
  for (const ch of emojiStr) {
    hexes.push(ch.codePointAt(0).toString(16));
  }
  const unified = hexes.join('-');
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${unified}.png`;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: '😀 Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '🫠', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗',
      '🤭', '🫢', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒',
      '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁',
      '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
      '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿'
    ]
  },
  {
    id: 'people',
    name: '👋 People',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫲', '🫱', '🫴', '🫳', '👌', '🤌', '🤏', '✌️', '🤞',
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊',
      '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
      '🧠', '🫀', '🫁', '🦴', '👀', '👁️', '👅', '👄', '🫦', '👶', '🧒', '👦', '👧', '🧑'
    ]
  },
  {
    id: 'animals',
    name: '🐱 Animals',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
      '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅',
      '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰',
      '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑'
    ]
  },
  {
    id: 'food',
    name: '🍕 Food',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭',
      '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒',
      '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞',
      '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆'
    ]
  },
  {
    id: 'activities',
    name: '⚽ Sports',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒',
      '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹',
      '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾'
    ]
  },
  {
    id: 'objects',
    name: '💡 Objects',
    emojis: [
      '🔥', '✨', '⚡', '💥', '🌟', '⭐', '🎈', '🎉', '🎊', '🎁', '🏆', '🏅', '🥇', '👑',
      '💎', '💡', '🔦', '🕯️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🕹️', '💽', '💾',
      '🎧', '🎤', '🎙️', '📻', '🎷', '🪗', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '🎬'
    ]
  },
  {
    id: 'symbols',
    name: '❤️ Symbols',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯',
      '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑'
    ]
  }
];

export default function EmojiPicker({ onEmojiSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategoryObj = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
  
  const displayedEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis)
    : currentCategoryObj?.emojis || [];

  return (
    <div className="w-80 h-96 glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50 backdrop-blur-2xl bg-zinc-950/85">
      {/* Header Search Bar */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/5">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Apple / WhatsApp emoji..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto no-scrollbar bg-black/20">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid Canvas with Official Apple / WhatsApp PNG Artwork */}
      <div className="flex-1 overflow-y-auto p-3 chat-scroll">
        <div className="grid grid-cols-7 gap-1.5">
          {displayedEmojis.map((emoji, idx) => {
            const appleUrl = getAppleEmojiUrl(emoji);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onEmojiSelect(emoji)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 hover:scale-125 active:scale-95 transition-all p-1 group"
                title={emoji}
              >
                <img
                  src={appleUrl}
                  alt={emoji}
                  className="w-6 h-6 object-contain pointer-events-none"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to text emoji if specific image fails to load
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className="hidden text-xl select-none">{emoji}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
