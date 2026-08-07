import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWpmCalculator } from './useWpmCalculator';

describe('useWpmCalculator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with initial WPM of 0', () => {
    const { result } = renderHook(() => useWpmCalculator());
    expect(result.current.wpm).toBe(0);
  });

  it('resets WPM to 0 when textLength is 0', () => {
    const { result } = renderHook(() => useWpmCalculator());

    act(() => {
      result.current.registerKeystroke(5);
    });

    act(() => {
      result.current.registerKeystroke(0);
    });

    expect(result.current.wpm).toBe(0);
  });

  it('calculates WPM accurately based on keystrokes over time', () => {
    const { result } = renderHook(() => useWpmCalculator());

    // First keystroke at t=0
    act(() => {
      result.current.registerKeystroke(1);
    });

    // Advance time by 1000ms (1 second) and register 4 more keystrokes (total 5 chars = 1 word)
    act(() => {
      vi.advanceTimersByTime(250);
      result.current.registerKeystroke(2);
      vi.advanceTimersByTime(250);
      result.current.registerKeystroke(3);
      vi.advanceTimersByTime(250);
      result.current.registerKeystroke(4);
      vi.advanceTimersByTime(250);
      result.current.registerKeystroke(5);
    });

    // 5 chars = 1 word in 1 second (1/60th minute) = 60 WPM
    expect(result.current.wpm).toBe(60);
  });

  it('caps calculated WPM at 250', () => {
    const { result } = renderHook(() => useWpmCalculator());

    // Register 100 keystrokes in 1ms (super fast)
    act(() => {
      result.current.registerKeystroke(1);
      vi.advanceTimersByTime(1);
      for (let i = 2; i <= 50; i++) {
        result.current.registerKeystroke(i);
      }
    });

    expect(result.current.wpm).toBeLessThanOrEqual(250);
  });

  it('resets WPM to 0 after 2.5s of inactivity', () => {
    const { result } = renderHook(() => useWpmCalculator());

    act(() => {
      result.current.registerKeystroke(1);
      vi.advanceTimersByTime(500);
      result.current.registerKeystroke(2);
    });

    expect(result.current.wpm).toBeGreaterThan(0);

    // Fast-forward 2.5s
    act(() => {
      vi.advanceTimersByTime(2550);
    });

    expect(result.current.wpm).toBe(0);
  });
});
