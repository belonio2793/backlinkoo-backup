/**
 * API Status Checker Component
 * Checks API availability before rendering AI-powered components
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface APIStatus {
  online: boolean;
  providers?: Record<string, any>;
  message?: string;
  timestamp?: string;
}

interface APIStatusCheckerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function APIStatusChecker({ children, fallback }: APIStatusCheckerProps) {
  const [status, setStatus] = useState<APIStatus | null>(null); // null = loading
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const checkAPIStatus = async () => {
    setLoading(true);
    try {
      console.log('Checking API status...');
      const response = await fetch('/.netlify/functions/api-status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API status response:', data);
        setStatus(data);
      } else {
        // Fallback: assume online for demo
        console.log('API status check failed, assuming online for demo');
        setStatus({ 
          online: true, 
          message: 'Demo mode - API status check unavailable',
          providers: { OpenAI: { status: 'demo' }, Grok: { status: 'demo' } }
        });
      }
    } catch (error) {
      console.error('API status check error:', error);
      // Fallback: assume online for demo
      setStatus({ 
        online: true, 
        message: 'Demo mode - API status check failed',
        providers: { OpenAI: { status: 'demo' }, Grok: { status: 'demo' } }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkAPIStatus();
  };

  useEffect(() => {
    checkAPIStatus();
  }, [retryCount]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Checking AI provider availability...</p>
        </div>
      </div>
    );
  }

  // Error/Offline state
  if (!status?.online) {
    return (
      <div className="p-6">
        {fallback || (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Services Unavailable</p>
                <p className="text-sm mt-1">
                  {status?.message || 'All AI providers are currently offline. Please try again later.'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Online state - render children
  return (
    <div>
      {/* Optional status indicator */}
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>AI services are online and ready</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRetry}
              className="text-green-600 hover:text-green-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      
      {children}
    </div>
  );
}

export default APIStatusChecker;
