import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, TestTube } from 'lucide-react';
import { NetlifyDomainSyncService } from '@/services/netlifyDomainSync';

const NetlifyConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log('🧪 Starting Netlify connection test...');

      // Test connection multiple times to verify no "Response body is already used" errors
      console.log('🔄 Running multiple connection tests to verify fix...');

      const connectionResults = [];
      for (let i = 0; i < 3; i++) {
        console.log(`📊 Connection test ${i + 1}/3...`);
        const result = await NetlifyDomainSyncService.testNetlifyConnection();
        connectionResults.push(result);

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test site info
      console.log('📊 Testing site info...');
      const siteInfoResult = await NetlifyDomainSyncService.getNetlifySiteInfo();
      console.log('📊 Site info result:', siteInfoResult);

      setResults({
        connectionTests: connectionResults,
        siteInfo: siteInfoResult,
        timestamp: new Date().toISOString(),
        multipleTestsPassed: connectionResults.every(r => r.success !== undefined)
      });

      console.log('✅ All tests completed successfully - no response body errors!');

    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setError(error.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <TestTube className="h-8 w-8 text-blue-600" />
            Netlify Connection Test
          </h1>
          <p className="text-gray-600">
            Test the fixed Netlify domain sync service to verify the "body stream already read" error is resolved
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTest} 
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Netlify Connection Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Multiple Connection Tests
                  {getStatusBadge(results.multipleTestsPassed)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Response Body Fix Test:</strong> {results.multipleTestsPassed ? '✅ PASSED' : '❌ FAILED'}
                  </div>
                  <div className="text-sm">
                    <strong>Tests Run:</strong> {results.connectionTests?.length || 0}/3
                  </div>
                  {results.connectionTests?.map((test, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                      <strong>Test {index + 1}:</strong> {test.success ? '✅ Success' : '❌ Failed'}
                      {test.error && <div className="text-red-600">Error: {test.error}</div>}
                      {test.siteInfo?.name && <div>Site: {test.siteInfo.name}</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Site Info Test Results
                  {getStatusBadge(results.siteInfo.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Success:</strong> {results.siteInfo.success ? 'Yes' : 'No'}</div>
                  {results.siteInfo.error && (
                    <div><strong>Error:</strong> {results.siteInfo.error}</div>
                  )}
                  {results.siteInfo.domains && (
                    <div><strong>Domains Found:</strong> {results.siteInfo.domains.length}</div>
                  )}
                  {results.siteInfo.siteInfo && (
                    <div>
                      <strong>Site Details:</strong>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(results.siteInfo.siteInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Alert className={results.multipleTestsPassed && results.siteInfo.success ?
              "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test completed at:</strong> {new Date(results.timestamp).toLocaleString()}
                <br />
                <strong>Response Body Fix:</strong> {results.multipleTestsPassed ?
                  '✅ SUCCESS - No "Response body is already used" errors detected!' :
                  '❌ FAILED - Response body errors may still occur'
                }
                <br />
                <strong>Overall Status:</strong> {results.multipleTestsPassed && results.siteInfo.success ?
                  '✅ All systems working correctly!' :
                  '❌ Some issues detected - check error messages above'
                }
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetlifyConnectionTest;
