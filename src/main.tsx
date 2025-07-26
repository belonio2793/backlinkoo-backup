import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent ethereum property conflicts from browser extensions
try {
  if (typeof window !== 'undefined' && window.ethereum) {
    // Create a non-configurable proxy to prevent redefinition attempts
    const originalEthereum = window.ethereum;
    delete window.ethereum;
    Object.defineProperty(window, 'ethereum', {
      value: originalEthereum,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
} catch (error) {
  // Silently handle any ethereum property conflicts
  console.warn('Ethereum property conflict handled:', error);
}

// Global error handler for uncaught ethereum conflicts
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('Cannot redefine property: ethereum') ||
      event.error?.message?.includes('evmAsk')) {
    console.warn('Prevented ethereum conflict error:', event.error.message);
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Cannot redefine property: ethereum') ||
      event.reason?.message?.includes('evmAsk')) {
    console.warn('Prevented ethereum promise rejection:', event.reason.message);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
