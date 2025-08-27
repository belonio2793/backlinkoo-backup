import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

// Minimal App component to test basic routing
const App = () => {
  console.log('🚀 Simple App component rendering...');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Basic App Works!</h1>
              <p className="text-gray-600 mb-4">React Router is functioning correctly.</p>
              <div className="text-sm text-gray-500">
                Time: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        } />
        <Route path="/full" element={<Index />} />
        <Route path="*" element={
          <div className="min-h-screen bg-red-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h1 className="text-xl font-bold text-red-600">404 - Not Found</h1>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
