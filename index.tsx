import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { applyThemePreference, DEFAULT_THEME, isThemePreference } from './utils/theme';
import { readPreference } from './utils/preferences';

applyThemePreference(readPreference('sql-toolkit.theme', DEFAULT_THEME, isThemePreference));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
