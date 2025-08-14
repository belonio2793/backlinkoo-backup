/**
 * Array-Free Implementation Test Page
 * Test the new array-free campaign system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Play, 
  Database, 
  TestTube,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { arrayFreeCampaignService, ArrayFreeCampaign, ArrayFreeCampaignUtils } from '@/services/arrayFreeCampaignService';
import { supabase } from '@/integrations/supabase/client';

export default function ArrayFreeTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
    details?: any;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const addTestResult = (test: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [
      ...prev.filter(r => r.test !== test),
      { test, status, message, details }
    ]);
  };
  
  const updateTestStatus = (test: string, status: 'pending' | 'running' | 'success' | 'error') => {
    setTestResults(prev => prev.map(r => 
      r.test === test ? { ...r, status } : r
    ));
  };
  
  // Test 1: Check if table exists
  const testTableExists = async () => {
    updateTestStatus('table_check', 'running');
    
    try {
      const { data, error } = await supabase
        .from('automation_campaigns_simple')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          addTestResult('table_check', 'error', 'Table automation_campaigns_simple does not exist', error);
          return false;
        } else {
          addTestResult('table_check', 'error', `Table access error: ${error.message}`, error);
          return false;
        }
      }
      
      addTestResult('table_check', 'success', 'Table exists and is accessible');
      return true;
      
    } catch (error) {
      addTestResult('table_check', 'error', 'Exception checking table', error);
      return false;
    }
  };
  
  // Test 2: Test utility functions
  const testUtilityFunctions = () => {
    updateTestStatus('utilities', 'running');
    
    try {
      // Test string to array conversion
      const testString = 'keyword1, keyword2, keyword3';
      const array = ArrayFreeCampaignUtils.stringToArray(testString);
      
      if (array.length !== 3 || array[0] !== 'keyword1') {
        throw new Error('String to array conversion failed');
      }
      
      // Test array to string conversion
      const backToString = ArrayFreeCampaignUtils.arrayToString(array);
      if (!backToString.includes('keyword1')) {
        throw new Error('Array to string conversion failed');
      }
      
      // Test add to string
      const updated = ArrayFreeCampaignUtils.addToString(testString, 'new keyword');
      if (!updated.includes('new keyword')) {
        throw new Error('Add to string failed');
      }
      
      // Test string contains
      const contains = ArrayFreeCampaignUtils.stringContains(testString, 'keyword2');
      if (!contains) {
        throw new Error('String contains check failed');
      }
      
      addTestResult('utilities', 'success', 'All utility functions working correctly', {
        stringToArray: array,
        arrayToString: backToString,
        addToString: updated,
        contains
      });
      
      return true;
      
    } catch (error) {
      addTestResult('utilities', 'error', 'Utility function test failed', error);
      return false;
    }
  };
  
  // Test 3: Test campaign creation
  const testCampaignCreation = async () => {
    if (!user) {
      addTestResult('campaign_creation', 'error', 'User not logged in');
      return false;
    }
    
    updateTestStatus('campaign_creation', 'running');
    
    try {
      const testCampaign: Omit<ArrayFreeCampaign, 'id' | 'created_at'> = {
        user_id: user.id,
        name: 'TEST_ARRAY_FREE_DELETE_ME',
        status: 'draft',
        primary_keyword: 'test keyword',
        secondary_keywords_text: 'seo, marketing, content',
        primary_anchor_text: 'test link',
        alternate_anchors_text: 'click here, learn more',
        target_url: 'https://example.com',
        sites_contacted: 0,
        links_built: 0,
        sites_used_text: '',
        campaign_metadata: JSON.stringify({ test: true }),
        links_requested: 5,
        auto_start: false
      };
      
      const result = await arrayFreeCampaignService.createCampaign(testCampaign);
      
      if (result.success && result.campaign) {
        addTestResult('campaign_creation', 'success', 'Campaign created successfully', result.campaign);
        
        // Clean up test campaign
        await supabase
          .from('automation_campaigns_simple')
          .delete()
          .eq('id', result.campaign.id);
        
        return true;
      } else {
        addTestResult('campaign_creation', 'error', result.error || 'Campaign creation failed');
        return false;
      }
      
    } catch (error) {
      addTestResult('campaign_creation', 'error', 'Exception during campaign creation', error);
      return false;
    }
  };
  
  // Test 4: Test campaign retrieval
  const testCampaignRetrieval = async () => {
    if (!user) {
      addTestResult('campaign_retrieval', 'error', 'User not logged in');
      return false;
    }
    
    updateTestStatus('campaign_retrieval', 'running');
    
    try {
      const result = await arrayFreeCampaignService.getCampaigns(user.id);
      
      if (result.success) {
        addTestResult('campaign_retrieval', 'success', 
          `Retrieved ${result.campaigns?.length || 0} campaigns`, 
          result.campaigns
        );
        return true;
      } else {
        addTestResult('campaign_retrieval', 'error', result.error || 'Campaign retrieval failed');
        return false;
      }
      
    } catch (error) {
      addTestResult('campaign_retrieval', 'error', 'Exception during campaign retrieval', error);
      return false;
    }
  };
  
  // Test 5: Test statistics
  const testStatistics = async () => {
    if (!user) {
      addTestResult('statistics', 'error', 'User not logged in');
      return false;
    }
    
    updateTestStatus('statistics', 'running');
    
    try {
      const result = await arrayFreeCampaignService.getCampaignStats(user.id);
      
      if (result.success && result.stats) {
        addTestResult('statistics', 'success', 'Statistics retrieved successfully', result.stats);
        return true;
      } else {
        addTestResult('statistics', 'error', result.error || 'Statistics retrieval failed');
        return false;
      }
      
    } catch (error) {
      addTestResult('statistics', 'error', 'Exception during statistics retrieval', error);
      return false;
    }
  };
  
  // Run all tests
  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    try {
      toast.info('Starting array-free implementation tests...');
      
      // Initialize test results
      const tests = ['table_check', 'utilities', 'campaign_creation', 'campaign_retrieval', 'statistics'];
      setTestResults(tests.map(test => ({ test, status: 'pending', message: 'Waiting...' })));
      
      // Run tests sequentially
      const tableExists = await testTableExists();
      testUtilityFunctions();
      
      if (tableExists) {
        await testCampaignCreation();
        await testCampaignRetrieval();
        await testStatistics();
      } else {
        // Skip database tests if table doesn't exist
        addTestResult('campaign_creation', 'error', 'Skipped - table does not exist');
        addTestResult('campaign_retrieval', 'error', 'Skipped - table does not exist');
        addTestResult('statistics', 'error', 'Skipped - table does not exist');
      }
      
      const allPassed = testResults.every(r => r.status === 'success');
      
      if (allPassed) {
        toast.success('All tests passed! Array-free implementation is working.');
      } else {
        toast.error('Some tests failed. Check results below.');
      }
      
    } catch (error) {
      toast.error('Test execution failed');
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Create table manually
  const createTableManually = async () => {
    try {
      toast.info('Attempting to create table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS automation_campaigns_simple (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          
          name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          
          primary_keyword TEXT NOT NULL,
          secondary_keywords_text TEXT DEFAULT '',
          primary_anchor_text TEXT NOT NULL,
          alternate_anchors_text TEXT DEFAULT '',
          target_url TEXT NOT NULL,
          
          sites_contacted INTEGER DEFAULT 0,
          links_built INTEGER DEFAULT 0,
          sites_used_text TEXT DEFAULT '',
          
          links_requested INTEGER DEFAULT 5,
          auto_start BOOLEAN DEFAULT false,
          
          campaign_metadata TEXT DEFAULT '{}',
          
          created_at TIMESTAMPTZ DEFAULT now(),
          started_at TIMESTAMPTZ NULL,
          completed_at TIMESTAMPTZ NULL,
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        ALTER TABLE automation_campaigns_simple ENABLE ROW LEVEL SECURITY;
      `;
      
      const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
      
      if (error) {
        toast.error(`Failed to create table: ${error.message}`);
      } else {
        toast.success('Table created successfully!');
      }
      
    } catch (error) {
      toast.error('Exception creating table');
      console.error('Create table error:', error);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <TestTube className="h-5 w-5 text-blue-500 animate-pulse" />;
      default: return <Database className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Array-Free Implementation Test</h1>
        <p className="text-gray-600">
          Test the new array-free automation system to ensure it works without array dependencies
        </p>
      </div>
      
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This test suite validates the array-free campaign system that eliminates all array column dependencies.
          The new system uses comma-separated strings and simple data types for reliable operation.
        </AlertDescription>
      </Alert>
      
      {/* Controls */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
        
        <Button 
          onClick={createTableManually} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Create Table
        </Button>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Array-free implementation validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <div key={result.test} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium capitalize">{result.test.replace('_', ' ')}</h4>
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">View details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Authentication Status</p>
              <p className={user ? 'text-green-600' : 'text-red-600'}>
                {user ? `Logged in as ${user.email}` : 'Not logged in'}
              </p>
            </div>
            
            <div>
              <p className="font-medium">Array Dependencies</p>
              <p className="text-green-600">Eliminated ✓</p>
            </div>
            
            <div>
              <p className="font-medium">Data Structure</p>
              <p className="text-blue-600">Simple strings + JSON</p>
            </div>
            
            <div>
              <p className="font-medium">Schema Complexity</p>
              <p className="text-green-600">Minimal</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
