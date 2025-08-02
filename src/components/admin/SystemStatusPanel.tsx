import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Key,
  Brain,
  TestTube
} from "lucide-react";

export function SystemStatusPanel() {
  const {
    openaiApiKey,
    keyStatus,
    lastUpdated,
    error,
    refresh,
    testOpenAI
  } = useSystemConfig();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testOpenAI();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (keyStatus) {
      case 'loading':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Loading</Badge>;
      case 'available':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Invalid</Badge>;
      case 'missing':
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Missing</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration Status
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* OpenAI API Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="font-medium">OpenAI API Integration</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* API Key Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">API Key</span>
              </div>
              {openaiApiKey ? (
                <div className="text-sm text-muted-foreground font-mono">
                  {openaiApiKey.substring(0, 10)}...
                  <span className="ml-2 text-green-600">✓ Available</span>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Not configured
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Updated</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Configuration Error</div>
                <div className="text-sm mt-1">{error}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <TestTube className={`h-4 w-4 ${testResult.success ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                <div className="font-medium">
                  {testResult.success ? '✅ OpenAI API Test Successful' : '❌ OpenAI API Test Failed'}
                </div>
                <div className="text-sm mt-1">
                  {testResult.success ? (
                    <>
                      Model: {testResult.model}
                      {testResult.usage && (
                        <span className="ml-2">
                          ({testResult.usage.total_models} models available)
                        </span>
                      )}
                    </>
                  ) : (
                    testResult.error
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !openaiApiKey}
            >
              <TestTube className={`h-4 w-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
              {testing ? 'Testing...' : 'Test OpenAI API'}
            </Button>
          </div>
        </div>

        {/* Integration Instructions */}
        {keyStatus === 'missing' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">OpenAI API Key Required</div>
              <div className="text-sm mt-1">
                Set the OPENAI_API_KEY environment variable in your Netlify dashboard to enable AI features.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
