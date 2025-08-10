/**
 * Authentication Error Test Component
 * Used to test and debug authentication error handling
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatAuthError, logAuthError, safeAuthToast } from '@/utils/authErrorFix';
import { formatErrorForUI } from '@/utils/errorUtils';

export function AuthErrorTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();

  const testCases = [
    {
      name: 'String Error',
      error: 'Invalid credentials'
    },
    {
      name: 'Error Object',
      error: new Error('Authentication failed')
    },
    {
      name: 'Supabase Auth Error',
      error: {
        message: 'Invalid login credentials',
        status: 400,
        statusText: 'Bad Request'
      }
    },
    {
      name: 'Nested Error Object',
      error: {
        error: {
          message: 'User not found'
        }
      }
    },
    {
      name: 'Complex Object (should not show [object Object])',
      error: {
        type: 'auth_error',
        code: 'INVALID_CREDENTIALS',
        details: { timestamp: Date.now() }
      }
    },
    {
      name: 'Null/Undefined Error',
      error: null
    },
    {
      name: 'Empty Object',
      error: {}
    }
  ];

  const runTest = (testCase: any) => {
    try {
      // Test our auth error formatter
      const authFormatted = formatAuthError(testCase.error);
      
      // Test general error formatter for comparison
      const generalFormatted = formatErrorForUI(testCase.error);
      
      // Log the test
      logAuthError(`Test: ${testCase.name}`, testCase.error);
      
      // Show toast with safe auth toast
      safeAuthToast(toast, `Test: ${testCase.name}`, testCase.error);
      
      const result = `✅ ${testCase.name}: "${authFormatted}" (General: "${generalFormatted}")`;
      setTestResults(prev => [...prev, result]);
      
      console.log(`🧪 Auth Error Test [${testCase.name}]:`, {
        original: testCase.error,
        authFormatted,
        generalFormatted,
        isObjectObject: authFormatted.includes('[object Object]') || generalFormatted.includes('[object Object]')
      });
      
    } catch (error) {
      const result = `❌ ${testCase.name}: Failed with ${error}`;
      setTestResults(prev => [...prev, result]);
      console.error(`🧪 Auth Error Test Failed [${testCase.name}]:`, error);
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    testCases.forEach((testCase, index) => {
      setTimeout(() => runTest(testCase), index * 500);
    });
  };

  const simulateAuthError = () => {
    // Simulate the exact pattern that was causing issues
    const errorObject = {
      status: 400,
      statusText: 'Bad Request',
      message: undefined, // This might cause [object Object]
      error: {
        code: 'invalid_credentials'
      }
    };
    
    console.error('🚨 Authentication Error:', errorObject);
    
    toast({
      title: "🚨 Authentication Error",
      description: formatAuthError(errorObject),
      variant: "destructive"
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Error Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            This component tests authentication error handling to prevent "[object Object]" displays.
            Check the console for detailed logging output.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Button onClick={runAllTests} className="w-full">
            Run All Error Format Tests
          </Button>
          <Button onClick={simulateAuthError} variant="outline" className="w-full">
            Simulate Problematic Auth Error
          </Button>
          <Button 
            onClick={() => setTestResults([])} 
            variant="ghost" 
            className="w-full"
          >
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    result.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Expected behavior:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No result should show "[object Object]"</li>
            <li>All errors should be formatted as readable strings</li>
            <li>Null/undefined errors should show fallback messages</li>
            <li>Console logs should include structured debug info</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
