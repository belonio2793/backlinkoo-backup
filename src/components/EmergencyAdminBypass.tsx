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
    try {
      setIsLoading(true);
      setError(null);

      // Quick auth check with immediate timeout
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 2000)
      );

      const { data: { user }, error } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;

      if (error || !user) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Immediate bypass for support admin
      if (user.email === 'support@backlinkoo.com') {
        console.log('✅ Emergency admin bypass activated');
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      // Try profile check with very short timeout
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const profileTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 1000)
        );

        const { data: profile } = await Promise.race([
          profilePromise,
          profileTimeout
        ]) as any;

        setIsAdmin(profile?.role === 'admin');
      } catch (profileError) {
        console.warn('Profile check failed, showing emergency options');
        setError('Database connection issues detected');
        setShowEmergency(true);
        setIsAdmin(false);
      }

    } catch (error: any) {
      console.error('Auth check completely failed:', error);
      setError(error.message);
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
