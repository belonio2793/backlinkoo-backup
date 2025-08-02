import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ConnectionTester } from '@/utils/connectionTester';

export function NetworkTester() {
  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runNetworkTest = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🔍 Running network connectivity test...');
      
      // Test basic connectivity
      const connectivityResults = await ConnectionTester.runFullConnectivityTest();
      
      // Test Supabase directly
      let supabaseTest = null;
      try {
        const { data, error } = await supabase.from('blog_posts').select('id').limit(1);
        supabaseTest = { 
          success: !error, 
          error: error?.message,
          dataCount: data?.length || 0
        };
      } catch (err: any) {
        supabaseTest = { 
          success: false, 
          error: err.message 
        };
      }
      
      setResults({
        connectivity: connectivityResults,
        supabaseTest,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Network Connectivity Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runNetworkTest} disabled={testing}>
          {testing ? 'Testing...' : 'Run Network Test'}
        </Button>
        
        {results && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
            
            {results.connectivity?.recommendations && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Recommendations:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {results.connectivity.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
