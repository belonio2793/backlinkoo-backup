import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { AuthService, setupAuthStateListener } from "@/services/authService";
import { PurgeStorageButton } from "@/components/PurgeStorageButton";

import { useNavigate } from "react-router-dom";
import { Infinity, Eye, EyeOff, Mail, RefreshCw, ArrowLeft, Shield, CheckCircle } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [activeTab, setActiveTab] = useState("login");
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
        // Continue to login page on error
      }
    };

    checkAuth();

    // Listen for auth changes with better error handling
    const { data: { subscription } } = setupAuthStateListener((event, session) => {
      console.log('🔐 Auth state changed:', event, !!session);

      if (event === 'SIGNED_IN' && session && session.user) {
        console.log('🔐 Auth state change: redirecting to dashboard');
        setTimeout(() => navigate('/dashboard'), 100);
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

  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 6) {
      return { isValid: false, message: "Password must be at least 6 characters long" };
    }
    return { isValid: true, message: "Password is valid" };
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLoading) {
      console.log('Login already in progress, ignoring submit');
      return;
    }

    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmailFormat(loginEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);


    try {
      const result = await AuthService.signIn({
        email: loginEmail,
        password: loginPassword
      });



      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });

        // Navigate immediately but also let auth state listener work
        setTimeout(() => {
          setIsLoading(false);
          navigate('/dashboard');
        }, 100);
        return;
      } else {
        if (result.requiresEmailVerification) {
          setShowResendConfirmation(true);
          setResendEmail(loginEmail);


        }



        toast({
          title: "Sign in failed",
          description: result.error || 'An error occurred during sign in.',
          variant: "destructive",
        });
      }


    } catch (error: any) {
      console.error('🔐 Login exception:', error);


      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (isLoading) {
      console.log('Signup already in progress, ignoring submit');
      return;
    }

    console.log('🆕 Starting signup process for:', email);

    setIsLoading(true);

    // Validate email format
    if (!validateEmailFormat(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!firstName.trim()) {
      toast({
        title: "First name required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await AuthService.signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim()
      });



      if (result.success) {
        console.log('Signup successful');

        if (result.requiresEmailVerification) {
          toast({
            title: "Account created! Check your email",
            description: "We've sent you a confirmation link to verify your account. Please check your email and spam folder.",
          });


        } else {
          toast({
            title: "Account created and verified!",
            description: "Your account has been created and your email is already verified. You can now sign in.",
          });
        }

        // Broadcast new user notification globally
        setTimeout(() => {
          broadcastNewUser(firstName.trim());
        }, 1000);

        // Auto-switch to login tab after successful signup
        setTimeout(() => {
          setActiveTab("login");
          setLoginEmail(email); // Pre-fill email for easy login
        }, 5000);
      } else {
        // Handle signup errors
        const errorMessage = result.error || 'An error occurred during sign up.';

        // Check if user already exists and handle appropriately
        if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
          // Try to determine if user needs email verification
          try {
            const resendResult = await AuthService.resendConfirmation(email.trim());

            if (resendResult.success) {
              toast({
                title: "Verification Email Sent",
                description: "This email is already registered but not verified. We've sent you a new confirmation link.",
              });
              setResendEmail(email);
              setShowResendConfirmation(true);
            } else if (resendResult.error?.includes('already verified')) {
              toast({
                title: "Account Already Verified",
                description: "This email is already registered and verified. Please try signing in with your password.",
              });
              setTimeout(() => {
                setActiveTab("login");
                setLoginEmail(email);
              }, 100);
            }
          } catch (resendError) {
            console.log('Could not determine verification status');
            setResendEmail(email);
            setShowResendConfirmation(true);
          }
        } else {
          let errorTitle = "Sign up failed";

          if (errorMessage.includes('Password should be')) {
            errorTitle = "Password requirements not met";
          } else if (errorMessage.includes('Invalid email')) {
            errorTitle = "Invalid email address";
          }

          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      let errorMessage = 'An error occurred during sign up.';
      let errorTitle = "Sign up failed";

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;

          if (error.message.includes('Password should be')) {
            errorTitle = "Password requirements not met";
            errorMessage = "Password must be at least 8 characters long with uppercase, lowercase, and numbers.";
          } else if (error.message.includes('Invalid email')) {
            errorTitle = "Invalid email address";
            errorMessage = "Please enter a valid email address.";
          } else if (error.message.includes('User already registered')) {
            errorTitle = "Account already exists";
            errorMessage = "An account with this email already exists. Please try signing in instead.";
          }
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (typeof error.toString === 'function') {
          errorMessage = error.toString();
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🆕 Signup process finished, resetting loading state');

      setIsLoading(false);
    }
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

  const handleResendConfirmation = async () => {
    if (isLoading) {
      console.log('Resend already in progress, ignoring click');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.resendConfirmation(resendEmail.trim());

      if (result.success) {
        toast({
          title: "Confirmation email sent!",
          description: "We've sent you a new confirmation link. Please check your email and spam folder.",
        });



        setShowResendConfirmation(false);
      } else {
        const errorMessage = result.error || 'Failed to send confirmation email.';

        if (errorMessage.includes('already verified')) {
          toast({
            title: "Email already verified!",
            description: "Your email address is already confirmed. You can now sign in to your account.",
          });
          setShowResendConfirmation(false);
          // Switch to login tab
          setTimeout(() => {
            setActiveTab("login");
            setLoginEmail(resendEmail);
          }, 100);
        } else {
          toast({
            title: "Failed to resend confirmation",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Resend confirmation exception:', error);
      toast({
        title: "Failed to resend confirmation",
        description: "An unexpected error occurred. Please try again or contact support.",
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
