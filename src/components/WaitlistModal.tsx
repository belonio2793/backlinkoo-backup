import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import '@/styles/waitlist-modal.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Rocket, 
  Star, 
  Zap, 
  Gift, 
  CheckCircle, 
  Mail, 
  Lock, 
  User,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Target,
  Crown,
  Sparkles,
  X,
  Globe,
  Award,
  Infinity
} from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  modalProps?: any;
  onSuccess?: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  modalProps,
  onSuccess
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
    if (effectiveInitialEmail && effectiveInitialEmail !== email) {
      setEmail(effectiveInitialEmail);
      setStep('signup');
    }
  }, [effectiveInitialEmail, modalProps]);

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
          const { error: waitlistError } = await supabase
            .from('waitlist')
            .upsert({
              user_id: authData.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              source: 'automation_page',
              status: 'pending',
              created_at: new Date().toISOString()
            });
          
          if (waitlistError) {
            console.warn('Waitlist tracking failed (table may not exist):', waitlistError);
          } else {
            console.log('✅ Added to waitlist tracking');
          }
        } catch (waitlistError) {
          console.warn('⚠️ Waitlist table insertion failed:', waitlistError);
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
    setStep(effectiveInitialEmail ? 'signup' : 'email');
    setEmail(effectiveInitialEmail);
    setPassword('');
    setFullName('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl mx-auto bg-white border-0 shadow-2xl p-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-lg"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {step === 'email' && (
          <div className="relative">
            <VisuallyHidden>
              <DialogTitle>Join Backlink Infinity Automation Waitlist - Email Entry</DialogTitle>
            </VisuallyHidden>
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
            <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"}></div>
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="text-white space-y-8">
                  <div className="space-y-6 waitlist-slide-up">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl waitlist-float">
                        <Infinity className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                        🚀 Launching Q1 2025
                      </div>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                      Join the Future of
                      <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                        Automated SEO
                      </span>
                    </h1>
                    
                    <p className="text-xl text-blue-100 leading-relaxed">
                      Be among the first to experience our revolutionary AI-powered link building platform. 
                      Get exclusive early access and lock in founding member pricing.
                    </p>
                  </div>

                  {/* Key Benefits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">10x Faster</div>
                        <div className="text-sm text-blue-200">Link Building</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">100% Safe</div>
                        <div className="text-sm text-blue-200">Google Compliant</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">AI Powered</div>
                        <div className="text-sm text-blue-200">Content Creation</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="p-2 bg-pink-500 rounded-lg">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Global Scale</div>
                        <div className="text-sm text-blue-200">Unlimited Reach</div>
                      </div>
                    </div>
                  </div>

                  {/* Social Proof */}
                  <div className="flex items-center gap-6 text-blue-100">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span className="font-semibold">2,847+</span>
                      <span>in queue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold">50%</span>
                      <span>early discount</span>
                    </div>
                  </div>
                </div>

                {/* Right Form */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl waitlist-slide-up waitlist-hover-lift">
                  <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 waitlist-pulse">
                      <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Spot</h2>
                    <p className="text-gray-600">Join the exclusive beta waitlist and get priority access</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="waitlist-email" className="flex items-center gap-2 text-gray-700 font-medium">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="waitlist-email"
                          type="email"
                          placeholder="Enter your professional email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 pl-4 pr-4 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all"
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleEmailSubmit}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all waitlist-glow-button"
                      disabled={!email}
                    >
                      Continue to Registration
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Free to join • No credit card required • Cancel anytime
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'signup' && (
          <div className="p-8 md:p-12">
            <VisuallyHidden>
              <DialogTitle>Join Backlink Infinity Automation Waitlist - Account Creation</DialogTitle>
            </VisuallyHidden>
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Create Your Account</h2>
                <p className="text-lg text-gray-600">Complete your registration to secure exclusive early access</p>
                
                {/* Progress Bar */}
                <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full w-2/3 transition-all"></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Step 2 of 3</p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="full-name" className="flex items-center gap-2 text-gray-700 font-medium">
                      <User className="w-4 h-4 text-green-600" />
                      Full Name
                    </Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="flex items-center gap-2 text-gray-700 font-medium">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Lock className="w-4 h-4 text-purple-600" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                  />
                </div>

                {/* Benefits Reminder */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Your Exclusive Benefits
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>50% Early Bird Discount</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Priority Beta Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Free Setup & Training</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Dedicated Support</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button 
                    onClick={() => setStep('email')}
                    variant="outline"
                    className="flex-1 h-12 border-2 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    ← Back
                  </Button>
                  <Button 
                    onClick={handleSignup}
                    className="flex-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading || !email || !password || !fullName}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      <>
                        Secure My Spot
                        <Crown className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="relative overflow-hidden waitlist-confetti">
            <VisuallyHidden>
              <DialogTitle>Join Backlink Infinity Automation Waitlist - Welcome Success</DialogTitle>
            </VisuallyHidden>
            {/* Celebration Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600"></div>
            <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M20 20L0 0h40L20 20z\"/%3E%3C/g%3E%3C/svg%3E')] opacity-20"}></div>

            <div className="relative z-10 text-center p-8 md:p-16 text-white">
              {/* Success Animation */}
              <div className="mx-auto w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 waitlist-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-6 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  🎉 <span className="waitlist-gradient-text">Welcome to the Elite!</span>
                </h2>
                <p className="text-xl text-green-100 leading-relaxed">
                  Congratulations! You've successfully joined the Backlink ∞ Automation exclusive waitlist. 
                  You're now part of an elite group of forward-thinking SEO professionals.
                </p>

                {/* Next Steps */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-left">
                  <h3 className="text-xl font-bold mb-6 text-center">What Happens Next?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-500 rounded-lg mt-1">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Check Your Inbox</div>
                        <div className="text-green-100">Confirmation email with next steps is on its way</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-purple-500 rounded-lg mt-1">
                        <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Early Access Notification</div>
                        <div className="text-green-100">Be the first to know when beta launches in Q1 2025</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-orange-500 rounded-lg mt-1">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Exclusive Founder's Pricing</div>
                        <div className="text-green-100">Lock in 50% discount - valid for first 100 users only</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-pink-500 rounded-lg mt-1">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Premium Onboarding</div>
                        <div className="text-green-100">Free 1-on-1 setup session worth $500</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Sharing */}
                <div className="border-t border-white/20 pt-8">
                  <p className="text-green-100 mb-4">Know other SEO professionals who'd love early access?</p>
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="outline" 
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      Share on LinkedIn
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      Share on Twitter
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    onSuccess?.();
                    handleClose();
                  }}
                  className="w-full max-w-md mx-auto bg-white text-blue-600 hover:bg-gray-100 h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                >
                  Start Exploring
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
