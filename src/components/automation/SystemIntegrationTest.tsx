import React, { useState, useEffect } from 'react';
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
  Database, 
  Activity, 
  Globe,
  Zap,
  AlertTriangle,
  TestTube,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Import all our services for testing
import { EnhancedCampaignManager, DeleteCampaignOptions } from '@/services/enhancedCampaignManager';
import { CampaignRuntimeEngine } from '@/services/campaignRuntimeEngine';
import { RealTimeUrlTracker } from '@/services/realTimeUrlTracker';
import type { AutomationCampaign } from '@/types/automationTypes';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
  message?: string;
  details?: Record<string, any>;
}

interface SystemTest {
  id: string;
  category: string;
  name: string;
  description: string;
  execute: () => Promise<TestResult>;
}

export function SystemIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testCampaign, setTestCampaign] = useState<AutomationCampaign | null>(null);

  const systemTests: SystemTest[] = [
    {
      id: 'create-test-campaign',
      category: 'Campaign Management',
      name: 'Create Test Campaign',
      description: 'Creates a test campaign for integration testing',
      execute: async () => {
        const startTime = Date.now();
        try {
          // Create a test campaign
          const campaign: AutomationCampaign = {
            id: `test_campaign_${Date.now()}`,
            user_id: 'test-user-id',
            name: 'Integration Test Campaign',
            engine_type: 'blog_comments',
            target_url: 'https://example-target.com',
            keywords: ['test', 'integration', 'automation'],
            anchor_texts: ['test link', 'integration test', 'automated posting'],
            status: 'draft',
            daily_limit: 10,
            auto_start: false,
            priority: 'high',
            settings: { test_mode: true },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          setTestCampaign(campaign);
          
          return {
            id: 'create-test-campaign',
            name: 'Create Test Campaign',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Test campaign created successfully',
            details: { campaign_id: campaign.id, campaign_name: campaign.name }
          };
        } catch (error: any) {
          return {
            id: 'create-test-campaign',
            name: 'Create Test Campaign',
            status: 'failed',
            duration: Date.now() - startTime,
            message: error.message
          };
        }
      }
    },
    {
      id: 'start-runtime-engine',
      category: 'Runtime Engine',
      name: 'Start Runtime Engine',
      description: 'Tests the campaign runtime engine startup process',
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!testCampaign) {
            throw new Error('No test campaign available');
          }

          const started = await CampaignRuntimeEngine.startCampaignRuntime(testCampaign, {
            batch_size: 3,
            processing_interval_seconds: 10,
            auto_retry: true,
            max_retries: 2
          });

          if (!started) {
            throw new Error('Failed to start runtime engine');
          }

          return {
            id: 'start-runtime-engine',
            name: 'Start Runtime Engine',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Runtime engine started successfully',
            details: { 
              campaign_id: testCampaign.id,
              runtime_active: CampaignRuntimeEngine.isRuntimeActive(testCampaign.id)
            }
          };
        } catch (error: any) {
          return {
            id: 'start-runtime-engine',
            name: 'Start Runtime Engine',
            status: 'failed',
            duration: Date.now() - startTime,
            message: error.message
          };
        }
      }
    },
    {
      id: 'test-url-discovery',
      category: 'URL Tracking',
      name: 'Test URL Discovery',
      description: 'Tests the real-time URL discovery and tracking system',
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!testCampaign) {
            throw new Error('No test campaign available');
          }

          // Record some URL discoveries
          const testUrls = [
            {
              url: 'https://test-blog.com/article-1',
              domain: 'test-blog.com',
              discoveryMethod: 'crawling' as const,
              relevanceScore: 85,
              authorityScore: 45,
              metadata: { test: true, discovery_round: 1 }
            },
            {
              url: 'https://demo-forum.org/discussion-thread',
              domain: 'demo-forum.org',
              discoveryMethod: 'api' as const,
              relevanceScore: 92,
              authorityScore: 38,
              metadata: { test: true, discovery_round: 1 }
            }
          ];

          const discoveries = await RealTimeUrlTracker.recordUrlDiscovery(testCampaign.id, testUrls);

          return {
            id: 'test-url-discovery',
            name: 'Test URL Discovery',
            status: 'success',
            duration: Date.now() - startTime,
            message: `Discovered ${discoveries.length} URLs successfully`,
            details: { 
              urls_discovered: discoveries.length,
              discoveries: discoveries.map(d => ({ url: d.url, authority: d.authority_score }))
            }
          };
        } catch (error: any) {
          return {
            id: 'test-url-discovery',
            name: 'Test URL Discovery',
            status: 'failed',
            duration: Date.now() - startTime,
            message: error.message
          };
        }
      }
    },
    {
      id: 'test-url-processing',
      category: 'URL Processing',
      name: 'Test URL Processing',
      description: 'Tests the URL processing pipeline with queue operations',
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!testCampaign) {
            throw new Error('No test campaign available');
          }

          // Queue some processing operations
          const operations = [];
          
          operations.push(await CampaignRuntimeEngine.queueOperation(
            testCampaign.id,
            'create_placement',
            {
              url: 'https://test-blog.com/article-1',
              anchor_text: 'test link',
              target_url: testCampaign.target_url,
              content_snippet: 'Test content for integration testing',
              placement_type: 'blog_comment',
              user_id: testCampaign.user_id
            },
            8 // High priority
          ));

          operations.push(await CampaignRuntimeEngine.queueOperation(
            testCampaign.id,
            'verify_placement',
            {
              placement_id: 'test-placement-id',
              source_url: 'https://test-blog.com/article-1'
            },
            6 // Medium priority
          ));

          // Wait a bit for processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          const queue = CampaignRuntimeEngine.getOperationQueue(testCampaign.id);
          const activeOps = CampaignRuntimeEngine.getActiveOperations(testCampaign.id);

          return {
            id: 'test-url-processing',
            name: 'Test URL Processing',
            status: 'success',
            duration: Date.now() - startTime,
            message: `Queued ${operations.length} operations successfully`,
            details: { 
              operations_queued: operations.length,
              queue_size: queue.length,
              active_operations: activeOps.length,
              operation_ids: operations
            }
          };
        } catch (error: any) {
          return {
            id: 'test-url-processing',
            name: 'Test URL Processing',
            status: 'failed',
            duration: Date.now() - startTime,
            message: error.message
          };
        }
      }
    },
    {
      id: 'test-realtime-stats',
      category: 'Real-Time Data',
      name: 'Test Real-Time Statistics',
      description: 'Tests the real-time statistics and data siphoning',
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!testCampaign) {
            throw new Error('No test campaign available');
          }

          // Get live statistics
          const stats = await EnhancedCampaignManager.getLiveUrlStatistics(testCampaign.id);
          const session = EnhancedCampaignManager.getRealTimeSession(testCampaign.id);
          const recentActivity = await RealTimeUrlTracker.getRecentActivity(testCampaign.id, 10);

          return {
            id: 'test-realtime-stats',
            name: 'Test Real-Time Statistics',
            status: 'success',
            duration: Date.now() - startTime,
            message: 'Real-time statistics retrieved successfully',
            details: { 
              stats,
              session_active: !!session,
              recent_activities: recentActivity.length,
              session_id: session?.id
            }
          };
        } catch (error: any) {
          return {
            id: 'test-realtime-stats',
            name: 'Test Real-Time Statistics',
            status: 'failed',
            duration: Date.now() - startTime,
            message: error.message
          };
        }
      }
    },
    {
      id: 'test-enhanced-delete',
      category: 'Campaign Management',
      name: 'Test Enhanced Delete',
      description: 'Tests the enhanced campaign deletion with cleanup',
      execute: async () => {
        const startTime = Date.now();
        try {
          if (!testCampaign) {
            throw new Error('No test campaign available');
          }

          // Test deletion with preservation options
          const deleteOptions: DeleteCampaignOptions = {
            preserveReports: true,
            preserveMetrics: true,
            archiveLinksOnly: true,
            forceDelete: false
          };

          const deletionResult = await EnhancedCampaignManager.deleteCampaignWithCleanup(
            testCampaign.id,
            testCampaign.user_id,
            deleteOptions
          );

          return {
            id: 'test-enhanced-delete',
            name: 'Test Enhanced Delete',
            status: deletionResult.success ? 'success' : 'failed',
            duration: Date.now() - startTime,
            message: deletionResult.success ? 'Campaign deleted successfully' : deletionResult.error,
            details: { 
              deletion_result: deletionResult,
              items_deleted: deletionResult.deleted_items,
              items_archived: deletionResult.archived_items
            }
          };
        } catch (error: any) {
          return {
            id: 'test-enhanced-delete',
            name: 'Test Enhanced Delete',
            status: 'failed',
            duration: Date.now() - startTime,
            message: error.message
          };
        }
      }
    }
  ];

  const runTest = async (test: SystemTest) => {
    setCurrentTest(test.id);
    
    // Update test status to running
    setTestResults(prev => {
      const existing = prev.find(r => r.id === test.id);
      if (existing) {
        return prev.map(r => r.id === test.id ? { ...r, status: 'running' as const } : r);
      }
      return [...prev, { id: test.id, name: test.name, status: 'running' as const }];
    });

    try {
      const result = await test.execute();
      
      setTestResults(prev => 
        prev.map(r => r.id === test.id ? result : r)
      );

      if (result.status === 'success') {
        toast.success(`Test Passed: ${test.name}`, {
          description: result.message
        });
      } else {
        toast.error(`Test Failed: ${test.name}`, {
          description: result.message
        });
      }

    } catch (error: any) {
      const failedResult: TestResult = {
        id: test.id,
        name: test.name,
        status: 'failed',
        message: error.message
      };

      setTestResults(prev => 
        prev.map(r => r.id === test.id ? failedResult : r)
      );

      toast.error(`Test Error: ${test.name}`, {
        description: error.message
      });
    }

    setCurrentTest(null);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const test of systemTests) {
      await runTest(test);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    
    const passedTests = testResults.filter(r => r.status === 'success').length;
    const totalTests = systemTests.length;
    
    toast.success('Integration Tests Completed', {
      description: `${passedTests}/${totalTests} tests passed`
    });
  };

  const getTestStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTestStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-yellow-600';
      case 'pending': return 'text-gray-400';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'success').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const totalTests = systemTests.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-6 w-6 text-purple-600" />
            System Integration Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing of the integrated campaign management system with real-time URL processing
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Controls</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {passedTests}/{totalTests} Passed
              </Badge>
              {failedTests > 0 && (
                <Badge variant="destructive">
                  {failedTests} Failed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {testResults.length > 0 && (
                <div>
                  Last run: {new Date().toLocaleTimeString()} • 
                  Progress: {testResults.filter(r => r.status !== 'pending').length}/{totalTests}
                </div>
              )}
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="mt-4">
              <Progress 
                value={(testResults.filter(r => r.status !== 'pending').length / totalTests) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid gap-4">
        {systemTests.map((test, index) => {
          const result = testResults.find(r => r.id === test.id);
          const isCurrentTest = currentTest === test.id;
          
          return (
            <Card key={test.id} className={isCurrentTest ? 'border-blue-200 bg-blue-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {test.category}
                      </span>
                      <h3 className="font-semibold">{test.name}</h3>
                      {result && getTestStatusIcon(result.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                    
                    {result && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-medium ${getTestStatusColor(result.status)}`}>
                            {result.status.toUpperCase()}
                          </span>
                          {result.duration && (
                            <span className="text-gray-500">
                              {result.duration}ms
                            </span>
                          )}
                        </div>
                        
                        {result.message && (
                          <p className="text-sm text-gray-700">{result.message}</p>
                        )}
                        
                        {result.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              Test Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTest(test)}
                      disabled={isRunning}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Status */}
      {testCampaign && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Campaign Created:</strong> {testCampaign.name} ({testCampaign.id})
            <br />
            <strong>Runtime Status:</strong> {CampaignRuntimeEngine.isRuntimeActive(testCampaign.id) ? 'Active' : 'Inactive'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
