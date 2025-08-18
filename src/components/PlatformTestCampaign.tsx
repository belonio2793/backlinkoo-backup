import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Ban,
  TrendingUp,
  Database,
  Globe,
  Zap
} from 'lucide-react';
import { platformTester, type PlatformTestResult } from '@/services/platformTester';

interface TestProgress {
  current: number;
  total: number;
  currentPlatform: string;
  status: 'idle' | 'testing' | 'completed' | 'error';
}

export const PlatformTestCampaign: React.FC = () => {
  const [testData, setTestData] = useState({
    keyword: 'digital marketing platform',
    anchorText: 'best digital marketing tools',
    targetUrl: 'https://example.com'
  });
  
  const [testProgress, setTestProgress] = useState<TestProgress>({
    current: 0,
    total: 0,
    currentPlatform: '',
    status: 'idle'
  });
  
  const [testResults, setTestResults] = useState<PlatformTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTest = async () => {
    if (isTesting) return;

    setIsTesting(true);
    setError(null);
    setTestResults([]);
    setTestProgress({
      current: 0,
      total: 0,
      currentPlatform: 'Initializing...',
      status: 'testing'
    });

    try {
      console.log('🚀 Starting platform test campaign...');
      
      // Start the test
      const results = await platformTester.testAllPlatforms(testData);
      
      setTestResults(results);
      setTestProgress({
        current: results.length,
        total: results.length,
        currentPlatform: 'Completed',
        status: 'completed'
      });

      console.log('✅ Platform test campaign completed');
      
    } catch (err) {
      console.error('❌ Test campaign failed:', err);
      setError(err instanceof Error ? err.message : 'Test campaign failed');
      setTestProgress(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (isWorking: boolean, responseTime: number) => {
    if (isWorking) {
      return responseTime < 2000 ? 
        <CheckCircle className="w-4 h-4 text-green-600" /> : 
        <Clock className="w-4 h-4 text-yellow-600" />;
    }
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (isWorking: boolean, responseTime: number) => {
    if (isWorking) {
      if (responseTime < 2000) {
        return <Badge className="bg-green-100 text-green-800">Fast & Working</Badge>;
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800">Slow but Working</Badge>;
      }
    }
    return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  };

  const workingPlatforms = testResults.filter(r => r.isWorking);
  const failedPlatforms = testResults.filter(r => !r.isWorking);
  const testSummary = platformTester.getTestSummary();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            <CardTitle>Platform Test Campaign</CardTitle>
          </div>
          <Button
            onClick={handleStartTest}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Start Test
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Test all platforms with real submissions to verify they work and automatically blacklist non-responsive ones
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Test Keyword</Label>
            <Input
              id="keyword"
              value={testData.keyword}
              onChange={(e) => setTestData(prev => ({ ...prev, keyword: e.target.value }))}
              placeholder="digital marketing"
              disabled={isTesting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anchorText">Test Anchor Text</Label>
            <Input
              id="anchorText"
              value={testData.anchorText}
              onChange={(e) => setTestData(prev => ({ ...prev, anchorText: e.target.value }))}
              placeholder="best digital marketing tools"
              disabled={isTesting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetUrl">Test Target URL</Label>
            <Input
              id="targetUrl"
              value={testData.targetUrl}
              onChange={(e) => setTestData(prev => ({ ...prev, targetUrl: e.target.value }))}
              placeholder="https://example.com"
              disabled={isTesting}
            />
          </div>
        </div>

        {/* Test Progress */}
        {isTesting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Testing Progress</span>
              <span className="text-sm text-gray-500">
                {testProgress.current}/{testProgress.total} platforms
              </span>
            </div>
            <Progress 
              value={testProgress.total > 0 ? (testProgress.current / testProgress.total) * 100 : 0} 
              className="h-2"
            />
            <div className="text-sm text-gray-600">
              Currently testing: {testProgress.currentPlatform}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="working">Working ({workingPlatforms.length})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({failedPlatforms.length})</TabsTrigger>
              <TabsTrigger value="blacklisted">Blacklisted</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
                  <div className="text-sm text-blue-600">Total Tested</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{workingPlatforms.length}</div>
                  <div className="text-sm text-green-600">Working</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{failedPlatforms.length}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {workingPlatforms.length > 0 ? Math.round((workingPlatforms.length / testResults.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-yellow-600">Success Rate</div>
                </div>
              </div>

              {workingPlatforms.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    <strong>✅ Verified Working Platforms:</strong>{' '}
                    {workingPlatforms.map(p => p.platformName).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {failedPlatforms.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    <strong>❌ Failed Platforms (will be blacklisted):</strong>{' '}
                    {failedPlatforms.map(p => p.platformName).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="working" className="space-y-3">
              {workingPlatforms.map((result) => (
                <div key={result.platformId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.isWorking, result.responseTime)}
                    <div>
                      <div className="font-medium text-green-900">{result.platformName}</div>
                      <div className="text-sm text-green-700">{result.domain}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.isWorking, result.responseTime)}
                    <div className="text-right text-sm">
                      <div className="text-green-700">{result.responseTime}ms</div>
                      {result.publishedUrl && (
                        <a 
                          href={result.publishedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {workingPlatforms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No working platforms found. Try running the test.
                </div>
              )}
            </TabsContent>

            <TabsContent value="failed" className="space-y-3">
              {failedPlatforms.map((result) => (
                <div key={result.platformId} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.isWorking, result.responseTime)}
                    <div>
                      <div className="font-medium text-red-900">{result.platformName}</div>
                      <div className="text-sm text-red-700">{result.domain}</div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1 max-w-md truncate" title={result.error}>
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      <Ban className="w-3 h-3 mr-1" />
                      Blacklisted
                    </Badge>
                    {result.statusCode && (
                      <div className="text-xs text-red-600">
                        HTTP {result.statusCode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {failedPlatforms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No failed platforms. All tests passed!
                </div>
              )}
            </TabsContent>

            <TabsContent value="blacklisted" className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-700">
                  Blacklisted platforms are automatically removed from campaign rotation to ensure reliable delivery.
                  These platforms failed verification tests and will not be used for future campaigns.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {failedPlatforms.map((result) => (
                  <div key={result.platformId} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Ban className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-900">{result.platformName}</div>
                        <div className="text-sm text-gray-600">{result.domain}</div>
                        <div className="text-xs text-red-600 mt-1">
                          Reason: {result.error || 'Platform test failed'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      Blacklisted: {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Action Buttons */}
        {testResults.length > 0 && !isTesting && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={() => {
                // Update platform configuration with only working platforms
                console.log('Updating platform configuration with verified platforms...');
                // This would trigger an update to PlatformConfigService
              }}
              className="flex items-center gap-2"
              disabled={workingPlatforms.length === 0}
            >
              <Zap className="w-4 h-4" />
              Update Active Platforms ({workingPlatforms.length})
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setTestResults([]);
                setError(null);
                setTestProgress({
                  current: 0,
                  total: 0,
                  currentPlatform: '',
                  status: 'idle'
                });
              }}
            >
              Clear Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformTestCampaign;
