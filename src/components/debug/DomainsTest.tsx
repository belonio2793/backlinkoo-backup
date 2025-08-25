import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, Globe } from 'lucide-react';
import { DomainService } from '@/services/domainService';
import { DomainServiceDev } from '@/services/domainServiceDev';

// Use development service if in development mode
const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
const DomainAPI = isDev ? DomainServiceDev : DomainService;
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';

const DomainsTest = () => {
  const { user } = useAuthState();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTests = async () => {
    if (!user?.id) {
      setResults([{ test: 'Auth Check', status: 'failed', message: 'User not authenticated' }]);
      return;
    }

    setTesting(true);
    const testResults: any[] = [];

    try {
      // Test 1: Database connection
      testResults.push({ test: 'Database Connection', status: 'running', message: 'Testing...' });
      setResults([...testResults]);

      try {
        const { data, error } = await supabase.from('domains').select('count').single();
        if (error) throw error;
        testResults[0] = { test: 'Database Connection', status: 'passed', message: '✅ Connected to Supabase' };
      } catch (error: any) {
        testResults[0] = { test: 'Database Connection', status: 'failed', message: `❌ ${error.message}` };
      }
      setResults([...testResults]);

      // Test 2: Domains table schema
      testResults.push({ test: 'Domains Table Schema', status: 'running', message: 'Testing...' });
      setResults([...testResults]);

      try {
        const { data, error } = await supabase.from('domains').select('id,domain,status,user_id,netlify_verified,created_at').limit(1);
        if (error) throw error;
        testResults[1] = { test: 'Domains Table Schema', status: 'passed', message: '✅ Domains table accessible with correct schema' };
      } catch (error: any) {
        testResults[1] = { test: 'Domains Table Schema', status: 'failed', message: `❌ ${error.message}` };
      }
      setResults([...testResults]);

      // Test 3: Netlify connection
      testResults.push({ test: 'Netlify Connection', status: 'running', message: 'Testing...' });
      setResults([...testResults]);

      try {
        const netlifyResult = await DomainAPI.testNetlifyConnection();
        if (netlifyResult.success) {
          testResults[2] = { test: 'Netlify Connection', status: 'passed', message: '✅ Connected to Netlify API' };
        } else {
          testResults[2] = { test: 'Netlify Connection', status: 'failed', message: `❌ ${netlifyResult.error}` };
        }
      } catch (error: any) {
        testResults[2] = { test: 'Netlify Connection', status: 'failed', message: `❌ ${error.message}` };
      }
      setResults([...testResults]);

      // Test 4: Domain sync from Netlify
      testResults.push({ test: 'Netlify Sync', status: 'running', message: 'Testing...' });
      setResults([...testResults]);

      try {
        const syncResult = await DomainAPI.syncFromNetlify(user.id);
        if (syncResult.success) {
          testResults[3] = { test: 'Netlify Sync', status: 'passed', message: `✅ ${syncResult.message}` };
        } else {
          testResults[3] = { test: 'Netlify Sync', status: 'failed', message: `❌ ${syncResult.error}` };
        }
      } catch (error: any) {
        testResults[3] = { test: 'Netlify Sync', status: 'failed', message: `❌ ${error.message}` };
      }
      setResults([...testResults]);

      // Test 5: Load user domains
      testResults.push({ test: 'Load User Domains', status: 'running', message: 'Testing...' });
      setResults([...testResults]);

      try {
        const domains = await DomainAPI.getUserDomains(user.id);
        testResults[4] = { test: 'Load User Domains', status: 'passed', message: `✅ Found ${domains.length} domains` };
      } catch (error: any) {
        testResults[4] = { test: 'Load User Domains', status: 'failed', message: `❌ ${error.message}` };
      }
      setResults([...testResults]);

      // Test 6: Domain validation
      testResults.push({ test: 'Domain Validation', status: 'running', message: 'Testing...' });
      setResults([...testResults]);

      try {
        const validDomain = DomainAPI.isValidDomain('example.com');
        const invalidDomain = DomainAPI.isValidDomain('not-a-domain');
        
        if (validDomain && !invalidDomain) {
          testResults[5] = { test: 'Domain Validation', status: 'passed', message: '✅ Domain validation working correctly' };
        } else {
          testResults[5] = { test: 'Domain Validation', status: 'failed', message: '❌ Domain validation not working correctly' };
        }
      } catch (error: any) {
        testResults[5] = { test: 'Domain Validation', status: 'failed', message: `❌ ${error.message}` };
      }
      setResults([...testResults]);

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-600">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Domains System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            This test verifies that the domains system is working correctly, including database access, Netlify integration, and core functionality.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runTests} 
          disabled={testing || !user}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Domain System Tests'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}

        {!user && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to run the domain system tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DomainsTest;
