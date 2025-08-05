import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SEOAcademyTab } from '@/components/SEOAcademyTab';
import { PremiumCheckoutModal } from '@/components/PremiumCheckoutModal';
import { CompleteCourseExperience } from '@/components/CompleteCourseExperience';
import {
  Crown,
  Star,
  Zap,
  TrendingUp,
  BookOpen,
  Shield,
  Infinity,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';

interface PremiumPlanTabProps {
  isSubscribed: boolean;
  onUpgrade: () => void;
}

export function PremiumPlanTab({ isSubscribed, onUpgrade }: PremiumPlanTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeFeature, setActiveFeature] = useState('overview');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Debug logging
  console.log('PremiumPlanTab render - isCheckoutOpen:', isCheckoutOpen);

  const premiumFeatures = [
    {
      icon: <Infinity className="h-6 w-6" />,
      title: "Unlimited Backlinks",
      description: "Create unlimited high-quality backlinks without credit restrictions",
      value: "∞ Backlinks/month"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Complete SEO Academy",
      description: "Access to comprehensive SEO course with 50+ lessons and certifications",
      value: "50+ Lessons"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Advanced Analytics",
      description: "Detailed performance tracking, competitor analysis, and ranking insights",
      value: "Pro Analytics"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Priority Support",
      description: "24/7 priority customer support with dedicated account manager",
      value: "24/7 Support"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "White-Hat Guarantee",
      description: "100% safe, Google-compliant backlinks with quality guarantee",
      value: "Safe & Secure"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Custom Campaigns",
      description: "Personalized backlink strategies tailored to your niche and goals",
      value: "Custom Strategy"
    }
  ];

  const comparisonData = [
    { feature: "Backlinks per month", free: "10", premium: "Unlimited" },
    { feature: "SEO Course Access", free: "❌", premium: "✅ Full Access" },
    { feature: "Advanced Analytics", free: "Basic", premium: "Full Suite" },
    { feature: "Priority Support", free: "Email only", premium: "24/7 Priority" },
    { feature: "Custom Reports", free: "❌", premium: "✅ Unlimited" },
    { feature: "API Access", free: "❌", premium: "✅ Full API" },
    { feature: "White-label Options", free: "❌", premium: "✅ Available" },
    { feature: "Account Manager", free: "❌", premium: "✅ Dedicated" }
  ];

  const handleUpgrade = () => {
    console.log('PremiumPlanTab handleUpgrade called, isCheckoutOpen will be set to true');
    setIsCheckoutOpen(true);
    console.log('isCheckoutOpen state updated');
  };

  const handleCheckoutSuccess = () => {
    toast({
      title: "Welcome to Premium!",
      description: "Your subscription is now active. Enjoy all premium features!",
    });
    onUpgrade();
  };

  return (
    <div className="space-y-8">
      {/* Premium Active Dashboard for subscribed users */}
      {isSubscribed && (
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-8 w-8 text-yellow-300" />
              <Badge className="bg-green-500 text-white px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Premium Active
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Premium Dashboard
            </h1>

            <p className="text-xl text-purple-100 mb-6 max-w-2xl">
              You're all set! Enjoy unlimited backlinks, complete SEO Academy access, and all premium features.
            </p>

            <div className="flex items-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">∞</div>
                <div className="text-purple-200">backlinks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-purple-200">SEO lessons</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-purple-200">support</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setActiveFeature('seo-academy')}
                size="lg"
                className="bg-white hover:bg-gray-100 text-purple-900 font-semibold px-6 py-3"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Access SEO Academy
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard?tab=campaigns'}
                size="lg"
                variant="outline"
                className="border-purple-900 text-purple-900 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-purple-900 font-semibold px-6 py-3"
              >
                <Infinity className="mr-2 h-5 w-5" />
                Create Campaigns
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Hidden for premium users */}
      {!isSubscribed && (
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-8 w-8 text-yellow-300" />
              <Badge className="bg-yellow-300 text-purple-900 px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium Plan
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Unlock Your SEO Potential
            </h1>

            <p className="text-xl text-purple-100 mb-6 max-w-2xl">
              Get unlimited backlinks, exclusive SEO training, and premium tools to dominate search rankings.
            </p>

            <div className="flex items-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">$29</div>
                <div className="text-purple-200">per month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">∞</div>
                <div className="text-purple-200">backlinks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-purple-200">SEO lessons</div>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-semibold px-8 py-4 text-lg"
            >
              <Crown className="mr-2 h-5 w-5" />
              Upgrade to Premium
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeFeature} onValueChange={setActiveFeature} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Features Overview</TabsTrigger>
          <TabsTrigger value="comparison">Plan Comparison</TabsTrigger>
          <TabsTrigger value="seo-academy">SEO Academy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">{feature.value}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Value Proposition */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                ROI Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">$29</div>
                  <div className="text-sm text-gray-600">Monthly Investment</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">$2,000+</div>
                  <div className="text-sm text-gray-600">Value of Services</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">6,900%</div>
                  <div className="text-sm text-gray-600">ROI Potential</div>
                </div>
              </div>
              <p className="text-center text-gray-700">
                Premium members typically see 3-5x organic traffic increase within 90 days
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Free vs Premium Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <span>Free Plan</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span>Premium Plan</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{row.feature}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{row.free}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-green-600 font-semibold">{row.premium}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo-academy" className="space-y-6">
          <CompleteCourseExperience isPremium={isSubscribed} onUpgrade={handleUpgrade} />
        </TabsContent>
      </Tabs>

      {/* Bottom CTA - Hidden for premium users */}
      {!isSubscribed && (
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your SEO?</h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join thousands of successful marketers who've upgraded their SEO game with our Premium Plan.
            </p>
            <Button
              onClick={handleUpgrade}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-semibold px-8 py-4"
            >
              <Crown className="mr-2 h-5 w-5" />
              Start Premium Today
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Checkout Modal */}
      <PremiumCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
