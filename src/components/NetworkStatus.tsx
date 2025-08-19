import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NetworkStatusProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export const NetworkStatus = ({ onRetry, showRetryButton = true }: NetworkStatusProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error' | 'offline'>('checking');
  const [lastError, setLastError] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const checkDatabaseConnection = async () => {
    try {
      setDbStatus('checking');
      
      // Simple connection test
      const { error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Database connection test failed:', error.message);
        setDbStatus('error');
        setLastError(error.message);
      } else {
        setDbStatus('connected');
        setLastError('');
      }
    } catch (error: any) {
      console.error('Database connection check failed:', error);
      setDbStatus('error');
      setLastError(error?.message || 'Unknown connection error');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await checkDatabaseConnection();
      if (onRetry) {
        await onRetry();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkDatabaseConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDbStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (isOnline) {
      checkDatabaseConnection();
    } else {
      setDbStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (dbStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (dbStatus) {
      case 'checking':
        return 'Checking connection...';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection error';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!isOnline || dbStatus === 'offline') return 'bg-gray-100 text-gray-800';
    
    switch (dbStatus) {
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const shouldShowAlert = !isOnline || dbStatus === 'error';

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Badge className={`${getStatusColor()} border-0`}>
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </Badge>
        
        {showRetryButton && (isOnline && dbStatus === 'error') && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Retry
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {shouldShowAlert && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {!isOnline ? (
              <div>
                <p className="font-medium">No internet connection</p>
                <p className="text-sm">Please check your network connection and try again.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Database connection failed</p>
                <p className="text-sm">{lastError}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs">Common solutions:</p>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    <li>Check your internet connection</li>
                    <li>Refresh the page</li>
                    <li>Try again in a few moments</li>
                    <li>Contact support if the issue persists</li>
                  </ul>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NetworkStatus;
