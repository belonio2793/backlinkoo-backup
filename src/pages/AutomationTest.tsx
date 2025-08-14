import React from 'react';
import AutomationSystemTest from '@/components/AutomationSystemTest';

const AutomationTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Automation System Test</h1>
          <p className="text-lg text-gray-600">
            Debug and test the automation system components
          </p>
        </div>
        
        <AutomationSystemTest />
      </div>
    </div>
  );
};

export default AutomationTest;
