import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Shield, 
  RefreshCw,
  Database,
  Mail
} from 'lucide-react';

interface AuthStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  userInfo: {
    email?: string;
    id?: string;
    createdAt?: string;
    lastSignIn?: string;
  };
  connectionHealth: {
    supabase: boolean;
    auth: boolean;
    database: boolean;
  };
  lastCheck: string;
}

export function AuthStatusMonitor() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkAuthStatus = async () => {
    setIsRefreshing(true);
    
    const newStatus: AuthStatus = {
      isConnected: false,
      isAuthenticated: false,
      isEmailVerified: false,
      userInfo: {},
      connectionHealth: {
        supabase: false,
        auth: false,
        database: false
      },
      lastCheck: new Date().toISOString()
    };

    try {
      // Test Supabase connection
      const { data: healthData, error: healthError } = await supabase
        .rpc('get_current_user_id')
        .then(() => ({ data: true, error: null }))
        .catch(error => ({ data: null, error }));

      if (!healthError) {
        newStatus.connectionHealth.supabase = true;
        newStatus.isConnected = true;
      }

      // Test auth service
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError) {
        newStatus.connectionHealth.auth = true;
        
        if (sessionData.session?.user) {
          newStatus.isAuthenticated = true;
          newStatus.isEmailVerified = !!sessionData.session.user.email_confirmed_at;
          newStatus.userInfo = {
            email: sessionData.session.user.email,
            id: sessionData.session.user.id,
            createdAt: sessionData.session.user.created_at,
            lastSignIn: sessionData.session.user.last_sign_in_at
          };
        }
      }

      // Test database access
      if (newStatus.isAuthenticated) {
        try {
          const { error: dbError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
          
          if (!dbError) {
            newStatus.connectionHealth.database = true;
          }
        } catch (error) {
          console.warn('Database access test failed:', error);
        }
      }

    } catch (error) {
      console.error('Auth status check failed:', error);
    }

    setStatus(newStatus);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [user, isAuthenticated]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isHealthy: boolean, label: string) => (
    <Badge variant={isHealthy ? "default" : "destructive"} className="flex items-center gap-1">
      {isHealthy ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </Badge>
  );

  if (!status) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking authentication status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkAuthStatus}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
            <span className="text-sm font-medium">Connection</span>
            {status.isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
            <span className="text-sm font-medium">Authenticated</span>
            {status.isAuthenticated ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
            <span className="text-sm font-medium">Email Verified</span>
            {status.isEmailVerified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : status.isAuthenticated ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>

        {/* Connection Health */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Service Health</h3>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(status.connectionHealth.supabase, 'Supabase')}
            {getStatusBadge(status.connectionHealth.auth, 'Authentication')}
            {getStatusBadge(status.connectionHealth.database, 'Database')}
          </div>
        </div>

        {/* User Information */}
        {status.isAuthenticated && status.userInfo.email && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Email:</span>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {status.userInfo.email}
                  {status.isEmailVerified && (
                    <CheckCircle className="h-3 w-3 text-green-600" title="Verified" />
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">User ID:</span>
                <div className="font-mono text-xs">
                  {status.userInfo.id?.substring(0, 8)}...
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Created:</span>
                <div>{formatDate(status.userInfo.createdAt)}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Last Sign In:</span>
                <div>{formatDate(status.userInfo.lastSignIn)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Issues and Recommendations */}
        {(!status.isConnected || !status.isAuthenticated || !status.isEmailVerified) && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Issues & Recommendations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {!status.connectionHealth.supabase && (
                <li>Supabase connection failed - check your environment variables</li>
              )}
              {!status.connectionHealth.auth && (
                <li>Authentication service unavailable - verify Supabase configuration</li>
              )}
              {!status.connectionHealth.database && status.isAuthenticated && (
                <li>Database access limited - check user permissions and RLS policies</li>
              )}
              {status.isAuthenticated && !status.isEmailVerified && (
                <li>Email verification pending - check your email for verification link</li>
              )}
              {!status.isAuthenticated && status.isConnected && (
                <li>Not signed in - use the sign-in form to authenticate</li>
              )}
            </ul>
          </div>
        )}

        {/* Last Check */}
        <div className="text-xs text-muted-foreground text-center">
          Last checked: {formatDate(status.lastCheck)}
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthStatusMonitor;
