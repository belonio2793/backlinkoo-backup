import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthService } from '@/services/authService';
import { EmailService } from '@/services/emailService';
import { ProfileMigrationService } from '@/services/profileMigrationService';
import { 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  RefreshCw, 
  Loader2, 
  ArrowLeft,
  Infinity
} from 'lucide-react';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('🔐 Email confirmation page loaded');
        
        // Get token and type from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const email = searchParams.get('email');
        
        if (email) {
          setUserEmail(email);
        }

        console.log('📧 Confirmation parameters:', { hasToken: !!token, type, email });

        if (!token || !type) {
          console.warn('Missing confirmation parameters');
          setStatus('error');
          setErrorMessage('Invalid confirmation link. Please check the link from your email.');
          return;
        }

        // Handle different confirmation types
        if (type === 'signup') {
          console.log('🆕 Processing signup confirmation...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });

          if (error) {
            console.error('Email verification error:', error);
            
            // Handle specific error cases
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              setStatus('resend');
              setErrorMessage('Your confirmation link has expired. Please request a new one.');
            } else if (error.message.includes('already confirmed')) {
              console.log('Email already confirmed, redirecting to login');
              toast({
                title: "Email already verified",
                description: "Your email is already confirmed. You can now sign in.",
              });
              setTimeout(() => navigate('/login'), 2000);
              return;
            } else {
              setStatus('error');
              setErrorMessage(error.message || 'Failed to verify email. Please try again.');
            }
            return;
          }

          if (data.user) {
            console.log('✅ Email verification successful:', data.user.id);
            
            // Ensure user profile exists
            try {
              const migrationResult = await ProfileMigrationService.ensureUserProfile(
                data.user.id,
                data.user.email || email || '',
                data.user.user_metadata
              );
              
              if (migrationResult.success) {
                console.log('✅ User profile created/verified');
              } else {
                console.warn('Profile migration warning:', migrationResult.error);
              }
            } catch (profileError) {
              console.warn('Profile creation error (non-blocking):', profileError.message || profileError);
            }

            // Send welcome email
            try {
              await EmailService.sendWelcomeEmail(
                data.user.email || email || '',
                data.user.user_metadata?.first_name || data.user.user_metadata?.display_name
              );
              console.log('✅ Welcome email sent');
            } catch (emailError) {
              console.warn('Welcome email failed (non-blocking):', emailError);
            }

            setStatus('success');
            toast({
              title: "Email verified successfully!",
              description: "Your account is now active. Redirecting to login...",
            });

            // Redirect to login after a brief delay
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          } else {
            setStatus('error');
            setErrorMessage('Verification completed but no user data received.');
          }
        } else if (type === 'recovery') {
          console.log('🔑 Processing password reset confirmation...');
          
          // For password reset, we need to redirect to the reset password page
          // The token will be handled there
          navigate(`/auth/reset-password?token=${token}&type=${type}`);
        } else {
          console.warn('Unknown confirmation type:', type);
          setStatus('error');
          setErrorMessage('Unknown confirmation type. Please contact support.');
        }

      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again or contact support.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  const handleResendConfirmation = async () => {
    if (!userEmail || isResending) return;

    setIsResending(true);
    try {
      console.log('📧 Resending confirmation email to:', userEmail);

      // Use AuthService to resend confirmation
      const result = await AuthService.resendConfirmation(userEmail);

      if (!result.success) {
        console.error('AuthService resend error:', result.error);
        throw new Error(result.error || 'Failed to resend confirmation');
      }

      // Send additional confirmation email via our custom service
      try {
        await EmailService.sendConfirmationEmail(
          userEmail,
          `${window.location.origin}/auth/confirm?email=${encodeURIComponent(userEmail)}`
        );
        console.log('✅ Additional confirmation email sent via custom service');
      } catch (emailError) {
        console.warn('Custom confirmation email failed (non-blocking):', emailError);
      }

      toast({
        title: "Confirmation email sent!",
        description: "Please check your email for a new verification link.",
      });

      setStatus('loading');
      setErrorMessage('');
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      
      let errorMsg = 'Failed to resend confirmation email.';
      if (error.message?.includes('rate limit')) {
        errorMsg = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('already confirmed')) {
        errorMsg = 'Your email is already verified. You can sign in now.';
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      toast({
        title: "Failed to resend",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Verifying your email...</h3>
              <p className="text-muted-foreground mt-2">
                Please wait while we confirm your email address.
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Email verified successfully!</h3>
              <p className="text-muted-foreground mt-2">
                Your account is now active and ready to use. You'll be redirected to the login page shortly.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </div>
        );

      case 'resend':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-800">Confirmation link expired</h3>
              <p className="text-muted-foreground mt-2">
                {errorMessage || 'Your confirmation link has expired. Please request a new one.'}
              </p>
              {userEmail && (
                <p className="text-sm text-muted-foreground mt-1">
                  We'll send a new confirmation link to: <strong>{userEmail}</strong>
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleResendConfirmation} 
                disabled={isResending || !userEmail}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send New Confirmation Email
                  </>
                )}
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Verification failed</h3>
              <p className="text-muted-foreground mt-2">
                {errorMessage || 'We couldn\'t verify your email address. Please try again.'}
              </p>
            </div>
            <div className="space-y-3">
              {userEmail && (
                <Button 
                  onClick={handleResendConfirmation} 
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Request New Confirmation Email
                    </>
                  )}
                </Button>
              )}
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Back to Login
              </Button>
              <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
                Back to Home
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Infinity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Backlink ∞</h1>
          </div>
          <p className="text-muted-foreground">Email Verification</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Email Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Having trouble? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
