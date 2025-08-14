import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getAutomationDebugger, type AutomationDebugResult } from '@/utils/automationDebugger';

export const AutomationSystemTest: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AutomationDebugResult | null>(null);
  const [testResults, setTestResults] = useState<{ success: boolean; error?: string; details?: any } | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);
    setTestResults(null);

    try {
      const debugger = getAutomationDebugger();
      const diagnosticResults = await debugger.runDiagnostics();
      setResults(diagnosticResults);

      if (diagnosticResults.overall.ready) {
        toast({
          title: "System Check Passed",
          description: "All automation services are working correctly!",
          variant: "default"
        });
      } else {
        toast({
          title: "System Issues Detected",
          description: `${diagnosticResults.overall.issues.length} issue(s) found. Check the report below.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Diagnostic Failed",
        description: error instanceof Error ? error.message : "Failed to run diagnostics",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runCampaignTest = async () => {
    if (!results?.overall.ready) {
      toast({
        title: "System Not Ready",
        description: "Please run diagnostics first and resolve any issues.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    try {
      const debugger = getAutomationDebugger();
      const testParams = {
        target_url: 'https://example.com',
        keyword: 'automation testing',
        anchor_text: 'test automation link'
      };

      const campaignResults = await debugger.testCampaignFlow(testParams);
      setTestResults(campaignResults);

      if (campaignResults.success) {
        toast({
          title: "Campaign Test Passed",
          description: "Successfully created a test campaign!",
          variant: "default"
        });
      } else {
        toast({
          title: "Campaign Test Failed",
          description: campaignResults.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to run campaign test",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Automation System Test
        </CardTitle>
        <CardDescription>
          Run diagnostics to check if all automation services are working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run System Diagnostics'
            )}
          </Button>

          <Button 
            onClick={runCampaignTest}
            disabled={isRunning || !results?.overall.ready}
            variant="default"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Campaign...
              </>
            ) : (
              'Test Campaign Creation'
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <Alert className={results.overall.ready ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                <strong>Overall Status:</strong> {results.overall.ready ? "✅ All systems operational" : "❌ Issues detected"}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(results.contentService.available && results.contentService.configured)}
                    Content Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Available:</span>
                      {getStatusIcon(results.contentService.available)}
                    </div>
                    <div className="flex justify-between">
                      <span>Configured:</span>
                      {getStatusIcon(results.contentService.configured)}
                    </div>
                    {results.contentService.error && (
                      <p className="text-red-600 text-xs mt-2">{results.contentService.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(results.telegraphService.available)}
                    Telegraph Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Available:</span>
                      {getStatusIcon(results.telegraphService.available)}
                    </div>
                    {results.telegraphService.error && (
                      <p className="text-red-600 text-xs mt-2">{results.telegraphService.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(results.database.connected)}
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Connected:</span>
                      {getStatusIcon(results.database.connected)}
                    </div>
                    {results.database.error && (
                      <p className="text-red-600 text-xs mt-2">{results.database.error}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {results.overall.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Issues to resolve:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {results.overall.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {testResults && (
          <Alert className={testResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription>
              <strong>Campaign Test Result:</strong> {testResults.success ? "✅ Success" : "❌ Failed"}
              {testResults.error && <div className="mt-1 text-red-600">{testResults.error}</div>}
              {testResults.details && (
                <div className="mt-2 text-sm">
                  <strong>Details:</strong> {JSON.stringify(testResults.details, null, 2)}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationSystemTest;