import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR websocket disconnection notices in sandboxed environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (msg.toLowerCase().includes('websocket')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (typeof msg === 'string' && msg.toLowerCase().includes('websocket')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  const origError = console.error;
  console.error = (...args: any[]) => {
    const text = args.map(a => typeof a === 'string' ? a : (a?.message || '')).join(' ');
    if (text.includes('[vite]') || text.toLowerCase().includes('websocket')) {
      return;
    }
    origError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
