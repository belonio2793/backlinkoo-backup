import React from 'react';

const MinimalAffiliateTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f0f9ff' }}>
      <h1 style={{ color: '#1e40af', fontSize: '2rem', marginBottom: '1rem' }}>
        ✅ Affiliate Page Working!
      </h1>
      
      <div style={{ backgroundColor: '#dcfce7', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
        <p style={{ color: '#166534', margin: 0 }}>
          Success! The affiliate page is loading correctly without redirects.
        </p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#374151', marginTop: 0 }}>Affiliate Program</h2>
        <p style={{ color: '#6b7280' }}>This confirms routing is working properly.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontWeight: 'bold' }}>20% Commission</div>
            <div style={{ fontSize: '0.875rem', color: '#92400e' }}>Earn on all sales</div>
          </div>
          
          <div style={{ backgroundColor: '#dbeafe', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏰</div>
            <div style={{ fontWeight: 'bold' }}>30-Day Tracking</div>
            <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>Extended attribution</div>
          </div>
          
          <div style={{ backgroundColor: '#f3e8ff', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontWeight: 'bold' }}>Live Analytics</div>
            <div style={{ fontSize: '0.875rem', color: '#7c3aed' }}>Real-time stats</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalAffiliateTest;
