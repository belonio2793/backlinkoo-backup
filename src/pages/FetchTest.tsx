/**
 * Fetch Test Page
 * Test network requests to identify and fix fetch issues
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
  RefreshCw,
  AlertTriangle,
  Info,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
  details?: any;
}

export default function FetchTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const updateTestResult = (name: string, status: TestResult['status'], message: string, duration?: number, details?: any) => {
    setTestResults(prev => {
      const filtered = prev.filter(r => r.name !== name);
      return [...filtered, { name, status, message, duration, details }];
    });
  };
  
  // Test 1: Basic fetch to external API
  const testBasicFetch = async () => {
    const startTime = Date.now();
    updateTestResult('basic_fetch', 'running', 'Testing basic fetch...');
    
    try {
      const response = await fetch('https://httpbin.org/json');
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        updateTestResult('basic_fetch', 'success', 'Basic fetch successful', duration, data);
      } else {
        updateTestResult('basic_fetch', 'error', `HTTP ${response.status}: ${response.statusText}`, duration);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('basic_fetch', 'error', error.message, duration, error);
    }
  };
  
  // Test 2: Supabase connection
  const testSupabaseConnection = async () => {
    const startTime = Date.now();
    updateTestResult('supabase_connection', 'running', 'Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('blog_posts').select('id').limit(1);
      const duration = Date.now() - startTime;
      
      if (error) {
        updateTestResult('supabase_connection', 'error', error.message, duration, error);
      } else {
        updateTestResult('supabase_connection', 'success', 'Supabase connection successful', duration, data);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('supabase_connection', 'error', error.message, duration, error);
    }
  };
  
  // Test 3: Test with different fetch methods
  const testFetchMethods = async () => {
    const startTime = Date.now();
    updateTestResult('fetch_methods', 'running', 'Testing different fetch methods...');
    
    try {
      // Test original window.fetch
      const originalFetch = (window as any).__originalFetch__ || window.fetch;
      const response1 = await originalFetch('https://httpbin.org/status/200');
      
      // Test current window.fetch
      const response2 = await window.fetch('https://httpbin.org/status/200');
      
      // Test XMLHttpRequest
      const xhr = new XMLHttpRequest();
      const xhrPromise = new Promise((resolve, reject) => {
        xhr.open('GET', 'https://httpbin.org/status/200');
        xhr.onload = () => resolve(xhr.status);
        xhr.onerror = () => reject(new Error('XHR failed'));
        xhr.send();
      });
      const xhrResult = await xhrPromise;
      
      const duration = Date.now() - startTime;
      const results = {
        originalFetch: response1.status,
        currentFetch: response2.status,
        xhr: xhrResult
      };
      
      updateTestResult('fetch_methods', 'success', 'All fetch methods working', duration, results);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('fetch_methods', 'error', error.message, duration, error);
    }
  };
  
  // Test 4: Check protection status
  const testProtectionStatus = () => {
    updateTestResult('protection_status', 'running', 'Checking protection status...');
    
    try {
      const status = {
        viteProtectionDisabled: !!(window as any).DISABLE_VITE_PROTECTION,
        fullstoryProtectionDisabled: !!(window as any).DISABLE_FULLSTORY_PROTECTION,
        fetchModified: window.fetch.toString().length < 100,
        fetchLength: window.fetch.toString().length,
        hasOriginalFetch: !!(window as any).__originalFetch__,
        hasFullStory: !!(window as any).FS || !!(window as any)._fs
      };
      
      updateTestResult('protection_status', 'success', 'Protection status checked', 0, status);
    } catch (error: any) {
      updateTestResult('protection_status', 'error', error.message, 0, error);
    }
  };
  
  // Run all tests
  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    try {
      toast.info('Starting fetch tests...');
      
      // Initialize tests
      const tests = ['basic_fetch', 'supabase_connection', 'fetch_methods', 'protection_status'];
      setTestResults(tests.map(name => ({ name, status: 'pending', message: 'Waiting...' })));
      
      // Run tests
      await testBasicFetch();
      await testSupabaseConnection();
      await testFetchMethods();
      testProtectionStatus();
      
      const hasErrors = testResults.some(r => r.status === 'error');
      if (hasErrors) {
        toast.error('Some tests failed - check results below');
      } else {
        toast.success('All fetch tests passed!');
      }
      
    } catch (error) {
      toast.error('Test execution failed');
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <Globe className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const emergencyDisable = () => {
    try {
      (window as any).disableFetchProtection();
      toast.success('Fetch protection disabled - try your requests again');
    } catch (error) {
      toast.error('Failed to disable protection');
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Fetch Test & Debug</h1>
        <p className="text-gray-600">
          Diagnose and fix network request issues
        </p>
      </div>
      
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This page tests different types of network requests to identify fetch issues. 
          If you're experiencing "Failed to fetch" errors, run these tests to diagnose the problem.
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
          onClick={emergencyDisable} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Emergency Disable Protection
        </Button>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Network request diagnostics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <div key={result.name} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium capitalize">{result.name.replace('_', ' ')}</h4>
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                    {result.duration && (
                      <Badge variant="outline">{result.duration}ms</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">View details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
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
      
      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Environment</p>
              <p className="text-gray-600">{import.meta.env.MODE}</p>
            </div>
            
            <div>
              <p className="font-medium">User Agent</p>
              <p className="text-gray-600 truncate">{navigator.userAgent}</p>
            </div>
            
            <div>
              <p className="font-medium">Fetch Function Length</p>
              <p className="text-gray-600">{window.fetch.toString().length} characters</p>
            </div>
            
            <div>
              <p className="font-medium">Has Original Fetch</p>
              <p className="text-gray-600">{(window as any).__originalFetch__ ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              💡 <strong>Troubleshooting tips:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• If tests fail, try the "Emergency Disable Protection" button</li>
              <li>• Check browser console for additional error details</li>
              <li>• Disable browser extensions if issues persist</li>
              <li>• Use browser dev tools Network tab to inspect requests</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
