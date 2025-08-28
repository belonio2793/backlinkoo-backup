import React, { useState } from 'react';
import { Button } from '../ui/button';

export function PaymentDiagnostic() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentEndpoint = async () => {
    setIsLoading(true);
    setStatus('Testing payment endpoint...');
    
    try {
      // Test Supabase Edge Function
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000, // $10.00 test amount
          credits: 100,
          productName: 'Test Credits',
          isGuest: true,
          guestEmail: 'test@example.com'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(`✅ Payment endpoint working! Session ID: ${data.sessionId?.substring(0, 20)}...`);
      } else {
        const errorText = await response.text();
        setStatus(`❌ Payment endpoint error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEnvironmentVars = () => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const results = [];
    if (publishableKey?.startsWith('pk_')) {
      results.push('✅ VITE_STRIPE_PUBLISHABLE_KEY: Configured');
    } else {
      results.push('❌ VITE_STRIPE_PUBLISHABLE_KEY: Missing or invalid');
    }

    if (supabaseUrl?.includes('supabase.co')) {
      results.push('✅ VITE_SUPABASE_URL: Configured');
    } else {
      results.push('❌ VITE_SUPABASE_URL: Missing or invalid');
    }

    if (supabaseKey?.length > 50) {
      results.push('✅ VITE_SUPABASE_ANON_KEY: Configured');
    } else {
      results.push('❌ VITE_SUPABASE_ANON_KEY: Missing or invalid');
    }

    setStatus(results.join('\n'));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Payment System Diagnostic</h2>
      
      <div className="space-y-4">
        <Button onClick={testEnvironmentVars} className="w-full">
          Test Environment Variables
        </Button>
        
        <Button 
          onClick={testPaymentEndpoint} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Payment Endpoint'}
        </Button>
        
        {status && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
