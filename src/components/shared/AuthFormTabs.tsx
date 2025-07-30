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
  Mail
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

    try {
      // Add timeout to prevent infinite loading (increased to 30 seconds)
      const signInPromise = AuthService.signIn({
        email: loginEmail,
        password: loginPassword,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign in is taking longer than expected. Please check your internet connection and try again.')), 30000)
      );

      const result = await Promise.race([signInPromise, timeoutPromise]) as any;

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

      let errorMessage = "Network error or server unavailable. Please check your connection and try again.";
      const isTimeoutError = error.message.includes('Sign in is taking longer than expected') || error.message === 'Sign in timeout';

      if (isTimeoutError) {
        setRetryAttempts(prev => prev + 1);

        if (retryAttempts < 2) {
          errorMessage = `Connection timeout (attempt ${retryAttempts + 1}/3). Retrying automatically...`;
          toast({
            title: "Retrying sign in...",
            description: errorMessage,
          });

          // Auto-retry after a short delay
          setTimeout(() => {
            if (loginEmail && loginPassword) {
              handleLogin(e);
            }
          }, 2000);
          return;
        } else {
          errorMessage = error.message + " Maximum retry attempts reached. Please check your connection or try refreshing the page.";
        }
      } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        errorMessage = "Network connection failed. Please check your internet connection.";
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials.";
        setRetryAttempts(0); // Reset retry attempts for credential errors
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
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
                Signing in...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Sign In
              </>
            )}
          </Button>

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
