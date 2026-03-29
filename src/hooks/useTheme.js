import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'readyblock-theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(resolved) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

// Apply theme immediately on module load — before React renders
const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
applyTheme(savedTheme === 'system' ? getSystemTheme() : savedTheme);

export function useTheme() {
  const [preference, setPreference] = useState(savedTheme);

  const resolved =
    preference === 'system' ? getSystemTheme() : preference;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((value) => {
    setPreference(value);
    localStorage.setItem(THEME_KEY, value);
  }, []);

  return { theme: preference, resolved, setTheme };
}
