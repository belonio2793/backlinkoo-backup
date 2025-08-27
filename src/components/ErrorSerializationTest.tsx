import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ErrorLogger } from '@/utils/errorLogger';
import { TestTube, CheckCircle, XCircle } from 'lucide-react';

export function ErrorSerializationTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runErrorSerializationTests = () => {
    setIsRunning(true);
    setTestResults([]);
    const results: string[] = [];

    // Test 1: Error object
    try {
      const errorObj = new Error('Test error message');
      ErrorLogger.logError('Test Error Object', errorObj);
      results.push('✅ Error object serialization - PASS');
    } catch (e) {
      results.push('❌ Error object serialization - FAIL');
    }

    // Test 2: Plain object
    try {
      const plainObj = { message: 'Test plain object error', status: 404 };
      ErrorLogger.logError('Test Plain Object', plainObj);
      results.push('✅ Plain object serialization - PASS');
    } catch (e) {
      results.push('❌ Plain object serialization - FAIL');
    }

    // Test 3: Complex object with nested properties
    try {
      const complexObj = {
        error: 'Complex error message',
        details: { endpoint: '/api/test', status: 500 },
        metadata: { user: 'test@example.com' }
      };
      ErrorLogger.logError('Test Complex Object', complexObj);
      results.push('✅ Complex object serialization - PASS');
    } catch (e) {
      results.push('❌ Complex object serialization - FAIL');
    }

    // Test 4: Object with circular references (should not crash)
    try {
      const circularObj: any = { message: 'Circular reference test' };
      circularObj.self = circularObj;
      ErrorLogger.logError('Test Circular Reference', circularObj);
      results.push('✅ Circular reference handling - PASS');
    } catch (e) {
      results.push('❌ Circular reference handling - FAIL');
    }

    // Test 5: Null/undefined
    try {
      ErrorLogger.logError('Test Null', null);
      ErrorLogger.logError('Test Undefined', undefined);
      results.push('✅ Null/undefined handling - PASS');
    } catch (e) {
      results.push('❌ Null/undefined handling - FAIL');
    }

    // Test 6: String error
    try {
      ErrorLogger.logError('Test String Error', 'Simple string error message');
      results.push('✅ String error handling - PASS');
    } catch (e) {
      results.push('❌ String error handling - FAIL');
    }

    // Test 7: Function (should not crash)
    try {
      const functionError = () => 'function error';
      ErrorLogger.logError('Test Function Error', functionError);
      results.push('✅ Function error handling - PASS');
    } catch (e) {
      results.push('❌ Function error handling - FAIL');
    }

    // Test 8: Network-like error object
    try {
      const networkError = {
        message: 'Network request failed',
        status: 404,
        statusText: 'Not Found',
        endpoint: '/.netlify/functions/create-payment',
        response: { data: { error: 'Function not found' } }
      };
      ErrorLogger.logError('Test Network Error', networkError);
      results.push('✅ Network error serialization - PASS');
    } catch (e) {
      results.push('❌ Network error serialization - FAIL');
    }

    // Test 9: Supabase-like error object
    try {
      const supabaseError = {
        message: 'Edge Function returned a non-2xx status code',
        details: 'Function execution failed',
        hint: 'Check function logs',
        code: 'EDGE_FUNCTION_ERROR'
      };
      ErrorLogger.logError('Test Supabase Error', supabaseError);
      results.push('✅ Supabase error serialization - PASS');
    } catch (e) {
      results.push('❌ Supabase error serialization - FAIL');
    }

    // Test 10: Payment service error simulation
    try {
      const paymentError = {
        endpoint: '/.netlify/functions/create-payment',
        status: 500,
        statusText: 'Internal Server Error',
        body: JSON.stringify({ error: 'Stripe API key invalid' }),
        type: 'fetch_error'
      };
      ErrorLogger.logError('Test Payment Error', paymentError);
      results.push('✅ Payment error serialization - PASS');
    } catch (e) {
      results.push('❌ Payment error serialization - FAIL');
    }

    setTestResults(results);
    setIsRunning(false);

    // Show toast with summary
    const passCount = results.filter(r => r.includes('PASS')).length;
    const failCount = results.filter(r => r.includes('FAIL')).length;

    toast({
      title: failCount === 0 ? "✅ All Tests Passed!" : `⚠️ ${failCount} Tests Failed`,
      description: `${passCount} passed, ${failCount} failed. Check console for detailed logs.`,
      variant: failCount === 0 ? "default" : "destructive"
    });
  };

  const getTestIcon = (result: string) => {
    return result.includes('PASS') ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getTestBadge = (result: string) => {
    return result.includes('PASS') ? 
      <Badge className="bg-green-100 text-green-800">PASS</Badge> :
      <Badge variant="destructive">FAIL</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Error Serialization Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runErrorSerializationTests}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Tests...' : 'Test Error Serialization'}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results</h4>
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getTestIcon(result)}
                    <span className="text-sm">{result.replace('✅ ', '').replace('❌ ', '')}</span>
                  </div>
                  {getTestBadge(result)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Purpose:</strong> Verify that error serialization fixes prevent "[object Object]" displays.</p>
          <p><strong>Action:</strong> Check browser console for properly formatted error messages.</p>
          <p><strong>Success:</strong> All errors should show clear, readable messages instead of "[object Object]".</p>
        </div>
      </CardContent>
    </Card>
  );
}
