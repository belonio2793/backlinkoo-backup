import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Database, 
  Settings,
  ExternalLink,
  RefreshCw,
  Zap
} from 'lucide-react';
import { NetlifyDomainSyncService } from '@/services/netlifyDomainSyncService';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

const DomainSyncTester = () => {
  const { user } = useAuthState();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runComprehensiveTest = async () => {
    if (!user?.id) {
      toast.error('Please sign in to run tests');
      return;
    }

    setTesting(true);
    setProgress(0);
    const testResults: TestResult[] = [];

    // Initialize test results
    const tests = [
      'Netlify Connection Test',
      'Get Netlify Site Info',
      'Supabase Database Test',
      'Domain Sync Test',
      'Full Integration Test'
    ];

    tests.forEach(test => {
      testResults.push({
        name: test,
        status: 'pending',
        message: 'Waiting to run...'
      });
    });
    setResults([...testResults]);

    try {
      // Test 1: Netlify Connection
      setProgress(20);
      testResults[0].status = 'running';
      testResults[0].message = 'Testing Netlify API connection...';
      setResults([...testResults]);

      const connectionTest = await NetlifyDomainSyncService.testConnection();
      testResults[0].status = connectionTest.success ? 'success' : 'error';
      testResults[0].message = connectionTest.message;
      testResults[0].details = connectionTest;
      setResults([...testResults]);

      // Test 2: Get Site Info
      setProgress(40);
      testResults[1].status = 'running';
      testResults[1].message = 'Fetching Netlify site information...';
      setResults([...testResults]);

      const siteInfoTest = await NetlifyDomainSyncService.getNetlifySiteInfo();
      testResults[1].status = siteInfoTest.success ? 'success' : 'error';
      testResults[1].message = siteInfoTest.success 
        ? `✅ Site: ${siteInfoTest.data?.name} (${siteInfoTest.data?.domain_aliases?.length || 0} aliases)`
        : `❌ ${siteInfoTest.error}`;
      testResults[1].details = siteInfoTest.data;
      setResults([...testResults]);

      // Test 3: Supabase Database
      setProgress(60);
      testResults[2].status = 'running';
      testResults[2].message = 'Testing Supabase database access...';
      setResults([...testResults]);

      const dbTest = await NetlifyDomainSyncService.getUserDomains(user.id);
      testResults[2].status = dbTest.success ? 'success' : 'error';
      testResults[2].message = dbTest.success 
        ? `✅ Database accessible (${dbTest.domains?.length || 0} domains found)`
        : `❌ ${dbTest.error}`;
      testResults[2].details = { domainCount: dbTest.domains?.length || 0 };
      setResults([...testResults]);

      // Test 4: Domain Sync
      setProgress(80);
      testResults[3].status = 'running';
      testResults[3].message = 'Testing domain sync functionality...';
      setResults([...testResults]);

      const syncTest = await NetlifyDomainSyncService.syncFromNetlify(user.id);
      testResults[3].status = syncTest.success ? 'success' : 'error';
      testResults[3].message = syncTest.message;
      testResults[3].details = {
        domains_synced: syncTest.domains_synced,
        domains_added: syncTest.domains_added,
        domains_updated: syncTest.domains_updated,
        errors: syncTest.errors
      };
      setResults([...testResults]);

      // Test 5: Full Integration
      setProgress(100);
      testResults[4].status = 'running';
      testResults[4].message = 'Running full integration test...';
      setResults([...testResults]);

      const integrationTest = await NetlifyDomainSyncService.performFullSync(user.id);
      testResults[4].status = integrationTest.success ? 'success' : 'error';
      testResults[4].message = integrationTest.message;
      testResults[4].details = integrationTest;
      setResults([...testResults]);

      // Final summary
      const successCount = testResults.filter(r => r.status === 'success').length;
      const totalTests = testResults.length;
      
      if (successCount === totalTests) {
        toast.success(`🎉 All ${totalTests} tests passed! Domain sync is working perfectly.`);
      } else {
        toast.warning(`⚠️ ${successCount}/${totalTests} tests passed. Check results for details.`);
      }

    } catch (error: any) {
      console.error('Test suite error:', error);
      toast.error(`Test suite failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Domain Sync Integration Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            This test verifies the complete domain sync integration between Supabase, Netlify, and your domain management interface.
          </AlertDescription>
        </Alert>

        {/* Test Progress */}
        {testing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Running Integration Tests...</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Test Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={runComprehensiveTest} 
            disabled={testing || !user}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Full Test Suite
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open('https://app.netlify.com/projects/backlinkoo/domain-management', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Netlify Console
          </Button>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                
                {result.details && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer font-medium mb-1">View Details</summary>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-medium">Supabase</h4>
            <p className="text-sm text-gray-600">Database Integration</p>
          </div>
          
          <div className="text-center">
            <Globe className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-medium">Netlify</h4>
            <p className="text-sm text-gray-600">Domain Management</p>
          </div>
          
          <div className="text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-medium">Backlinkoo</h4>
            <p className="text-sm text-gray-600">Domain Interface</p>
          </div>
        </div>

        {!user && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to run the domain sync integration tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DomainSyncTester;
