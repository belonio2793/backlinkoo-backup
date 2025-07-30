import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { AuthService, setupAuthStateListener } from "@/services/authService";
import { PurgeStorageButton } from "@/components/PurgeStorageButton";
import { AuthFormTabs } from "@/components/shared/AuthFormTabs";

import { useNavigate } from "react-router-dom";
import { Infinity, Mail, RefreshCw, ArrowLeft } from "lucide-react";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const { toast } = useToast();
  const { broadcastNewUser } = useGlobalNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { session } = await AuthService.getCurrentSession();

        if (session && session.user) {
          console.log('🔐 User already authenticated, redirecting...');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = setupAuthStateListener((event, session) => {
      console.log('🔐 Auth state changed:', event, !!session);

      if (event === 'SIGNED_IN' && session && session.user) {
        console.log('🔐 Auth state change: redirecting to dashboard');
        setTimeout(() => navigate('/dashboard'), 100);
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [navigate]);

  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuthSuccess = (user: any) => {
    navigate('/dashboard');
  };

  const handleForgotPassword = async () => {
    if (isLoading) return;

    if (!forgotPasswordEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmailFormat(forgotPasswordEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.resetPassword(forgotPasswordEmail.trim());

      if (result.success) {
        toast({
          title: "Password reset email sent!",
          description: "We've sent you a password reset link. Please check your email.",
        });

        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast({
          title: "Password reset failed",
          description: result.error || "Failed to send email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast({
        title: "Reset failed",
        description: "Unexpected error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <PurgeStorageButton
            variant="ghost"
            size="sm"
            showIcon={true}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Infinity className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" role="banner">Welcome Back</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <AuthFormTabs
              onAuthSuccess={handleAuthSuccess}
              onForgotPassword={() => setShowForgotPassword(true)}
            />

            {showForgotPassword && (
              <div className="mt-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 text-sm text-blue-800 mb-3">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Reset Password</span>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {isLoading ? "Sending..." : "Send Reset Email"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
