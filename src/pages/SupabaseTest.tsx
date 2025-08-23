import React from 'react';
import SupabaseConnectionTest from '@/components/SupabaseConnectionTest';

export const SupabaseTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supabase Connection Diagnostics
          </h1>
          <p className="text-gray-600">
            Debug and fix Supabase connection and authentication issues
          </p>
        </div>
        
        <SupabaseConnectionTest />
      </div>
    </div>
  );
};

export default SupabaseTest;
