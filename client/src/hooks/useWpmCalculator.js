import { useState, useRef, useCallback } from 'react';

export function useWpmCalculator() {
  const [wpm, setWpm] = useState(0);
  const keystrokeTimes = useRef([]);
  const timerRef = useRef(null);

  const registerKeystroke = useCallback((textLength) => {
    const now = Date.now();
    
    if (textLength === 0) {
      keystrokeTimes.current = [];
      setWpm(0);
      return;
    }

    keystrokeTimes.current.push(now);

    // Keep only keystrokes from the last 10 seconds for real-time window
    const windowStart = now - 10000;
    keystrokeTimes.current = keystrokeTimes.current.filter(t => t >= windowStart);

    if (keystrokeTimes.current.length > 1) {
      const timeSpanMinutes = (now - keystrokeTimes.current[0]) / 60000;
      if (timeSpanMinutes > 0) {
        // Standard formula: 1 word = 5 characters
        const charCount = keystrokeTimes.current.length;
        const wordCount = charCount / 5;
        const calculatedWpm = Math.round(wordCount / timeSpanMinutes);
        setWpm(Math.min(calculatedWpm, 250)); // Cap at realistic 250 WPM
      }
    }

    // Reset WPM after 2.5s of inactivity
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setWpm(0);
      keystrokeTimes.current = [];
    }, 2500);
  }, []);

  return { wpm, registerKeystroke };
}
