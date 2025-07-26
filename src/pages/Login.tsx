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
import { ProfileMigrationService } from "@/services/profileMigrationService";
import { EmailService } from "@/services/emailService";

import { useNavigate } from "react-router-dom";
import { Infinity, Eye, EyeOff, Mail, RefreshCw, ArrowLeft, Shield, CheckCircle, AlertCircle } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("login");
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

  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    return { isValid: true, message: "Password strength is good" };
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

        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          console.warn('🔐 User email not verified, showing verification prompt');
          setShowResendConfirmation(true);
          setResendEmail(loginEmail);
          
          toast({
            title: "Email verification required",
            description: "Please verify your email address before signing in. Check your email for a verification link.",
            variant: "destructive",
          });

          // Sign out the user since they need to verify email first
          await supabase.auth.signOut();
          setIsLoading(false);
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
          } else if (error.message.includes('Email not confirmed') ||
                     error.message.includes('not verified') ||
                     error.message.includes('confirmation')) {
            errorMessage = 'Your email address needs to be verified. Please check your email for a confirmation link.';
            setShowResendConfirmation(true);
            setResendEmail(loginEmail);

            // Provide additional guidance
            setTimeout(() => {
              toast({
                title: "Need to verify your email?",
                description: "Click the 'Resend Confirmation Email' button below if you need a new verification link.",
              });
            }, 3000);
          } else if (error.message.includes('Too many requests') || error.message.includes('rate limit')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
          } else if (error.message.includes('account') && error.message.includes('disabled')) {
            errorMessage = 'Your account has been disabled. Please contact support for assistance.';
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

    if (isLoading) {
      console.log('Signup already in progress, ignoring submit');
      return;
    }

    console.log('🆕 Starting signup process for:', email);
    setDebugInfo(prev => [...prev, 'Starting signup process...']);
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
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      // Sign up with email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            first_name: firstName.trim(),
            display_name: firstName.trim()
          }
        }
      });

      if (error) {
        console.log('Signup error details:', error);

        // Handle various "user already exists" error messages
        const errorMessage = error.message?.toLowerCase() || '';
        const isUserExists = errorMessage.includes('user already registered') ||
                            errorMessage.includes('email address already registered') ||
                            errorMessage.includes('already been registered') ||
                            errorMessage.includes('email already exists') ||
                            errorMessage.includes('user with this email already exists') ||
                            error.status === 422 ||
                            error.code === 'user_already_exists';

        if (isUserExists) {
          console.log('User already exists, checking verification status');
          setDebugInfo(prev => [...prev, 'User already exists - checking verification status']);

          // Try to determine if user needs email verification
          try {
            const { error: testResendError } = await supabase.auth.resend({
              type: 'signup',
              email: email.trim(),
              options: {
                emailRedirectTo: `${window.location.origin}/auth/confirm`
              }
            });

            if (testResendError) {
              if (testResendError.message.includes('already confirmed') ||
                  testResendError.message.includes('verified')) {
                // User is already verified
                console.log('User is already verified');
                setIsLoading(false);
                toast({
                  title: "Account Already Verified",
                  description: "This email is already registered and verified. Please try signing in with your password.",
                });
                // Switch to login tab and pre-fill email
                setTimeout(() => {
                  setActiveTab("login");
                  setLoginEmail(email);
                }, 100);
                return;
              } else {
                // Other error, treat as unverified
                console.log('User exists but verification status unclear');
              }
            } else {
              // Resend successful, means user needs verification
              console.log('User exists and needs email verification');
              toast({
                title: "Verification Email Sent",
                description: "This email is already registered but not verified. We've sent you a new confirmation link.",
              });
            }
          } catch (statusError) {
            console.log('Could not determine verification status');
          }

          // Show resend options for unverified users
          setResendEmail(email);
          setShowResendConfirmation(true);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (data.user) {
        console.log('✅ Signup successful, user created:', data.user.id);

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

        // Check if email was sent and provide appropriate feedback
        if (data.user.email_confirmed_at) {
          // User is already confirmed (shouldn't happen for new signups)
          console.log('🎉 User email already confirmed');
          toast({
            title: "Account created and verified!",
            description: "Your account has been created and your email is already verified. You can now sign in.",
          });
        } else {
          // Email confirmation needed - Supabase will send via configured SMTP
          console.log('📧 Confirmation email will be sent via Supabase SMTP');
          
          // Send additional confirmation email via our custom service for better UX
          try {
            await EmailService.sendConfirmationEmail(
              email,
              `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`
            );
            console.log('✅ Additional confirmation email sent via custom service');
          } catch (emailError) {
            console.warn('Custom confirmation email failed (non-blocking):', emailError);
          }

          toast({
            title: "Account created! Check your email",
            description: "We've sent you a confirmation link to verify your account. Please check your email and spam folder.",
          });

          // Show additional help for email confirmation
          setTimeout(() => {
            toast({
              title: "Email not received?",
              description: "Check your spam folder or use the resend button below if needed.",
            });
          }, 10000);
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
      setDebugInfo(prev => [...prev, 'Signup process finished - resetting loading']);
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
      console.log('🔑 Requesting password reset for:', forgotPasswordEmail);

      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent via Supabase SMTP');

      // Send additional password reset email via our custom service for better UX
      try {
        await EmailService.sendPasswordResetEmail(
          forgotPasswordEmail.trim(),
          `${window.location.origin}/auth/reset-password?email=${encodeURIComponent(forgotPasswordEmail)}`
        );
        console.log('✅ Additional password reset email sent via custom service');
      } catch (emailError) {
        console.warn('Custom password reset email failed (non-blocking):', emailError);
      }

      toast({
        title: "Password reset email sent!",
        description: "We've sent you a password reset link. Please check your email and spam folder.",
      });

      // Provide additional guidance
      setTimeout(() => {
        toast({
          title: "Email not received?",
          description: "The email may take a few minutes to arrive. Check your spam folder or try again.",
        });
      }, 8000);

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      console.error('Password reset failed:', error);

      let errorMessage = "Failed to send password reset email. Please try again.";

      if (error.message) {
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          errorMessage = "Too many password reset attempts. Please wait a few minutes before trying again.";
        } else if (error.message.includes('not found') || error.message.includes('invalid email')) {
          errorMessage = "This email address is not registered with us. Please check the email or create a new account.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Password reset failed",
        description: errorMessage,
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
      console.log('📧 Resending confirmation email for:', resendEmail);

      // Use Supabase resend (will use configured SMTP settings)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        console.error('Supabase resend error:', error);

        // Handle specific resend errors
        if (error.message.includes('already confirmed') || error.message.includes('verified')) {
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
          return;
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          throw new Error('Too many email requests. Please wait a few minutes before trying again.');
        } else {
          throw new Error(error.message);
        }
      }

      console.log('✅ Confirmation email resent via Supabase SMTP');

      // Send additional confirmation email via our custom service for better UX
      try {
        await EmailService.sendConfirmationEmail(
          resendEmail.trim(),
          `${window.location.origin}/auth/confirm?email=${encodeURIComponent(resendEmail)}`
        );
        console.log('✅ Additional confirmation email sent via custom service');
      } catch (emailError) {
        console.warn('Custom confirmation email failed (non-blocking):', emailError);
      }

      toast({
        title: "Confirmation email sent!",
        description: "We've sent you a new confirmation link. Please check your email and spam folder.",
      });

      // Provide additional guidance after successful resend
      setTimeout(() => {
        toast({
          title: "Still waiting for the email?",
          description: "Emails typically arrive within 2-3 minutes. Check your spam folder if you don't see it.",
        });
      }, 10000);

      setShowResendConfirmation(false);
    } catch (error: any) {
      console.error('Resend confirmation error:', error);

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
            <h1 className="text-2xl font-bold text-foreground">Backlink ∞</h1>
          </div>
          <p className="text-muted-foreground">Professional SEO & Backlink Management</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Backlink ∞</CardTitle>
            <CardDescription>Sign in to your account or create a new one to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  
                  <Button type="submit" className="w-full" disabled={isLoading || !loginEmail || !loginPassword}>
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

                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Email verification is required before you can sign in</span>
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
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>You'll receive a confirmation email to verify your account</span>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Separator className="my-6" />
        
        <div className="text-center text-xs text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
