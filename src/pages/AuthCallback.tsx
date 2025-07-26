import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Infinity
} from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔐 OAuth callback page loaded');
        
        // Check for error parameters in URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth error from URL:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || error || 'OAuth authentication failed');
          return;
        }

        // Process the OAuth callback
        const result = await AuthService.handleOAuthCallback();

        if (result.success) {
          console.log('✅ OAuth callback processed successfully');
          setStatus('success');
          
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in with your social account.",
          });

          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          console.error('OAuth callback failed:', result.error);
          setStatus('error');
          setErrorMessage(result.error || 'Authentication failed');
        }

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during authentication');
      }
    };

    handleOAuthCallback();
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
              <h3 className="text-lg font-semibold">Completing sign in...</h3>
              <p className="text-muted-foreground mt-2">
                Please wait while we securely authenticate your account.
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
              <h3 className="text-lg font-semibold text-green-800">Welcome to Backlink ∞!</h3>
              <p className="text-muted-foreground mt-2">
                You have been successfully signed in. Redirecting to your dashboard...
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
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
              <h3 className="text-lg font-semibold text-red-800">Authentication failed</h3>
              <p className="text-muted-foreground mt-2">
                {errorMessage || 'We couldn\'t complete your sign in. Please try again.'}
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Try Again
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
          <p className="text-muted-foreground">Social Authentication</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Completing Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Secured by industry-standard OAuth 2.0 authentication</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
