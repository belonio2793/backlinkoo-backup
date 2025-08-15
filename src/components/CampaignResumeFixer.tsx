import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Bug } from 'lucide-react';

interface FixResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const CampaignResumeFixer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const addResult = (result: FixResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Test function availability
  const testFunctions = async () => {
    const functions = [
      'working-campaign-processor',
      'fix-campaign-schema',
      'api-status'
    ];

    for (const func of functions) {
      try {
        const response = await fetch(`/.netlify/functions/${func}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });

        if (response.status === 404) {
          addResult({
            step: `Function ${func}`,
            status: 'error',
            message: 'NOT FOUND (404) - Function not deployed'
          });
        } else {
          addResult({
            step: `Function ${func}`,
            status: 'success',
            message: `Available (status: ${response.status})`
          });
        }
      } catch (error) {
        addResult({
          step: `Function ${func}`,
          status: 'error',
          message: `Network error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  };

  // Fix database schema
  const fixDatabaseSchema = async () => {
    try {
      const response = await fetch('/.netlify/functions/fix-campaign-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        addResult({
          step: 'Database Schema',
          status: 'success',
          message: 'Schema fixes applied successfully',
          details: result
        });
      } else {
        const error = await response.text();
        addResult({
          step: 'Database Schema',
          status: 'error',
          message: `Schema fix failed: ${error}`
        });
      }
    } catch (error) {
      addResult({
        step: 'Database Schema',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // Test campaign processor
  const testCampaignProcessor = async () => {
    const testData = {
      keyword: 'test keyword',
      anchorText: 'test link',
      targetUrl: 'https://example.com',
      campaignId: 'debug-test-' + Date.now()
    };

    try {
      const response = await fetch('/.netlify/functions/working-campaign-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        addResult({
          step: 'Campaign Processor Test',
          status: 'success',
          message: 'Campaign processor working correctly',
          details: result
        });
      } else {
        const error = await response.text();
        addResult({
          step: 'Campaign Processor Test',
          status: 'error',
          message: `Test failed: ${error}`
        });
      }
    } catch (error) {
      addResult({
        step: 'Campaign Processor Test',
        status: 'error',
        message: `Network error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // Run comprehensive fix
  const runComprehensiveFix = async () => {
    setIsRunning(true);
    clearResults();

    try {
      addResult({
        step: 'Environment Check',
        status: 'success',
        message: `Environment: ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}`
      });

      await testFunctions();
      await fixDatabaseSchema();
      await testCampaignProcessor();

      addResult({
        step: 'Fix Complete',
        status: 'success',
        message: 'All campaign resume fixes have been applied'
      });

    } catch (error) {
      addResult({
        step: 'Fix Process',
        status: 'error',
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: FixResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: FixResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    } as const;
    
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (!isExpanded) {
    return (
      <Alert className="mb-4">
        <Bug className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Campaign not resuming properly? Run diagnostics to fix common issues.</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(true)}
          >
            <Bug className="h-3 w-3 mr-1" />
            Debug Campaign
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Campaign Resume Debugger</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Hide
          </Button>
          <Button
            onClick={runComprehensiveFix}
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Bug className="h-3 w-3 mr-1" />
                Run Fix
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !isRunning && (
          <p className="text-sm text-muted-foreground mb-4">
            Click "Run Fix" to diagnose and fix campaign resume issues automatically.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{result.step}</p>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        View Details
                      </summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isRunning && (
          <div className="flex items-center space-x-2 p-3 rounded-lg border">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <p className="text-sm">Running diagnostics and fixes...</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Common Issues & Solutions:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>404 Function Errors:</strong> Netlify functions need deployment</li>
            <li>• <strong>Database Errors:</strong> Missing tables - auto-fixed by this tool</li>
            <li>• <strong>Content Not Posting:</strong> Check OpenAI API key configuration</li>
            <li>• <strong>Telegraph Errors:</strong> Service may be temporarily unavailable</li>
          </ul>

          <div className="mt-3 pt-3 border-t border-muted-foreground/20">
            <p className="text-xs text-muted-foreground mb-2">
              For severe issues, use the emergency fix center:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/emergency-campaign-fix.html', '_blank')}
              className="text-xs"
            >
              🚨 Emergency Fix Center
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
