import { useState, useEffect, useMemo } from 'react';

export function useTicker(intervalMs = 1000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

export function useTypewriter(
  text: string,
  { speed = 18, startDelay = 0, enabled = true } = {}
) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setOut(text);
      setDone(true);
      return;
    }
    setOut('');
    setDone(false);
    let i = 0;
    let cancelled = false;
    const start = setTimeout(function step() {
      if (cancelled) return;
      i += 1;
      setOut(text.slice(0, i));
      if (i < text.length) {
        setTimeout(step, speed);
      } else {
        setDone(true);
      }
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, speed, startDelay, enabled]);
  return { text: out, done };
}
