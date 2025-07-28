/**
 * Enhanced AI Content Test Component
 * Test the new AI content generation system with sample keywords and URLs
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { enhancedAIContentEngine } from '@/services/enhancedAIContentEngine';
import { aiContentEngine } from '@/services/aiContentEngine';
import { globalBlogGenerator } from '@/services/globalBlogGenerator';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  BarChart3, 
  FileText,
  ExternalLink,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  result?: any;
  error?: string;
}

export function EnhancedAIContentTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  
  // Test inputs
  const [testKeyword, setTestKeyword] = useState('digital marketing');
  const [testUrl, setTestUrl] = useState('https://example.com');
  const [testAnchorText, setTestAnchorText] = useState('best digital marketing tools');

  const { toast } = useToast();

  const sampleTestCases = [
    {
      keyword: 'SEO optimization',
      url: 'https://example-seo.com',
      anchorText: 'advanced SEO tools'
    },
    {
      keyword: 'content marketing',
      url: 'https://content-example.com',
      anchorText: 'content marketing platform'
    },
    {
      keyword: 'email automation',
      url: 'https://email-tools.com',
      anchorText: 'email automation software'
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);
    
    const tests = [
      { name: 'Provider Status Check', fn: testProviderStatus },
      { name: 'Enhanced AI Engine Test', fn: testEnhancedAIEngine },
      { name: 'Full AI Content Engine Test', fn: testFullAIEngine },
      { name: 'Global Blog Generator Test', fn: testGlobalBlogGenerator },
      { name: 'Sample Test Cases', fn: testSampleCases }
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      setProgress(((i + 1) / tests.length) * 100);

      try {
        const startTime = Date.now();
        const result = await test.fn();
        const duration = Date.now() - startTime;

        setTestResults(prev => [...prev, {
          testName: test.name,
          success: true,
          duration,
          result
        }]);

        toast({
          title: `${test.name} completed`,
          description: `Test completed successfully in ${duration}ms`,
        });

      } catch (error) {
        const duration = Date.now() - Date.now();
        setTestResults(prev => [...prev, {
          testName: test.name,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]);

        toast({
          title: `${test.name} failed`,
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive",
        });
      }
    }

    setIsRunning(false);
    setCurrentTest('');
    setProgress(100);
  };

  const testProviderStatus = async () => {
    console.log('🔍 Testing provider status...');
    const status = await aiContentEngine.testProviders();
    setProviderStatus(status);
    return status;
  };

  const testEnhancedAIEngine = async () => {
    console.log('🚀 Testing enhanced AI engine...');
    const result = await enhancedAIContentEngine.generateContent({
      keyword: testKeyword,
      targetUrl: testUrl,
      anchorText: testAnchorText,
      contentLength: 'medium',
      contentTone: 'professional',
      seoFocus: true
    });
    return result;
  };

  const testFullAIEngine = async () => {
    console.log('🤖 Testing full AI content engine...');
    const result = await aiContentEngine.generateContent({
      keyword: testKeyword,
      targetUrl: testUrl,
      anchorText: testAnchorText,
      wordCount: 1500
    });
    return result;
  };

  const testGlobalBlogGenerator = async () => {
    console.log('🌍 Testing global blog generator...');
    const sessionId = crypto.randomUUID();
    const result = await globalBlogGenerator.generateGlobalBlogPost({
      targetUrl: testUrl,
      primaryKeyword: testKeyword,
      anchorText: testAnchorText,
      sessionId,
      additionalContext: {
        contentTone: 'professional',
        contentLength: 'medium',
        seoFocus: 'high'
      }
    });
    return result;
  };

  const testSampleCases = async () => {
    console.log('📋 Testing sample cases...');
    const results = [];
    
    for (const testCase of sampleTestCases) {
      try {
        const result = await enhancedAIContentEngine.generateContent({
          keyword: testCase.keyword,
          targetUrl: testCase.url,
          anchorText: testCase.anchorText,
          contentLength: 'short',
          contentTone: 'professional'
        });
        results.push({
          testCase,
          success: true,
          wordCount: result.metadata.wordCount,
          provider: result.bestProvider
        });
      } catch (error) {
        results.push({
          testCase,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  };

  const renderProviderStatus = () => {
    if (!providerStatus) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Provider Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(providerStatus).map(([provider, status]: [string, any]) => (
              <div key={provider} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{provider}</span>
                  {status.available ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs space-y-1">
                  <div className={`px-2 py-1 rounded ${status.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status.configured ? 'Configured' : 'Not Configured'}
                  </div>
                  <div className={`px-2 py-1 rounded ${status.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {status.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTestResults = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.testName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {result.duration}ms
                  </div>
                </div>
                
                {result.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}
                
                {result.result && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedResult(result.result)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Result
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResultModal = () => {
    if (!selectedResult) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Result Details
            </CardTitle>
            <Button variant="ghost" onClick={() => setSelectedResult(null)}>×</Button>
          </CardHeader>
          
          <CardContent className="overflow-y-auto max-h-[70vh]">
            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="providers">Providers</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                {selectedResult.finalContent && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Generated Content</h3>
                    <div className="prose max-w-none text-sm p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto"
                         dangerouslySetInnerHTML={{ __html: selectedResult.finalContent }} />
                  </div>
                )}
                {selectedResult.bestContent && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Best Content</h3>
                    <div className="prose max-w-none text-sm p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto"
                         dangerouslySetInnerHTML={{ __html: selectedResult.bestContent }} />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="metadata" className="space-y-4">
                {selectedResult.metadata && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedResult.metadata.title}</p>
                    </div>
                    <div>
                      <Label>Word Count</Label>
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedResult.metadata.wordCount}</p>
                    </div>
                    <div>
                      <Label>SEO Score</Label>
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedResult.metadata.seoScore}/100</p>
                    </div>
                    <div>
                      <Label>Reading Time</Label>
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedResult.metadata.readingTime} min</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Meta Description</Label>
                      <p className="text-sm p-2 bg-gray-50 rounded">{selectedResult.metadata.metaDescription}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Keywords</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedResult.metadata.keywords?.map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="providers" className="space-y-4">
                {selectedResult.allResults && (
                  <div className="space-y-3">
                    {selectedResult.allResults.map((provider: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={provider.success ? "default" : "destructive"}>
                            {provider.provider}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {provider.generationTime}ms
                          </span>
                        </div>
                        {provider.success && (
                          <div className="text-xs space-y-1">
                            <p>Tokens: {provider.usage?.tokens || 0}</p>
                            <p>Cost: ${(provider.usage?.cost || 0).toFixed(4)}</p>
                            <p>Quality: {provider.quality || 0}/100</p>
                          </div>
                        )}
                        {provider.error && (
                          <p className="text-xs text-red-600">{provider.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="raw" className="space-y-4">
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(selectedResult, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Enhanced AI Content Generation Test Suite
          </CardTitle>
          <p className="text-muted-foreground">
            Test the new AI content generation system with multiple providers and enhanced prompts
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Test Keyword</Label>
              <Input
                value={testKeyword}
                onChange={(e) => setTestKeyword(e.target.value)}
                placeholder="digital marketing"
              />
            </div>
            <div className="space-y-2">
              <Label>Test URL</Label>
              <Input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Anchor Text</Label>
              <Input
                value={testAnchorText}
                onChange={(e) => setTestAnchorText(e.target.value)}
                placeholder="best marketing tools"
              />
            </div>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Running: {currentTest}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </Button>
            
            <Button 
              variant="outline"
              onClick={testProviderStatus}
              disabled={isRunning}
            >
              <Settings className="h-4 w-4 mr-2" />
              Check Providers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      {renderProviderStatus()}

      {/* Test Results */}
      {testResults.length > 0 && renderTestResults()}

      {/* Result Modal */}
      {renderResultModal()}
    </div>
  );
}
