import React from 'react';

const TestPage = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>✅ Test Page Works!</h1>
      <p>If you can see this, React routing is working.</p>
      <p>Current URL: {window.location.href}</p>
      <p>Time: {new Date().toLocaleString()}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ padding: '10px 20px', marginRight: '10px' }}
        >
          Go Home
        </button>
        <button 
          onClick={() => window.location.href = '/domains'}
          style={{ padding: '10px 20px' }}
        >
          Try Domains
        </button>
      </div>
    </div>
  );
};

export default TestPage;
