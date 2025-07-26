import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, LogOut } from 'lucide-react';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkEmailVerification();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session?.user) {
        checkEmailVerificationStatus(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkEmailVerification = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate('/login');
        return;
      }

      checkEmailVerificationStatus(user);
    } catch (error) {
      console.error('Error checking authentication:', error);
      navigate('/login');
    }
  };

  const checkEmailVerificationStatus = (user: any) => {
    setUserEmail(user.email || '');
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');

    // In development mode, bypass email verification to allow testing
    if (isDev) {
      console.log('🧪 Development mode: Bypassing email verification check');
      setIsEmailVerified(true);
      return;
    }

    // Check if email is confirmed
    if (user.email_confirmed_at) {
      setIsEmailVerified(true);
    } else {
      setIsEmailVerified(false);
      console.warn('🔐 Email not verified, blocking access to protected content');
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        if (isDev) {
          toast({
            title: "Development Mode",
            description: "Email verification is simulated in development. Use admin panel to test verification flow.",
          });
        } else {
          toast({
            title: "Resend failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        if (isDev) {
          toast({
            title: "Development Mode - Email Simulated",
            description: "In production, you would receive an actual verification email.",
          });
        } else {
          toast({
            title: "Verification email sent!",
            description: "Please check your email for the verification link.",
          });
        }
      }
    } catch (error: any) {
      if (isDev) {
        toast({
          title: "Development Mode",
          description: "Email verification is simulated. Use the admin panel to manage verification status.",
        });
      } else {
        toast({
          title: "Resend failed",
          description: error.message || "Failed to send verification email",
          variant: "destructive",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  // Loading state
  if (isEmailVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Email not verified - show verification required screen
  if (isEmailVerified === false) {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-orange-600">Email Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isDev && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  🧪 <strong>Development Mode:</strong> Email verification is simulated.
                  Use the admin dashboard to test verification flows.
                </p>
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Please verify your email address to access your account.
              </p>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to: <strong>{userEmail}</strong>
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification} 
                disabled={isResending}
                className="w-full"
                variant="default"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSignOut} 
                variant="outline"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            <div className="text-xs text-center text-muted-foreground">
              Check your spam folder if you don't see the email.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verified - render protected content
  return <>{children}</>;
}
