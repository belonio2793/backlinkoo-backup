import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthService, setupAuthStateListener } from '@/services/authService';
import { Mail, AlertCircle, Loader2, Shield, CheckCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface InstantEmailVerificationGuardProps {
  children: React.ReactNode;
}

export const InstantEmailVerificationGuard = ({ children }: InstantEmailVerificationGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const checkEmailVerificationInstantly = async () => {
      try {
        console.log('InstantEmailVerificationGuard: Instant auth check...');

        // Check if we're in development mode first
        const isDevelopment = window.location.hostname === 'localhost' ||
                             window.location.port === '8080' ||
                             process.env.NODE_ENV === 'development';

        if (isDevelopment) {
          console.log('InstantEmailVerificationGuard: Development mode - instant mock user');
          const mockUser = {
            id: 'dev-user-' + Date.now(),
            email: 'dev@example.com',
            email_confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: { first_name: 'Dev User' }
          } as any;

          setUser(mockUser);
          setIsEmailVerified(true);
          setAuthChecked(true);
          return;
        }

        // For production, instant session check
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.warn('InstantEmailVerificationGuard: Session error, redirecting to login:', error);
          navigate('/login');
          return;
        }

        if (!data.session?.user) {
          console.log('InstantEmailVerificationGuard: No user session found, redirecting to login');
          navigate('/login');
          return;
        }

        const user = data.session.user;
        setUser(user);

        // Check if email is verified
        const isVerified = user.email_confirmed_at !== null;
        setIsEmailVerified(isVerified);

        console.log('InstantEmailVerificationGuard: Instant auth successful:', {
          email: user.email,
          isVerified,
          userId: user.id
        });

        setAuthChecked(true);

      } catch (error: any) {
        console.error('InstantEmailVerificationGuard: Auth check failed:', error);

        if (!isMounted) return;

        // Always allow development access if auth fails
        const isDevelopment = window.location.hostname === 'localhost' ||
                             window.location.port === '8080';

        if (isDevelopment) {
          console.warn('InstantEmailVerificationGuard: Development fallback - instant mock user');
          const mockUser = {
            id: 'dev-fallback-' + Date.now(),
            email: 'dev-fallback@example.com',
            email_confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: { first_name: 'Dev User' }
          } as any;

          setUser(mockUser);
          setIsEmailVerified(true);
        } else {
          navigate('/login');
        }
        setAuthChecked(true);
      }
    };

    checkEmailVerificationInstantly();

    // Listen for auth state changes with error handling
    let subscription;
    try {
      const { data: { subscription: authSubscription } } = setupAuthStateListener(async (event, session) => {
        if (!isMounted) return;

        console.log('InstantEmailVerificationGuard: Auth state change:', { event, hasUser: !!session?.user });

        if (event === 'SIGNED_OUT' || !session) {
          navigate('/');
        } else if (session?.user) {
          setUser(session.user);

          const isVerified = session.user.email_confirmed_at !== null;
          setIsEmailVerified(isVerified);
          setAuthChecked(true);
        }
      });
      subscription = authSubscription;
    } catch (subscriptionError) {
      console.warn('InstantEmailVerificationGuard: Could not set up auth state listener:', subscriptionError);
      // Continue without the listener
    }

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('InstantEmailVerificationGuard: Error unsubscribing from auth changes:', error);
        }
      }
    };
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!user?.email || isResending) return;

    setIsResending(true);
    try {
      const result = await AuthService.resendConfirmation(user.email);

      if (result.success) {
        toast({
          title: "Verification email sent",
          description: "Please check your email and click the verification link. Check your spam folder if you don't see it.",
        });
      } else {
        if (result.error?.includes('already verified')) {
          toast({
            title: "Email already verified",
            description: "Your email is already confirmed. Please refresh the page.",
          });
          // Refresh the page to re-check verification status
          setTimeout(() => window.location.reload(), 2000);
        } else {
          toast({
            title: "Failed to resend",
            description: result.error || "Failed to resend verification email",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      navigate('/');
    }
  };

  // Don't render anything until auth is checked (prevents flash)
  if (!authChecked) {
    return null;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!isEmailVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Account access restricted</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a verification email to <strong>{user.email}</strong>.
                Please check your email and click the verification link to access your account.
              </p>
              <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                <p className="font-medium text-blue-800 mb-1">Why verify your email?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Secure your account</li>
                  <li>Access all platform features</li>
                  <li>Receive important updates</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full"
              >
                Sign out
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-2">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium mb-1">Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your spam/junk folder</li>
                  <li>Wait 2-3 minutes for delivery</li>
                  <li>Try resending using the button above</li>
                </ul>
              </div>
              <p className="text-green-700">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                Your account is created and secure
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
