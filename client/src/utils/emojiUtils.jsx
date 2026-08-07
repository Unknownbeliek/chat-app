import React from 'react';

/**
 * Returns the CDN URL for the official Apple emoji artwork (64x64 PNG).
 */
export function getAppleEmojiUrl(emojiStr) {
  const hexes = [];
  for (const ch of emojiStr) {
    const codePoint = ch.codePointAt(0);
    // Ignore variation selector 16 (0xfe0f) for CDN lookup if not standalone
    if (codePoint !== 0xfe0f) {
      hexes.push(codePoint.toString(16));
    }
  }
  const unified = hexes.join('-');
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${unified}.png`;
}

/**
 * Checks if a string contains any unicode emoji characters.
 */
export function hasEmoji(text) {
  if (typeof text !== 'string' || !text) return false;
  return /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u.test(text);
}

/**
 * Parses any text string containing unicode emojis and converts emoji characters
 * into inline Apple Emoji <img> components.
 */
export function renderAppleEmojis(text) {
  if (typeof text !== 'string' || !text) return text;

  // Regex to match unicode emojis (including extended pictographics & surrogate pairs)
  const EMOJI_REGEX = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = EMOJI_REGEX.exec(text)) !== null) {
    const emojiStr = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const appleUrl = getAppleEmojiUrl(emojiStr);

    parts.push(
      <img
        key={`apple-emoji-${matchIndex}-${emojiStr}`}
        src={appleUrl}
        alt={emojiStr}
        className="inline-block w-[1.25em] h-[1.25em] align-[-0.2em] my-0 mx-[1px] pointer-events-none select-none object-contain"
        loading="lazy"
        onError={(e) => {
          // If CDN fails, replace image with native emoji string
          e.target.style.display = 'none';
          if (e.target.nextSibling) {
            e.target.nextSibling.style.display = 'inline';
          }
        }}
      />
    );

    parts.push(
      <span key={`fallback-${matchIndex}`} className="hidden select-none pointer-events-none">
        {emojiStr}
      </span>
    );

    lastIndex = matchIndex + emojiStr.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return lastIndex > 0 ? parts : text;
}
