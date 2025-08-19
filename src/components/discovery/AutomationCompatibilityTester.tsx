import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Zap, 
  AlertTriangle,
  Clock,
  Settings,
  Api,
  FileText,
  Link2,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutomationTestResult {
  id: string;
  url: string;
  domain: string;
  automation_ready: boolean;
  api_available: boolean;
  form_detection: boolean;
  registration_required: boolean;
  publishing_method: string;
  success_probability: number;
  compatibility_score: number;
  error?: string;
}

interface AutomationCompatibilityTesterProps {
  results: Array<{
    id: string;
    url: string;
    domain: string;
    title: string;
    platform_type: string;
    publishing_method?: string;
  }>;
  onTestComplete: (testResults: AutomationTestResult[]) => void;
}

const AutomationCompatibilityTester: React.FC<AutomationCompatibilityTesterProps> = ({ 
  results, 
  onTestComplete 
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<AutomationTestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const { toast } = useToast();

  const testAutomationCompatibility = async () => {
    if (results.length === 0) {
      toast({
        title: "No URLs to Test",
        description: "Discover URLs first before testing automation compatibility.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    setProgress(0);

    try {
      const batchSize = 3; // Test 3 URLs at a time
      const batches = [];
      
      for (let i = 0; i < results.length; i += batchSize) {
        batches.push(results.slice(i, i + batchSize));
      }

      let completedCount = 0;
      const allResults: AutomationTestResult[] = [];

      for (const batch of batches) {
        setCurrentUrl(`Testing automation compatibility for ${batch.length} URLs...`);
        
        // Test batch in parallel
        const batchPromises = batch.map(async (result) => {
          return await testSingleUrlCompatibility(result);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled' && promiseResult.value) {
            allResults.push(promiseResult.value);
          } else {
            // Handle failed test
            allResults.push({
              id: batch[index].id,
              url: batch[index].url,
              domain: batch[index].domain,
              automation_ready: false,
              api_available: false,
              form_detection: false,
              registration_required: true,
              publishing_method: 'unknown',
              success_probability: 0,
              compatibility_score: 0,
              error: 'Test failed'
            });
          }
        });

        completedCount += batch.length;
        setProgress((completedCount / results.length) * 100);
        setTestResults([...allResults]);

        // Delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Update database with test results
      await updateAutomationCompatibility(allResults);
      
      setIsTesting(false);
      setCurrentUrl('');
      onTestComplete(allResults);
      
      const readyCount = allResults.filter(r => r.automation_ready).length;
      toast({
        title: "Compatibility Testing Complete",
        description: `${readyCount} of ${allResults.length} URLs are automation-ready.`,
      });

    } catch (error) {
      console.error('Compatibility testing error:', error);
      setIsTesting(false);
      toast({
        title: "Testing Failed",
        description: error instanceof Error ? error.message : "Failed to test automation compatibility",
        variant: "destructive"
      });
    }
  };

  const testSingleUrlCompatibility = async (result: any): Promise<AutomationTestResult> => {
    try {
      setCurrentUrl(result.url);
      
      const response = await fetch('/.netlify/functions/test-automation-compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: result.url,
          platform_type: result.platform_type,
          test_depth: 'comprehensive'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const compatibilityData = await response.json();
      
      return {
        id: result.id,
        url: result.url,
        domain: result.domain,
        automation_ready: compatibilityData.automation_ready || false,
        api_available: compatibilityData.api_available || false,
        form_detection: compatibilityData.form_detection || false,
        registration_required: compatibilityData.registration_required || true,
        publishing_method: compatibilityData.publishing_method || 'form_submission',
        success_probability: compatibilityData.success_probability || 0,
        compatibility_score: compatibilityData.compatibility_score || 0
      };

    } catch (error) {
      return {
        id: result.id,
        url: result.url,
        domain: result.domain,
        automation_ready: false,
        api_available: false,
        form_detection: false,
        registration_required: true,
        publishing_method: 'unknown',
        success_probability: 0,
        compatibility_score: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const updateAutomationCompatibility = async (results: AutomationTestResult[]) => {
    try {
      const response = await fetch('/.netlify/functions/update-automation-compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testResults: results
        }),
      });

      if (!response.ok) {
        console.error('Failed to update compatibility results in database');
      }
    } catch (error) {
      console.error('Error updating compatibility results:', error);
    }
  };

  const getCompatibilityIcon = (result: AutomationTestResult) => {
    if (result.automation_ready && result.compatibility_score >= 80) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (result.compatibility_score >= 50) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const automationReadyUrls = testResults.filter(r => r.automation_ready);
  const apiAvailableUrls = testResults.filter(r => r.api_available);
  const formCompatibleUrls = testResults.filter(r => r.form_detection);

  return (
    <div className="space-y-6">
      {/* Testing Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Compatibility Testing
          </h3>
          <p className="text-sm text-gray-600">
            Test discovered URLs for automation platform compatibility and publishing success
          </p>
        </div>
        <Button 
          onClick={testAutomationCompatibility} 
          disabled={isTesting || results.length === 0}
          className="flex items-center gap-2"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              Test Compatibility ({results.length})
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      {isTesting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Testing Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {currentUrl && (
            <p className="text-xs text-gray-500 truncate">
              Current: {currentUrl}
            </p>
          )}
        </div>
      )}

      {/* Compatibility Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-800">Automation Ready</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{automationReadyUrls.length}</p>
            <p className="text-sm text-green-600">Ready for campaigns</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Api className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-blue-800">API Available</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{apiAvailableUrls.length}</p>
            <p className="text-sm text-blue-600">Direct API publishing</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <span className="font-medium text-purple-800">Form Compatible</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formCompatibleUrls.length}</p>
            <p className="text-sm text-purple-600">Form submission ready</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-orange-800">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {testResults.length > 0 ? Math.round((automationReadyUrls.length / testResults.length) * 100) : 0}%
            </p>
            <p className="text-sm text-orange-600">Compatibility rate</p>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Compatibility Test Results</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getCompatibilityIcon(result)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.url}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{result.publishing_method}</span>
                      <span>•</span>
                      <span>{result.success_probability}% success probability</span>
                      {result.api_available && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">API</Badge>
                        </>
                      )}
                      {result.form_detection && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Form</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getCompatibilityColor(result.compatibility_score)}
                  >
                    {result.compatibility_score}% compatible
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isTesting && testResults.length === 0 && results.length > 0 && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Click "Test Compatibility" to evaluate discovered URLs for automation platform compatibility and publishing success rates.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AutomationCompatibilityTester;
