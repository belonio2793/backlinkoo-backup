import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Database,
  ExternalLink,
  RefreshCw,
  Settings,
  Target,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { automationLogger } from '@/services/automationLogger';
import { automationOrchestrator } from '@/services/automationOrchestrator';
import { targetSitesManager } from '@/services/targetSitesManager';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
  url?: string;
}

export default function AutomationTestDashboard() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [lastTestCampaign, setLastTestCampaign] = useState<any>(null);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const status = automationOrchestrator.getStatus();
      const sitesStats = targetSitesManager.getStats();
      
      setSystemStatus({
        ...status,
        sites: sitesStats,
        database: await checkDatabaseConnection()
      });
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const checkDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('count')
        .limit(1);
      
      return { connected: !error, error: error?.message };
    } catch (error) {
      return { connected: false, error: 'Connection failed' };
    }
  };

  const runFullTest = async () => {
    if (!user) {
      toast.error('Please sign in to run tests');
      return;
    }

    setTesting(true);
    setTestResults([]);

    const tests: TestResult[] = [
      { test: 'Database Connection', status: 'pending', message: 'Checking database connectivity...' },
      { test: 'OpenAI API', status: 'pending', message: 'Testing content generation...' },
      { test: 'Telegraph API', status: 'pending', message: 'Testing article publishing...' },
      { test: 'Campaign Creation', status: 'pending', message: 'Creating test campaign...' },
      { test: 'Full Automation', status: 'pending', message: 'Running complete workflow...' }
    ];

    setTestResults([...tests]);

    try {
      // Test 1: Database Connection
      await runTest(0, async () => {
        const dbStatus = await checkDatabaseConnection();
        if (!dbStatus.connected) throw new Error(dbStatus.error || 'Database connection failed');
        return 'Database connected successfully';
      });

      // Test 2: OpenAI API Test
      await runTest(1, async () => {
        const response = await fetch('/.netlify/functions/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: 'SEO automation testing',
            anchor_text: 'test automation tools',
            url: 'https://test-automation.example.com',
            campaign_id: 'test-campaign-' + Date.now(),
            user_id: user.id,
            word_count: 500
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Content generation failed');
        
        return `Content generated: ${data.data.wordCount} words, anchor link: ${data.data.hasAnchorLink ? 'YES' : 'NO'}`;
      });

      // Test 3: Telegraph API Test
      await runTest(2, async () => {
        const response = await fetch('/.netlify/functions/publish-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Article - Automation System',
            content: `# Test Article

This is a test article created by our automation system.

## Features Tested

- Content generation with OpenAI
- [Link building automation](https://test-automation.example.com)
- Telegraph publishing

The system is working correctly!`,
            campaign_id: 'test-campaign-' + Date.now(),
            user_id: user.id,
            target_site: 'telegraph'
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `Publishing error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Article publishing failed');
        
        return `Article published successfully`;
      }, (result) => result.url);

      // Test 4: Campaign Creation
      await runTest(3, async () => {
        const { data, error } = await supabase
          .from('automation_campaigns')
          .insert({
            user_id: user.id,
            name: `Test Campaign - ${new Date().toISOString()}`,
            keywords: ['automation testing', 'link building', 'SEO tools'],
            anchor_texts: ['automation platform', 'SEO testing', 'click here'],
            target_url: 'https://test-automation.example.com',
            status: 'draft',
            links_built: 0,
            available_sites: 1,
            target_sites_used: []
          })
          .select()
          .single();

        if (error) throw error;
        setLastTestCampaign(data);
        return `Campaign created with ID: ${data.id}`;
      });

      // Test 5: Full Automation Workflow
      await runTest(4, async () => {
        if (!lastTestCampaign) throw new Error('No test campaign available');

        const result = await automationOrchestrator.processCampaign({
          id: lastTestCampaign.id,
          name: lastTestCampaign.name,
          keywords: lastTestCampaign.keywords,
          anchor_texts: lastTestCampaign.anchor_texts,
          target_url: lastTestCampaign.target_url,
          user_id: lastTestCampaign.user_id,
          status: 'active'
        });

        if (!result.success) throw new Error(result.error || 'Automation workflow failed');
        
        return `Full workflow completed - Article: ${result.articleTitle}`;
      }, (result) => result.articleUrl);

      automationLogger.info('system', 'All automation tests completed successfully');
      toast.success('All tests passed! Automation system is ready for production use.');

    } catch (error) {
      automationLogger.error('system', 'Test suite failed', {}, undefined, error as Error);
      toast.error('Test suite failed - check results for details');
    } finally {
      setTesting(false);
    }
  };

  const runTest = async (
    index: number, 
    testFn: () => Promise<string>, 
    extractUrl?: (result: any) => string
  ) => {
    const startTime = Date.now();
    
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, status: 'running' } : test
    ));

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map((test, i) => 
        i === index ? { 
          ...test, 
          status: 'success', 
          message: result,
          duration,
          url: extractUrl ? extractUrl(result) : undefined
        } : test
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      
      setTestResults(prev => prev.map((test, i) => 
        i === index ? { 
          ...test, 
          status: 'error', 
          message: errorMessage,
          duration
        } : test
      ));
      
      throw error;
    }
  };

  const cleanupTestData = async () => {
    if (!user) return;

    try {
      // Delete test campaigns
      await supabase
        .from('automation_campaigns')
        .delete()
        .eq('user_id', user.id)
        .like('name', '%Test Campaign%');

      // Delete test submissions
      await supabase
        .from('article_submissions')
        .delete()
        .like('article_title', '%Test Article%');

      toast.success('Test data cleaned up');
      setLastTestCampaign(null);
    } catch (error) {
      toast.error('Failed to cleanup test data');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Automation Test Dashboard</h1>
        <p className="text-gray-600">Verify system components and test the complete automation workflow</p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemStatus?.sites?.active_sites || 0}
              </div>
              <p className="text-sm text-gray-500">Active Publishing Sites</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus?.sites?.average_success_rate || 0}%
              </div>
              <p className="text-sm text-gray-500">Average Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemStatus?.database?.connected ? 'Connected' : 'Disconnected'}
              </div>
              <p className="text-sm text-gray-500">Database Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Test Automation System
          </CardTitle>
          <CardDescription>
            Run comprehensive tests to verify all components are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to run automation tests. Testing requires a user account for campaign creation and tracking.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={runFullTest}
              disabled={testing || !user}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Full Test Suite
                </>
              )}
            </Button>

            <Button
              onClick={checkSystemStatus}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>

            {lastTestCampaign && (
              <Button
                onClick={cleanupTestData}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Cleanup Test Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <Badge variant="outline">
                        {result.duration}ms
                      </Badge>
                    )}
                    {result.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
