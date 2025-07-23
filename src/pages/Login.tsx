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
import { useNavigate } from "react-router-dom";
import { Infinity, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Try to sign in with the email and a dummy password to check if user exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-to-check-existence'
      });
      
      // If we get "Invalid login credentials", the email exists but password is wrong
      // If we get "Email not confirmed", the email exists but isn't confirmed
      // If we get "User not found" or similar, the email doesn't exist
      if (error) {
        const errorMessage = error.message.toLowerCase();
        return errorMessage.includes('invalid login credentials') || 
               errorMessage.includes('email not confirmed') ||
               errorMessage.includes('signup is disabled') ||
               !errorMessage.includes('user not found');
      }
      
      // If no error, user exists and we accidentally logged them in (shouldn't happen with dummy password)
      return true;
    } catch (error) {
      // On any error, assume email doesn't exist to be safe
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
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
      // First check if email already exists
      const emailExists = await checkEmailExists(email);
      
      if (emailExists) {
        toast({
          title: "Email Already Taken",
          description: "This email address is already registered. Please use the Sign In tab to log into your account.",
          variant: "destructive",
        });
        
        // Switch to login tab automatically
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        if (loginTab) {
          loginTab.click();
        }
        
        setIsLoading(false);
        return;
      }

      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const redirectUrl = `https://backlinkoo.com/auth/confirm`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName.trim()
          }
        }
      });

      if (error) {
        throw error;
      }

      // Show success message for new signups
      if (data.user) {
        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link to verify your account.",
        });
        
        // Broadcast new user notification globally
        setTimeout(() => {
          broadcastNewUser(firstName.trim());
        }, 1000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `https://backlinkoo.com/auth/confirm`
        }
      });

      if (error) throw error;

      toast({
        title: "Confirmation email sent!",
        description: "We've sent you a new confirmation link. Please check your email.",
      });
      
      setShowResendConfirmation(false);
    } catch (error: any) {
      toast({
        title: "Failed to resend confirmation",
        description: error.message || "An error occurred while sending the confirmation email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
                    <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Mail className="h-4 w-4" />
                        <span>Account already exists for: {resendEmail}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleResendConfirmation}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isLoading ? "Sending..." : "Resend Confirmation Email"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full mt-2" 
                        onClick={() => setShowResendConfirmation(false)}
                      >
                        Cancel
                      </Button>
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