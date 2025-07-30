import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import { TrialConversionService } from "@/services/trialConversionService";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  CheckCircle,
  Mail,
  Wifi
} from "lucide-react";

interface AuthFormTabsProps {
  onAuthSuccess?: (user: any) => void;
  showTrialUpgrade?: boolean;
  isCompact?: boolean;
  onForgotPassword?: () => void;
  className?: string;
  defaultTab?: "login" | "signup";
}

export function AuthFormTabs({
  onAuthSuccess,
  showTrialUpgrade = false,
  isCompact = false,
  onForgotPassword,
  className = "",
  defaultTab
}: AuthFormTabsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    defaultTab || (showTrialUpgrade ? "signup" : "login")
  );

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { toast } = useToast();

  // Reset retry attempts when switching tabs
  useEffect(() => {
    setRetryAttempts(0);
  }, [activeTab]);

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

  const testConnection = async () => {
    if (isTestingConnection) return;

    setIsTestingConnection(true);
    toast({
      title: "Testing Connection",
      description: "Checking authentication service connectivity...",
    });

    try {
      const { runAuthHealthCheck } = await import('@/utils/authHealthCheck');
      const healthResult = await runAuthHealthCheck();

      if (healthResult.overallHealth === 'good') {
        toast({
          title: "Connection Test Passed",
          description: "All authentication services are working properly.",
        });
      } else {
        toast({
          title: "Connection Issues Detected",
          description: healthResult.recommendations[0] || "Some authentication services may be slow or unavailable.",
          variant: "destructive"
        });
      }

      console.log('🔧 Connection test results:', healthResult);
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Test Failed",
        description: "Unable to run connectivity diagnostics.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    console.log('🔐 Login attempt with:', { email: loginEmail, hasPassword: !!loginPassword });

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

    // Show loading notification
    toast({
      title: "Signing you in...",
      description: "Please wait while we verify your credentials.",
    });

    // Start countdown timer (reduced for better UX)
    setTimeoutCountdown(25);
    const countdownInterval = setInterval(() => {
      setTimeoutCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      // Try multiple authentication methods with shorter timeouts
      let result;
      let authError;

      // Method 1: Quick AuthService attempt (15 seconds)
      try {
        console.log('🔐 Attempting quick AuthService login...');
        const quickSignInPromise = AuthService.signIn({
          email: loginEmail,
          password: loginPassword,
        });

        const quickTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Quick auth timeout')), 15000)
        );

        result = await Promise.race([quickSignInPromise, quickTimeoutPromise]) as any;
        console.log('✅ Quick auth successful');
      } catch (quickError: any) {
        console.warn('⚠️ Quick auth failed, trying direct Supabase...', quickError.message);
        authError = quickError;

        // Method 2: Direct Supabase authentication (fallback)
        try {
          console.log('🔐 Attempting direct Supabase login...');
          const { supabase } = await import('@/integrations/supabase/client');

          const directAuthPromise = supabase.auth.signInWithPassword({
            email: loginEmail.trim(),
            password: loginPassword
          });

          const directTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Direct auth timeout')), 20000) // Increased to 20 seconds
          );

          const directResult = await Promise.race([directAuthPromise, directTimeoutPromise]) as any;

          if (directResult.error) {
            throw new Error(directResult.error.message);
          }

          if (directResult.data?.user) {
            // Check email verification
            if (!directResult.data.user.email_confirmed_at) {
              throw new Error('Email verification required. Please check your email for a verification link.');
            }

            result = {
              success: true,
              user: directResult.data.user,
              session: directResult.data.session
            };
            console.log('✅ Direct Supabase auth successful');
          } else {
            throw new Error('No user data received');
          }
        } catch (directError: any) {
          console.error('❌ Direct Supabase auth failed:', directError.message);

          // Provide specific error messages based on the error type
          if (directError.message.includes('timeout') && authError?.message?.includes('timeout')) {
            throw new Error('Connection timeout. Please check your internet connection and try again later.');
          } else if (directError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials.');
          } else if (directError.message.includes('Email verification required')) {
            throw new Error('Email verification required. Please check your email for a verification link.');
          } else if (directError.message.includes('timeout')) {
            throw new Error('Authentication is taking longer than expected. Please try again.');
          } else {
            // Use the more specific error message
            throw new Error(directError.message || 'Authentication failed. Please try again.');
          }
        }
      }

      // Clear countdown on success
      clearInterval(countdownInterval);
      setTimeoutCountdown(0);

      if (result.success && result.user) {
        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${result.user.email}`,
        });

        onAuthSuccess?.(result.user);

        // Reset form and retry attempts
        setLoginEmail("");
        setLoginPassword("");
        setRetryAttempts(0);
      } else if (result.requiresEmailVerification) {
        toast({
          title: "Email verification required",
          description: "Please check your email and verify your account before signing in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign in failed",
          description: result.error || 'Invalid email or password. Please check your credentials and try again.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setTimeoutCountdown(0); // Clear countdown on error

      let errorMessage = "Authentication failed. Please try again.";
      let shouldRetry = false;

      // Categorize error types for better user feedback
      if (error.message?.includes('timeout') || error.message?.includes('taking longer than expected')) {
        // Timeout errors - offer retry
        setRetryAttempts(prev => prev + 1);

        if (retryAttempts < 2) {
          shouldRetry = true;
          errorMessage = `Connection timeout (attempt ${retryAttempts + 1}/3). Retrying automatically...`;
          toast({
            title: "Retrying sign in...",
            description: errorMessage,
          });

          // Auto-retry with longer delay
          setTimeout(() => {
            if (loginEmail && loginPassword) {
              handleLogin(e);
            }
          }, 3000);
          return;
        } else {
          errorMessage = "Connection keeps timing out. Please check your internet connection or try refreshing the page.";
        }
      } else if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid email or password')) {
        errorMessage = "Invalid email or password. Please check your credentials.";
        setRetryAttempts(0); // Reset retry attempts for credential errors
      } else if (error.message?.includes('Email verification required') || error.message?.includes('Email not confirmed')) {
        errorMessage = "Please verify your email address before signing in. Check your email for a verification link.";
        setRetryAttempts(0);
      } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage = "Network connection failed. Please check your internet connection and try again.";
      } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
      } else {
        // Generic error with the actual error message
        errorMessage = error.message || "An unexpected error occurred. Please try again.";
      }

      if (!shouldRetry) {
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      console.log('🔐 Login attempt completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validate email format
    if (!validateEmailFormat(signupEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(signupPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password requirements not met",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!firstName.trim()) {
      toast({
        title: "First name required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Show loading notification
    toast({
      title: showTrialUpgrade ? "Upgrading your trial..." : "Creating your account...",
      description: "Please wait while we set up your account.",
    });

    try {
      // Use trial conversion service if we're upgrading a trial
      if (showTrialUpgrade && TrialConversionService.hasConvertibleTrialPosts()) {
        const conversionResult = await TrialConversionService.convertTrialToAccount(
          signupEmail,
          signupPassword,
          firstName.trim()
        );

        if (conversionResult.success) {
          const convertedCount = conversionResult.convertedPosts || 0;
          toast({
            title: "Trial upgraded successfully!",
            description: convertedCount > 0
              ? `Your account is ready and ${convertedCount} trial post${convertedCount > 1 ? 's have' : ' has'} been converted to permanent.`
              : "Your account is ready! You can now create permanent backlinks.",
          });
          onAuthSuccess?.(conversionResult.user);
        } else {
          toast({
            title: "Upgrade failed",
            description: conversionResult.error || "Failed to upgrade trial account.",
            variant: "destructive",
          });
        }
      } else {
        // Regular signup
        const result = await AuthService.signUp({
          email: signupEmail.trim(),
          password: signupPassword,
          firstName: firstName.trim(),
        });

        if (result.success) {
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

          if (result.user?.email_confirmed_at) {
            onAuthSuccess?.(result.user);
          } else {
            // Auto-switch to login tab after successful signup
            setTimeout(() => {
              setActiveTab("login");
              setLoginEmail(signupEmail); // Pre-fill email for easy login
            }, 3000);
          }

        } else {
          let errorTitle = "Sign up failed";
          let errorMessage = result.error || "An error occurred during sign up.";

          if (result.error?.includes("already registered") || result.error?.includes("already exists")) {
            errorTitle = "Account already exists";
            errorMessage = "An account with this email already exists. Please try signing in instead.";
            setActiveTab("login");
            setLoginEmail(signupEmail);
          }

          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          });
        }
      }

      // Reset signup form
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setFirstName("");

    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputHeight = isCompact ? "h-9" : "";
  const spacingClass = isCompact ? "space-y-3" : "space-y-4";

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${className}`}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Sign In</TabsTrigger>
        <TabsTrigger value="signup">
          {showTrialUpgrade ? "Upgrade" : "Create Account"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleLogin} className={spacingClass}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="your@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={inputHeight}
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
                className={inputHeight}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute right-0 top-0 ${isCompact ? 'h-9 w-9' : 'h-full'} px-3 py-2 hover:bg-transparent`}
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
            className={`w-full ${inputHeight} ${isLoading ? 'bg-primary/80' : ''}`}
            disabled={isLoading || !loginEmail || !loginPassword}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {timeoutCountdown > 15 ?
                  `Signing in... (${timeoutCountdown}s)` :
                  timeoutCountdown > 5 ?
                    `Trying backup method... (${timeoutCountdown}s)` :
                    'Almost there...'}
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Sign In
              </>
            )}
          </Button>

          <div className="space-y-2">
            {onForgotPassword && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-muted-foreground"
                  onClick={onForgotPassword}
                >
                  Forgot your password?
                </Button>
              </div>
            )}

            {retryAttempts > 0 && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={testConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignup} className={spacingClass}>
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputHeight}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your@email.com"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className={inputHeight}
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
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={inputHeight}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute right-0 top-0 ${isCompact ? 'h-9 w-9' : 'h-full'} px-3 py-2 hover:bg-transparent`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isCompact && (
              <div className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputHeight}
              required
            />
          </div>

          <Button
            type="submit"
            className={`w-full ${inputHeight} ${isLoading ? 'bg-primary/80' : ''}`}
            disabled={isLoading || !signupEmail || !signupPassword || !confirmPassword || !firstName}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {showTrialUpgrade ? "Upgrading trial..." : "Creating account..."}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {showTrialUpgrade ? "Upgrade Trial" : "Create Account"}
              </>
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
