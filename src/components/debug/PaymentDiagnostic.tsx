import React, { useState } from 'react';
import { Button } from '../ui/button';

export function PaymentDiagnostic() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentEndpoint = async () => {
    setIsLoading(true);
    setStatus('Testing payment endpoints...\n');

    const results = ['🔍 Advanced Payment Function Diagnostic', ''];

    try {
      // Test Supabase Edge Function (proper method)
      results.push('🔄 Testing Supabase Edge Function (create-payment)');
      setStatus(results.join('\n'));

      // Import Supabase client
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        results.push('❌ Supabase client: Missing environment variables');
        results.push(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
        results.push(`   VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
      } else {
        results.push(`📡 Supabase URL: ${supabaseUrl}`);

        // Dynamically import Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const testPayload = {
          amount: 1000, // $10.00 test amount
          credits: 100,
          productName: 'Test Credits',
          isGuest: true,
          guestEmail: 'test@example.com'
        };

        results.push(`📦 Test payload: ${JSON.stringify(testPayload, null, 2)}`);
        results.push('⏳ Calling supabase.functions.invoke("create-payment")...');
        setStatus(results.join('\n'));

        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: testPayload
        });

        if (error) {
          results.push(`❌ Supabase Edge Function Error:`);
          results.push(`   Error Code: ${error.name || 'Unknown'}`);
          results.push(`   Error Message: ${error.message || 'No message'}`);
          results.push(`   Error Details: ${JSON.stringify(error, null, 2)}`);

          // Check specific error types
          if (error.message?.includes('not found') || error.message?.includes('404')) {
            results.push('💡 Diagnosis: Function not deployed or wrong function name');
          } else if (error.message?.includes('CORS')) {
            results.push('💡 Diagnosis: CORS configuration issue');
          } else if (error.message?.includes('Environment')) {
            results.push('💡 Diagnosis: Missing environment variables in Supabase');
          } else if (error.message?.includes('STRIPE_SECRET_KEY')) {
            results.push('💡 Diagnosis: Missing or invalid Stripe secret key');
          } else if (error.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            results.push('💡 Diagnosis: Missing or invalid Supabase service role key');
          }
        } else {
          results.push('✅ Supabase Edge Function Response:');
          results.push(`   Data: ${JSON.stringify(data, null, 2)}`);

          if (data?.sessionId) {
            results.push(`✅ SUCCESS! Session ID: ${data.sessionId.substring(0, 20)}...`);
            results.push(`   Payment URL: ${data.url ? 'Generated' : 'Missing'}`);
          } else if (data?.error) {
            results.push(`❌ Function Error: ${data.error}`);
          } else {
            results.push('❌ Unexpected response format');
          }
        }
      }

      results.push(''); // Add spacing

      // Quick connectivity test
      results.push('🔄 Testing Supabase connectivity...');
      setStatus(results.join('\n'));

      try {
        const connectTest = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        results.push(`✅ Supabase REST API: ${connectTest.status} ${connectTest.statusText}`);
      } catch (connectError) {
        results.push(`❌ Supabase connectivity: ${connectError instanceof Error ? connectError.message : 'Failed'}`);
      }

    } catch (error) {
      results.push(`❌ Critical test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    }

    results.push('');
    results.push('🔧 Troubleshooting Checklist:');
    results.push('1. ✓ Verify Supabase functions are deployed');
    results.push('2. ✓ Check Supabase secrets are set correctly');
    results.push('3. ✓ Confirm Stripe secret key is valid');
    results.push('4. ✓ Ensure SUPABASE_SERVICE_ROLE_KEY has proper permissions');

    setStatus(results.join('\n'));
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
