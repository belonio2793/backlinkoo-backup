import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminSignIn } from '@/components/AdminSignIn';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';

interface EmergencyAdminBypassProps {
  children: React.ReactNode;
}

export const EmergencyAdminBypass = ({ children }: EmergencyAdminBypassProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthWithTimeout();
  }, []);

  const checkAuthWithTimeout = async () => {
    setIsLoading(true);
    setError(null);

    // Set a maximum loading time of 3 seconds, then show emergency options
    const maxLoadingTimer = setTimeout(() => {
      console.warn('⏰ Auth check taking too long, showing emergency options');
      setError('Authentication system is not responding');
      setShowEmergency(true);
      setIsLoading(false);
    }, 3000);

    try {
      // Try basic auth check with no timeout (let the max timer handle it)
      const { data: { user }, error } = await supabase.auth.getUser();

      // Clear the max loading timer since we got a response
      clearTimeout(maxLoadingTimer);

      if (error) {
        console.error('Auth error:', error);
        setError(`Authentication error: ${error.message}`);
        setShowEmergency(true);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      if (!user) {
        // No user logged in - show sign in
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // User is authenticated
      setIsAuthenticated(true);

      // Immediate bypass for support admin - don't even check database
      if (user.email === 'support@backlinkoo.com') {
        console.log('✅ Support admin detected - immediate access granted');
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      // For other users, try a quick profile check but don't block on it
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.warn('Profile check failed:', profileError);
          setError('Database access issues - using emergency mode');
          setShowEmergency(true);
        } else {
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (profileError) {
        console.warn('Profile check exception:', profileError);
        setError('Database connection issues');
        setShowEmergency(true);
      }

    } catch (error: any) {
      console.error('Complete auth failure:', error);
      clearTimeout(maxLoadingTimer);

      // Show emergency options immediately on any error
      setError(`System error: ${error.message}`);
      setShowEmergency(true);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyAdminAccess = () => {
    console.log('🚨 Emergency admin access granted');
    setIsAdmin(true);
    setShowEmergency(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Quick auth check...</span>
          <div className="text-xs text-muted-foreground">
            If this takes too long, there may be database issues
          </div>
        </div>
      </div>
    );
  }

  if (showEmergency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Database connection issues detected. The authentication system is not responding.'}
            </AlertDescription>
          </Alert>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Emergency Admin Access</h2>
            <p className="text-sm text-muted-foreground mb-4">
              If you're the system administrator and need immediate access, click below.
            </p>
            
            <Button 
              onClick={emergencyAdminAccess}
              className="w-full mb-3"
              variant="destructive"
            >
              🚨 Grant Emergency Admin Access
            </Button>

            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Retry Authentication
            </Button>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>This bypasses normal authentication due to database issues.</p>
              <p>Fix the database policies to restore normal auth flow.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <AdminSignIn />;
  }

  return <>{children}</>;
};

export default EmergencyAdminBypass;
