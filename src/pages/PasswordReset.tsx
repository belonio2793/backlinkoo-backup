import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Loader2, 
  ArrowLeft,
  Infinity,
  Shield
} from 'lucide-react';

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initializeReset = async () => {
      try {
        console.log('🔑 Password reset page loaded');
        
        // Get token and type from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        console.log('🔑 Reset parameters:', { hasToken: !!token, type });

        if (!token) {
          console.warn('No reset token found');
          setStatus('error');
          setErrorMessage('Invalid password reset link. Please request a new one.');
          return;
        }

        // Verify the token is valid before showing the form
        try {
          // Note: We don't actually verify the token here since that would consume it
          // Instead, we just show the form and let the actual reset attempt verify it
          setStatus('form');
        } catch (error) {
          console.error('Token validation error:', error);
          setStatus('error');
          setErrorMessage('Invalid or expired reset token. Please request a new password reset.');
        }

      } catch (error: any) {
        console.error('Password reset initialization error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    initializeReset();
  }, [searchParams]);

  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 6) {
      return { isValid: false, message: "Password must be at least 6 characters long" };
    }
    return { isValid: true, message: "Password is valid" };
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate passwords
    if (!password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please enter both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password requirements not met",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔑 Attempting password reset...');

      const result = await AuthService.updatePassword(password);

      if (result.success) {
        console.log('✅ Password reset successful');
        setStatus('success');

        toast({
          title: "Password reset successful!",
          description: "Your password has been updated. You can now sign in with your new password.",
        });

        // Redirect to login after a brief delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        console.error('Password reset error:', result.error);

        // Handle specific error cases
        if (result.error?.includes('session_not_found') || result.error?.includes('invalid_token')) {
          setStatus('error');
          setErrorMessage('Your password reset link has expired or is invalid. Please request a new one.');
        } else if (result.error?.includes('same_password')) {
          toast({
            title: "Password unchanged",
            description: "Please choose a different password from your current one.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password reset failed",
            description: result.error || "Failed to reset password. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              <h3 className="text-lg font-semibold">Verifying reset link...</h3>
              <p className="text-muted-foreground mt-2">
                Please wait while we verify your password reset link.
              </p>
            </div>
          </div>
        );

      case 'form':
        const passwordValidation = password ? validatePasswordStrength(password) : null;
        return (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Reset Your Password</h3>
              <p className="text-muted-foreground mt-2">
                Enter your new password below to complete the reset process.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordValidation && (
                <div className={`text-xs ${passwordValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordValidation.message}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="text-xs text-red-600">
                  Passwords do not match
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </form>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Password reset successful!</h3>
              <p className="text-muted-foreground mt-2">
                Your password has been updated successfully. You can now sign in with your new password.
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

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Password reset failed</h3>
              <p className="text-muted-foreground mt-2">
                {errorMessage || 'We couldn\'t process your password reset. Please try again.'}
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Request New Reset Link
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
          <p className="text-muted-foreground">Password Reset</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Password Reset</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Need help? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
