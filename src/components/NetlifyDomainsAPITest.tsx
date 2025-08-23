import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

export const NetlifyDomainsAPITest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testNetlifyDomainsAPI = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const netlifyToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
      const siteId = import.meta.env.VITE_NETLIFY_SITE_ID;

      console.log('🔍 Testing Netlify domains API...');
      console.log(`   Site ID: ${siteId}`);
      console.log(`   Token: ${netlifyToken ? `${netlifyToken.substring(0, 8)}...` : 'Not configured'}`);

      if (!netlifyToken || !siteId) {
        throw new Error('Netlify configuration not found in environment variables');
      }

      // Test the exact endpoint from the user's specification
      const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/domains`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const domains = await response.json();
      console.log('✅ Domains fetched successfully:', domains);

      setResult({
        success: true,
        status: response.status,
        domains: domains,
        domain_count: domains?.length || 0,
        endpoint: `https://api.netlify.com/api/v1/sites/${siteId}/domains`
      });

    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testCurlEquivalent = () => {
    const netlifyToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
    const siteId = import.meta.env.VITE_NETLIFY_SITE_ID;

    return `curl -X GET \\
  -H "Authorization: Bearer ${netlifyToken}" \\
  -H "Content-Type: application/json" \\
  https://api.netlify.com/api/v1/sites/${siteId}/domains`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Netlify Domains API Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Testing the exact Netlify domains API endpoint as specified in the user requirements.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-medium">Environment Configuration:</h3>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              <div>NETLIFY_SITE_ID: {import.meta.env.VITE_NETLIFY_SITE_ID || 'Not configured'}</div>
              <div>NETLIFY_ACCESS_TOKEN: {import.meta.env.VITE_NETLIFY_ACCESS_TOKEN ? `${import.meta.env.VITE_NETLIFY_ACCESS_TOKEN.substring(0, 8)}...` : 'Not configured'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Equivalent cURL command:</h3>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
              {testCurlEquivalent()}
            </div>
          </div>

          <Button 
            onClick={testNetlifyDomainsAPI}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : (
              'Test Netlify Domains API'
            )}
          </Button>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-2">Test Failed:</div>
                <pre className="text-xs whitespace-pre-wrap">{error}</pre>
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-medium mb-2">Test Successful!</div>
                <div className="space-y-2">
                  <div><strong>Status:</strong> {result.status}</div>
                  <div><strong>Endpoint:</strong> {result.endpoint}</div>
                  <div><strong>Domains Found:</strong> {result.domain_count}</div>
                  
                  {result.domains && result.domains.length > 0 && (
                    <div>
                      <strong>Domains:</strong>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.domains, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.domain_count === 0 && (
                    <div className="text-sm text-green-700 mt-2">
                      ✅ API is working correctly. No domains are currently configured for this site.
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetlifyDomainsAPITest;
