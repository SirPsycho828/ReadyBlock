import { useLayoutEffect } from 'react';
import { useAppModeStore } from '@/stores/appModeStore';

const THEME_COLORS = {
  bluesky: '#1D5C5C',
  storm: '#1D5C5C',
  recovery: '#C4782A',
};

/**
 * Syncs the app mode to the DOM:
 *  - Sets data-app-mode attribute on <html>
 *  - Always uses light mode for visibility
 *  - Updates <meta name="theme-color"> for PWA chrome
 *
 * Call once in AppShell.
 */
export function useAppMode() {
  const mode = useAppModeStore((s) => s.mode);

  useLayoutEffect(() => {
    const root = document.documentElement;

    // Set data attribute for CSS selectors
    root.dataset.appMode = mode;

    // Always light mode
    root.classList.remove('dark');

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[mode]);
  }, [mode]);

  return mode;
}
