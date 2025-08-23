import React from 'react';

// Minimal domains test page to check if basic rendering works
const DomainsTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Domains Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>React rendering working</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Tailwind CSS working</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
              <span>Basic page routing working</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Environment Info:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Path:</strong> {window.location.pathname}</p>
            <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <button 
            onClick={() => window.location.href = '/domains'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Real Domains Page
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainsTestPage;
