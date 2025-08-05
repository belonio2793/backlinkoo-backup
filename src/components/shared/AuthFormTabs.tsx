import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import { TrialConversionService } from "@/services/trialConversionService";

import { validateEmail, validatePassword, validateRequired } from "@/utils/authValidation";
import { Eye, EyeOff, Shield, CheckCircle } from "lucide-react";

interface AuthFormTabsProps {
  onAuthSuccess?: (user: any) => void;
  onSignInStart?: () => void;
  showTrialUpgrade?: boolean;
  isCompact?: boolean;
  onForgotPassword?: () => void;
  className?: string;
  defaultTab?: "login" | "signup";
}

export function AuthFormTabs({
  onAuthSuccess,
  onSignInStart,
  showTrialUpgrade = false,
  isCompact = false,
  onForgotPassword,
  className = "",
  defaultTab
}: AuthFormTabsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    defaultTab || "login"
  );

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");

  const { toast } = useToast();



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

    if (!validateEmail(loginEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Close modal immediately when sign in is clicked
    onSignInStart?.();

    setIsLoading(true);
    const currentEmail = loginEmail;
    const currentPassword = loginPassword;

    try {
      const result = await AuthService.signIn({
        email: currentEmail,
        password: currentPassword,
      });

      if (result.success) {
        toast({
          title: "Welcome back!",
          description: `Signing in as ${currentEmail}`,
        });
        onAuthSuccess?.(result.user);
      } else {
        // Check if this is a database error and provide helpful guidance
        if (result.error?.includes('Database error')) {
          toast({
            title: "Database Configuration Issue",
            description: "Your Supabase database needs to be configured. Please run the provided SQL fix script in your Supabase dashboard.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: result.error || "Invalid email or password.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('🚨 Login component error:', {
        error: error,
        message: error.message,
        stack: error.stack,
        email: currentEmail,
        errorString: JSON.stringify(error, null, 2)
      });
      console.error('🚨 Raw login error object:', error);
      toast({
        title: "Sign in failed",
        description: `An unexpected error occurred: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validate all fields
    const emailValidation = validateEmail(signupEmail);
    const passwordValidation = validatePassword(signupPassword);
    const nameValidation = validateRequired(firstName, "First name");

    if (!emailValidation) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

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

    if (!nameValidation.isValid) {
      toast({
        title: "Required field missing",
        description: nameValidation.message,
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

          // Check for claim intent
          const claimIntent = localStorage.getItem('claim_intent');
          if (claimIntent) {
            try {
              const intent = JSON.parse(claimIntent);
              localStorage.removeItem('claim_intent');

              toast({
                title: "Continuing with your claim...",
                description: `Processing your request to claim "${intent.postTitle}"`,
              });

              window.location.href = `/blog/${intent.postSlug}`;
              return;
            } catch (error) {
              console.warn('Failed to parse claim intent:', error);
              localStorage.removeItem('claim_intent');
            }
          }

          onAuthSuccess?.(conversionResult.user);
        } else {
          toast({
            title: "Upgrade failed",
            description: conversionResult.error || "Failed to upgrade trial account.",
            variant: "destructive",
          });
        }
      } else {
        // Use standard AuthService for signup
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
            // Check for claim intent
            const claimIntent = localStorage.getItem('claim_intent');
            if (claimIntent) {
              try {
                const intent = JSON.parse(claimIntent);
                localStorage.removeItem('claim_intent');

                toast({
                  title: "Continuing with your claim...",
                  description: `Processing your request to claim "${intent.postTitle}"`,
                });

                window.location.href = `/blog/${intent.postSlug}`;
                return;
              } catch (error) {
                console.warn('Failed to parse claim intent:', error);
                localStorage.removeItem('claim_intent');
              }
            }

            onAuthSuccess?.(result.user);
          } else {
            // Auto-switch to login tab immediately after successful signup
            setActiveTab("login");
            setLoginEmail(signupEmail); // Pre-fill email for easy login
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
            className={`w-full ${inputHeight}`}
            disabled={!loginEmail || !loginPassword || isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Signing In..." : "Sign In"}
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
              placeholder="•���••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputHeight}
              required
            />
          </div>

          <Button
            type="submit"
            className={`w-full ${inputHeight} ${isLoading ? 'bg-primary/80' : ''}`}
            disabled={!signupEmail || !signupPassword || !confirmPassword || !firstName}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {showTrialUpgrade ? "Upgrade Trial" : "Create Account"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
