import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Star,
  Users,
  Clock
} from "lucide-react";

interface InlineAuthFormProps {
  onAuthSuccess?: (user: any) => void;
  onTrialConversion?: () => void;
  showTrialUpgrade?: boolean;
  className?: string;
}

export function InlineAuthForm({ 
  onAuthSuccess, 
  onTrialConversion, 
  showTrialUpgrade = false,
  className = ""
}: InlineAuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(showTrialUpgrade ? "signup" : "login");

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");

  const { toast } = useToast();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateEmailFormat(loginEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!loginPassword) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.signIn({
        email: loginEmail,
        password: loginPassword,
      });

      if (result.success && result.user) {
        toast({
          title: "Welcome back!",
          description: "You're now signed in to your account.",
        });
        
        onAuthSuccess?.(result.user);
        
        // Reset form
        setLoginEmail("");
        setLoginPassword("");
      } else if (result.requiresEmailVerification) {
        toast({
          title: "Email verification required",
          description: "Please check your email and verify your account before signing in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign in failed",
          description: result.error || 'Invalid email or password.',
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
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateEmailFormat(signupEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePasswordStrength(signupPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Weak password",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
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

    try {
      const result = await AuthService.signUp({
        email: signupEmail,
        password: signupPassword,
        firstName: firstName.trim(),
      });

      if (result.success) {
        if (result.user?.email_confirmed_at) {
          toast({
            title: "Account created successfully!",
            description: "You're now signed in and ready to start your first campaign.",
          });
          onAuthSuccess?.(result.user);
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email for a verification link to complete your account setup.",
          });
        }
        
        // Reset signup form
        setSignupEmail("");
        setSignupPassword("");
        setConfirmPassword("");
        setFirstName("");
        
      } else {
        let errorTitle = "Registration failed";
        let errorMessage = result.error || "An error occurred during registration.";

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
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrialUpgrade = () => {
    if (onTrialConversion) {
      onTrialConversion();
    } else {
      setActiveTab("signup");
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${className}`}>
      {showTrialUpgrade && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Trial Active</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            Upgrade your trial to permanent backlinks and unlock all features
          </p>
          <Button 
            size="sm" 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleTrialUpgrade}
          >
            <Zap className="h-3 w-3 mr-1" />
            Upgrade Trial
          </Button>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-center">
          {showTrialUpgrade ? "Upgrade Your Trial" : "Get Started Today"}
        </CardTitle>
        
        {/* Social Proof */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>2,000+ users</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>4.9/5 rating</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">
              {showTrialUpgrade ? "Upgrade" : "Create Account"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inline-login-email" className="text-sm">Email</Label>
                <Input
                  id="inline-login-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inline-login-password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="inline-login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-9 pr-9"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent"
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
                className="w-full h-9"
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
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            {showTrialUpgrade && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Trial Benefits Included</span>
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Convert trial backlinks to permanent</li>
                  <li>• Unlock advanced analytics</li>
                  <li>• Priority support access</li>
                </ul>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inline-signup-firstName" className="text-sm">First Name</Label>
                <Input
                  id="inline-signup-firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inline-signup-email" className="text-sm">Email</Label>
                <Input
                  id="inline-signup-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inline-signup-password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="inline-signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-9 pr-9"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent"
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
                <Label htmlFor="inline-confirm-password" className="text-sm">Confirm Password</Label>
                <Input
                  id="inline-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-9"
                disabled={isLoading || !signupEmail || !signupPassword || !confirmPassword || !firstName}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {showTrialUpgrade ? "Upgrade Trial" : "Create Account"}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our terms of service.
              </p>
            </form>
          </TabsContent>
        </Tabs>

        {/* Trust signals */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-xs text-muted-foreground">
              <Shield className="h-3 w-3 mx-auto mb-1" />
              <span>Secure</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mx-auto mb-1" />
              <span>Instant Setup</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3 mx-auto mb-1" />
              <span>Start Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
