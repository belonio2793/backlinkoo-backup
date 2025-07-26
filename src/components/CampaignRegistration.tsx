import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CampaignRegistrationProps {
  campaignId?: string;
  onRegistrationSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CampaignRegistration({ 
  campaignId, 
  onRegistrationSuccess, 
  trigger 
}: CampaignRegistrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
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



        toast({
          title: 'Registration Successful!',
          description: 'Welcome to Backlinkoo!',
        });

        setIsOpen(false);
        onRegistrationSuccess?.();
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'There was an error creating your account',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
      <UserPlus className="h-5 w-5 mr-2" />
      Create Account & Save Campaign
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Join Backlinkoo & Save Your Campaign
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {campaignId && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Your campaign expires in 24 hours without an account
                </span>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="register-email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name (Optional)</Label>
              <Input
                id="display-name"
                placeholder="Your Name"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="register-password"
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
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </div>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Your data is encrypted and secure. We never share your information.</span>
            </div>
          </div>

          {/* Already have account link */}
          <div className="text-center">
            <Button variant="link" className="text-sm">
              Already have an account? Sign in instead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuickRegistrationProps {
  campaignId: string;
  onSaved: () => void;
}

export function QuickRegistration({ campaignId, onSaved }: QuickRegistrationProps) {
  return (
    <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
      <CardContent className="p-6 text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Save Your Campaign Forever</h3>
          <p className="text-sm text-muted-foreground">
            Create a free account to permanently save your AI-generated content and access your campaign dashboard
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Save className="h-3 w-3" />
            Permanent Storage
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            Full Dashboard
          </Badge>
        </div>

        <CampaignRegistration 
          campaignId={campaignId}
          onRegistrationSuccess={onSaved}
          trigger={
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Free Account
            </Button>
          }
        />
        
        <p className="text-xs text-muted-foreground">
          No credit card required • Free forever tier available
        </p>
      </CardContent>
    </Card>
  );
}
