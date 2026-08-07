import { describe, it, expect } from 'vitest';
import { getUsernameColor, getInitials, PRESET_AVATARS } from './avatarUtils';

describe('avatarUtils', () => {
  describe('getUsernameColor', () => {
    it('returns customColor if customColor is provided', () => {
      expect(getUsernameColor('raj', '#ff0000')).toBe('#ff0000');
    });

    it('returns grey fallback for empty username', () => {
      expect(getUsernameColor('')).toBe('hsl(0, 0%, 70%)');
      expect(getUsernameColor(null)).toBe('hsl(0, 0%, 70%)');
      expect(getUsernameColor(undefined)).toBe('hsl(0, 0%, 70%)');
    });

    it('returns deterministic HSL color for the same username', () => {
      const color1 = getUsernameColor('rajkumar');
      const color2 = getUsernameColor('rajkumar');
      expect(color1).toBe(color2);
      expect(color1).toMatch(/^hsl\(\d+, 75%, 65%\)$/);
    });

    it('returns different colors for different usernames', () => {
      const color1 = getUsernameColor('alice');
      const color2 = getUsernameColor('bob');
      expect(color1).not.toBe(color2);
    });
  });

  describe('getInitials', () => {
    it('returns "?" for falsy or empty name', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials(null)).toBe('?');
      expect(getInitials(undefined)).toBe('?');
    });

    it('returns globe emoji for "Global Chat"', () => {
      expect(getInitials('Global Chat')).toBe('🌍');
    });

    it('returns uppercase initials for multi-word names', () => {
      expect(getInitials('Raj Kumar')).toBe('RK');
      expect(getInitials('john doe smith')).toBe('JD');
    });

    it('returns first 2 characters uppercase for single-word names >= 2 chars', () => {
      expect(getInitials('rajkumar')).toBe('RA');
      expect(getInitials('alice')).toBe('AL');
    });

    it('returns single uppercase letter for single character name', () => {
      expect(getInitials('a')).toBe('A');
    });
  });

  describe('PRESET_AVATARS', () => {
    it('contains array of avatar path strings', () => {
      expect(Array.isArray(PRESET_AVATARS)).toBe(true);
      expect(PRESET_AVATARS.length).toBeGreaterThan(0);
      expect(PRESET_AVATARS[0]).toMatch(/^\/avatars\//);
    });
  });
});
