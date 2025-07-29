/**
 * API Connection Test Component
 * Tests and displays real-time API connection status
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, RefreshCw, Zap, Clock } from 'lucide-react';
import { enhancedOpenAIService } from '@/services/api/enhancedOpenAI';

interface ConnectionTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  details?: any;
}

export function ApiConnectionTest() {
  const [isTestingManual, setIsTestingManual] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectionTestResult | null>(null);
  const [isAutoTesting, setIsAutoTesting] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-test on component mount and periodically
  useEffect(() => {
    if (isAutoTesting) {
      runConnectionTest();
      
      // Auto-test every 30 seconds
      const interval = setInterval(runConnectionTest, 30000);
      return () => clearInterval(interval);
    }
  }, [isAutoTesting]);

  const runConnectionTest = async () => {
    const startTime = Date.now();
    setProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      console.log('🧪 Running API connection test...');
      
      const result = await enhancedOpenAIService.testConnection();
      const responseTime = Date.now() - startTime;
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const testResult: ConnectionTestResult = {
        success: result.success,
        responseTime,
        details: result.details,
        error: result.success ? undefined : 'Connection failed'
      };

      setLastTestResult(testResult);
      
      console.log('✅ API test completed:', testResult);
      
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(100);
      
      const responseTime = Date.now() - startTime;
      
      setLastTestResult({
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('❌ API test failed:', error);
    }
  };

  const handleManualTest = async () => {
    setIsTestingManual(true);
    await runConnectionTest();
    setTimeout(() => setIsTestingManual(false), 1000);
  };

  const getStatusDisplay = () => {
    if (!lastTestResult) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        status: 'testing',
        message: 'Testing connection...',
        variant: 'secondary' as const
      };
    }

    if (lastTestResult.success) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        status: 'connected',
        message: `Connected (${lastTestResult.responseTime}ms)`,
        variant: 'success' as const
      };
    } else {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        status: 'error',
        message: lastTestResult.error || 'Connection failed',
        variant: 'destructive' as const
      };
    }
  };

  const statusDisplay = getStatusDisplay();
  const isConfigured = enhancedOpenAIService.isConfigured();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4" />
          API Connection Status
          <Badge variant={statusDisplay.variant} className="ml-auto">
            {statusDisplay.status.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Real-time OpenAI API connection monitoring
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Configuration Status */}
        <div className="flex items-center gap-2 text-xs">
          {isConfigured ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-500" />
          )}
          <span className={isConfigured ? 'text-green-600' : 'text-red-600'}>
            API Key {isConfigured ? 'Configured' : 'Missing'}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs">
          {statusDisplay.icon}
          <span className="flex-1">{statusDisplay.message}</span>
        </div>

        {/* Progress Bar (when testing) */}
        {(isTestingManual || progress > 0) && progress < 100 && (
          <Progress value={progress} className="h-2" />
        )}

        {/* Last Test Details */}
        {lastTestResult && (
          <div className="bg-muted/50 rounded-md p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span className="font-mono">{lastTestResult.responseTime}ms</span>
            </div>
            
            {lastTestResult.details && (
              <div className="space-y-1">
                {lastTestResult.details.serviceStatus && (
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{lastTestResult.details.serviceStatus}</span>
                  </div>
                )}
                {lastTestResult.details.healthChecks && (
                  <div className="flex justify-between">
                    <span>Health:</span>
                    <span>{lastTestResult.details.healthChecks}</span>
                  </div>
                )}
              </div>
            )}
            
            {lastTestResult.error && (
              <div className="text-red-600 mt-1">
                <strong>Error:</strong> {lastTestResult.error}
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualTest}
            disabled={isTestingManual}
            className="flex-1 h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isTestingManual ? 'animate-spin' : ''}`} />
            Test Now
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoTesting(!isAutoTesting)}
            className="h-8 px-3"
          >
            {isAutoTesting ? 'Disable Auto' : 'Enable Auto'}
          </Button>
        </div>

        {/* Service Health Information */}
        {lastTestResult?.success && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                Enhanced reliability
              </Badge>
              <Badge variant="outline" className="text-xs">
                Auto-retry
              </Badge>
              <Badge variant="outline" className="text-xs">
                Failover ready
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
