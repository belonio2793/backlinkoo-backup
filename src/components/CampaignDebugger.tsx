import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play,
  Settings,
  Database,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CampaignDebugger() {
  const [isFixingSchema, setIsFixingSchema] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [schemaResult, setSchemaResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const fixDatabaseSchema = async () => {
    setIsFixingSchema(true);
    setSchemaResult(null);

    try {
      const response = await fetch('/.netlify/functions/fix-campaign-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      setSchemaResult(result);

      if (result.success) {
        toast({
          title: "Schema Fixed",
          description: "Database schema has been updated successfully",
        });
      } else {
        toast({
          title: "Schema Fix Failed",
          description: result.error || "Failed to fix database schema",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSchemaResult({ success: false, error: errorMessage });
      toast({
        title: "Error",
        description: "Failed to fix database schema: " + errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsFixingSchema(false);
    }
  };

  const runCampaignTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/.netlify/functions/test-campaign-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success && result.testResults?.summary?.testPassed) {
        toast({
          title: "Campaign Test Passed",
          description: `Successfully created ${result.testResults.summary.validUrls} working links`,
        });
      } else {
        toast({
          title: "Campaign Test Failed",
          description: result.error || "Campaign test did not pass",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({ success: false, error: errorMessage });
      toast({
        title: "Error",
        description: "Failed to run campaign test: " + errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Campaign System Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Database Schema Fix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Fix Database Schema
                </h3>
                <p className="text-sm text-gray-600">
                  Create missing tables: automation_campaigns, automation_published_links, activity_logs
                </p>
              </div>
              <Button 
                onClick={fixDatabaseSchema} 
                disabled={isFixingSchema}
                className="flex items-center gap-2"
              >
                {isFixingSchema ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {isFixingSchema ? 'Fixing...' : 'Fix Schema'}
              </Button>
            </div>

            {schemaResult && (
              <Alert className={schemaResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {schemaResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={schemaResult.success ? 'text-green-700' : 'text-red-700'}>
                    {schemaResult.success ? 'Database schema fixed successfully!' : `Error: ${schemaResult.error}`}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Campaign Flow Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  Test Campaign Flow
                </h3>
                <p className="text-sm text-gray-600">
                  Run end-to-end test: Generate content → Publish to Telegraph → Validate URLs
                </p>
              </div>
              <Button 
                onClick={runCampaignTest} 
                disabled={isTesting}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isTesting ? 'Testing...' : 'Run Test'}
              </Button>
            </div>

            {testResult && (
              <div className="space-y-4">
                <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                      {testResult.success ? 'Campaign test completed!' : `Error: ${testResult.error}`}
                    </AlertDescription>
                  </div>
                </Alert>

                {testResult.success && testResult.testResults && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {testResult.testResults.summary?.totalPosts || 0}
                          </div>
                          <div className="text-sm text-gray-600">Posts Generated</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {testResult.testResults.summary?.validUrls || 0}
                          </div>
                          <div className="text-sm text-gray-600">Valid URLs</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {testResult.testResults.summary?.testPassed ? 'PASS' : 'FAIL'}
                          </div>
                          <div className="text-sm text-gray-600">Test Result</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {testResult.testResults?.urlValidation?.details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Published URLs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {testResult.testResults.urlValidation.details.map((urlTest: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {urlTest.valid ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm font-mono text-gray-600">
                                  {urlTest.url}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={urlTest.valid ? 'default' : 'destructive'}>
                                  {urlTest.status}
                                </Badge>
                                {urlTest.valid && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(urlTest.url, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Troubleshooting Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>First, click "Fix Schema" to create missing database tables</li>
                <li>Then click "Run Test" to verify the campaign flow works</li>
                <li>If test passes, campaigns should work normally</li>
                <li>If test fails, check the error messages for specific issues</li>
                <li>Common issues: Missing OpenAI API key, Supabase permissions, network errors</li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
