import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Infinity,
  Mail
} from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('📧 Email confirmation page loaded');
        
        // Check for error parameters in URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Email confirmation error from URL:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || error || 'Email confirmation failed');
          return;
        }

        // Check for confirmation success
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        if (type === 'signup' || (accessToken && refreshToken)) {
          console.log('✅ Email confirmation successful');
          setStatus('success');
          
          toast({
            title: "Email Verified!",
            description: "Your email has been verified successfully. You can now sign in to your account.",
          });

          // Redirect to login after a brief delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          console.warn('Email confirmation - no valid parameters found');
          setStatus('error');
          setErrorMessage('Invalid confirmation link. Please try again or request a new confirmation email.');
        }

      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during email verification');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, toast]);

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
              <h3 className="text-lg font-semibold text-green-800">Email Verified Successfully!</h3>
              <p className="text-muted-foreground mt-2">
                Your email has been confirmed. You can now sign in to your account.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Sign In to Your Account
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
              <h3 className="text-lg font-semibold text-red-800">Email Verification Failed</h3>
              <p className="text-muted-foreground mt-2">
                {errorMessage || 'We couldn\'t verify your email. The link may be expired or invalid.'}
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Sign In
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
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
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            Email Verification
          </p>
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
          <p>Secure email verification system</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
