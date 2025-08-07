import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AuthService, setupAuthStateListener } from "@/services/authService";
import { AuthFormTabs } from "@/components/shared/AuthFormTabs";
import { validateEmail } from "@/utils/authValidation";
import { useNavigate } from "react-router-dom";
import { Infinity, Mail, ArrowLeft } from "lucide-react";
import AnimatedTestimonials from "@/components/AnimatedTestimonials";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for claim intent and show notification
    const claimIntent = localStorage.getItem('claim_intent');
    if (claimIntent) {
      try {
        const intent = JSON.parse(claimIntent);
        toast({
          title: "Complete Your Claim",
          description: `Sign in to claim "${intent.postTitle}" and make it permanent.`,
        });
      } catch (error) {
        console.warn('Failed to parse claim intent:', error);
        localStorage.removeItem('claim_intent');
      }
    }

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { session } = await AuthService.getCurrentSession();

        // Only redirect if user is truly authenticated AND email is verified
        if (session && session.user && session.user.email_confirmed_at) {
          console.log('🔐 User already authenticated and verified, checking for claim intent...');

          // Handle claim intent if user is already logged in
          if (claimIntent) {
            try {
              const intent = JSON.parse(claimIntent);
              localStorage.removeItem('claim_intent');

              toast({
                title: "Continuing with your claim...",
                description: `Processing your request to claim "${intent.postTitle}"`,
              });

              setTimeout(() => {
                window.location.href = `/blog/${intent.postSlug}`;
              }, 1500);
              return;
            } catch (error) {
              console.warn('Failed to parse claim intent:', error);
              localStorage.removeItem('claim_intent');
            }
          }

          // Prevent redirect loops
          if (window.location.pathname !== '/dashboard') {
            navigate('/dashboard');
          }
        } else if (session && session.user && !session.user.email_confirmed_at) {
          console.log('📬 User authenticated but email not verified, staying on login page');
        } else {
          console.log('🚪 No valid session found, staying on login page');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = setupAuthStateListener((event, session) => {
      console.log('🔐 Auth state changed:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        emailConfirmed: session?.user?.email_confirmed_at
      });

      // Only redirect if user is signed in AND email is verified
      if (event === 'SIGNED_IN' && session && session.user && session.user.email_confirmed_at) {
        console.log('🔐 Auth state change: user verified, redirecting to dashboard');
        // Prevent redirect loops and ensure we're not already on dashboard
        if (window.location.pathname !== '/dashboard') {
          setTimeout(() => navigate('/dashboard'), 100);
        }
      } else if (event === 'SIGNED_IN' && session && session.user && !session.user.email_confirmed_at) {
        console.log('📬 Auth state change: user signed in but email not verified');
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [navigate]);



  const handleAuthSuccess = (user: any) => {
    navigate('/dashboard');
  };

  const handleForgotPassword = async () => {
    if (isLoading) return;

    if (!forgotPasswordEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.resetPassword(forgotPasswordEmail.trim());

      if (result.success) {
        toast({
          title: "Password reset email sent!",
          description: "We've sent you a password reset link. Please check your email.",
        });

        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast({
          title: "Password reset failed",
          description: result.error || "Failed to send email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast({
        title: "Reset failed",
        description: "Unexpected error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main auth section */}
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Infinity className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground" role="banner">Welcome Back</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <AuthFormTabs
                onAuthSuccess={handleAuthSuccess}
                onForgotPassword={() => setShowForgotPassword(true)}
              />

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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedTestimonials />
        </div>
      </div>
    </div>
  );
};

export default Login;
