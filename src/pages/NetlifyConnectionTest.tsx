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
      
      // Test connection
      const connectionResult = await NetlifyDomainSyncService.testNetlifyConnection();
      console.log('📊 Connection test result:', connectionResult);

      // Test site info
      const siteInfoResult = await NetlifyDomainSyncService.getNetlifySiteInfo();
      console.log('📊 Site info result:', siteInfoResult);

      setResults({
        connection: connectionResult,
        siteInfo: siteInfoResult,
        timestamp: new Date().toISOString()
      });

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
                  Connection Test Results
                  {getStatusBadge(results.connection.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Success:</strong> {results.connection.success ? 'Yes' : 'No'}</div>
                  {results.connection.error && (
                    <div><strong>Error:</strong> {results.connection.error}</div>
                  )}
                  {results.connection.config && (
                    <div><strong>Config Valid:</strong> {JSON.stringify(results.connection.config, null, 2)}</div>
                  )}
                  {results.connection.siteInfo && (
                    <div><strong>Site Name:</strong> {results.connection.siteInfo.name}</div>
                  )}
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

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test completed at:</strong> {new Date(results.timestamp).toLocaleString()}
                <br />
                <strong>Status:</strong> {results.connection.success && results.siteInfo.success ? 
                  '✅ All tests passed! The "body stream already read" error has been fixed.' :
                  '❌ Some tests failed. Check the error messages above.'
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
