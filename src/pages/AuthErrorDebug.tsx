/**
 * Authentication Error Debug Page
 * Used to test and verify authentication error handling fixes
 */

import React from 'react';
import { AuthErrorTest } from '@/components/AuthErrorTest';

export default function AuthErrorDebug() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Authentication Error Debug
          </h1>
          <p className="text-gray-600">
            Test authentication error handling to ensure proper formatting and prevent "[object Object]" displays
          </p>
        </div>
        
        <AuthErrorTest />
        
        <div className="text-center text-sm text-gray-600">
          <p>This page is used to debug and verify authentication error fixes.</p>
          <p>All errors should be properly formatted and readable to users.</p>
        </div>
      </div>
    </div>
  );
}
