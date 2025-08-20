import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastNetworkError, setLastNetworkError] = useState<string | null>(null);
  const [showNetworkError, setShowNetworkError] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      setShowNetworkError(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Listen for browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor network quality without overriding fetch
    // Use a safer approach that doesn't modify global fetch

    // Test connection quality periodically
    const testConnection = async () => {
      try {
        const start = Date.now();
        const response = await fetch('/favicon.svg', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        const duration = Date.now() - start;

        if (!response.ok) {
          setConnectionQuality('poor');
          setLastNetworkError(`Server responded with ${response.status}`);
          setShowNetworkError(true);
        } else if (duration > 5000) {
          setConnectionQuality('poor');
          setLastNetworkError('Slow connection detected');
          setShowNetworkError(true);
        } else {
          setConnectionQuality('good');
          setShowNetworkError(false);
          setLastNetworkError(null);
        }
      } catch (error: any) {
        setConnectionQuality('poor');
        setLastNetworkError(error.message || 'Network connection failed');
        setShowNetworkError(true);
      }
    };

    // Listen for global error events to detect network failures
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('Failed to fetch') ||
          event.message?.includes('NetworkError') ||
          event.message?.includes('Network request blocked')) {
        setConnectionQuality('poor');
        setLastNetworkError(event.message);
        setShowNetworkError(true);
      }
    };

    window.addEventListener('error', handleGlobalError);

    // Test connection every 30 seconds if online
    const interval = setInterval(() => {
      if (isOnline) {
        testConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleGlobalError);
      clearInterval(interval);
    };
  }, [isOnline]);

  const getStatusBadge = () => {
    if (!isOnline || connectionQuality === 'offline') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="w-3 h-3" />
          Offline
        </Badge>
      );
    }

    if (connectionQuality === 'poor') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-yellow-300 text-yellow-700 bg-yellow-50">
          <AlertTriangle className="w-3 h-3" />
          Poor Connection
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1 border-green-300 text-green-700 bg-green-50">
        <Wifi className="w-3 h-3" />
        Online
      </Badge>
    );
  };

  const handleRetryConnection = async () => {
    try {
      await fetch('/favicon.svg', { method: 'HEAD', cache: 'no-cache' });
      setConnectionQuality('good');
      setShowNetworkError(false);
      setLastNetworkError(null);
    } catch (error: any) {
      setConnectionQuality('poor');
      setLastNetworkError(error.message);
    }
  };

  return (
    <div className={className}>
      {getStatusBadge()}
      
      {showDetails && showNetworkError && lastNetworkError && (
        <Alert className="mt-2 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <div>
                <strong>Network Issue Detected</strong>
                <p className="text-sm">{lastNetworkError}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryConnection}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
