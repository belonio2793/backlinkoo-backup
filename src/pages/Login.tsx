import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { supabase } from "@/integrations/supabase/client";
import { ResendEmailService } from "@/services/resendEmailService";
import { ProfileMigrationService } from "@/services/profileMigrationService";
import { DevEmailVerificationHelper } from "@/components/DevEmailVerificationHelper";

import { useNavigate } from "react-router-dom";
import { Infinity, Eye, EyeOff, Mail, RefreshCw, ArrowLeft } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
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
  const { toast } = useToast();
  const { broadcastNewUser } = useGlobalNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Auth session check failed:', error);
          return;
        }

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, !!session);

      if (event === 'SIGNED_IN' && session && session.user) {
        console.log('🔐 Auth state change: redirecting to dashboard');
        setTimeout(() => navigate('/dashboard'), 100);
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 Auth state change: user signed out');
        // Stay on login page
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const cleanupAuthState = () => {
    try {
      // Only clear specific problematic keys, not all auth state
      const keysToRemove = [];

      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('sb-') && key.includes('token'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Failed to remove localStorage key:', key);
        }
      });

      console.log('🔐 Cleaned up auth state');
    } catch (error) {
      console.warn('Auth cleanup failed:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Starting login process for:', loginEmail);
      setDebugInfo(['Starting login process...']);

      // Clear any existing auth state first
      cleanupAuthState();
      setDebugInfo(prev => [...prev, 'Cleared auth state']);

      // Simple sign out without waiting
      supabase.auth.signOut({ scope: 'global' }).catch(() => {});

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      setDebugInfo(prev => [...prev, 'Cleaned up previous session']);

      console.log('🔐 Attempting sign in...');
      setDebugInfo(prev => [...prev, 'Calling Supabase signInWithPassword...']);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      setDebugInfo(prev => [...prev, `Sign in response received. Has data: ${!!data}, Has error: ${!!error}`]);

      if (error) {
        console.error('🔐 Sign in error:', error);
        throw error;
      }

      if (data.user && data.session) {
        console.log('🔐 Sign in successful:', data.user.id);
        setDebugInfo(prev => [...prev, `Login successful! User ID: ${data.user.id}`]);

        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          console.warn('🔐 Email not confirmed, blocking login');
          setDebugInfo(prev => [...prev, 'Email not confirmed - blocking access']);

          // Sign out the user immediately
          await supabase.auth.signOut();

          toast({
            title: "Email verification required",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive",
          });

          setShowResendConfirmation(true);
          setResendEmail(loginEmail);
          return;
        }

        // Profile migration in background - don't wait for it
        ProfileMigrationService.ensureUserProfile(
          data.user.id,
          data.user.email || loginEmail,
          data.user.user_metadata
        ).catch(err => {
          console.warn('Profile migration failed (non-blocking):', err);
        });

        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });

        setDebugInfo(prev => [...prev, 'Navigating to dashboard...']);

        // Use React Router navigation instead of window.location
        console.log('🔐 Redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        setDebugInfo(prev => [...prev, 'No user/session data in response']);
        throw new Error('No user data received from authentication');
      }
    } catch (error: any) {
      console.error('🔐 Login failed:', error);

      // Handle different error types properly
      let errorMessage = 'An error occurred during sign in.';

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;

          // Handle specific authentication errors
          if (error.message.includes('fetch') || error.message.includes('network')) {
            errorMessage = 'Network connection failed. Please check your internet connection and try again.';
          } else if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
            setShowResendConfirmation(true);
            setResendEmail(loginEmail);
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a moment and try again.';
          }
        } else if (error.error_description) {
          errorMessage = error.error_description;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setDebugInfo(prev => [...prev, `Login failed: ${errorMessage}`]);

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Show debug info in development
      if (window.location.hostname === 'localhost') {
        console.error('📝 Debug info:', debugInfo);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log('🆕 Starting signup process for:', email);
    setDebugInfo(prev => [...prev, 'Starting signup process...']);
    setIsLoading(true);

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
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      // Sign up and save both first_name and display_name for compatibility
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `https://backlinkoo.com/auth/confirm`,
          data: {
            first_name: firstName.trim(),
            display_name: firstName.trim()
          }
        }
      });

      if (error) {
        console.log('Signup error details:', error);

        // Handle various "user already exists" error messages
        // Check both message and error code for more reliable detection
        const errorMessage = error.message?.toLowerCase() || '';
        const isUserExists = errorMessage.includes('user already registered') ||
                            errorMessage.includes('email address already registered') ||
                            errorMessage.includes('already been registered') ||
                            errorMessage.includes('email already exists') ||
                            errorMessage.includes('user with this email already exists') ||
                            error.status === 422 || // Common status for user exists
                            error.code === 'user_already_exists';

        if (isUserExists) {
          console.log('User already exists, showing resend option');
          setDebugInfo(prev => [...prev, 'User already exists - showing resend options']);
          setResendEmail(email);
          setShowResendConfirmation(true);
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please check your email for confirmation or try signing in instead.",
          });
          // Switch to login tab automatically
          setTimeout(() => {
            const loginTab = document.querySelector('[value="login"]') as HTMLElement;
            if (loginTab) {
              loginTab.click();
            }
          }, 100);
          return; // finally block will reset loading state
        }
        throw error;
      }

      if (data.user) {
        console.log('Signup successful, user created:', data.user.id);

        // Ensure profile is created using migration service
        try {
          const migrationResult = await ProfileMigrationService.ensureUserProfile(
            data.user.id,
            email,
            { first_name: firstName.trim(), display_name: firstName.trim() }
          );

          if (!migrationResult.success) {
            console.warn('Could not create profile during signup:', migrationResult.error);
          }
        } catch (profileErr) {
          console.warn('Profile creation error during signup:', profileErr);
        }

        // Send custom confirmation email via Netlify function
        try {
          const emailResult = await ResendEmailService.sendConfirmationEmail(email);
          const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');

          if (emailResult.success) {
            console.log('Confirmation email sent successfully:', emailResult.emailId);

            if (isDev) {
              toast({
                title: "Account created! (Development Mode)",
                description: "Email verification is simulated in development. In production, you would receive an actual email. You can test the verification flow using the admin panel.",
              });
            } else {
              toast({
                title: "Check your email!",
                description: "We've sent you a confirmation link via our secure email system. Please check your email and spam folder.",
              });
            }
          } else {
            console.error('Failed to send confirmation email:', emailResult.error);

            if (isDev) {
              toast({
                title: "Account created! (Development Mode)",
                description: "Account created successfully. Email sending is simulated in development - you can test verification in the admin panel.",
              });
            } else {
              toast({
                title: "Account created with email issue",
                description: `Your account has been created, but we couldn't send the confirmation email: ${emailResult.error || 'Unknown error'}. Please use the resend option or contact support.`,
                variant: "destructive",
              });
            }
          }
        } catch (emailError: any) {
          console.error('Email service error:', emailError);
          const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');

          if (isDev) {
            toast({
              title: "Account created! (Development Mode)",
              description: "Account created successfully. Email system is in mock mode for development.",
            });
          } else {
            toast({
              title: "Account created with email issue",
              description: `Your account has been created. Email service error: ${emailError?.message || 'Unknown error'}. Please try the resend option.`,
              variant: "destructive",
            });
          }
        }

        // Broadcast new user notification globally
        setTimeout(() => {
          broadcastNewUser(firstName.trim());
        }, 1000);

        // Auto-switch to login tab after successful signup
        setTimeout(() => {
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          if (loginTab) {
            loginTab.click();
            setLoginEmail(email); // Pre-fill email for easy login
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      // Handle different error types properly
      let errorMessage = 'An error occurred during sign up.';
      let errorTitle = "Sign up failed";

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;

          // Provide more helpful error messages for common issues
          if (error.message.includes('Password should be')) {
            errorTitle = "Password requirements not met";
            errorMessage = "Password must be at least 6 characters long.";
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
      setDebugInfo(prev => [...prev, 'Signup process finished - resetting loading']);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `https://backlinkoo.com/auth/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent!",
        description: "Check your email for a link to reset your password.",
      });

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');

    try {
      // Try Supabase resend first
      const { error: supabaseError } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (supabaseError) {
        console.log('Supabase resend failed, trying custom email service:', supabaseError.message);

        // Fallback to custom email service
        const emailResult = await ResendEmailService.sendConfirmationEmail(resendEmail);

        if (emailResult.success) {
          if (isDev) {
            toast({
              title: "Confirmation email sent! (Development Mode)",
              description: "Email simulation completed. In production, you would receive an actual email.",
            });
          } else {
            toast({
              title: "Confirmation email sent!",
              description: "We've sent you a confirmation email via our backup system. Please check your email and spam folder.",
            });
          }
        } else {
          throw new Error(emailResult.error || 'Failed to send email via backup service');
        }
      } else {
        if (isDev) {
          toast({
            title: "Confirmation email sent! (Development Mode)",
            description: "Supabase email simulation completed. In production, you would receive an actual email.",
          });
        } else {
          toast({
            title: "Confirmation email sent!",
            description: "We've sent you a new confirmation link. Please check your email.",
          });
        }
      }

      setShowResendConfirmation(false);
    } catch (error: any) {
      console.error('Email sending error:', error);

      let errorMessage = 'Failed to send confirmation email. Please try again or contact support.';

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (typeof error.toString === 'function') {
          errorMessage = error.toString();
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // In development, provide more helpful error context
      if (isDev) {
        errorMessage = `Development Mode: ${errorMessage}. Email services are mocked for testing.`;
      }

      toast({
        title: "Failed to resend confirmation",
        description: errorMessage,
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
            <h1 className="text-2xl font-bold text-foreground">Backlink</h1>
          </div>
          <p className="text-muted-foreground">Powerful SEO & Backlink Management</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Debug info in development */}
                  {window.location.hostname === 'localhost' && debugInfo.length > 0 && (
                    <div className="p-3 bg-gray-100 rounded text-xs">
                      <div className="font-medium mb-1">Debug Info:</div>
                      {debugInfo.map((info, idx) => (
                        <div key={idx} className="text-gray-600">{idx + 1}. {info}</div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
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
                  <Button type="submit" className="w-full" disabled={isLoading || !loginEmail || !loginPassword}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
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
                  {/* Debug info in development */}
                  {window.location.hostname === 'localhost' && debugInfo.length > 0 && (
                    <div className="p-3 bg-gray-100 rounded text-xs">
                      <div className="font-medium mb-1">Debug Info:</div>
                      {debugInfo.map((info, idx) => (
                        <div key={idx} className="text-gray-600">{idx + 1}. {info}</div>
                      ))}
                    </div>
                  )}
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
                    <Label htmlFor="signup-email">Email</Label>
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
                    {isLoading ? "Creating account..." : "Create Account"}
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
                            const loginTab = document.querySelector('[value="login"]') as HTMLElement;
                            if (loginTab) {
                              loginTab.click();
                            }
                          }}
                        >
                          Go to Sign In Instead
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>You'll receive a confirmation email to verify your account</span>
                  </div>
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
