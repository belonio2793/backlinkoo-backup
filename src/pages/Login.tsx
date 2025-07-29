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
          navigate('/my-dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Continue to login page on error
      }
    };

    checkAuth();

    // Listen for auth changes with better error handling
    const { data: { subscription } } = setupAuthStateListener((event, session) => {
      console.log('🔐 Auth state changed:', event, !!session);

      if (event === 'SIGNED_IN' && session && session.user) {
        console.log('🔐 Auth state change: redirecting to dashboard');
        setTimeout(() => navigate('/my-dashboard'), 100);
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 Auth state change: user signed out');
        // Stay on login page
      }
    });

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuthSuccess = (user: any) => {
    navigate('/my-dashboard');
  };

  const handleForgotPassword = async () => {
    if (isLoading) {
      console.log('Password reset already in progress, ignoring click');
      return;
    }

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
          description: "We've sent you a password reset link. Please check your email and spam folder.",
        });

        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast({
          title: "Password reset failed",
          description: result.error || "Failed to send password reset email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
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

        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Infinity className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" role="banner">Welcome Back</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !loginEmail || !loginPassword}
                    aria-label="Sign in to your account"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-muted-foreground"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot your password?
                    </Button>
                  </div>


                </form>

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
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
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
                    <div className="text-xs text-muted-foreground">
                      Password must be at least 8 characters with uppercase, lowercase, and numbers
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                  
                  {showResendConfirmation && (
                    <div className="mt-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 text-sm text-blue-800 mb-3">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">Account exists for: {resendEmail}</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        This email is already registered. If you haven't verified your account yet,
                        you can resend the confirmation email. Otherwise, try signing in.
                      </p>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="default"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={handleResendConfirmation}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {isLoading ? "Sending..." : "Resend Confirmation Email"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setShowResendConfirmation(false);
                            setLoginEmail(resendEmail);
                            setActiveTab("login");
                          }}
                        >
                          Go to Sign In Instead
                        </Button>
                      </div>
                    </div>
                  )}
                  

                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
