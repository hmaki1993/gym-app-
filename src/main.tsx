import { SplashScreen } from '@capacitor/splash-screen';
// Dismiss native splash screen the millisecond the JS bundle executes
SplashScreen.hide().catch(err => console.log('Early splash hide error:', err));

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Prevent Vite overlay from showing Gemini API errors
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  event.stopPropagation();
}, { capture: true });
window.addEventListener('error', (event) => {
  const msg = event.message || event.error?.message || '';
  if (msg.includes('does not support') || msg.includes('Cannot read') || msg.includes('Gemini')) {
    event.preventDefault();
    event.stopPropagation();
  }
}, { capture: true });

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
