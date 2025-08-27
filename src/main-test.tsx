import React from 'react'
import { createRoot } from 'react-dom/client'

// Simple test component
const TestApp = () => (
  <div className="min-h-screen bg-blue-100 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ React is Working!</h1>
      <p className="text-gray-600">The app is rendering correctly.</p>
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          Time: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  </div>
)

// Clear console and mount
console.clear();
console.log('🧪 Testing React mounting...');

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<TestApp />);
  console.log('✅ Test app mounted successfully');
} else {
  console.error('❌ Root element not found');
}
