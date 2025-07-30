import React from "react";

const TestApp = () => {
  console.log('TestApp rendering...');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test App - React is working!</h1>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <p>If you can see this, React is mounting properly.</p>
      </div>
    </div>
  );
};

export default TestApp;
