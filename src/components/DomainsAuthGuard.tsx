import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Lock, Globe } from 'lucide-react';

interface DomainsAuthGuardProps {
  children: React.ReactNode;
}

export const DomainsAuthGuard = ({ children }: DomainsAuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  const AUTHORIZED_EMAIL = 'support@backlinkoo.com';

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Domains auth state changed:', event);
      checkAuthStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail('');
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(user.email || '');

      // For development: Allow any authenticated user access to domain management
      // In production: Check if user email matches authorized email
      const authorized = true; // user.email === AUTHORIZED_EMAIL;
      setIsAuthorized(authorized);

      console.log(`🔐 Domains access check: ${user.email} -> ${authorized ? 'AUTHORIZED' : 'DENIED'}`);

    } catch (error) {
      console.error('Domains auth check failed:', error);
      setIsAuthenticated(false);
      setIsAuthorized(false);
      setUserEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-600">Verifying domain access permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Domain Management Access
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Please sign in to access domain management features
            </p>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Domain management is restricted to authorized personnel only.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
            <p className="text-gray-600 mt-2">
              You are not authorized to access domain management
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p><strong>Current user:</strong> {userEmail}</p>
                  <p><strong>Required access level:</strong> Support Team</p>
                  <p><strong>Authorized email:</strong> {AUTHORIZED_EMAIL}</p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out & Switch Account
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>
                Need access? Contact your administrator or sign in with an authorized account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default DomainsAuthGuard;
