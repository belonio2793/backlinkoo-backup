import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import DomainManagementService from '@/services/domainManagementService';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const DomainTester = () => {
  const [testDomain, setTestDomain] = useState('test-domain-' + Date.now() + '.com');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const runComprehensiveTest = async () => {
    setRunning(true);
    setResults([]);

    const tests = [
      'Netlify Connection Test',
      'Domain Validation Test', 
      'Add Domain Test',
      'Sync Domains Test',
      'Remove Domain Test',
      'Error Handling Test'
    ];

    // Initialize all tests as pending
    tests.forEach(test => {
      addResult({ test, status: 'pending', message: 'Starting...' });
    });

    try {
      // Test 1: Netlify Connection
      try {
        const connectionResult = await DomainManagementService.testNetlifyConnection();
        updateResult(0, {
          status: connectionResult.success ? 'success' : 'error',
          message: connectionResult.message,
          data: { responseTime: connectionResult.responseTime }
        });
      } catch (error: any) {
        updateResult(0, {
          status: 'error',
          message: error.message
        });
      }

      // Test 2: Domain Validation
      const validationTests = [
        { domain: 'valid-domain.com', shouldPass: true },
        { domain: 'invalid..domain', shouldPass: false },
        { domain: '', shouldPass: false },
        { domain: 'no-tld', shouldPass: false }
      ];

      let validationPassed = true;
      const validationMessages: string[] = [];

      validationTests.forEach(({ domain, shouldPass }) => {
        const result = DomainManagementService.validateDomain(domain);
        if (result.isValid !== shouldPass) {
          validationPassed = false;
          validationMessages.push(`${domain}: expected ${shouldPass}, got ${result.isValid}`);
        }
      });

      updateResult(1, {
        status: validationPassed ? 'success' : 'error',
        message: validationPassed ? 'All validation tests passed' : validationMessages.join(', ')
      });

      // Test 3: Add Domain
      try {
        const addResult = await DomainManagementService.addDomain(testDomain);
        updateResult(2, {
          status: addResult.success ? 'success' : 'error',
          message: addResult.message || addResult.error || 'Unknown result',
          data: addResult
        });
      } catch (error: any) {
        updateResult(2, {
          status: 'error',
          message: error.message
        });
      }

      // Wait a moment for any async operations
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 4: Sync Domains
      try {
        const syncResult = await DomainManagementService.syncDomains();
        updateResult(3, {
          status: syncResult.success ? 'success' : 'error',
          message: syncResult.message || syncResult.error || 'Unknown result',
          data: syncResult.sync_results
        });
      } catch (error: any) {
        updateResult(3, {
          status: 'error',
          message: error.message
        });
      }

      // Test 5: Remove Domain (only if add was successful)
      const addTestResult = results.find(r => r.test === 'Add Domain Test');
      if (addTestResult?.status === 'success') {
        try {
          const removeResult = await DomainManagementService.removeDomain(testDomain);
          updateResult(4, {
            status: removeResult.success ? 'success' : 'error',
            message: removeResult.message || removeResult.error || 'Unknown result',
            data: removeResult
          });
        } catch (error: any) {
          updateResult(4, {
            status: 'error',
            message: error.message
          });
        }
      } else {
        updateResult(4, {
          status: 'error',
          message: 'Skipped - Add Domain test failed'
        });
      }

      // Test 6: Error Handling
      try {
        const errorResult = await DomainManagementService.addDomain('invalid-domain-format...');
        updateResult(5, {
          status: errorResult.success ? 'error' : 'success',
          message: errorResult.success ? 'Should have failed for invalid domain' : 'Correctly rejected invalid domain',
          data: errorResult
        });
      } catch (error: any) {
        updateResult(5, {
          status: 'success',
          message: 'Correctly threw error for invalid domain'
        });
      }

    } catch (error: any) {
      console.error('Test suite error:', error);
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">✅ Passed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">⏳ Running</Badge>;
      default:
        return <Badge variant="outline">❓ Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Domain Management System Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Domain</label>
              <Input
                value={testDomain}
                onChange={(e) => setTestDomain(e.target.value)}
                placeholder="Enter a test domain"
                disabled={running}
              />
            </div>
            <Button
              onClick={runComprehensiveTest}
              disabled={running}
              className="w-full"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Comprehensive Test Suite
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {results.map((result, index) => (
                <Card key={index} className="border-l-4" style={{
                  borderLeftColor: result.status === 'success' ? '#10b981' : 
                                   result.status === 'error' ? '#ef4444' : '#3b82f6'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.test}</span>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.data && (
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">View Details</summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Test Summary */}
          {results.length > 0 && !running && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Summary:</strong> {' '}
                {results.filter(r => r.status === 'success').length} passed, {' '}
                {results.filter(r => r.status === 'error').length} failed, {' '}
                {results.filter(r => r.status === 'pending').length} pending
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainTester;
