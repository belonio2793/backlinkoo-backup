/**
 * Auth Debug Status Component
 * Displays authentication configuration and status for debugging
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SecureConfig } from '@/lib/secure-config';
import { CheckCircle, XCircle, AlertCircle, Refresh } from 'lucide-react';

export function AuthDebugStatus() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      // Test basic connection
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Test user fetch
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      // Get configuration
      const config = {
        hasEnvUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasEnvKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        hasSecureUrl: !!SecureConfig.SUPABASE_URL,
        hasSecureKey: !!SecureConfig.SUPABASE_ANON_KEY,
        envUrl: import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...` : null,
        secureUrl: SecureConfig.SUPABASE_URL ? `${SecureConfig.SUPABASE_URL.substring(0, 30)}...` : null,
        envKeyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...' : null,
        secureKeyPrefix: SecureConfig.SUPABASE_ANON_KEY ? SecureConfig.SUPABASE_ANON_KEY.substring(0, 10) + '...' : null,
      };

      setAuthStatus({
        session,
        sessionError,
        user,
        userError,
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthStatus({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (!authStatus) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 animate-spin" />
            <span>Checking authentication status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Authentication Status</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkAuthStatus}
            disabled={isLoading}
          >
            <Refresh className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Status */}
        <div>
          <h3 className="font-medium mb-2">Configuration</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus.config?.hasEnvUrl)}
              <span>Environment URL</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus.config?.hasEnvKey)}
              <span>Environment Key</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus.config?.hasSecureUrl)}
              <span>Secure Config URL</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus.config?.hasSecureKey)}
              <span>Secure Config Key</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div>
          <h3 className="font-medium mb-2">Connection</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(!authStatus.sessionError)}
              <span>Session Check</span>
              {authStatus.sessionError && (
                <Badge variant="destructive" className="text-xs">
                  {authStatus.sessionError.message}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!authStatus.userError)}
              <span>User Check</span>
              {authStatus.userError && (
                <Badge variant="destructive" className="text-xs">
                  {authStatus.userError.message}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Current User */}
        <div>
          <h3 className="font-medium mb-2">Current Session</h3>
          {authStatus.session?.user ? (
            <div className="text-sm">
              <Badge variant="default">Authenticated</Badge>
              <p className="mt-1">User ID: {authStatus.session.user.id}</p>
              <p>Email: {authStatus.session.user.email}</p>
            </div>
          ) : (
            <Badge variant="secondary">Not authenticated</Badge>
          )}
        </div>

        {/* URLs for debugging */}
        <div>
          <h3 className="font-medium mb-2">Configuration Details</h3>
          <div className="text-xs space-y-1 font-mono bg-gray-50 p-2 rounded">
            <div>Env URL: {authStatus.config?.envUrl || 'Not set'}</div>
            <div>Secure URL: {authStatus.config?.secureUrl || 'Not set'}</div>
            <div>Env Key: {authStatus.config?.envKeyPrefix || 'Not set'}</div>
            <div>Secure Key: {authStatus.config?.secureKeyPrefix || 'Not set'}</div>
          </div>
        </div>

        {authStatus.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{authStatus.error}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Last checked: {new Date(authStatus.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
