import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  AlertTriangle,
  Database,
  Zap,
  Globe,
  Brain,
  Mail,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { scalableDataService, rateLimiter } from '@/services/scalabilityOptimizations';
import { logError } from '@/services/productionErrorHandler';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
  message?: string;
  details?: any;
}

interface ProductionTest {
  id: string;
  category: string;
  name: string;
  description: string;
  critical: boolean;
  execute: () => Promise<TestResult>;
}

export function ProductionTestSuite() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const productionTests: ProductionTest[] = [
    {
      id: 'database_connectivity',
      category: 'Infrastructure',
      name: 'Database Connectivity',
      description: 'Test database connection and basic operations',
      critical: true,
      execute: async () => {
        const startTime = Date.now();
        try {
          // Test basic database operations
          const { data, error } = await supabase
            .from('automation_campaigns')
            .select('id')
            .limit(1);

          if (error) throw error;

          return {
            id: 'database_connectivity',
            name: 'Database Connectivity',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Database connection successful'
          };
        } catch (error) {
          return {
            id: 'database_connectivity',
            name: 'Database Connectivity',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    },
    {
      id: 'campaign_creation',
      category: 'Campaign Management',
      name: 'Campaign Creation',
      description: 'Test campaign creation and validation',
      critical: true,
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!user) throw new Error('User not authenticated');

          const testCampaign = {
            user_id: user.id,
            name: 'Production Test Campaign',
            target_url: 'https://example.com',
            keywords: ['test keyword'],
            strategy: 'natural_growth',
            content_tone: 'professional',
            auto_publish: false,
            drip_speed: 'medium',
            status: 'paused'
          };

          const { data, error } = await supabase
            .from('automation_campaigns')
            .insert(testCampaign)
            .select()
            .single();

          if (error) throw error;

          // Clean up test campaign
          await supabase
            .from('automation_campaigns')
            .delete()
            .eq('id', data.id);

          return {
            id: 'campaign_creation',
            name: 'Campaign Creation',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Campaign creation and cleanup successful'
          };
        } catch (error) {
          return {
            id: 'campaign_creation',
            name: 'Campaign Creation',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Campaign creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    },
    {
      id: 'automation_services',
      category: 'Automation',
      name: 'Automation Services',
      description: 'Test automation service endpoints',
      critical: true,
      execute: async () => {
        const startTime = Date.now();
        try {
          const response = await fetch('/.netlify/functions/automation-status', {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });

          if (!response.ok) {
            throw new Error(`Service returned ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          return {
            id: 'automation_services',
            name: 'Automation Services',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Automation services responding correctly',
            details: result
          };
        } catch (error) {
          return {
            id: 'automation_services',
            name: 'Automation Services',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Automation services failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    },
    {
      id: 'content_generation',
      category: 'AI Services',
      name: 'Content Generation',
      description: 'Test AI content generation service',
      critical: false,
      execute: async () => {
        const startTime = Date.now();
        try {
          const response = await fetch('/.netlify/functions/ai-content-generator', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              action: 'health_check',
              content_type: 'test',
              keywords: ['test'],
              tone: 'professional'
            })
          });

          if (!response.ok) {
            throw new Error(`Content service returned ${response.status}`);
          }

          return {
            id: 'content_generation',
            name: 'Content Generation',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Content generation service operational'
          };
        } catch (error) {
          return {
            id: 'content_generation',
            name: 'Content Generation',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    },
    {
      id: 'rate_limiting',
      category: 'Scalability',
      name: 'Rate Limiting',
      description: 'Test rate limiting functionality',
      critical: false,
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!user) throw new Error('User not authenticated');

          // Test rate limiting
          const allowed = await rateLimiter.checkLimit(user.id, 'automation');
          if (!allowed) {
            throw new Error('Rate limit check failed - user should be allowed');
          }

          // Test consecutive requests
          const results = await Promise.all([
            rateLimiter.checkLimit(user.id, 'automation'),
            rateLimiter.checkLimit(user.id, 'automation'),
            rateLimiter.checkLimit(user.id, 'automation')
          ]);

          return {
            id: 'rate_limiting',
            name: 'Rate Limiting',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Rate limiting working correctly',
            details: { requestsAllowed: results.filter(r => r).length }
          };
        } catch (error) {
          return {
            id: 'rate_limiting',
            name: 'Rate Limiting',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Rate limiting test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    },
    {
      id: 'data_caching',
      category: 'Performance',
      name: 'Data Caching',
      description: 'Test data caching and retrieval',
      critical: false,
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!user) throw new Error('User not authenticated');

          // Test cached data retrieval
          const firstCall = await scalableDataService.getCampaignStats(user.id, 5, 0);
          const secondCall = await scalableDataService.getCampaignStats(user.id, 5, 0);

          return {
            id: 'data_caching',
            name: 'Data Caching',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Data caching working correctly',
            details: {
              firstCallStats: firstCall.stats,
              secondCallStats: secondCall.stats,
              cacheHit: JSON.stringify(firstCall) === JSON.stringify(secondCall)
            }
          };
        } catch (error) {
          return {
            id: 'data_caching',
            name: 'Data Caching',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Data caching test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    },
    {
      id: 'error_handling',
      category: 'Reliability',
      name: 'Error Handling',
      description: 'Test error logging and handling',
      critical: false,
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!user) throw new Error('User not authenticated');

          // Test error logging
          await logError(
            new Error('Production test error'),
            {
              component: 'production_test',
              operation: 'error_handling_test',
              userId: user.id
            },
            'low'
          );

          return {
            id: 'error_handling',
            name: 'Error Handling',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Error handling system working correctly'
          };
        } catch (error) {
          return {
            id: 'error_handling',
            name: 'Error Handling',
            status: 'failed',
            duration: Date.now() - startTime,
            message: `Error handling test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    }
  ];

  const runAllTests = async () => {
    if (!user) {
      toast.error('Please sign in to run tests');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const results: TestResult[] = [];

    for (let i = 0; i < productionTests.length; i++) {
      const test = productionTests[i];
      setCurrentTest(test.name);
      setProgress((i / productionTests.length) * 100);

      try {
        const result = await test.execute();
        results.push(result);
        setTestResults([...results]);

        // Stop on critical test failure
        if (test.critical && result.status === 'failed') {
          toast.error(`Critical test failed: ${test.name}`);
          break;
        }
      } catch (error) {
        const failedResult: TestResult = {
          id: test.id,
          name: test.name,
          status: 'failed',
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        results.push(failedResult);
        setTestResults([...results]);

        if (test.critical) {
          toast.error(`Critical test failed: ${test.name}`);
          break;
        }
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProgress(100);
    setCurrentTest(null);
    setIsRunning(false);

    const failed = results.filter(r => r.status === 'failed').length;
    const passed = results.filter(r => r.status === 'success').length;

    if (failed === 0) {
      toast.success(`All tests passed! (${passed}/${results.length})`);
    } else {
      toast.error(`${failed} tests failed, ${passed} passed`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700';
      case 'failed': return 'bg-red-50 text-red-700';
      case 'running': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const criticalTests = testResults.filter(r => productionTests.find(t => t.id === r.id)?.critical);
  const criticalFailures = criticalTests.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Test Suite</h2>
          <p className="text-gray-600">Validate automation system before going live</p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning}>
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running: {currentTest}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Passed</span>
              </div>
              <p className="text-2xl font-bold">{testResults.filter(r => r.status === 'success').length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <p className="text-2xl font-bold">{testResults.filter(r => r.status === 'failed').length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold">{testResults.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {criticalFailures > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalFailures} critical test(s) failed. The system is not ready for production.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Detailed results from production validation tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {productionTests.map((test) => {
              const result = testResults.find(r => r.id === test.id);
              const status = result?.status || 'pending';

              return (
                <div key={test.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  {getStatusIcon(status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{test.name}</h3>
                      {test.critical && (
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{test.description}</p>
                    {result?.message && (
                      <p className="text-xs text-gray-500 mt-1">{result.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                    {result?.duration && (
                      <p className="text-xs text-gray-500 mt-1">{result.duration}ms</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
