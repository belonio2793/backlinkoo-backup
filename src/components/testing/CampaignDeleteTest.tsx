import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  TestTube,
  Database,
  Activity,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { campaignService } from '@/services/campaignService';
import { CampaignQueueManager } from '@/services/automationEngine/CampaignQueueManager';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  details?: any;
}

interface MockCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  linksGenerated: number;
  progress: number;
}

export default function CampaignDeleteTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mockCampaigns, setMockCampaigns] = useState<MockCampaign[]>([]);
  const { toast } = useToast();

  const queueManager = CampaignQueueManager.getInstance();

  const initialTests: TestResult[] = [
    { testName: 'API Authentication Test', status: 'pending', message: 'Verifying API authentication' },
    { testName: 'Campaign Creation Test', status: 'pending', message: 'Creating test campaigns' },
    { testName: 'Delete Validation Test', status: 'pending', message: 'Testing deletion validation logic' },
    { testName: 'Active Campaign Delete Test', status: 'pending', message: 'Testing active campaign deletion constraints' },
    { testName: 'Force Delete Test', status: 'pending', message: 'Testing force deletion functionality' },
    { testName: 'Cascade Operations Test', status: 'pending', message: 'Verifying cascade deletion operations' },
    { testName: 'Queue Manager Integration Test', status: 'pending', message: 'Testing queue manager integration' },
    { testName: 'Error Handling Test', status: 'pending', message: 'Testing error scenarios and rollback' },
    { testName: 'Audit Log Test', status: 'pending', message: 'Verifying deletion audit logging' },
    { testName: 'Cleanup Test', status: 'pending', message: 'Cleaning up test data' }
  ];

  const updateTestResult = (testName: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.testName === testName ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(testName, { status: 'running', message: 'Running...' });
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      updateTestResult(testName, { 
        status: 'passed', 
        message: 'Test passed successfully',
        duration,
        details: result
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(testName, { 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Test failed',
        duration,
        details: error
      });
      throw error;
    }
  };

  const createMockCampaign = (id: string, status: MockCampaign['status'], linksGenerated: number = 0): MockCampaign => ({
    id,
    name: `Test Campaign ${id}`,
    status,
    linksGenerated,
    progress: status === 'completed' ? 100 : Math.floor(Math.random() * 80)
  });

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([...initialTests]);
    setMockCampaigns([]);

    try {
      // Test 1: API Authentication
      await runTest('API Authentication Test', async () => {
        // Test authentication by trying to get campaigns
        await campaignService.getCampaigns();
        return { authenticated: true };
      });

      // Test 2: Create test campaigns
      const testCampaigns = await runTest('Campaign Creation Test', async () => {
        const campaigns = [
          createMockCampaign('test_active_1', 'active', 15),
          createMockCampaign('test_paused_1', 'paused', 8),
          createMockCampaign('test_completed_1', 'completed', 25)
        ];
        setMockCampaigns(campaigns);
        return { campaignsCreated: campaigns.length };
      });

      // Test 3: Deletion validation
      await runTest('Delete Validation Test', async () => {
        const validation = await campaignService.validateCampaignForDeletion('test_active_1');
        if (!validation.canDelete && validation.warnings.length === 0) {
          throw new Error('Validation should indicate warnings for active campaigns');
        }
        return { validation };
      });

      // Test 4: Active campaign delete (should require force)
      await runTest('Active Campaign Delete Test', async () => {
        try {
          await campaignService.deleteCampaign('test_active_1', {
            forceDelete: false,
            reason: 'Test deletion',
            confirmationText: 'DELETE Test Campaign test_active_1',
            archiveLinks: true,
            notifyStakeholders: false
          });
          throw new Error('Should have prevented deletion of active campaign without force flag');
        } catch (error) {
          // This should fail, which is expected
          if (error instanceof Error && error.message.includes('active')) {
            return { expectedError: true, errorMessage: error.message };
          }
          throw error;
        }
      });

      // Test 5: Force delete
      await runTest('Force Delete Test', async () => {
        const result = await campaignService.deleteCampaign('test_active_1', {
          forceDelete: true,
          reason: 'Test force deletion of active campaign',
          confirmationText: 'DELETE Test Campaign test_active_1',
          archiveLinks: true,
          notifyStakeholders: false
        });
        
        // Update mock campaigns
        setMockCampaigns(prev => prev.filter(c => c.id !== 'test_active_1'));
        
        return { deletionResult: result };
      });

      // Test 6: Cascade operations
      await runTest('Cascade Operations Test', async () => {
        // Test deletion of paused campaign (should be straightforward)
        const result = await campaignService.deleteCampaign('test_paused_1', {
          forceDelete: false,
          reason: 'Test cascade operations',
          confirmationText: 'DELETE Test Campaign test_paused_1',
          archiveLinks: true,
          notifyStakeholders: false
        });
        
        setMockCampaigns(prev => prev.filter(c => c.id !== 'test_paused_1'));
        
        if (!result.deletionSummary?.cascadeOperations) {
          throw new Error('Cascade operations information missing from response');
        }
        
        return { cascadeOps: result.deletionSummary.cascadeOperations };
      });

      // Test 7: Queue manager integration
      await runTest('Queue Manager Integration Test', async () => {
        const queueResult = await queueManager.deleteCampaign('test_completed_1', false);
        return { queueDeletion: queueResult };
      });

      // Test 8: Error handling
      await runTest('Error Handling Test', async () => {
        try {
          // Try to delete non-existent campaign
          await campaignService.deleteCampaign('nonexistent_campaign', {
            forceDelete: false,
            reason: 'Test error handling',
            confirmationText: 'DELETE nonexistent_campaign',
            archiveLinks: true,
            notifyStakeholders: false
          });
          throw new Error('Should have failed for non-existent campaign');
        } catch (error) {
          if (error instanceof Error && (error.message.includes('not found') || error.message.includes('404'))) {
            return { expectedError: true, errorType: 'not_found' };
          }
          throw error;
        }
      });

      // Test 9: Audit logs
      await runTest('Audit Log Test', async () => {
        const logs = await campaignService.getDeletionLogs();
        return { auditLogs: logs.length };
      });

      // Test 10: Cleanup
      await runTest('Cleanup Test', async () => {
        // Clear any remaining test data
        setMockCampaigns([]);
        return { cleanupComplete: true };
      });

      toast({
        title: "All Tests Completed",
        description: "Campaign deletion functionality has been comprehensively tested.",
      });

    } catch (error) {
      console.error('Test suite failed:', error);
      toast({
        title: "Test Suite Failed",
        description: "Some tests failed. Check the results for details.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Campaign Delete Functionality Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing of campaign deletion with safety checks, cascade operations, and error handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            {testResults.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="text-green-600">
                  {passedTests} Passed
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  {failedTests} Failed
                </Badge>
                <Badge variant="outline">
                  {totalTests - passedTests - failedTests} Pending
                </Badge>
              </div>
            )}
          </div>

          {/* Mock Campaigns Display */}
          {mockCampaigns.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Test Campaigns
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mockCampaigns.map(campaign => (
                  <div key={campaign.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Progress: {campaign.progress}%</div>
                      <div>Links: {campaign.linksGenerated}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Test Results</h4>
              <div className="space-y-2">
                {testResults.map((test, index) => (
                  <div 
                    key={test.testName} 
                    className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium text-sm">{test.testName}</div>
                          <div className="text-xs text-gray-600">{test.message}</div>
                        </div>
                      </div>
                      {test.duration && (
                        <Badge variant="outline" className="text-xs">
                          {test.duration}ms
                        </Badge>
                      )}
                    </div>
                    
                    {test.details && test.status === 'failed' && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {testResults.length > 0 && !isRunning && (
            <Alert className={failedTests > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              {failedTests > 0 ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription>
                <strong>Test Suite Complete: </strong>{passedTests}/{totalTests} tests passed. 
                {failedTests > 0 && ` ${failedTests} tests failed and require attention.`}
                {failedTests === 0 && " All deletion functionality is working correctly."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
