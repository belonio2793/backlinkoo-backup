import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Settings,
  Database,
  Zap,
  FileText,
  BarChart3
} from 'lucide-react';
import { getAutomationMockService, type MockCampaignConfig, type MockCampaignResult } from '@/services/automationMockService';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  config: MockCampaignConfig;
  enabled: boolean;
}

interface TestResult {
  scenario: string;
  status: 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
  details?: MockCampaignResult;
}

const AutomationTestingDashboard: React.FC = () => {
  const [mockService] = useState(() => getAutomationMockService());
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [completedTests, setCompletedTests] = useState(0);

  // Configuration state
  const [maxConcurrency, setMaxConcurrency] = useState(3);
  const [simulateErrors, setSimulateErrors] = useState(false);
  const [simulateDelay, setSimulateDelay] = useState(true);
  const [environmentMode, setEnvironmentMode] = useState<'development' | 'testing' | 'staging'>('development');

  // Test scenarios
  const [testScenarios] = useState<TestScenario[]>([
    {
      id: 'basic-seo',
      name: 'Basic SEO Campaign',
      description: 'Standard link building campaign with single keyword',
      config: {
        keyword: 'SEO optimization',
        anchorText: 'professional SEO services',
        targetUrl: 'https://example.com/seo-services',
        contentVariations: 1,
        publishingDelay: 1000,
        simulateErrors: false
      },
      enabled: true
    },
    {
      id: 'multi-variation',
      name: 'Multi-Variation Content',
      description: 'Campaign generating multiple content variations',
      config: {
        keyword: 'digital marketing',
        anchorText: 'expert marketing solutions',
        targetUrl: 'https://example.com/marketing',
        contentVariations: 3,
        publishingDelay: 500,
        simulateErrors: false
      },
      enabled: true
    },
    {
      id: 'error-simulation',
      name: 'Error Handling Test',
      description: 'Test error handling and recovery mechanisms',
      config: {
        keyword: 'content automation',
        anchorText: 'automation tools',
        targetUrl: 'https://example.com/automation',
        contentVariations: 1,
        publishingDelay: 1000,
        simulateErrors: true
      },
      enabled: false
    },
    {
      id: 'high-volume',
      name: 'High Volume Test',
      description: 'Stress test with multiple simultaneous campaigns',
      config: {
        keyword: 'link building',
        anchorText: 'quality backlinks',
        targetUrl: 'https://example.com/backlinks',
        contentVariations: 2,
        publishingDelay: 200,
        simulateErrors: false
      },
      enabled: false
    },
    {
      id: 'performance-benchmark',
      name: 'Performance Benchmark',
      description: 'Measure system performance under load',
      config: {
        keyword: 'performance testing',
        anchorText: 'load testing tools',
        targetUrl: 'https://example.com/performance',
        contentVariations: 1,
        publishingDelay: 100,
        simulateErrors: false
      },
      enabled: false
    }
  ]);

  // Update environment configuration
  useEffect(() => {
    mockService.updateConfig({
      mode: environmentMode,
      database: environmentMode === 'development' ? 'mock' : 'sandbox',
      contentGeneration: simulateErrors ? 'mock' : 'real',
      publishing: simulateDelay ? 'mock' : 'real'
    });
  }, [environmentMode, simulateErrors, simulateDelay, mockService]);

  // Run selected test scenarios
  const runTests = async () => {
    if (selectedScenarios.length === 0) {
      alert('Please select at least one test scenario');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    setCompletedTests(0);
    setTotalTests(selectedScenarios.length);

    try {
      const selectedConfigs = testScenarios
        .filter(scenario => selectedScenarios.includes(scenario.id))
        .map(scenario => ({
          ...scenario.config,
          simulateErrors: simulateErrors || scenario.config.simulateErrors
        }));

      // Initialize test results
      const initialResults: TestResult[] = selectedScenarios.map(scenarioId => {
        const scenario = testScenarios.find(s => s.id === scenarioId);
        return {
          scenario: scenario?.name || scenarioId,
          status: 'running'
        };
      });
      setTestResults(initialResults);

      // Run tests in parallel
      const results = await mockService.runParallelTests(selectedConfigs, maxConcurrency);

      // Update results as they complete
      const finalResults: TestResult[] = results.map((result, index) => {
        const scenario = testScenarios[index];
        return {
          scenario: scenario?.name || `Test ${index + 1}`,
          status: result.status === 'completed' ? 'completed' : 'failed',
          duration: result.performance.duration,
          error: result.logs.find(log => log.level === 'error')?.message,
          details: result
        };
      });

      setTestResults(finalResults);
      setCompletedTests(finalResults.length);
      setProgress(100);

    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults(prev => prev.map(result => ({ 
        ...result, 
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setIsRunning(false);
    }
  };

  // Stop running tests
  const stopTests = () => {
    setIsRunning(false);
    mockService.cleanupMockData();
  };

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
    setProgress(0);
    setCompletedTests(0);
    mockService.cleanupMockData();
  };

  // Generate performance report
  const generateReport = () => {
    const report = mockService.generatePerformanceReport();
    console.log('Performance Report:', report);
    
    // In a real app, this could download a detailed report
    alert(`Performance Report:\n
Total Campaigns: ${report.totalCampaigns}\n
Completed: ${report.completed}\n
Failed: ${report.failed}\n
Average Processing Time: ${Math.round(report.averageProcessingTime)}ms\n
Slowest Step: ${report.slowestStep}\n
Fastest Step: ${report.fastestStep}`);
  };

  // Toggle scenario selection
  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!mockService.isMockEnabled()) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Mock testing is only available in development environment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automation Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Test automation workflows in a safe development environment
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Database className="h-4 w-4 mr-2" />
          {environmentMode.toUpperCase()}
        </Badge>
      </div>

      <Tabs defaultValue="testing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="testing">
            <Play className="h-4 w-4 mr-2" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="results">
            <BarChart3 className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6">
          {/* Test Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Test Control Panel</CardTitle>
              <CardDescription>
                Select and run automation test scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={runTests} 
                  disabled={isRunning || selectedScenarios.length === 0}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Tests ({selectedScenarios.length})
                </Button>
                <Button 
                  onClick={stopTests} 
                  disabled={!isRunning}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
                <Button 
                  onClick={clearResults} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </Button>
                <Button 
                  onClick={generateReport} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Report
                </Button>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {completedTests}/{totalTests}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
              <CardDescription>
                Select which automation scenarios to test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {testScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedScenarios.includes(scenario.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleScenario(scenario.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{scenario.name}</h4>
                          {scenario.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {scenario.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Keyword: {scenario.config.keyword}</span>
                          <span>Variations: {scenario.config.contentVariations}</span>
                          <span>Delay: {scenario.config.publishingDelay}ms</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={() => toggleScenario(scenario.id)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>
                Configure testing environment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment Mode</Label>
                  <select
                    id="environment"
                    value={environmentMode}
                    onChange={(e) => setEnvironmentMode(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="staging">Staging</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concurrency">Max Concurrency</Label>
                  <Input
                    id="concurrency"
                    type="number"
                    min="1"
                    max="10"
                    value={maxConcurrency}
                    onChange={(e) => setMaxConcurrency(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="simulate-delay">Simulate Processing Delays</Label>
                    <p className="text-sm text-muted-foreground">
                      Add realistic delays to simulate real-world processing
                    </p>
                  </div>
                  <Switch
                    id="simulate-delay"
                    checked={simulateDelay}
                    onCheckedChange={setSimulateDelay}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="simulate-errors">Simulate Errors</Label>
                    <p className="text-sm text-muted-foreground">
                      Include error scenarios in testing
                    </p>
                  </div>
                  <Switch
                    id="simulate-errors"
                    checked={simulateErrors}
                    onCheckedChange={setSimulateErrors}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {testResults.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Results from the latest test run
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(result.status)}>
                          {getStatusIcon(result.status)}
                        </Badge>
                        <div>
                          <p className="font-medium">{result.scenario}</p>
                          {result.duration && (
                            <p className="text-sm text-muted-foreground">
                              Duration: {result.duration}ms
                            </p>
                          )}
                          {result.error && (
                            <p className="text-sm text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.details && (
                          <div className="text-right text-sm">
                            <p>Content: {result.details.generatedContent.length}</p>
                            <p>URLs: {result.details.publishedUrls.length}</p>
                          </div>
                        )}
                        <Badge variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No test results yet. Run some tests to see results here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationTestingDashboard;
