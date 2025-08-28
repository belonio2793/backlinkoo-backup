import React, { useState } from 'react';
import { Button } from '../ui/button';

export function PaymentDiagnostic() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentEndpoint = async () => {
    setIsLoading(true);
    setStatus('Testing payment endpoints...\n');

    const endpoints = [
      { name: 'Supabase Edge Function', url: '/api/create-payment' },
      { name: 'Netlify Function', url: '/.netlify/functions/create-payment' }
    ];

    const results = ['Testing payment endpoints...', ''];

    for (const endpoint of endpoints) {
      try {
        results.push(`🔄 Testing ${endpoint.name}: ${endpoint.url}`);
        setStatus(results.join('\n'));

        const response = await fetch(endpoint.url, {
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
          try {
            const data = await response.json();
            results.push(`✅ ${endpoint.name}: Working! Session ID: ${data.sessionId?.substring(0, 20)}...`);
            break; // Found working endpoint
          } catch (parseError) {
            results.push(`❌ ${endpoint.name}: Response parsing error`);
          }
        } else {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorText = await response.text();
            if (errorText.length > 0 && errorText.length < 200) {
              errorMessage += ` - ${errorText}`;
            }
          } catch (readError) {
            // Ignore error reading response body
          }
          results.push(`❌ ${endpoint.name}: ${errorMessage}`);
        }
      } catch (error) {
        results.push(`❌ ${endpoint.name}: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      results.push(''); // Add spacing between tests
      setStatus(results.join('\n'));
    }

    setIsLoading(false);
  };

  const testEnvironmentVars = () => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const results = [];

    // Stripe Publishable Key
    if (publishableKey && publishableKey.startsWith('pk_')) {
      results.push('✅ VITE_STRIPE_PUBLISHABLE_KEY: Configured (' + publishableKey.substring(0, 10) + '...)');
    } else {
      results.push('❌ VITE_STRIPE_PUBLISHABLE_KEY: ' + (publishableKey ? 'Invalid format' : 'Missing'));
    }

    // Supabase URL
    if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
      results.push('✅ VITE_SUPABASE_URL: Configured');
    } else {
      results.push('❌ VITE_SUPABASE_URL: ' + (supabaseUrl ? 'Invalid format' : 'Missing'));
    }

    // Supabase Anon Key
    if (supabaseKey && supabaseKey.length > 50) {
      results.push('✅ VITE_SUPABASE_ANON_KEY: Configured (' + supabaseKey.length + ' chars)');
    } else {
      const keyLength = supabaseKey ? supabaseKey.length : 0;
      results.push('❌ VITE_SUPABASE_ANON_KEY: ' + (supabaseKey ? 'Too short (' + keyLength + ' chars)' : 'Missing'));
    }

    // Debug info
    results.push('');
    results.push('🔍 Debug Info:');
    results.push('Environment: ' + import.meta.env.MODE);
    const viteKeys = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
    results.push('Available VITE_ vars: ' + viteKeys.join(', '));

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
