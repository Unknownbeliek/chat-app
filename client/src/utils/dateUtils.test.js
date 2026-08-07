import { describe, it, expect } from 'vitest';
import { formatTimestamp } from './dateUtils';

describe('formatTimestamp', () => {
  it('returns empty string for null, undefined, or empty input', () => {
    expect(formatTimestamp(null)).toBe('');
    expect(formatTimestamp(undefined)).toBe('');
    expect(formatTimestamp('')).toBe('');
  });

  it('returns raw string fallback for non-parseable date strings', () => {
    expect(formatTimestamp('Just now')).toBe('Just now');
    expect(formatTimestamp('10:45 AM')).toBe('10:45 AM');
  });

  it('formats today timestamp as time only', () => {
    const now = new Date();
    now.setHours(14, 30, 0, 0); // 2:30 PM today
    const result = formatTimestamp(now.toISOString());
    // Should contain time components (either 14:30 or 2:30 PM depending on locale default)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats past date timestamp with short month and day', () => {
    const pastDate = new Date('2025-01-15T09:15:00Z');
    const result = formatTimestamp(pastDate.toISOString());
    expect(result).toMatch(/Jan 15|15 Jan|1\/15/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
