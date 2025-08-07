import React from 'react';

const WorkingAffiliate: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Affiliate Program</h1>
        
        <div className="bg-green-100 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">✅ Page Loading Successfully</h2>
          <p className="text-green-800">
            The affiliate page is now working correctly. This confirms routing and basic functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">20% Commission</h3>
            <p className="text-blue-700">Earn 20% on all referrals</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">30-Day Tracking</h3>
            <p className="text-purple-700">Extended attribution window</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Real-Time Stats</h3>
            <p className="text-orange-700">Live performance dashboard</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Next Steps:</h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-green-600 mr-2">•</span>
              Basic page structure is working
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">•</span>
              Routing is configured correctly
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">•</span>
              Ready to add full affiliate functionality
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkingAffiliate;
