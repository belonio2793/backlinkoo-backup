import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import { validateEmail, validatePassword } from "@/utils/authValidation";
import { 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  UserPlus,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  CreditCard,
  Star
} from "lucide-react";

interface CheckoutAuthFormProps {
  onAuthSuccess?: (user: any) => void;
  defaultTab?: "signin" | "signup";
  orderSummary?: {
    credits?: number;
    price?: number;
    planName?: string;
  };
  isGuest?: boolean;
  onGuestCheckout?: () => void;
}

export function CheckoutAuthForm({
  onAuthSuccess,
  defaultTab = "signup",
  orderSummary,
  isGuest = false,
  onGuestCheckout
}: CheckoutAuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);

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

    try {
      const result = await AuthService.signIn(trimmedEmail, trimmedPassword);

      if (result.success && result.user) {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });

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

    try {
      const result = await AuthService.signUp(
        trimmedEmail,
        trimmedPassword,
        trimmedFirstName
      );

      if (result.success && result.user) {
        toast({
          title: "Account created successfully!",
          description: "Welcome! Your account has been created and you can now complete your purchase.",
        });

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
          setActiveTab("signin");
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
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Auth Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Almost There!</h2>
            </div>
            <p className="text-muted-foreground text-lg">
              Sign in to your account or create a new one to complete your purchase
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="signin" className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4" />
                Create Account
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-6">
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Welcome Back
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Sign in to continue with your purchase
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-12 text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="h-12 text-base pr-12"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                      disabled={!loginEmail || !loginPassword || isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? "Signing In..." : "Sign In & Continue"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Create Your Account
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Join thousands of satisfied customers and start building your SEO success
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          First Name
                        </Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-12 text-base"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="h-12 text-base pr-12"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Must be at least 6 characters long
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Confirm Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      disabled={!signupEmail || !signupPassword || !confirmPassword || !firstName || isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? "Creating Account..." : "Create Account & Continue"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-green-900 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Why Create an Account?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Track your orders & campaigns
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Access your dashboard
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        View detailed analytics
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Priority customer support
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="bg-blue-50 border-blue-200 sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderSummary && (
                <>
                  {orderSummary.planName ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Plan:</span>
                        <span className="font-semibold text-blue-900">{orderSummary.planName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Credits:</span>
                        <span className="font-semibold text-blue-900">{orderSummary.credits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Price per credit:</span>
                        <span className="text-blue-900">$1.40</span>
                      </div>
                    </div>
                  )}
                  <Separator className="bg-blue-300" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-blue-900">Total:</span>
                    <span className="text-blue-900">${orderSummary.price?.toFixed(2)}</span>
                  </div>
                </>
              )}

              <Separator className="bg-blue-300" />

              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">You'll Get:</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    High DA backlinks
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Instant access to dashboard
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Real-time reporting
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    24/7 customer support
                  </div>
                </div>
              </div>

              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-800">
                  <Shield className="h-3 w-3" />
                  <span className="font-medium">Secure checkout • 30-day money-back guarantee</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
