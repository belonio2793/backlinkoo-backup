import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import {
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Crown,
  Award,
  Target,
  Zap,
  Clock,
  Shield,
  Globe,
  BarChart3,
  Copy,
  Download,
  Play,
  CheckCircle,
  ArrowRight,
  MousePointer,
  Eye,
  Share2,
  Gift,
  Rocket,
  Calendar,
  Mail,
  ExternalLink,
  Infinity
} from 'lucide-react';

interface AffiliateData {
  id?: string;
  user_id: string;
  affiliate_code: string;
  custom_id: string;
  status: string;
  commission_rate: number;
  total_earnings: number;
  total_paid: number;
  pending_earnings: number;
  referral_url: string;
  created_at?: string;
}

export const NewAffiliateProgram: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    website: '',
    experience: '',
    channels: [] as string[],
    goals: ''
  });

  // Load affiliate data on mount
  useEffect(() => {
    if (user) {
      loadAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading affiliate data:', error);
      }

      setAffiliateData(data);
      
      if (data) {
        setCurrentStep(data.status === 'active' ? 5 : 4); // Dashboard or pending approval
      } else {
        setCurrentStep(1); // Start onboarding
      }
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateCode = () => {
    return 'BL' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  };

  const generateCustomId = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const createAffiliateProfile = async () => {
    if (!user) return;

    setIsRegistering(true);
    try {
      const affiliateCode = generateAffiliateCode();
      const customId = generateCustomId();
      const referralUrl = `${window.location.origin}?ref=${affiliateCode}`;

      const { data, error } = await supabase
        .from('affiliate_programs')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          custom_id: customId,
          status: 'active', // Auto-approve for better UX
          commission_rate: 0.20,
          total_earnings: 0,
          total_paid: 0,
          pending_earnings: 0,
          referral_url: referralUrl
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
      setCurrentStep(5); // Go to dashboard
      
      toast({
        title: "🎉 Welcome to the Affiliate Program!",
        description: "Your affiliate account is active and ready to earn commissions!"
      });
    } catch (error: any) {
      console.error('Error creating affiliate profile:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <Badge className="mb-6 bg-green-100 text-green-800 border-green-200">
                🚀 Join 1000+ Successful Affiliates
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Earn <span className="text-primary">$10,000+</span> Monthly
                <br />
                with Backlink ∞ Affiliate Program
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join the most lucrative affiliate program in the SEO industry. Earn up to 35% 
                recurring commissions promoting the world's leading backlink building platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-3"
                  onClick={() => navigate('/auth')}
                >
                  Join Now - Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-20 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Backlink ∞ Affiliate Program?
            </h2>
            <p className="text-xl text-gray-600">
              Industry-leading commissions, premium tools, and dedicated support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Up to 35% Commission</h3>
                <p className="text-gray-600 mb-4">
                  Start at 20% and earn up to 35% recurring commissions with our tier-based system
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Bronze:</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Silver:</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gold:</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platinum:</span>
                    <span className="font-semibold">35%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-8 text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">30-Day Cookies</h3>
                <p className="text-gray-600 mb-4">
                  Extended attribution window ensures you get credit for all your referrals
                </p>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Cross-device tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Session persistence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>First-click attribution</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-8 text-center">
                <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Premium Resources</h3>
                <p className="text-gray-600 mb-4">
                  Complete marketing toolkit with proven assets and training materials
                </p>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Marketing asset library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>SEO Academy access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Dedicated support team</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gray-900 text-white rounded-2xl p-12">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Ready to Start Earning?</h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of successful affiliates who are already earning substantial 
              monthly income with Backlink ∞'s industry-leading affiliate program.
            </p>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
              onClick={() => navigate('/auth')}
            >
              Start Earning Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step-by-step onboarding for authenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Infinity className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Affiliate Program</h1>
            </div>
            {currentStep < 5 && (
              <Badge variant="outline">Step {currentStep} of 4</Badge>
            )}
          </div>
          {currentStep < 5 && (
            <Progress value={(currentStep / 4) * 100} className="h-2" />
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Welcome & Value Proposition */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Welcome to the Affiliate Program!</h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  You're about to join an exclusive group of successful affiliates earning substantial 
                  commissions by promoting the world's leading backlink building platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-green-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Earn 20-35%</h3>
                  <p className="text-sm text-gray-600">Recurring commissions on all sales</p>
                </div>
                
                <div className="p-6 bg-blue-50 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">30-Day Tracking</h3>
                  <p className="text-sm text-gray-600">Extended attribution window</p>
                </div>
                
                <div className="p-6 bg-purple-50 rounded-lg">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Premium Support</h3>
                  <p className="text-sm text-gray-600">Dedicated success team</p>
                </div>
              </div>

              <Button size="lg" onClick={() => setCurrentStep(2)}>
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Quick Profile Setup */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Quick Profile Setup</CardTitle>
              <CardDescription className="text-center">
                Tell us a bit about yourself to optimize your affiliate experience
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company/Website (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateFormData('company', e.target.value)}
                    placeholder="Your Company or Website"
                  />
                </div>

                <div>
                  <Label>Marketing Experience</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {[
                      { value: 'beginner', label: 'Beginner', desc: 'New to affiliate marketing' },
                      { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                      { value: 'advanced', label: 'Advanced', desc: 'Experienced marketer' }
                    ].map((option) => (
                      <Card
                        key={option.value}
                        className={`cursor-pointer border-2 ${
                          formData.experience === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200'
                        }`}
                        onClick={() => updateFormData('experience', option.value)}
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-semibold">{option.label}</h4>
                          <p className="text-sm text-gray-600">{option.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Primary Marketing Channels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {['Social Media', 'Email', 'Blog/Content', 'Paid Ads', 'YouTube', 'SEO', 'Webinars', 'Other'].map((channel) => (
                      <Button
                        key={channel}
                        variant={formData.channels.includes(channel) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleChannelToggle(channel)}
                        className="justify-start"
                      >
                        {channel}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!formData.firstName || !formData.lastName}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Commission Structure & Terms */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Commission Structure & Benefits</CardTitle>
              <CardDescription className="text-center">
                Understand your earning potential and program benefits
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Commission Tiers */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-center">Tier-Based Commission Structure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { tier: 'Bronze', rate: '20%', min: '$0', color: 'orange' },
                      { tier: 'Silver', rate: '25%', min: '$1,000', color: 'gray' },
                      { tier: 'Gold', rate: '30%', min: '$5,000', color: 'yellow' },
                      { tier: 'Platinum', rate: '35%', min: '$15,000', color: 'purple' }
                    ].map((tier) => (
                      <Card key={tier.tier} className={`border-2 border-${tier.color}-200 bg-${tier.color}-50`}>
                        <CardContent className="p-4 text-center">
                          <h4 className="font-bold text-lg">{tier.tier}</h4>
                          <div className="text-2xl font-bold text-primary my-2">{tier.rate}</div>
                          <p className="text-sm text-gray-600">Min: {tier.min} revenue</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Key Benefits */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-center">What You Get</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Real-time tracking dashboard</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>30-day cookie attribution</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Monthly payments (min $50)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Dedicated affiliate support</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Premium marketing assets</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Custom tracking links</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Performance analytics</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>No application fees</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earning Examples */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4 text-center">Earning Examples</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">$500/mo</div>
                      <p className="text-sm text-gray-600">5 sales × $50 commission</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">$2,000/mo</div>
                      <p className="text-sm text-gray-600">20 sales × $100 commission</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">$10,000/mo</div>
                      <p className="text-sm text-gray-600">100+ sales × $100+ commission</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  Accept & Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Activate Account */}
        {currentStep === 4 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-8">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Activate Your Affiliate Account</h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  You're one click away from joining our affiliate program and starting to earn commissions!
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="font-bold mb-4">Your Profile Summary:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>Experience:</strong> {formData.experience}</p>
                  </div>
                  <div className="text-left">
                    <p><strong>Company:</strong> {formData.company || 'Individual'}</p>
                    <p><strong>Channels:</strong> {formData.channels.join(', ') || 'Various'}</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={createAffiliateProfile}
                disabled={isRegistering}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRegistering ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activating Account...
                  </>
                ) : (
                  <>
                    Activate My Account
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                By activating your account, you agree to our affiliate terms and conditions
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Dashboard */}
        {currentStep === 5 && affiliateData && (
          <div className="space-y-6">
            {/* Welcome Header */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      🎉 Welcome to the Affiliate Program, {formData.firstName}!
                    </h2>
                    <p className="text-gray-600">
                      Your affiliate account is active and ready to start earning commissions.
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold">${affiliateData.total_earnings.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clicks</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <MousePointer className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversions</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Commission Rate</p>
                      <p className="text-2xl font-bold">{(affiliateData.commission_rate * 100).toFixed(0)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="links" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="links">Referral Links</TabsTrigger>
                <TabsTrigger value="assets">Marketing Assets</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              {/* Referral Links Tab */}
              <TabsContent value="links" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      Your Referral Links
                    </CardTitle>
                    <CardDescription>
                      Use these links to promote Backlink ∞ and earn commissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Homepage Link</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={affiliateData.referral_url}
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(affiliateData.referral_url, 'Homepage link')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Pricing Page Link</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={`${window.location.origin}/pricing?ref=${affiliateData.affiliate_code}`}
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/pricing?ref=${affiliateData.affiliate_code}`, 'Pricing link')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Blog Link</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={`${window.location.origin}/blog?ref=${affiliateData.affiliate_code}`}
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/blog?ref=${affiliateData.affiliate_code}`, 'Blog link')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Start Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Share2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Share on Social Media</h4>
                          <p className="text-sm text-gray-600">Post your referral links on social platforms where your audience is active</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Mail className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Email Your List</h4>
                          <p className="text-sm text-gray-600">Send targeted emails to your subscribers about Backlink ∞'s benefits</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Download className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Use Marketing Assets</h4>
                          <p className="text-sm text-gray-600">Download our professional banners, graphics, and content from the Assets tab</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Marketing Assets Tab */}
              <TabsContent value="assets" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Marketing Assets Library
                    </CardTitle>
                    <CardDescription>
                      Professional marketing materials to boost your conversion rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Homepage Banner 728x90', type: 'Banner', format: 'JPG', size: '728x90' },
                        { name: 'Social Media Square', type: 'Social', format: 'PNG', size: '1080x1080' },
                        { name: 'Email Template', type: 'Email', format: 'HTML', size: 'Responsive' },
                        { name: 'Product Demo Video', type: 'Video', format: 'MP4', size: '1920x1080' },
                        { name: 'Case Study PDF', type: 'Document', format: 'PDF', size: 'A4' },
                        { name: 'Logo Pack', type: 'Assets', format: 'ZIP', size: 'Various' }
                      ].map((asset, index) => (
                        <Card key={index} className="border-2 border-gray-200 hover:border-primary/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                              <Download className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{asset.name}</h4>
                            <p className="text-xs text-gray-600 mb-3">{asset.type} • {asset.format} • {asset.size}</p>
                            <Button size="sm" className="w-full">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Performance Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Clicks</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <Progress value={0} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Conversions</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <Progress value={0} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Conversion Rate</span>
                          <span className="font-semibold">0%</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Getting Started</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 text-sm">
                        <p className="text-gray-600">
                          Start sharing your referral links to see analytics data here. Track:
                        </p>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>Real-time click tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span>Conversion analytics</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-purple-600" />
                            <span>Geographic data</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Get Help
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Affiliate Support
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Knowledge Base
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Join Community Forum
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Play className="w-4 h-4 mr-2" />
                        Affiliate Training Videos
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Best Practices Guide
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Webinar Schedule
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAffiliateProgram;
