import { describe, it, expect } from 'vitest';
import { getAppleEmojiUrl, renderAppleEmojis } from './emojiUtils';

describe('emojiUtils', () => {
  it('generates correct Apple Emoji CDN URL for single emoji', () => {
    const url = getAppleEmojiUrl('😀');
    expect(url).toContain('https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/');
    expect(url).toContain('1f600.png');
  });

  it('returns unchanged string if text contains no emojis', () => {
    const text = 'Hello world!';
    const result = renderAppleEmojis(text);
    expect(result).toBe('Hello world!');
  });

  it('parses text containing emojis into array with Apple Emoji elements', () => {
    const result = renderAppleEmojis('Hi 😀 test 🚀');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(1);
  });
});
