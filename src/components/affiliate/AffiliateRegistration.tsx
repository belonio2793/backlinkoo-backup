import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import {
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  Globe,
  Star,
  ArrowRight,
  Award,
  Target,
  Zap,
  Shield,
  Clock,
  FileText,
  ExternalLink,
  Play,
  BookOpen,
  MessageCircle,
  Gift
} from 'lucide-react';
import { affiliateService } from '../../services/affiliateService';

interface AffiliateRegistrationProps {
  userId: string;
  userEmail: string;
  onRegistrationComplete: () => void;
}

interface RegistrationData {
  website?: string;
  socialMedia?: string;
  monthlyTraffic: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  promotionMethods: string[];
  goals: string;
  hasReadTerms: boolean;
  hasReadCommissionStructure: boolean;
  marketingConsent: boolean;
}

export const AffiliateRegistration: React.FC<AffiliateRegistrationProps> = ({
  userId,
  userEmail,
  onRegistrationComplete
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RegistrationData>({
    monthlyTraffic: '',
    experience: 'beginner',
    promotionMethods: [],
    goals: '',
    hasReadTerms: false,
    hasReadCommissionStructure: false,
    marketingConsent: false
  });

  const totalSteps = 4;

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      promotionMethods: prev.promotionMethods.includes(method)
        ? prev.promotionMethods.filter(m => m !== method)
        : [...prev.promotionMethods, method]
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Create affiliate profile
      await affiliateService.createAffiliateProfile(userId, userEmail);
      
      // Store additional registration data (would be saved to database)
      console.log('Registration data:', formData);
      
      toast.success('Welcome to the Backlink ∞ Affiliate Program!');
      onRegistrationComplete();
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 2:
        return formData.monthlyTraffic && formData.experience;
      case 3:
        return formData.promotionMethods.length > 0 && formData.goals.trim();
      case 4:
        return formData.hasReadTerms && formData.hasReadCommissionStructure;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to the Backlink ∞ Affiliate Program
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join thousands of successful affiliates earning substantial commissions by promoting the world's 
                most effective backlink building platform.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">20% Commission</h3>
                <p className="text-gray-600">
                  Earn 20% commission on all subscriptions, with tier-based increases up to 35%
                </p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">30-Day Cookies</h3>
                <p className="text-gray-600">
                  Extended attribution window ensures you get credit for all your referrals
                </p>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Performance Bonuses</h3>
                <p className="text-gray-600">
                  Unlock tier upgrades and bonus rewards based on your performance
                </p>
              </div>
            </div>

            {/* Success Stories */}
            <div className="bg-gradient-to-r from-primary/5 to-blue-50 p-6 rounded-lg border">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Badge className="bg-green-100 text-green-800">Top Performer</Badge>
              </div>
              <blockquote className="text-lg italic text-gray-700 mb-3">
                "I've earned over $15,000 in my first 6 months with Backlink ∞'s affiliate program. 
                The conversion rates are incredible and the support team is amazing!"
              </blockquote>
              <cite className="text-sm text-gray-600">— Sarah K., Digital Marketing Agency Owner</cite>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium">Real-time tracking & analytics</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium">Complete marketing asset library</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium">Dedicated affiliate support</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium">SEO Academy access included</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Your Platform</h2>
              <p className="text-gray-600">
                Help us understand your audience so we can provide the best resources
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website">Website/Blog URL (Optional)</Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social">Primary Social Media (Optional)</Label>
                  <Input
                    id="social"
                    placeholder="@yourusername or channel URL"
                    value={formData.socialMedia || ''}
                    onChange={(e) => handleInputChange('socialMedia', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Traffic/Audience Size</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'under-1k', label: 'Under 1K' },
                    { value: '1k-10k', label: '1K - 10K' },
                    { value: '10k-100k', label: '10K - 100K' },
                    { value: 'over-100k', label: '100K+' }
                  ].map(option => (
                    <Button
                      key={option.value}
                      variant={formData.monthlyTraffic === option.value ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => handleInputChange('monthlyTraffic', option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affiliate Marketing Experience</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'beginner', label: 'Beginner', desc: 'New to affiliate marketing' },
                    { value: 'intermediate', label: 'Intermediate', desc: 'Some experience with affiliate programs' },
                    { value: 'advanced', label: 'Advanced', desc: 'Experienced affiliate marketer' }
                  ].map(option => (
                    <Button
                      key={option.value}
                      variant={formData.experience === option.value ? 'default' : 'outline'}
                      className="flex-col h-auto p-4 space-y-2"
                      onClick={() => handleInputChange('experience', option.value)}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-600">{option.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Promotion Strategy</h2>
              <p className="text-gray-600">
                Select how you plan to promote Backlink ∞ to optimize your success
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>How do you plan to promote Backlink ∞? (Select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'blog', label: 'Blog Content & Reviews', icon: FileText },
                    { id: 'social', label: 'Social Media Marketing', icon: Users },
                    { id: 'email', label: 'Email Marketing', icon: MessageCircle },
                    { id: 'youtube', label: 'YouTube Videos', icon: Play },
                    { id: 'seo', label: 'SEO & Organic Traffic', icon: TrendingUp },
                    { id: 'paid', label: 'Paid Advertising', icon: Target },
                    { id: 'webinar', label: 'Webinars & Online Events', icon: Globe },
                    { id: 'other', label: 'Other Methods', icon: Zap }
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = formData.promotionMethods.includes(method.id);
                    
                    return (
                      <Button
                        key={method.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="justify-start p-4 h-auto"
                        onClick={() => handleMethodToggle(method.id)}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {method.label}
                        {isSelected && <CheckCircle className="w-4 h-4 ml-auto" />}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">What are your affiliate marketing goals?</Label>
                <Textarea
                  id="goals"
                  placeholder="Tell us about your goals, target audience, and how you plan to integrate Backlink ∞ into your content strategy..."
                  rows={4}
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  This helps our team provide personalized support and resources
                </p>
              </div>
            </div>

            {/* Recommended Resources */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Recommended for Your Strategy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.promotionMethods.includes('blog') && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Blog template library & SEO guides
                  </div>
                )}
                {formData.promotionMethods.includes('social') && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Social media content calendar
                  </div>
                )}
                {formData.promotionMethods.includes('email') && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Email sequence templates
                  </div>
                )}
                {formData.promotionMethods.includes('youtube') && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Video marketing assets & scripts
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Registration</h2>
              <p className="text-gray-600">
                Review the terms and commission structure to finalize your application
              </p>
            </div>

            <div className="space-y-6">
              {/* Commission Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Commission Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { tier: 'Bronze', rate: '20%', requirement: 'Default tier' },
                      { tier: 'Silver', rate: '25%', requirement: '$1,000 earnings' },
                      { tier: 'Gold', rate: '30%', requirement: '$5,000 earnings' },
                      { tier: 'Platinum', rate: '35%', requirement: '$10,000 earnings' },
                      { tier: 'Partner', rate: '40%', requirement: 'Invitation only' }
                    ].map(tier => (
                      <div key={tier.tier} className="text-center p-4 bg-gray-50 rounded-lg border">
                        <div className="font-semibold text-lg">{tier.tier}</div>
                        <div className="text-2xl font-bold text-primary">{tier.rate}</div>
                        <div className="text-sm text-gray-600">{tier.requirement}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Additional Benefits:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 30-day cookie duration for maximum attribution</li>
                      <li>• Performance bonuses and milestone rewards</li>
                      <li>• Monthly payout with $50 minimum threshold</li>
                      <li>• Dedicated affiliate support team</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Agreements */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={formData.hasReadTerms}
                    onCheckedChange={(checked) => handleInputChange('hasReadTerms', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="cursor-pointer">
                      I have read and agree to the{' '}
                      <Button variant="link" className="p-0 h-auto text-primary">
                        Affiliate Terms & Conditions
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Label>
                    <p className="text-sm text-gray-600">
                      Review the complete terms governing the affiliate program
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="commission"
                    checked={formData.hasReadCommissionStructure}
                    onCheckedChange={(checked) => handleInputChange('hasReadCommissionStructure', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="commission" className="cursor-pointer">
                      I understand the commission structure and payout terms
                    </Label>
                    <p className="text-sm text-gray-600">
                      Confirm understanding of how commissions are calculated and paid
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <Checkbox
                    id="marketing"
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) => handleInputChange('marketingConsent', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="marketing" className="cursor-pointer">
                      Send me affiliate marketing tips and program updates (Optional)
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive exclusive insights to maximize your affiliate earnings
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Review Note */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Application Review</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your application will be reviewed within 24-48 hours. You'll receive an email 
                      confirmation once approved, along with access to your affiliate dashboard and marketing materials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Affiliate Registration</h1>
          <Badge variant="outline">Step {step} of {totalSteps}</Badge>
        </div>
        <Progress value={(step / totalSteps) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Previous
        </Button>

        <div className="flex gap-3">
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceedToStep(step + 1)}
              className="flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceedToStep(step) || loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Complete Registration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateRegistration;
