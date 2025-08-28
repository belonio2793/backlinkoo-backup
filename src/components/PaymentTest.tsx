import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export function PaymentTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPaymentEndpoints = async () => {
    setIsLoading(true);
    setTestResults([]);

    const testData = {
      amount: 140,
      credits: 100,
      productName: "100 Test Credits",
      paymentMethod: "stripe",
      isGuest: true,
      guestEmail: "test@example.com"
    };

    const endpoints = [
      '/.netlify/functions/create-payment',
      '/api/create-payment'
    ];

    for (const endpoint of endpoints) {
      try {
        addResult(`Testing endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData)
        });

        addResult(`Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          try {
            const responseText = await response.text();
            addResult(`Response length: ${responseText.length} characters`);
            
            if (responseText) {
              const result = JSON.parse(responseText);
              addResult(`✅ ${endpoint} - SUCCESS`);
              addResult(`Stripe URL received: ${result.url ? 'YES' : 'NO'}`);
              addResult(`Session ID: ${result.sessionId ? 'YES' : 'NO'}`);
            } else {
              addResult(`❌ ${endpoint} - Empty response`);
            }
          } catch (parseError) {
            addResult(`❌ ${endpoint} - JSON parse error: ${parseError.message}`);
          }
        } else {
          try {
            const errorText = await response.text();
            addResult(`❌ ${endpoint} - Error: ${errorText}`);
          } catch {
            addResult(`❌ ${endpoint} - Failed to read error response`);
          }
        }
      } catch (error) {
        addResult(`❌ ${endpoint} - Network error: ${error.message}`);
      }
      
      addResult('---');
    }

    setIsLoading(false);
  };

  const testEnvironmentVars = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test if we can reach any function
      const response = await fetch('/.netlify/functions/api-status', {
        method: 'GET'
      });

      addResult(`API Status endpoint: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        addResult(`API Status response: ${data.substring(0, 100)}...`);
      }
    } catch (error) {
      addResult(`API Status error: ${error.message}`);
    }

    // Check environment variables that should be available on frontend
    const frontendVars = [
      'VITE_SUPABASE_URL',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ];

    frontendVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (value) {
        addResult(`✅ ${varName}: ${value.substring(0, 20)}...`);
      } else {
        addResult(`❌ ${varName}: Not set`);
      }
    });

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Payment System Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testPaymentEndpoints} 
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Test Payment Endpoints
          </Button>
          <Button 
            onClick={testEnvironmentVars} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Test Environment
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Test Results:</h4>
            <div className="text-sm font-mono space-y-1 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`${
                    result.includes('✅') ? 'text-green-600' : 
                    result.includes('❌') ? 'text-red-600' : 
                    result.includes('Testing') ? 'text-blue-600 font-medium' :
                    'text-gray-600'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Expected Behavior:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Payment endpoints should return 200 status</li>
            <li>• Response should contain Stripe checkout URL</li>
            <li>• Environment variables should be properly set</li>
            <li>�� Functions should be accessible via both /.netlify/functions/ and /api/</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
