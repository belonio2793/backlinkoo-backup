import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Save,
  Globe,
  BarChart3,
  Loader2
} from 'lucide-react';

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle?: string;
  trigger?: 'save_post' | 'general';
}

export function RegistrationModal({ 
  open, 
  onOpenChange, 
  postTitle,
  trigger = 'general'
}: RegistrationModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !firstName) {
      toast({
        title: "Please fill all fields",
        description: "All fields are required to create your account.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Here you would implement actual registration logic
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Account Created Successfully! 🎉",
        description: postTitle ? 
          `Your account has been created and "${postTitle}" has been saved permanently!` :
          "Welcome to Backlink ∞! Your account has been created successfully.",
      });

      // Reset form
      setEmail('');
      setPassword('');
      setFirstName('');
      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Save,
      title: "Save Posts Forever",
      description: "Never lose your generated content again"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track clicks, views, and backlink performance"
    },
    {
      icon: Zap,
      title: "Priority Generation",
      description: "Faster content generation with premium models"
    },
    {
      icon: Globe,
      title: "Custom Domains",
      description: "Publish on your own domain for better SEO"
    },
    {
      icon: TrendingUp,
      title: "SEO Optimization",
      description: "Advanced SEO tools and recommendations"
    },
    {
      icon: Shield,
      title: "No Ads",
      description: "Clean, professional experience without ads"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6 text-purple-600" />
            {trigger === 'save_post' ? 'Save Your Post Forever!' : 'Join Backlink ∞'}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {trigger === 'save_post' && postTitle ? (
              <>Create a free account to save <strong>"{postTitle}"</strong> permanently and unlock premium features.</>
            ) : (
              'Create your free account and unlock advanced features for better SEO results.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Form */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                Create Free Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Choose a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {trigger === 'save_post' ? 'Save Post & Create Account' : 'Create Free Account'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By creating an account, you agree to our{' '}
                  <Button variant="link" className="p-0 h-auto text-xs">
                    Terms of Service
                  </Button>{' '}
                  and{' '}
                  <Button variant="link" className="p-0 h-auto text-xs">
                    Privacy Policy
                  </Button>
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Features List */}
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">100% Free Account</h3>
                </div>
                <p className="text-sm text-green-700">
                  No hidden fees, no credit card required. Start improving your SEO today!
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What You'll Get:</h3>
              <div className="grid grid-cols-1 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                    <feature.icon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {trigger === 'save_post' && (
              <>
                <Separator />
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Save className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">Save This Post</h3>
                    </div>
                    <p className="text-sm text-orange-700">
                      Your generated blog post will be saved permanently and won't auto-delete in 24 hours.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Social Proof */}
        <Card className="border-blue-200 bg-blue-50 mt-6">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">
                Join 10,000+ marketers already improving their SEO
              </h3>
              <div className="flex items-center justify-center gap-6 text-sm text-blue-700">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>500% avg. traffic increase</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>50+ backlinks per campaign</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>98% customer satisfaction</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default RegistrationModal;
