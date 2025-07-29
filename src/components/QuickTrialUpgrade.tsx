import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrialConversionService } from "@/services/trialConversionService";
import { 
  Zap, 
  Crown, 
  CheckCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Clock
} from "lucide-react";

interface QuickTrialUpgradeProps {
  onSuccess?: (user: any) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function QuickTrialUpgrade({ 
  onSuccess, 
  className = "",
  variant = "default",
  size = "default"
}: QuickTrialUpgradeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");

  const { toast } = useToast();

  const trialStats = TrialConversionService.getTrialStats();
  const hasTrialPosts = TrialConversionService.hasConvertibleTrialPosts();

  if (!hasTrialPosts) {
    return null;
  }

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

  const handleQuickUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailFormat(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Weak password",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
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
      const result = await TrialConversionService.convertTrialToAccount(
        email,
        password,
        firstName.trim()
      );

      if (result.success) {
        const convertedCount = result.convertedPosts || 0;
        toast({
          title: "Trial upgraded successfully! 🎉",
          description: convertedCount > 0 
            ? `Your account is ready and ${convertedCount} trial post${convertedCount > 1 ? 's have' : ' has'} been converted to permanent backlinks.`
            : "Your account is ready! You can now create permanent backlinks.",
        });
        
        onSuccess?.(result.user);
        setIsOpen(false);
        
        // Reset form
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
      } else {
        toast({
          title: "Upgrade failed",
          description: result.error || "Failed to upgrade trial account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Quick upgrade error:', error);
      toast({
        title: "Upgrade failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextExpiringPost = TrialConversionService.getNextExpiringPost();
  const timeUntilExpiry = nextExpiringPost ? new Date(nextExpiringPost.expires_at).getTime() - new Date().getTime() : 0;
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const isUrgent = hoursUntilExpiry < 2;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={`${isUrgent ? 'animate-pulse' : ''} ${className}`}
      >
        <Crown className="h-4 w-4 mr-2" />
        {isUrgent ? 'Upgrade Now!' : 'Upgrade Trial'}
        {trialStats.totalPosts > 0 && (
          <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
            {trialStats.totalPosts}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Upgrade Your Trial
            </DialogTitle>
          </DialogHeader>

          {/* Trial stats */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {trialStats.totalPosts} Trial Post{trialStats.totalPosts > 1 ? 's' : ''} Ready for Conversion
              </span>
            </div>
            {isUrgent && (
              <p className="text-xs text-amber-700">
                ⚠️ Expiring in {hoursUntilExpiry}h - upgrade now to save your backlinks!
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Permanent backlinks</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Campaign tools</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleQuickUpgrade} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-firstName">First Name</Label>
              <Input
                id="quick-firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-email">Email</Label>
              <Input
                id="quick-email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-password">Password</Label>
              <div className="relative">
                <Input
                  id="quick-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
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
              <Label htmlFor="quick-confirm-password">Confirm Password</Label>
              <Input
                id="quick-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={isLoading || !email || !password || !confirmPassword || !firstName}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By upgrading, you agree to our terms of service.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
