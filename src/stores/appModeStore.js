import { create } from 'zustand';

const STORAGE_KEY = 'readyblock-app-mode';

function getPersistedMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'bluesky' || stored === 'storm' || stored === 'recovery') return stored;
  } catch { /* SSR or blocked storage */ }
  return 'bluesky';
}

export const useAppModeStore = create((set) => ({
  mode: getPersistedMode(),

  setMode: (mode) => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
    set({ mode });
  },
}));
