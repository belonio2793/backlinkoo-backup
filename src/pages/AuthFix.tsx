import React from 'react';
import { AuthSessionFixer } from '@/components/debug/AuthSessionFixer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthFix = () => {
  const navigate = useNavigate();

  const handleFixed = () => {
    console.log('✅ Authentication session fixed!');
    // You can navigate somewhere after fixing if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Authentication Session Fixer
          </h1>
          <p className="text-lg text-gray-600">
            Resolve Supabase authentication and API key configuration issues
          </p>
        </div>

        {/* Auth Session Fixer Component */}
        <AuthSessionFixer onFixed={handleFixed} />

        {/* Additional Help */}
        <div className="mt-8 text-center text-gray-500">
          <p>After fixing authentication issues, you should be able to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access the /domains page</li>
            <li>Use all database features</li>
            <li>Sign in successfully</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthFix;
