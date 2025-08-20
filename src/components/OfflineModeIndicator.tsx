import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineModeIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide the alert after 5 seconds when coming back online
  useEffect(() => {
    if (isOnline && !showOfflineAlert) {
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineAlert]);

  if (!showOfflineAlert && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className={`${
        isOnline 
          ? 'border-green-200 bg-green-50' 
          : 'border-amber-200 bg-amber-50'
      }`}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-600" />
        )}
        <AlertDescription className={
          isOnline ? 'text-green-800' : 'text-amber-800'
        }>
          {isOnline ? (
            <span>✅ Connection restored</span>
          ) : (
            <div>
              <p className="font-medium">⚠️ Working offline</p>
              <p className="text-xs mt-1">
                Some features may be limited until connection is restored
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default OfflineModeIndicator;
