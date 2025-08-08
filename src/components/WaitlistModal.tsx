import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Rocket, Star, Zap, Gift, CheckCircle, Mail, Lock, User } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  modalProps?: any;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  modalProps
}) => {
  const effectiveInitialEmail = modalProps?.initialEmail || initialEmail;
  const [step, setStep] = useState<'email' | 'signup' | 'success'>(effectiveInitialEmail ? 'signup' : 'email');
  const [email, setEmail] = useState(effectiveInitialEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update email and step when initialEmail changes
  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
      setStep('signup');
    }
  }, [initialEmail]);

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    setStep('signup');
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            waitlist_joined: true,
            joined_from: 'automation_waitlist'
          }
        }
      });

      if (authError) throw authError;

      // Add to waitlist table (optional - for tracking)
      if (authData.user) {
        try {
          await supabase
            .from('waitlist')
            .upsert({
              user_id: authData.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              source: 'automation_page',
              status: 'pending',
              created_at: new Date().toISOString()
            });
        } catch (waitlistError) {
          console.warn('Waitlist table insertion failed:', waitlistError);
          // Don't fail the signup if waitlist table doesn't exist
        }
      }

      setStep('success');
      
      toast({
        title: "Welcome to the Waitlist! 🎉",
        description: "Check your email for confirmation and early access updates",
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "This email is already registered. Try signing in instead.";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes('weak password')) {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }

      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(initialEmail ? 'signup' : 'email');
    setEmail(initialEmail);
    setPassword('');
    setFullName('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto bg-white">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Rocket className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join Waitlist For Backlink ∞ Automation
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {step === 'email' && "Get early access to the most powerful automated link building system"}
            {step === 'signup' && "Create your account to secure your spot"}
            {step === 'success' && "You're all set! Welcome to the future of SEO"}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' && (
          <div className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">50% Early Bird Discount</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium">Exclusive Beta Access</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <Gift className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium">Free Setup & Training</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium">Priority Support</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="waitlist-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="waitlist-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              />
            </div>

            <Button 
              onClick={handleEmailSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
              disabled={!email}
            >
              Continue to Account Creation
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Join 2,847+ others waiting for early access
            </p>
          </div>
        )}

        {step === 'signup' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="full-name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="signup-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              />
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('email')}
                variant="outline"
                className="flex-1 h-11"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handleSignup}
                className="flex-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 font-semibold"
                disabled={isLoading || !email || !password || !fullName}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  'Join Waitlist'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Welcome to the Waitlist!</h3>
              <p className="text-gray-600">
                You've successfully joined the Backlink ∞ Automation waitlist.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">What happens next?</p>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Check your email for confirmation</li>
                <li>• Get notified when we launch beta access</li>
                <li>• Receive your exclusive 50% discount code</li>
                <li>• Access priority support and training</li>
              </ul>
            </div>

            <Button 
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11"
            >
              Get Started
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
