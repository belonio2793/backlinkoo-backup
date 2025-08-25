import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Clear console for fresh start
console.clear();
console.log('🚀 Starting Backlinkoo application...');

if (import.meta.env.DEV) {
  console.log('💡 Development mode active');
  console.log('🔧 Debug helpers will be available after app loads');
}

// Priority: Get React app rendering ASAP
createRoot(document.getElementById("root")!).render(<App />);
