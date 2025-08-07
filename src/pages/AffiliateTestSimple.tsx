import React from 'react';

export const AffiliateTestSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Affiliate Test Page</h1>
        <p>This is a simple test page to verify routing works.</p>
        <div className="mt-8 p-4 bg-green-100 border border-green-200 rounded">
          <p className="text-green-800">✅ If you can see this, routing is working correctly.</p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateTestSimple;
