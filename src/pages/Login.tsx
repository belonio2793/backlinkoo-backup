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
import LoginDebugger from "@/components/LoginDebugger";

import { useNavigate } from "react-router-dom";
import { Infinity, Eye, EyeOff, Mail, RefreshCw, ArrowLeft, Bug } from "lucide-react";

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
  const [showDebugger, setShowDebugger] = useState(false);
  const { toast } = useToast();
  const { broadcastNewUser } = useGlobalNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔑 Starting login process...');
    console.log('Email:', loginEmail);
    console.log('Password length:', loginPassword?.length);

    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('⚠️ Cleanup sign out failed (continuing):', err);
      }

      console.log('🔍 Attempting Supabase sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ User authenticated:', data.user.id, data.user.email);
        console.log('📝 Session data:', data.session);

        // Wait a moment for session to be properly stored
        await new Promise(resolve => setTimeout(resolve, 100));
        // Ensure user has proper profile using migration service
        try {
          const migrationResult = await ProfileMigrationService.ensureUserProfile(
            data.user.id,
            data.user.email || loginEmail,
            data.user.user_metadata
          );

          if (!migrationResult.success) {
            console.warn('Profile migration failed, but continuing login:', migrationResult.error);
          }
        } catch (profileErr) {
          // Don't fail login if profile operations fail
          console.warn('Profile migration error, but continuing login:', profileErr);
        }

        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      // Handle different error types properly
      let errorMessage = 'An error occurred during sign in.';

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;

          // Handle specific authentication errors
          if (error.message.includes('fetch')) {
            errorMessage = 'Network connection failed. Please check your internet connection and try again.';
          } else if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
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
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
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
        // Handle various "user already exists" error messages
        if (error.message.includes('User already registered') ||
            error.message.includes('Email address already registered') ||
            error.message.includes('already been registered')) {
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
          return;
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

        // Send custom confirmation email via Resend directly
        try {
          const emailResult = await ResendEmailService.sendConfirmationEmail(email);

          if (emailResult.success) {
            console.log('Confirmation email sent successfully via Resend:', emailResult.emailId);

            toast({
              title: "Check your email!",
              description: "We've sent you a confirmation link via our secure email system. Please check your email and spam folder.",
            });
          } else {
            console.error('Failed to send confirmation email:', emailResult.error);

            toast({
              title: "Account created successfully!",
              description: "Your account has been created, but we couldn't send the confirmation email. Please contact support if needed.",
              variant: "destructive",
            });
          }
        } catch (emailError) {
          console.error('Email service error:', emailError);

          toast({
            title: "Account created!",
            description: "Your account has been created. If you don't receive a confirmation email, please try the resend option.",
          });
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
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);

    try {
      // Try Supabase resend first
      const { error: supabaseError } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `https://backlinkoo.com/auth/confirm`
        }
      });

      if (supabaseError) {
        console.log('Supabase resend failed, trying custom Resend service:', supabaseError.message);

        // Fallback to custom Resend email via Netlify function
        const confirmationLink = `https://backlinkoo.com/auth/confirm?email=${encodeURIComponent(resendEmail)}`;

        const emailResponse = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: resendEmail,
            subject: 'Confirm Your Backlink ��� Account',
            message: `Welcome to Backlink ∞!

Please confirm your email address by clicking the link below:

${confirmationLink}

If you didn't create an account with us, please ignore this email.

Best regards,
The Backlink ∞ Team`,
            from: 'Backlink ∞ <support@backlinkoo.com>'
          }),
        });

        const result = await emailResponse.json();

        if (!emailResponse.ok || !result.success) {
          throw new Error(result.error || 'Failed to send email via Resend');
        }

        toast({
          title: "Confirmation email sent!",
          description: "We've sent you a confirmation email via our backup system. Please check your email and spam folder.",
        });
      } else {
        toast({
          title: "Confirmation email sent!",
          description: "We've sent you a new confirmation link. Please check your email.",
        });
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
        {/* Back to Home Button and Debug Toggle */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          {window.location.hostname === 'localhost' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugger(!showDebugger)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug
            </Button>
          )}
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
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

        {/* Debug Panel */}
        {showDebugger && (
          <div className="mt-6">
            <LoginDebugger />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
