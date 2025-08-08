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

interface CleanAuthFormProps {
  onAuthSuccess?: (user: any) => void;
  onSignInStart?: () => void;
  showTrialUpgrade?: boolean;
  onForgotPassword?: () => void;
  defaultTab?: "login" | "signup";
}

export function CleanAuthForm({
  onAuthSuccess,
  onSignInStart,
  showTrialUpgrade = false,
  onForgotPassword,
  defaultTab = "login"
}: CleanAuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);

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
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    onSignInStart?.();
    setIsLoading(true);

    try {
      const result = await AuthService.signIn({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (result.success) {
        toast({
          title: "Welcome back!",
          description: `Signing in as ${trimmedEmail}`,
        });
        onAuthSuccess?.(result.user);
      } else {
        toast({
          title: "Sign in failed",
          description: result.error || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection error",
        description: "Unable to connect to authentication service.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

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

    try {
      if (showTrialUpgrade && TrialConversionService.hasConvertibleTrialPosts()) {
        const conversionResult = await TrialConversionService.convertTrialToAccount(
          signupEmail,
          signupPassword,
          firstName.trim()
        );

        if (conversionResult.success) {
          toast({
            title: "Trial upgraded successfully!",
            description: "Your account is ready! You can now create permanent backlinks.",
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
        const result = await AuthService.signUp({
          email: signupEmail.trim(),
          password: signupPassword,
          firstName: firstName.trim(),
        });

        if (result.success) {
          if (result.requiresEmailVerification) {
            toast({
              title: "Account created! Check your email",
              description: "We've sent you a confirmation link to verify your account.",
            });
          } else {
            toast({
              title: "Account created successfully!",
              description: "Your account has been created and verified.",
            });
          }

          if (result.user?.email_confirmed_at) {
            onAuthSuccess?.(result.user);
          } else {
            setActiveTab("login");
            setLoginEmail(signupEmail);
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

      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setFirstName("");
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login" className="text-sm font-medium">
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="text-sm font-medium">
            {showTrialUpgrade ? "Upgrade" : "Create Account"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-0">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 w-10 px-3 hover:bg-transparent"
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
              className="w-full h-10 mt-6"
              disabled={!loginEmail || !loginPassword || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {onForgotPassword && (
              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-muted-foreground p-0 h-auto"
                  onClick={onForgotPassword}
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-0">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="first-name"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="h-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 w-10 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-6"
              disabled={!signupEmail || !signupPassword || !confirmPassword || !firstName || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {showTrialUpgrade ? "Upgrade Trial" : "Create Account"}
                </>
              )}
            </Button>

            <div className="text-center mt-4">
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground p-0 h-auto"
                onClick={() => window.open('/auth-diagnostic', '_blank')}
              >
                Need help signing up?
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
