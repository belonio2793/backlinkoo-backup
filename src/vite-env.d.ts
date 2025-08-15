/// <reference types="vite/client" />

// Global variables for error handling
declare global {
  interface Window {
    _originalFetch?: typeof fetch;
    _lastErrorTime?: number;
  }
}
