import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Save,
  Crown,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Timer,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { liveBlogPublisher } from '@/services/liveBlogPublisher';

interface SavePostSignupPopupProps {
  isOpen: boolean;
  onClose: () => void;
  blogPostId?: string;
  blogPostUrl?: string;
  blogPostTitle?: string;
  onSignupSuccess?: (user: any) => void;
  timeRemaining?: number; // seconds until deletion
}

export function SavePostSignupPopup({ 
  isOpen, 
  onClose, 
  blogPostId,
  blogPostUrl,
  blogPostTitle,
  onSignupSuccess,
  timeRemaining = 86400 // 24 hours default
}: SavePostSignupPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'signup' | 'success'>('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const { toast } = useToast();

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            display_name: formData.displayName || null
          });

        if (profileError) {
          console.warn('Profile creation failed:', profileError);
        }



        // Save the blog post if ID provided
        if (blogPostId) {
          const saved = await liveBlogPublisher.extendTrialPost(blogPostId, authData.user.id);
          if (saved) {
            toast({
              title: 'Blog Post Saved!',
              description: 'Your blog post has been permanently saved to your account',
            });
          }
        }

        setStep('success');
        onSignupSuccess?.(authData.user);

        toast({
          title: 'Account Created Successfully!',
          description: 'Welcome to Backlinkoo!',
        });
      }
    } catch (error: any) {
      console.error('Signup failed:', error);

      // Handle different error types properly
      let errorMessage = 'There was an error creating your account';

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (typeof error.toString === 'function') {
          errorMessage = error.toString();
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-6 py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Backlinkoo! 🎉</h2>
              <p className="text-muted-foreground">
                Your account has been created and your blog post has been saved permanently.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  What's Next?
                </h3>
                <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Your blog post is now live permanently</li>
                  <li>• Check your dashboard for campaign details</li>

                  <li>• Explore our premium features</li>
                </ul>
              </div>

              {blogPostUrl && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Live Post:</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={blogPostUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Continue Exploring
              </Button>
              <Button className="flex-1" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Save Your Blog Post Forever
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Urgency Section */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Save className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                Create an account to claim these permanent links
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your trial expires in <strong>{formatTimeRemaining(timeRemaining)}</strong> - Save now to keep forever!
              </p>
              <Progress 
                value={Math.max(0, 100 - ((86400 - timeRemaining) / 86400) * 100)} 
                className="h-2" 
              />
              {blogPostTitle && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  "{blogPostTitle.substring(0, 50)}..."
                </p>
              )}
            </div>
          </div>



          {/* Quick Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-name">Display Name (Optional)</Label>
              <Input
                id="signup-name"
                placeholder="Your Name"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving Post...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Post & Create Account
                </div>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure signup • No spam • Cancel anytime</span>
            </div>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              I'll take my chances with auto-delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
