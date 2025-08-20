import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle,
  Settings,
  Info
} from 'lucide-react';
import { SupabaseConnectionFixer } from '@/utils/supabaseConnectionFixer';
import { toast } from 'sonner';

interface SupabaseErrorRecoveryProps {
  error?: Error | null;
  onRecovery?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}

export const SupabaseErrorRecovery: React.FC<SupabaseErrorRecoveryProps> = ({
  error,
  onRecovery,
  onRetry,
  compact = false
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [connectivity, setConnectivity] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnectivity = async () => {
    try {
      const result = await SupabaseConnectionFixer.testConnectivity();
      setConnectivity(result);
      return result;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return null;
    }
  };

  const handleEmergencyFix = async () => {
    setIsFixing(true);
    try {
      toast.info('🔧 Applying emergency fixes...', { duration: 3000 });
      
      const result = await SupabaseConnectionFixer.emergencyFix();
      
      if (result.success) {
        toast.success('✅ Connection issues resolved!', { duration: 3000 });
        
        // Test connectivity after fix
        await checkConnectivity();
        
        // Notify parent component
        onRecovery?.();
        
        // Auto-retry if callback provided
        setTimeout(() => {
          onRetry?.();
        }, 1000);
        
      } else {
        toast.error('❌ Some issues remain. See details below.', { duration: 5000 });
        console.warn('Emergency fix completed with remaining issues:', result.remainingIssues);
      }
      
      return result;
      
    } catch (error) {
      console.error('Emergency fix failed:', error);
      toast.error('❌ Emergency fix failed. Please check your connection.', { duration: 5000 });
    } finally {
      setIsFixing(false);
    }
  };

  const handleTestConnectivity = async () => {
    const result = await checkConnectivity();
    
    if (result?.supabase && result?.internet) {
      toast.success('✅ Connection restored!', { duration: 3000 });
      onRecovery?.();
    } else if (result?.internet && !result?.supabase) {
      toast.warning('⚠️ Internet works but Supabase is unreachable', { duration: 5000 });
    } else {
      toast.error('❌ No internet connection detected', { duration: 5000 });
    }
  };

  // Don't show if there's no error and we're online
  if (!error && isOnline) {
    return null;
  }

  // Determine if this is a network error
  const isNetworkError = error ? SupabaseConnectionFixer.isSupabaseNetworkError(error) : !isOnline;

  if (compact) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {isOnline ? 'Database connection issues' : 'No internet connection'}
            </span>
            <div className="flex gap-2 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleTestConnectivity}
                className="h-6 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Test
              </Button>
              {isNetworkError && (
                <Button 
                  size="sm" 
                  onClick={handleEmergencyFix}
                  disabled={isFixing}
                  className="h-6 text-xs"
                >
                  {isFixing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Settings className="h-3 w-3 mr-1" />
                  )}
                  Fix
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          {isOnline ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
          {isOnline ? 'Connection Issues Detected' : 'No Internet Connection'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span>Internet: {isOnline ? 'Connected' : 'Offline'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {connectivity?.supabase ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <span>Database: {connectivity?.supabase ? 'Connected' : 'Issues'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {connectivity?.google ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <span>External: {connectivity?.google ? 'Connected' : 'Issues'}</span>
          </div>
        </div>

        {/* Error Details */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error.message || 'Unknown error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleTestConnectivity}
            variant="outline"
            className="flex-1"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          
          {isNetworkError && (
            <Button 
              onClick={handleEmergencyFix}
              disabled={isFixing}
              className="flex-1"
            >
              {isFixing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              {isFixing ? 'Fixing...' : 'Emergency Fix'}
            </Button>
          )}
          
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Helpful Tips */}
        <div className="text-sm text-orange-700 space-y-1">
          <p><strong>Quick fixes to try:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check your internet connection</li>
            <li>Disable ad blockers or browser extensions</li>
            <li>Try refreshing the page</li>
            <li>Clear browser cache and cookies</li>
            {isOnline && <li>Server may be temporarily unavailable</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseErrorRecovery;
