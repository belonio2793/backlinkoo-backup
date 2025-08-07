import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { affiliateService } from '../services/affiliateService';
import AffiliateDashboard from '../components/affiliate/AffiliateDashboard';
import AffiliateRegistration from '../components/affiliate/AffiliateRegistration';
import AffiliateAssetLibrary from '../components/affiliate/AffiliateAssetLibrary';
import AffiliateSetupGuide from '../components/AffiliateSetupGuide';
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Award,
  Target,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Globe,
  BarChart3,
  Gift,
  Rocket,
  Crown,
  Infinity,
  ExternalLink,
  Play,
  Download,
  Mail,
  Calendar
} from 'lucide-react';

export const AffiliateProgram: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [affiliateProfile, setAffiliateProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);

  useEffect(() => {
    if (user) {
      checkAffiliateStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkAffiliateStatus = async () => {
    try {
      setLoading(true);
      setDatabaseError(false);
      const profile = await affiliateService.getAffiliateProfile(user.id);
      setAffiliateProfile(profile);
    } catch (error) {
      console.error('Failed to check affiliate status:', error);
      if (error.message && error.message.includes('not set up yet')) {
        setDatabaseError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    checkAffiliateStatus();
  };

  // If user is not logged in, show public affiliate program landing
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50 py-20">
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

          {/* Success Stories */}
          <div className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-2xl p-8 mb-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h3>
              <p className="text-gray-600">Real affiliates, real earnings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    SM
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Martinez</h4>
                    <p className="text-sm text-gray-600">Digital Marketing Agency</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "I've earned over $15,000 in my first 6 months. The conversion rates are incredible 
                  and the support team is amazing!"
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">$15,247 earned</span>
                  <span className="text-gray-500">Platinum Tier</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    MJ
                  </div>
                  <div>
                    <h4 className="font-semibold">Mike Johnson</h4>
                    <p className="text-sm text-gray-600">SEO Consultant</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Backlink ∞'s affiliate program is the best I've ever joined. High commissions, 
                  great tools, and the product sells itself."
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">$8,932 earned</span>
                  <span className="text-gray-500">Gold Tier</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    LC
                  </div>
                  <div>
                    <h4 className="font-semibold">Lisa Chen</h4>
                    <p className="text-sm text-gray-600">Content Creator</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Perfect for content creators. The asset library saves me hours, and the 
                  commissions are consistently growing month over month."
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">$12,456 earned</span>
                  <span className="text-gray-500">Gold Tier</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Real-Time Analytics</h4>
              <p className="text-sm text-gray-600">Track clicks, conversions, and earnings in real-time</p>
            </div>
            
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Fraud Protection</h4>
              <p className="text-sm text-gray-600">Advanced fraud detection keeps your earnings secure</p>
            </div>
            
            <div className="text-center p-6">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Global Reach</h4>
              <p className="text-sm text-gray-600">Promote to customers worldwide with multi-currency support</p>
            </div>
            
            <div className="text-center p-6">
              <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Bonus Rewards</h4>
              <p className="text-sm text-gray-600">Unlock milestone bonuses and special promotions</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gray-900 text-white rounded-2xl p-12">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Ready to Start Earning?</h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of successful affiliates who are already earning substantial 
              monthly income with Backlink ∞'s industry-leading affiliate program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
                onClick={() => navigate('/auth')}
              >
                Start Earning Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-gray-900">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show registration if user doesn't have affiliate profile
  if (!affiliateProfile && !showRegistration) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Infinity className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to the Backlink ∞ Affiliate Program
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              You're one step away from joining our exclusive affiliate program. 
              Complete the registration process to start earning commissions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Earn 20-35%</h3>
                <p className="text-sm text-gray-600">Recurring commissions on all referrals</p>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">30-Day Tracking</h3>
                <p className="text-sm text-gray-600">Extended attribution window</p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Premium Support</h3>
                <p className="text-sm text-gray-600">Dedicated affiliate success team</p>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={() => setShowRegistration(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Registration
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show registration form
  if (showRegistration) {
    return (
      <div className="min-h-screen bg-background">
        <AffiliateRegistration
          userId={user.id}
          userEmail={user.email}
          onRegistrationComplete={handleRegistrationComplete}
        />
      </div>
    );
  }

  // Show affiliate dashboard for existing affiliates
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="dashboard" className="max-w-7xl mx-auto">
        <div className="border-b bg-white sticky top-0 z-40">
          <div className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-0">
          <AffiliateDashboard userId={user.id} />
        </TabsContent>

        <TabsContent value="assets" className="mt-0">
          <AffiliateAssetLibrary 
            affiliateId={affiliateProfile.affiliate_id}
            affiliateCode={affiliateProfile.affiliate_id}
          />
        </TabsContent>

        <TabsContent value="support" className="mt-0">
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Support</CardTitle>
                <CardDescription>
                  Get help with your affiliate journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5" />
                        Training Resources
                      </h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Play className="w-4 h-4 mr-2" />
                          Affiliate Marketing Masterclass
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="w-4 h-4 mr-2" />
                          Best Practices Guide
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics Deep Dive
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Get Help
                      </h4>
                      <div className="space-y-2">
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
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateProgram;
