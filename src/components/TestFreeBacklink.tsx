/**
 * Test component to verify free backlink functionality
 * This can be removed in production
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { openAIContentGenerator } from '@/services/openAIContentGenerator';
import { 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';

export function TestFreeBacklink() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    const results: any[] = [];

    try {
      // Test 1: Check if OpenAI is configured
      results.push({
        name: 'OpenAI Configuration',
        status: openAIContentGenerator.isConfigured() ? 'success' : 'error',
        message: openAIContentGenerator.isConfigured() ? 
          'OpenAI is properly configured' : 
          'OpenAI API key is missing'
      });

      // Test 2: Test OpenAI connection (if configured)
      if (openAIContentGenerator.isConfigured()) {
        try {
          const connectionTest = await openAIContentGenerator.testConnection();
          results.push({
            name: 'OpenAI Connection',
            status: connectionTest ? 'success' : 'error',
            message: connectionTest ? 
              'Successfully connected to OpenAI' : 
              'Failed to connect to OpenAI'
          });
        } catch (error) {
          results.push({
            name: 'OpenAI Connection',
            status: 'error',
            message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Test 3: Test local storage functionality
      try {
        const testData = { test: 'data', timestamp: Date.now() };
        localStorage.setItem('test_free_backlink', JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem('test_free_backlink') || '{}');
        localStorage.removeItem('test_free_backlink');
        
        results.push({
          name: 'Local Storage',
          status: retrieved.test === 'data' ? 'success' : 'error',
          message: retrieved.test === 'data' ? 
            'Local storage working correctly' : 
            'Local storage test failed'
        });
      } catch (error) {
        results.push({
          name: 'Local Storage',
          status: 'error',
          message: `Local storage error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Test 4: Test service initialization
      try {
        const statistics = freeBacklinkService.getStatistics();
        results.push({
          name: 'Service Initialization',
          status: 'success',
          message: `Service initialized. Found ${statistics.total} existing posts.`
        });
      } catch (error) {
        results.push({
          name: 'Service Initialization',
          status: 'error',
          message: `Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Test 5: Test mock content generation (if OpenAI fails)
      if (!simpleAIContentEngine.isConfigured() || results.some(r => r.name === 'OpenAI Connection' && r.status === 'error')) {
        try {
          const mockResult = await simpleAIContentEngine.generateFreeBacklink({
            targetUrl: 'https://example.com',
            primaryKeyword: 'test keyword'
          });
          
          results.push({
            name: 'Fallback Content Generation',
            status: mockResult.error ? 'warning' : 'success',
            message: mockResult.error ? 
              `Fallback generated with error: ${mockResult.error}` :
              'Fallback content generation working'
          });
        } catch (error) {
          results.push({
            name: 'Fallback Content Generation',
            status: 'error',
            message: `Fallback generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      setTestResults(results);

      const hasErrors = results.some(r => r.status === 'error');
      const hasWarnings = results.some(r => r.status === 'warning');

      if (hasErrors) {
        toast({
          title: "Tests Completed with Errors",
          description: "Some critical functionality is not working. Check the results below.",
          variant: "destructive"
        });
      } else if (hasWarnings) {
        toast({
          title: "Tests Completed with Warnings",
          description: "Basic functionality works but some features may be limited.",
        });
      } else {
        toast({
          title: "All Tests Passed! ✅",
          description: "Free backlink feature is ready to use.",
        });
      }

    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Free Backlink System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This test will verify that the free backlink feature is working correctly. 
              It checks OpenAI configuration, connection, and local functionality.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runTests}
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Run System Tests
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          )}

          {testResults.length > 0 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong>
                {testResults.some(r => r.status === 'error') ? (
                  <span className="text-red-700"> Fix the failing tests before using the free backlink feature in production.</span>
                ) : testResults.some(r => r.status === 'warning') ? (
                  <span className="text-yellow-700"> The system will work with basic functionality. Configure OpenAI for full features.</span>
                ) : (
                  <span className="text-green-700"> System is ready! You can now use the free backlink feature.</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
