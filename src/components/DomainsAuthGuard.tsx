import React, { useState, useEffect } from 'react';
import { supabase, SupabaseConnectionFixer } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Lock, Globe } from 'lucide-react';
import SupabaseErrorRecovery from '@/components/SupabaseErrorRecovery';
import { useUserFlow } from '@/contexts/UserFlowContext';
import { LoginModal } from '@/components/LoginModal';

interface DomainsAuthGuardProps {
  children: React.ReactNode;
}

export const DomainsAuthGuard = ({ children }: DomainsAuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  const {
    showSignInModal,
    setShowSignInModal,
    setDefaultAuthTab
  } = useUserFlow();

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
    setConnectionError(null);

    try {
      console.log('🔍 Starting domains auth check...');

      // First check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection available');
      }

      // Use resilient auth operations with enhanced error handling
      let authResult;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`🔍 Auth attempt ${attempts}/${maxAttempts}...`);

          authResult = await supabase.auth.getUser();
          console.log('✅ Auth request successful');
          break;

        } catch (authError: any) {
          console.error(`❌ Auth attempt ${attempts} failed:`, authError.message);

          if (attempts >= maxAttempts) {
            throw authError;
          }

          // Wait before retrying
          const delay = Math.min(1000 * attempts, 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!authResult) {
        throw new Error('Failed to get auth result after all attempts');
      }

      const { data: { user }, error } = authResult;

      if (error) {
        console.error('❌ Auth error from Supabase:', error);

        // Handle specific auth errors gracefully
        if (error.message?.includes('Auth session missing')) {
          console.log('ℹ️ No active session (user not logged in)');
          setIsAuthenticated(false);
          setIsAuthorized(false);
          setUserEmail('');
          setIsLoading(false);
          return;
        }

        throw error;
      }

      if (!user) {
        console.log('ℹ️ No user found (not logged in)');
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail('');
        setIsLoading(false);
        return;
      }

      console.log('✅ User authenticated:', user.email);
      setIsAuthenticated(true);
      setUserEmail(user.email || '');

      // Check authorization
      const authorized = user.email === AUTHORIZED_EMAIL;
      setIsAuthorized(authorized);

      console.log(`🔐 Domains access check: ${user.email} -> ${authorized ? 'AUTHORIZED' : 'DENIED'}`);

    } catch (error: any) {
      console.error('❌ Domains auth check failed:', error);

      // Check if this is a network/connection error
      if (SupabaseConnectionFixer.isSupabaseNetworkError(error)) {
        console.warn('⚠️ Network error during domains auth check');
        setConnectionError(error);

        // Still allow fallback behavior
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail('');
      } else if (error.message?.includes('No internet connection')) {
        console.warn('⚠️ No internet connection available');
        setConnectionError(new Error('No internet connection. Please check your network and try again.'));
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail('');
      } else {
        console.error('❌ Unknown auth error:', error);
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setUserEmail('');
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 Domains auth check complete');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthSuccess = (user: any) => {
    console.log('🎯 DomainsAuthGuard: Auth success, staying on domains page');
    setShowSignInModal(false);
    // Force re-check auth status to update the guard state
    checkAuthStatus();
  };

  const handleSignInClick = () => {
    // Set intended route as backup in case user somehow gets to login page
    localStorage.setItem('intended_route', '/domains');
    setDefaultAuthTab('login');
    setShowSignInModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-600">Verifying domain access permissions...</span>
          </div>

          {connectionError && (
            <SupabaseErrorRecovery
              error={connectionError}
              onRecovery={() => {
                setConnectionError(null);
                checkAuthStatus();
              }}
              onRetry={checkAuthStatus}
              compact={true}
            />
          )}
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
                onClick={handleSignInClick}
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

  return (
    <>
      {children}

      {/* Login Modal for unauthenticated users */}
      <LoginModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab="login"
        pendingAction="domain management features"
      />
    </>
  );
};

export default DomainsAuthGuard;
