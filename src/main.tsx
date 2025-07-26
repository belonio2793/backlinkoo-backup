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

createRoot(document.getElementById("root")!).render(<App />);
