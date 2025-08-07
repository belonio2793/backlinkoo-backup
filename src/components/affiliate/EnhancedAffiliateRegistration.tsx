import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useToast } from '@/hooks/use-toast';
import { compatibilityAffiliateService } from '../../services/compatibilityAffiliateService';
import {
  User,
  Building,
  Globe,
  CreditCard,
  Target,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  TrendingUp,
  Users,
  Mail,
  Phone,
  MapPin,
  DollarSign
} from 'lucide-react';

interface RegistrationProps {
  userId: string;
  userEmail: string;
  onRegistrationComplete: () => void;
}

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Business Information
  company: string;
  website: string;
  primaryNiche: string;
  audienceSize: string;
  experienceLevel: string;
  
  // Address Information
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Marketing Information
  marketingChannels: string[];
  howHeard: string;
  marketingStrategy: string;
  
  // Payment Information
  paymentMethod: string;
  paymentDetails: any;
  paymentThreshold: number;
  
  // Terms and Preferences
  agreeToTerms: boolean;
  marketingEmails: boolean;
}

export const EnhancedAffiliateRegistration: React.FC<RegistrationProps> = ({
  userId,
  userEmail,
  onRegistrationComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: userEmail,
    phone: '',
    company: '',
    website: '',
    primaryNiche: '',
    audienceSize: '',
    experienceLevel: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    marketingChannels: [],
    howHeard: '',
    marketingStrategy: '',
    paymentMethod: 'paypal',
    paymentDetails: {},
    paymentThreshold: 50,
    agreeToTerms: false,
    marketingEmails: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarketingChannelChange = (channel: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      marketingChannels: checked
        ? [...prev.marketingChannels, channel]
        : prev.marketingChannels.filter(c => c !== channel)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email);
      case 2:
        return !!(formData.primaryNiche && formData.experienceLevel);
      case 3:
        return !!(formData.addressLine1 && formData.city && formData.country);
      case 4:
        return !!(formData.paymentMethod);
      case 5:
        return formData.agreeToTerms;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast({
        title: "Please agree to the terms",
        description: "You must agree to the terms and conditions to proceed.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await compatibilityAffiliateService.createAffiliateProfile(userId, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        website: formData.website,
        primary_niche: formData.primaryNiche,
        audience_size: parseInt(formData.audienceSize) || 0,
        experience_level: formData.experienceLevel as any,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: formData.country,
        marketing_channels: formData.marketingChannels,
        how_heard: formData.howHeard,
        marketing_strategy: formData.marketingStrategy,
        payment_method: formData.paymentMethod as any,
        payment_details: formData.paymentDetails,
        payment_threshold: formData.paymentThreshold
      });

      toast({
        title: "Application submitted successfully!",
        description: "Your affiliate application is under review. You'll receive an email within 24-48 hours."
      });

      onRegistrationComplete();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Business & Marketing</h2>
              <p className="text-gray-600">Tell us about your business and marketing approach</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              <div>
                <Label htmlFor="primaryNiche">Primary Niche *</Label>
                <Select value={formData.primaryNiche} onValueChange={(value) => updateFormData('primaryNiche', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seo">SEO & Digital Marketing</SelectItem>
                    <SelectItem value="content">Content Marketing</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS & Technology</SelectItem>
                    <SelectItem value="agency">Marketing Agency</SelectItem>
                    <SelectItem value="blogging">Blogging & Publishing</SelectItem>
                    <SelectItem value="social">Social Media Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="audienceSize">Audience Size</Label>
                <Select value={formData.audienceSize} onValueChange={(value) => updateFormData('audienceSize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your audience size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">Less than 1,000</SelectItem>
                    <SelectItem value="5000">1,000 - 5,000</SelectItem>
                    <SelectItem value="25000">5,000 - 25,000</SelectItem>
                    <SelectItem value="100000">25,000 - 100,000</SelectItem>
                    <SelectItem value="500000">100,000 - 500,000</SelectItem>
                    <SelectItem value="1000000">500,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="experienceLevel">Affiliate Marketing Experience *</Label>
                <Select value={formData.experienceLevel} onValueChange={(value) => updateFormData('experienceLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (New to affiliate marketing)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (Some experience)</SelectItem>
                    <SelectItem value="advanced">Advanced (Experienced marketer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Marketing Channels (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {[
                    'social', 'email', 'blog', 'youtube', 'paid-ads', 'seo',
                    'content', 'webinars', 'podcasts', 'influencer', 'affiliate', 'other'
                  ].map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel}
                        checked={formData.marketingChannels.includes(channel)}
                        onCheckedChange={(checked) => handleMarketingChannelChange(channel, checked as boolean)}
                      />
                      <Label htmlFor={channel} className="capitalize text-sm">
                        {channel.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Address Information</h2>
              <p className="text-gray-600">We need your address for tax purposes and payments</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => updateFormData('addressLine1', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2}
                  onChange={(e) => updateFormData('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Payment Preferences</h2>
              <p className="text-gray-600">Choose how you'd like to receive your commissions</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Payment Method *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[
                    { value: 'paypal', label: 'PayPal', desc: 'Fast and secure payments' },
                    { value: 'stripe', label: 'Bank Transfer (Stripe)', desc: 'Direct to your bank account' },
                    { value: 'crypto', label: 'Cryptocurrency', desc: 'Bitcoin, Ethereum, USDC' },
                    { value: 'bank', label: 'Wire Transfer', desc: 'Traditional bank wire' }
                  ].map((method) => (
                    <Card
                      key={method.value}
                      className={`cursor-pointer border-2 ${
                        formData.paymentMethod === method.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      }`}
                      onClick={() => updateFormData('paymentMethod', method.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.paymentMethod === method.value
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                          }`} />
                          <div>
                            <h4 className="font-semibold">{method.label}</h4>
                            <p className="text-sm text-gray-600">{method.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {formData.paymentMethod === 'paypal' && (
                <div>
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    placeholder="your-paypal@email.com"
                    onChange={(e) => updateFormData('paymentDetails', { email: e.target.value })}
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="paymentThreshold">Minimum Payment Threshold</Label>
                <Select 
                  value={formData.paymentThreshold.toString()} 
                  onValueChange={(value) => updateFormData('paymentThreshold', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">$25</SelectItem>
                    <SelectItem value="50">$50 (Recommended)</SelectItem>
                    <SelectItem value="100">$100</SelectItem>
                    <SelectItem value="250">$250</SelectItem>
                    <SelectItem value="500">$500</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  Commissions will be held until they reach this threshold
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <p className="text-gray-600">Review your information and submit your application</p>
            </div>
            
            <div className="space-y-6">
              {/* Application Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Primary Niche:</span>
                    <span className="capitalize">{formData.primaryNiche.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Experience Level:</span>
                    <span className="capitalize">{formData.experienceLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Method:</span>
                    <span className="capitalize">{formData.paymentMethod}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Program Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>What You'll Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span>20-35% recurring commissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>30-day cookie tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Real-time analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span>Premium marketing assets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => updateFormData('agreeToTerms', checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="agreeToTerms" className="text-sm font-medium">
                      I agree to the Terms and Conditions *
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      By checking this box, you agree to our{' '}
                      <a href="/affiliate-terms" className="text-primary underline">
                        Affiliate Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary underline">
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketingEmails"
                    checked={formData.marketingEmails}
                    onCheckedChange={(checked) => updateFormData('marketingEmails', checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="marketingEmails" className="text-sm font-medium">
                      Send me affiliate marketing tips and updates
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Receive exclusive insights to maximize your earnings (optional)
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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Affiliate Program Application</h1>
            <Badge variant="outline">Step {currentStep} of {totalSteps}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
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
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreeToTerms}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAffiliateRegistration;
