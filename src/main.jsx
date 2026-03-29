import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fonts
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/dm-serif-display/400.css';

// Styles
import './styles/tokens.css';
import './index.css';

// Theme — apply before first paint to prevent flash
import './hooks/useTheme.js';

// i18n — must initialize before app renders
import './i18n/index.js';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
