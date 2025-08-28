import React, { useState } from 'react';
import { Button } from '../ui/button';

export function PaymentDiagnostic() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentEndpoint = async () => {
    setIsLoading(true);
    setStatus('Testing payment endpoints...\n');

    const results = ['Testing payment endpoints...', ''];

    try {
      // Test Supabase Edge Function (proper method)
      results.push('🔄 Testing Supabase Edge Function (via SDK)');
      setStatus(results.join('\n'));

      // Import Supabase client
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        results.push('❌ Supabase client: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      } else {
        // Dynamically import Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: 1000, // $10.00 test amount
            credits: 100,
            productName: 'Test Credits',
            isGuest: true,
            guestEmail: 'test@example.com'
          }
        });

        if (error) {
          if (error.message?.includes('not found') || error.message?.includes('404')) {
            results.push('❌ Supabase Edge Function: Function not deployed');
            results.push('💡 Run: supabase functions deploy create-payment');
          } else {
            results.push(`❌ Supabase Edge Function: ${error.message}`);
          }
        } else if (data?.sessionId) {
          results.push(`✅ Supabase Edge Function: Working! Session ID: ${data.sessionId.substring(0, 20)}...`);
        } else {
          results.push(`❌ Supabase Edge Function: Invalid response format`);
        }
      }

      results.push(''); // Add spacing

      // Test Netlify Function (fallback)
      results.push('🔄 Testing Netlify Function (fallback)');
      setStatus(results.join('\n'));

      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000,
          credits: 100,
          productName: 'Test Credits',
          isGuest: true,
          guestEmail: 'test@example.com'
        })
      });

      if (response.ok) {
        try {
          const data = await response.json();
          results.push(`✅ Netlify Function: Working! Session ID: ${data.sessionId?.substring(0, 20)}...`);
        } catch (parseError) {
          results.push(`❌ Netlify Function: Response parsing error`);
        }
      } else {
        results.push(`❌ Netlify Function: HTTP ${response.status} (Expected on non-Netlify hosting)`);
      }

    } catch (error) {
      results.push(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    results.push('');
    results.push('📋 Next Steps:');
    results.push('1. Deploy Supabase Edge Functions:');
    results.push('   supabase functions deploy create-payment');
    results.push('   supabase functions deploy create-subscription');
    results.push('   supabase functions deploy verify-payment');
    results.push('');
    results.push('2. Set Supabase secrets:');
    results.push('   supabase secrets set STRIPE_SECRET_KEY=sk_live_...');
    results.push('   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...');

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
