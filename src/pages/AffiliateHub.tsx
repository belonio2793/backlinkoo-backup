import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { AffiliateSystemSetup } from '../components/AffiliateSystemSetup';
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
  Infinity,
  Link,
  Settings,
  PieChart,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

// Types for our affiliate system
interface AffiliateProfile {
  id: string;
  user_id: string;
  affiliate_code: string;
  custom_id: string;
  status: 'active' | 'pending' | 'suspended';
  commission_rate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  total_earnings: number;
  total_paid: number;
  pending_earnings: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  referral_url: string;
  created_at: string;
  updated_at: string;
}

interface DashboardMetrics {
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  todayConversions: number;
  weekConversions: number;
  monthConversions: number;
  epc: number; // Earnings per click
  topSources: Array<{ source: string; clicks: number }>;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
}

const AffiliateHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [affiliateProfile, setAffiliateProfile] = useState<AffiliateProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  // Load affiliate data
  useEffect(() => {
    if (user) {
      loadAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      
      // Check if user has affiliate profile
      const { data: profile, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading affiliate profile:', error);
        throw error;
      }

      if (profile) {
        setAffiliateProfile(profile);
        await loadMetrics(profile.affiliate_code);
      }
    } catch (error: any) {
      console.error('Failed to load affiliate data:', error);
      if (error.message?.includes('does not exist')) {
        // Table doesn't exist, but that's ok - user just needs to join
        console.log('Affiliate table not found - user needs to join program');
      } else {
        toast({
          title: "Error loading data",
          description: "Please refresh the page",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (affiliateCode: string) => {
    // Mock metrics for now - in real implementation would query actual data
    const mockMetrics: DashboardMetrics = {
      todayClicks: Math.floor(Math.random() * 20) + 5,
      weekClicks: Math.floor(Math.random() * 100) + 50,
      monthClicks: Math.floor(Math.random() * 400) + 200,
      todayEarnings: Math.floor(Math.random() * 50) + 10,
      weekEarnings: Math.floor(Math.random() * 200) + 100,
      monthEarnings: Math.floor(Math.random() * 800) + 400,
      todayConversions: Math.floor(Math.random() * 3) + 1,
      weekConversions: Math.floor(Math.random() * 10) + 5,
      monthConversions: Math.floor(Math.random() * 40) + 20,
      epc: (Math.random() * 2) + 0.5,
      topSources: [
        { source: 'Direct', clicks: 45 },
        { source: 'Social Media', clicks: 32 },
        { source: 'Email', clicks: 18 },
        { source: 'Blog', clicks: 12 }
      ],
      deviceBreakdown: {
        mobile: 45,
        desktop: 40,
        tablet: 15
      }
    };
    setMetrics(mockMetrics);
  };

  const generateAffiliateCode = () => {
    const prefix = 'BL';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const generateCustomId = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const joinAffiliateProgram = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join the affiliate program",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    try {
      console.log('👤 User attempting to join affiliate program:', user.id);

      const affiliateCode = generateAffiliateCode();
      const customId = generateCustomId();
      const referralUrl = `${window.location.origin}?ref=${affiliateCode}`;

      console.log('📝 Attempting to create affiliate profile with data:', {
        user_id: user.id,
        affiliate_code: affiliateCode,
        custom_id: customId,
        status: 'active',
        commission_rate: 0.20,
        referral_url: referralUrl
      });

      // Create affiliate profile
      const { data, error } = await supabase
        .from('affiliate_programs')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          custom_id: customId,
          status: 'active',
          commission_rate: 0.20, // 20% default
          total_earnings: 0,
          total_paid: 0,
          pending_earnings: 0,
          referral_url: referralUrl
        })
        .select()
        .single();

      console.log('📊 Insert result:', { data, error });

      if (error) {
        // Enhanced error logging and handling
        console.error('❌ Supabase error joining affiliate program:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', JSON.stringify(error, null, 2));

        // Extract meaningful error message
        let errorMessage = 'Unknown database error';

        if (error.code === '42P01') {
          errorMessage = 'Affiliate system is not set up yet. Please contact an administrator to enable the affiliate program.';
          console.log('💡 Table does not exist - admin needs to run migration');
        } else if (error.code === '23505') {
          errorMessage = 'You already have an affiliate account. Please refresh the page.';
        } else if (error.code === '23503') {
          errorMessage = 'Authentication error. Please sign out and sign back in.';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied. Please contact support.';
        } else if (error.message && error.message.trim()) {
          errorMessage = error.message;
        } else if (error.details && error.details.trim()) {
          errorMessage = error.details;
        } else if (error.hint && error.hint.trim()) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error code: ${error.code}`;
        }

        throw new Error(errorMessage);
      }

      console.log('✅ Affiliate profile created successfully:', data);
      setAffiliateProfile(data);
      await loadMetrics(affiliateCode);

      toast({
        title: "🎉 Welcome to the Affiliate Program!",
        description: "Your account is active and ready to earn commissions!"
      });
    } catch (error: any) {
      console.error('❌ Error joining affiliate program:', error);
      toast({
        title: "Join failed",
        description: error.message || "Unknown error occurred. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      diamond: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getTierIcon = (tier: string) => {
    const icons = {
      bronze: <Award className="w-4 h-4" />,
      silver: <Star className="w-4 h-4" />,
      gold: <Crown className="w-4 h-4" />,
      platinum: <Zap className="w-4 h-4" />,
      diamond: <Gift className="w-4 h-4" />
    };
    return icons[tier as keyof typeof icons] || icons.bronze;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  // Show sign in prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mb-8">
              <Infinity className="w-16 h-16 text-primary mx-auto mb-6" />
              <Badge className="mb-6 bg-green-100 text-green-800 border-green-200">
                🚀 Join 1000+ Successful Affiliates
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Earn <span className="text-primary">$10,000+</span> Monthly
              <br />
              with Backlinkoo Affiliate Program
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join the most lucrative affiliate program in the SEO industry. Earn up to 35% 
              recurring commissions promoting the world's leading backlink building platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="text-lg px-8 py-3"
                onClick={() => navigate('/login')}
              >
                Join Now - Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-8 text-center">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Up to 35% Commission</h3>
                  <p className="text-gray-600 mb-4">
                    Start at 20% and earn up to 35% recurring commissions
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
                    Extended attribution window ensures maximum earnings
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
                  <h3 className="text-2xl font-bold mb-4">Premium Tools</h3>
                  <p className="text-gray-600 mb-4">
                    Complete marketing toolkit and dedicated support
                  </p>
                  <div className="space-y-2 text-sm text-purple-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Marketing asset library</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Real-time analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Dedicated support team</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="bg-gray-900 text-white rounded-2xl p-12">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-4">Ready to Start Earning?</h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of successful affiliates earning substantial monthly income
              </p>
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
                onClick={() => navigate('/login')}
              >
                Start Earning Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show join program interface for users without affiliate profile
  if (!affiliateProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <Infinity className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Join the Backlinkoo Affiliate Program</h1>
            <p className="text-gray-600">Start earning commissions by promoting the world's leading SEO platform</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">You're Almost Ready!</h2>
                  <p className="text-gray-600">
                    Click below to activate your affiliate account and start earning 20% recurring commissions
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold">20% Commission</h4>
                    <p className="text-sm text-gray-600">Starting rate</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold">30-Day Tracking</h4>
                    <p className="text-sm text-gray-600">Cookie duration</p>
                  </div>
                  <div className="text-center">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold">Real-Time Stats</h4>
                    <p className="text-sm text-gray-600">Live dashboard</p>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={joinAffiliateProgram}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activating Account...
                    </>
                  ) : (
                    <>
                      Activate My Affiliate Account
                      <CheckCircle className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  No approval required • Instant activation • Start earning immediately
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main affiliate dashboard for active affiliates
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-3">
              <Infinity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.email?.split('@')[0]}!</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <Badge className={`${getTierColor(affiliateProfile.tier || 'bronze')} border`}>
                {getTierIcon(affiliateProfile.tier || 'bronze')}
                <span className="ml-1 capitalize">{affiliateProfile.tier || 'Bronze'} Affiliate</span>
              </Badge>
              <Badge variant={affiliateProfile.status === 'active' ? 'default' : 'secondary'}>
                {affiliateProfile.status === 'active' ? 'Active' : 'Pending'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(affiliateProfile.total_earnings)}</p>
                  <p className="text-sm text-green-600">
                    +{formatCurrency(metrics?.monthEarnings || 0)} this month
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold">{affiliateProfile.total_clicks || metrics?.monthClicks || 0}</p>
                  <p className="text-sm text-blue-600">
                    +{metrics?.todayClicks || 0} today
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <MousePointer className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold">{affiliateProfile.total_conversions || metrics?.monthConversions || 0}</p>
                  <p className="text-sm text-purple-600">
                    {((affiliateProfile.conversion_rate || 2.5) * 100).toFixed(1)}% rate
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">EPC</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.epc || 0.75)}</p>
                  <p className="text-sm text-orange-600">
                    Earnings per click
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Links & Tools</TabsTrigger>
            <TabsTrigger value="assets">Marketing Assets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referral Links Quick Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Quick Links
                  </CardTitle>
                  <CardDescription>Your most important referral links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">Homepage Link</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={affiliateProfile.referral_url}
                        readOnly
                        className="bg-gray-50 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(affiliateProfile.referral_url, 'Homepage link')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600">Pricing Link</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={`${window.location.origin}/pricing?ref=${affiliateProfile.affiliate_code}`}
                        readOnly
                        className="bg-gray-50 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}/pricing?ref=${affiliateProfile.affiliate_code}`, 'Pricing link')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Overview
                  </CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Clicks</span>
                      <span className="font-semibold">{metrics?.monthClicks || 0}</span>
                    </div>
                    <Progress value={Math.min((metrics?.monthClicks || 0) / 10, 100)} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversions</span>
                      <span className="font-semibold">{metrics?.monthConversions || 0}</span>
                    </div>
                    <Progress value={Math.min((metrics?.monthConversions || 0) * 10, 100)} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Earnings</span>
                      <span className="font-semibold">{formatCurrency(metrics?.monthEarnings || 0)}</span>
                    </div>
                    <Progress value={Math.min((metrics?.monthEarnings || 0) / 50, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with these essential tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                    <Share2 className="w-6 h-6 mb-2 text-blue-600" />
                    <span className="font-semibold">Share Links</span>
                    <span className="text-xs text-gray-600">Start promoting today</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                    <Download className="w-6 h-6 mb-2 text-green-600" />
                    <span className="font-semibold">Get Assets</span>
                    <span className="text-xs text-gray-600">Download banners & graphics</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                    <BarChart3 className="w-6 h-6 mb-2 text-purple-600" />
                    <span className="font-semibold">View Analytics</span>
                    <span className="text-xs text-gray-600">Track your performance</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links & Tools Tab */}
          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Referral Links & Tools
                </CardTitle>
                <CardDescription>
                  Generate and customize your affiliate links for maximum conversions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Referral Links */}
                <div>
                  <h3 className="font-semibold mb-4">Primary Referral Links</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Homepage', url: affiliateProfile.referral_url, desc: 'Main landing page - highest converting' },
                      { label: 'Pricing Page', url: `${window.location.origin}/pricing?ref=${affiliateProfile.affiliate_code}`, desc: 'Direct to pricing - ready to buy visitors' },
                      { label: 'Blog', url: `${window.location.origin}/blog?ref=${affiliateProfile.affiliate_code}`, desc: 'Content marketing - educational approach' },
                      { label: 'Free Trial', url: `${window.location.origin}/trial?ref=${affiliateProfile.affiliate_code}`, desc: 'Free trial signup - low barrier entry' }
                    ].map((link, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{link.label}</h4>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(link.url, link.label)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{link.desc}</p>
                        <Input value={link.url} readOnly className="bg-gray-50 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* UTM Builder */}
                <div>
                  <h3 className="font-semibold mb-4">Custom UTM Builder</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="utmSource">Source</Label>
                          <Input id="utmSource" placeholder="facebook, email, blog" />
                        </div>
                        <div>
                          <Label htmlFor="utmMedium">Medium</Label>
                          <Input id="utmMedium" placeholder="social, email, organic" />
                        </div>
                        <div>
                          <Label htmlFor="utmCampaign">Campaign</Label>
                          <Input id="utmCampaign" placeholder="spring-sale-2024" />
                        </div>
                        <div>
                          <Label htmlFor="utmContent">Content</Label>
                          <Input id="utmContent" placeholder="banner-ad, text-link" />
                        </div>
                      </div>
                      <Button className="w-full">
                        Generate Custom Link
                      </Button>
                    </CardContent>
                  </Card>
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
                    { name: 'Homepage Banner 728x90', type: 'Display Banner', format: 'JPG', size: '728x90px', downloads: 1247 },
                    { name: 'Social Media Square', type: 'Social Media', format: 'PNG', size: '1080x1080px', downloads: 892 },
                    { name: 'Email Template', type: 'Email Marketing', format: 'HTML', size: 'Responsive', downloads: 567 },
                    { name: 'Product Demo Video', type: 'Video Content', format: 'MP4', size: '1920x1080px', downloads: 234 },
                    { name: 'Case Study Pack', type: 'Content', format: 'PDF', size: 'Various', downloads: 456 },
                    { name: 'Logo & Brand Kit', type: 'Branding', format: 'ZIP', size: 'Multiple', downloads: 789 }
                  ].map((asset, index) => (
                    <Card key={index} className="border-2 border-gray-200 hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-md mb-3 flex items-center justify-center">
                          <Download className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{asset.name}</h4>
                        <p className="text-xs text-gray-600 mb-1">{asset.type} • {asset.format}</p>
                        <p className="text-xs text-gray-500 mb-3">{asset.size} • {asset.downloads} downloads</p>
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
              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.topSources?.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{source.source}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(source.clicks / 100) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold w-8">{source.clicks}</span>
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-sm">No data yet</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Device Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { device: 'Mobile', icon: Smartphone, count: metrics?.deviceBreakdown?.mobile || 0 },
                      { device: 'Desktop', icon: Monitor, count: metrics?.deviceBreakdown?.desktop || 0 },
                      { device: 'Tablet', icon: Tablet, count: metrics?.deviceBreakdown?.tablet || 0 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm">{item.device}</span>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{metrics?.epc ? formatCurrency(metrics.epc) : '$0.00'}</div>
                    <div className="text-sm text-gray-600">Earnings Per Click</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{((affiliateProfile.conversion_rate || 0) * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(affiliateProfile.total_earnings / Math.max(affiliateProfile.total_conversions, 1) || 0)}</div>
                    <div className="text-sm text-gray-600">Avg. Commission</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{(affiliateProfile.commission_rate * 100).toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Commission Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <CardDescription>Contact our affiliate support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support Team
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Knowledge Base
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Community Forum
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Resources & Training
                  </CardTitle>
                  <CardDescription>Learn to maximize your earnings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="w-4 h-4 mr-2" />
                    Training Videos
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Marketing Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Webinar Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Affiliate Code</Label>
                      <div className="flex gap-2">
                        <Input value={affiliateProfile.affiliate_code} readOnly className="bg-gray-50" />
                        <Button size="sm" onClick={() => copyToClipboard(affiliateProfile.affiliate_code, 'Affiliate code')}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Custom ID</Label>
                      <Input value={affiliateProfile.custom_id} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Commission Rate</Label>
                      <Input value={`${(affiliateProfile.commission_rate * 100).toFixed(0)}%`} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Member Since</Label>
                      <Input value={new Date(affiliateProfile.created_at).toLocaleDateString()} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AffiliateHub;
