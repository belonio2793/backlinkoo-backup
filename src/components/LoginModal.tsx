import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import { AuthFormTabs } from "@/components/shared/AuthFormTabs";
import { validateEmail } from "@/utils/authValidation";
import { Mail, RefreshCw, Infinity } from "lucide-react";
import { LiveUserActivity } from "./SocialProofElements";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: any) => void;
  defaultTab?: "login" | "signup";
}

export function LoginModal({ isOpen, onClose, onAuthSuccess, defaultTab = "login" }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const { toast } = useToast();

  const handleAuthSuccess = (user: any) => {
    onAuthSuccess?.(user);
    onClose();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailFormat(forgotPasswordEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.resetPassword(forgotPasswordEmail);

      if (result.success) {
        toast({
          title: "Reset email sent!",
          description: "Check your email for password reset instructions.",
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast({
          title: "Reset failed",
          description: result.error || "Failed to send reset email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setForgotPasswordEmail("");
    setShowForgotPassword(false);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Infinity className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground" role="banner">
              Welcome Back
            </DialogTitle>
            <div className="mt-3">
              <LiveUserActivity />
            </div>
          </div>
        </DialogHeader>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email address"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForgotPassword(false)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !forgotPasswordEmail}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Email
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <AuthFormTabs
            onAuthSuccess={handleAuthSuccess}
            onForgotPassword={() => setShowForgotPassword(true)}
            defaultTab={defaultTab}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
