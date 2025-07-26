import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export const EmailVerificationGuard = ({ children }: EmailVerificationGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }

        setUser(session.user);
        
        // Check if email is verified
        const isVerified = session.user.email_confirmed_at !== null;
        setIsEmailVerified(isVerified);
        
        console.log('Email verification status:', {
          email: session.user.email,
          confirmed_at: session.user.email_confirmed_at,
          isVerified
        });
      } catch (error) {
        console.error('Email verification check error:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkEmailVerification();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      } else if (session?.user) {
        setUser(session.user);
        const isVerified = session.user.email_confirmed_at !== null;
        setIsEmailVerified(isVerified);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!user?.email || isResending) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        console.error('Resend verification error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to resend verification email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Please check your email and click the verification link",
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
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
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Verify your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Email verification required</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a verification email to <strong>{user.email}</strong>. 
                Please check your email and click the verification link to continue.
              </p>
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

            <div className="text-xs text-muted-foreground text-center">
              <p>Didn't receive the email? Check your spam folder or try resending.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
