import { describe, it, expect, vi } from 'vitest';
import { urlBase64ToUint8Array, registerServiceWorker, subscribeUserToPush } from './push';

describe('push.js utilities', () => {
  describe('urlBase64ToUint8Array', () => {
    it('converts base64url string to Uint8Array', () => {
      // "hello" in standard base64 is "aGVsbG8=" -> base64url "aGVsbG8"
      const input = 'aGVsbG8';
      const result = urlBase64ToUint8Array(input);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      // 'h'=104, 'e'=101, 'l'=108, 'l'=108, 'o'=111
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
    });

    it('handles base64url characters (- and _)', () => {
      // "hello?" in standard base64 is "aGVsbG8/" -> base64url "aGVsbG8_"
      const base64Url = 'aGVsbG8_';
      const result = urlBase64ToUint8Array(base64Url);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111, 63]);
    });
  });

  describe('registerServiceWorker', () => {
    it('returns null when serviceWorker is not supported in navigator', async () => {
      const originalSW = navigator.serviceWorker;
      delete navigator.serviceWorker;
      const result = await registerServiceWorker();
      expect(result).toBeNull();
      navigator.serviceWorker = originalSW;
    });
  });

  describe('subscribeUserToPush', () => {
    it('returns error when username is empty', async () => {
      const result = await subscribeUserToPush('');
      expect(result).toEqual({ success: false, error: 'User is not authenticated' });
    });
  });
});
