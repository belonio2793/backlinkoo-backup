import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { 
  RotateCcw, 
  Mail, 
  Key, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  User,
  Trash
} from 'lucide-react';

export function AuthRecoveryHelper() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendPasswordReset = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.resetPassword(email);
      
      if (result.success) {
        toast({
          title: "Password reset sent",
          description: "Check your email for password reset instructions.",
        });
      } else {
        toast({
          title: "Reset failed",
          description: result.error || "Failed to send password reset email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Reset error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.resendConfirmation(email);
      
      if (result.success) {
        toast({
          title: "Confirmation sent",
          description: "Check your email for the confirmation link.",
        });
      } else {
        toast({
          title: "Resend failed",
          description: result.error || "Failed to resend confirmation email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Resend error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthState = async () => {
    setIsLoading(true);
    try {
      // Sign out and clear all auth state
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear localStorage auth-related items
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      toast({
        title: "Auth state cleared",
        description: "All authentication data has been cleared. Try signing in again.",
      });
    } catch (error: any) {
      toast({
        title: "Clear failed",
        description: error.message || "Failed to clear authentication state.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        toast({
          title: "Refresh failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Session refreshed",
          description: "Your authentication session has been refreshed.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Refresh error",
        description: error.message || "Failed to refresh session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailStatus = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Try to initiate password reset to check if email exists
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        if (error.message.includes('User not found')) {
          toast({
            title: "Email not found",
            description: "No account exists with this email address.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Email found",
          description: "An account exists with this email address.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Check error",
        description: error.message || "Failed to check email status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Authentication Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Use these tools to recover from authentication issues. These actions are safe and won't damage your account.
          </AlertDescription>
        </Alert>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email Address</Label>
          <Input
            id="recovery-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Recovery Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Recovery Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={sendPasswordReset}
              disabled={isLoading || !email}
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <Key className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Reset Password</div>
                <div className="text-xs text-muted-foreground">Send reset email</div>
              </div>
            </Button>

            <Button 
              onClick={resendEmailConfirmation}
              disabled={isLoading || !email}
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <Mail className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Resend Confirmation</div>
                <div className="text-xs text-muted-foreground">Verify email again</div>
              </div>
            </Button>

            <Button 
              onClick={checkEmailStatus}
              disabled={isLoading || !email}
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <User className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Check Email</div>
                <div className="text-xs text-muted-foreground">Verify account exists</div>
              </div>
            </Button>

            <Button 
              onClick={refreshSession}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <RefreshCw className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Refresh Session</div>
                <div className="text-xs text-muted-foreground">Update auth token</div>
              </div>
            </Button>
          </div>

          {/* Clear Auth State - Separate and More Prominent */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2 text-orange-600">Nuclear Option</h4>
            <Button 
              onClick={clearAuthState}
              disabled={isLoading}
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Clear All Auth Data
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              This will sign you out and clear all authentication data from your browser.
            </p>
          </div>
        </div>

        {/* Common Issues */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Common Issues & Solutions</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>"Invalid login credentials":</strong> Check email spelling and password. Try password reset if unsure.
            </li>
            <li>
              <strong>"Email not confirmed":</strong> Check your email (including spam) for confirmation link. Use "Resend Confirmation" if needed.
            </li>
            <li>
              <strong>"Session expired":</strong> Use "Refresh Session" or sign out and sign in again.
            </li>
            <li>
              <strong>"User not found":</strong> The email might not be registered. Try creating a new account.
            </li>
            <li>
              <strong>Stuck in loading state:</strong> Use "Clear All Auth Data" to reset everything.
            </li>
          </ul>
        </div>

        {/* Success Tips */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro tip:</strong> After any recovery action, wait a moment before trying to sign in again. 
            Email delivery can take a few minutes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default AuthRecoveryHelper;
