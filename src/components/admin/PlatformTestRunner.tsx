import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Zap
} from 'lucide-react';
import { PlatformAPITests } from '@/tests/platforms/PlatformAPITests';
import { getAllPlatforms } from '@/services/platformConfigs';

interface TestResult {
  success: boolean;
  error?: string;
  errors?: string[];
  [key: string]: any;
}

export function PlatformTestRunner() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Map<string, TestResult>>(new Map());
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const platforms = getAllPlatforms();

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(new Map());
    
    try {
      // Simulate test progress
      const testSteps = [
        'Platform Configurations',
        'WordPress Service',
        'Medium Service', 
        'Dev.to Service',
        'Hashnode Service',
        'Ghost Service',
        'Web2Platforms Engine',
        'Config System'
      ];

      for (let i = 0; i < testSteps.length; i++) {
        setCurrentTest(testSteps[i]);
        setProgress((i / testSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate test time
      }

      // Run actual tests
      const testResults = await PlatformAPITests.runAllTests();
      setResults(testResults);
      setLastRun(new Date());
      
      const totalTests = testResults.size;
      const passedTests = Array.from(testResults.values()).filter(r => r.success).length;
      
      toast({
        title: 'Tests Completed',
        description: `${passedTests}/${totalTests} tests passed`,
        variant: passedTests === totalTests ? 'default' : 'destructive'
      });

    } catch (error: any) {
      toast({
        title: 'Test Error',
        description: error.message || 'Failed to run tests',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runSingleTest = async (platformId: string) => {
    setIsRunning(true);
    setCurrentTest(`Testing ${platformId}...`);
    
    try {
      const result = await PlatformAPITests.testPlatform(platformId);
      const newResults = new Map(results);
      newResults.set(`${platformId}Service`, result);
      setResults(newResults);
      
      toast({
        title: `${platformId} Test ${result.success ? 'Passed' : 'Failed'}`,
        description: result.error || `${platformId} service test completed`,
        variant: result.success ? 'default' : 'destructive'
      });

    } catch (error: any) {
      toast({
        title: 'Test Error',
        description: error.message || `Failed to test ${platformId}`,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getTestStatus = (testName: string): 'success' | 'error' | 'pending' => {
    const result = results.get(testName);
    if (!result) return 'pending';
    return result.success ? 'success' : 'error';
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-600">Pass</Badge>;
      case 'error': return <Badge variant="destructive">Fail</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const calculateOverallStats = () => {
    if (results.size === 0) return { total: 0, passed: 0, failed: 0, percentage: 0 };
    
    const total = results.size;
    const passed = Array.from(results.values()).filter(r => r.success).length;
    const failed = total - passed;
    const percentage = Math.round((passed / total) * 100);
    
    return { total, passed, failed, percentage };
  };

  const stats = calculateOverallStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform API Tests</h2>
        <p className="text-gray-600">
          Test all platform API integrations to ensure they're working correctly
        </p>
      </div>

      {/* Stats Overview */}
      {results.size > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.percentage}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Controls
            {lastRun && (
              <span className="text-sm text-gray-500 font-normal">
                Last run: {lastRun.toLocaleString()}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Run comprehensive tests on all platform API integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentTest}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Run All Tests Button */}
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core System Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Core System Tests</CardTitle>
            <CardDescription>
              Test core platform functionality and configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'platformConfigurations', name: 'Platform Configurations' },
              { key: 'web2PlatformsEngine', name: 'Web2Platforms Engine' },
              { key: 'platformConfigSystem', name: 'Platform Config System' }
            ].map(test => (
              <div key={test.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(getTestStatus(test.key))}
                  <span className="font-medium">{test.name}</span>
                </div>
                {getStatusBadge(getTestStatus(test.key))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Platform Service Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Service Tests</CardTitle>
            <CardDescription>
              Test individual platform API services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'wordpressService', name: 'WordPress', platformId: 'wordpress' },
              { key: 'mediumService', name: 'Medium', platformId: 'medium' },
              { key: 'devtoService', name: 'Dev.to', platformId: 'devto' },
              { key: 'hashnodeService', name: 'Hashnode', platformId: 'hashnode' },
              { key: 'ghostService', name: 'Ghost', platformId: 'ghost' }
            ].map(test => (
              <div key={test.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(getTestStatus(test.key))}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(getTestStatus(test.key))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(test.platformId)}
                    disabled={isRunning}
                  >
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      {results.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Test Results</CardTitle>
            <CardDescription>
              View detailed information about test results and any errors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(results.entries()).map(([testName, result]) => (
              <div key={testName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    {getStatusIcon(result.success ? 'success' : 'error')}
                    {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  {getStatusBadge(result.success ? 'success' : 'error')}
                </div>
                
                {result.error && (
                  <div className="bg-red-50 p-3 rounded-md mb-2">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Error:</span>
                    </div>
                    <p className="text-red-700 mt-1">{result.error}</p>
                  </div>
                )}
                
                {result.errors && result.errors.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Issues Found:</span>
                    </div>
                    <ul className="text-yellow-700 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-sm">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {result.success && !result.errors?.length && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">All checks passed successfully</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Testing Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Tests validate API service functionality without making real API calls</p>
          <p>• Configuration tests check that platform settings are properly structured</p>
          <p>• Service tests verify that each platform's API integration logic works correctly</p>
          <p>• Engine tests ensure the Web2PlatformsEngine can orchestrate multiple platforms</p>
          <p>• Run tests after making changes to platform configurations or services</p>
          <p>• Failed tests indicate issues that should be resolved before running campaigns</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlatformTestRunner;
