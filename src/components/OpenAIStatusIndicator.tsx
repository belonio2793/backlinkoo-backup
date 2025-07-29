/**
 * OpenAI Status Indicator Component
 * Shows the real-time status and reliability of the OpenAI service
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { OpenAIReliabilityTester } from '@/utils/openaiReliabilityTest';

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down' | 'checking';
  message: string;
  details: any;
  lastChecked?: Date;
}

export function OpenAIStatusIndicator() {
  const [status, setStatus] = useState<ServiceStatus>({
    status: 'checking',
    message: 'Checking OpenAI service status...',
    details: {}
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    setIsRefreshing(true);
    try {
      const serviceStatus = await OpenAIReliabilityTester.getServiceStatus();
      setStatus({
        ...serviceStatus,
        lastChecked: new Date()
      });
    } catch (error) {
      setStatus({
        status: 'down',
        message: 'Failed to check service status',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        lastChecked: new Date()
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isRefreshing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    switch (status.status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      operational: 'success' as const,
      degraded: 'warning' as const,
      down: 'destructive' as const,
      checking: 'secondary' as const
    };

    return (
      <Badge variant={variants[status.status]} className="ml-2">
        {status.status === 'checking' ? 'Checking...' : status.status.toUpperCase()}
      </Badge>
    );
  };

  const getAlertVariant = () => {
    switch (status.status) {
      case 'operational':
        return 'default';
      case 'degraded':
        return 'default';
      case 'down':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm font-medium">
          {getStatusIcon()}
          <span className="ml-2">OpenAI Service Status</span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Enhanced reliability with intelligent fallback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={getAlertVariant()}>
          <AlertTitle className="text-sm">Current Status</AlertTitle>
          <AlertDescription className="text-xs">
            {status.message}
          </AlertDescription>
        </Alert>

        {status.details && Object.keys(status.details).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Service Details</h4>
            <div className="bg-muted/50 rounded-md p-2 text-xs">
              {status.details.health && (
                <div className="mb-2">
                  <strong>Health:</strong> {status.details.health.healthStatus || 'Unknown'}
                  {status.details.health.successRate && (
                    <span className="ml-2">({status.details.health.successRate})</span>
                  )}
                </div>
              )}
              {status.details.connection && (
                <div className="mb-2">
                  <strong>Connection:</strong> {status.details.connection.serviceStatus || 'Unknown'}
                </div>
              )}
              {status.details.error && (
                <div className="text-red-600">
                  <strong>Error:</strong> {status.details.error}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            {status.lastChecked && (
              <span>Last checked: {status.lastChecked.toLocaleTimeString()}</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={isRefreshing}
            className="h-8 px-3"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {status.status === 'operational' && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              Multi-key fallback
            </Badge>
            <Badge variant="outline" className="text-xs">
              Health monitoring
            </Badge>
            <Badge variant="outline" className="text-xs">
              Auto-retry
            </Badge>
            <Badge variant="outline" className="text-xs">
              Circuit breaker
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
