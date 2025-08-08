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
import CompactTestimonials from "@/components/CompactTestimonials";
import TestimonialBanner from "@/components/TestimonialBanner";

interface AuthFormTabsProps {
  onAuthSuccess?: (user: any) => void;
  onSignInStart?: () => void;
  showTrialUpgrade?: boolean;
  isCompact?: boolean;
  onForgotPassword?: () => void;
  className?: string;
  defaultTab?: "login" | "signup";
  onTabChange?: (tab: "login" | "signup") => void;
}

export function AuthFormTabs({
  onAuthSuccess,
  onSignInStart,
  showTrialUpgrade = false,
  isCompact = false,
  onForgotPassword,
  className = "",
  defaultTab,
  onTabChange
}: AuthFormTabsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    defaultTab || "login"
  );

  const handleTabChange = (value: string) => {
    const newTab = value as "login" | "signup";
    setActiveTab(newTab);
    onTabChange?.(newTab);
  };

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

    const trimmedEmail = loginEmail.trim();
    const trimmedPassword = loginPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Signing you in...");

    try {
      const result = await AuthService.signIn(trimmedEmail, trimmedPassword);

      if (result.success && result.user) {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });

        // Clear form
        setLoginEmail("");
        setLoginPassword("");

        onAuthSuccess?.(result.user);
      } else {
        toast({
          title: "Sign in failed",
          description: result.error || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedEmail = signupEmail.trim();
    const trimmedPassword = signupPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedFirstName = firstName.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirmPassword || !trimmedFirstName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Creating your account...");

    try {
      const result = await AuthService.signUp(
        trimmedEmail,
        trimmedPassword,
        trimmedFirstName
      );

      if (result.success && result.user) {
        toast({
          title: "Account created!",
          description: "Welcome! Your account has been created successfully.",
        });

        // Clear form
        setSignupEmail("");
        setSignupPassword("");
        setConfirmPassword("");
        setFirstName("");

        onAuthSuccess?.(result.user);
      } else {
        let errorTitle = "Sign up failed";
        let errorMessage = result.error || "Unable to create account. Please try again.";

        if (result.error?.includes("already registered") || result.error?.includes("already exists")) {
          errorTitle = "Account already exists";
          errorMessage = "An account with this email already exists. Please sign in instead.";
          if (setActiveTab) {
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
    <div className={className}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
              {isLoading ? (loadingMessage || "Signing In...") : "Sign In"}
            </Button>

            <div className="flex items-center justify-center gap-1 text-center">
              {onForgotPassword && (
                <>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground p-0 h-auto"
                    onClick={onForgotPassword}
                  >
                    Forgot your password?
                  </Button>
                  <span className="text-sm text-muted-foreground">•</span>
                </>
              )}
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground p-0 h-auto"
                onClick={() => window.open('/auth-diagnostic', '_blank')}
              >
                Having trouble signing in?
              </Button>
            </div>

            {!isCompact && (
              <div className="mt-6">
                <TestimonialBanner />
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
                placeholder="••••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputHeight}
                required
              />
            </div>

            <Button
              type="submit"
              className={`w-full ${inputHeight}`}
              disabled={!signupEmail || !signupPassword || !confirmPassword || !firstName || isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Creating Account..." : (showTrialUpgrade ? "Upgrade Trial" : "Create Account")}
            </Button>

            <div className="flex items-center justify-center gap-1 text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground p-0 h-auto"
                onClick={() => window.open('/auth-diagnostic', '_blank')}
              >
                Need help signing up?
              </Button>
            </div>

            {!isCompact && (
              <div className="mt-6">
                <CompactTestimonials />
              </div>
            )}
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
