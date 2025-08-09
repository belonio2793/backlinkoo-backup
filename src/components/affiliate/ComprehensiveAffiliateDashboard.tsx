import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { useToast } from '@/hooks/use-toast';
import { compatibilityAffiliateService } from '../../services/compatibilityAffiliateService';
import ReferredUsersSimple from './ReferredUsersSimple';
import {
  DollarSign,
  Users,
  TrendingUp,
  MousePointer,
  Target,
  Award,
  Copy,
  Download,
  ExternalLink,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Eye,
  Share2,
  Gift,
  Star,
  Crown,
  Zap
} from 'lucide-react';

interface DashboardProps {
  userId: string;
}

export const ComprehensiveAffiliateDashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [affiliateProfile, setAffiliateProfile] = useState<any>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [marketingAssets, setMarketingAssets] = useState<any[]>([]);
  const [commissionTiers, setCommissionTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // days
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [userId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load affiliate profile
      const profile = await compatibilityAffiliateService.getAffiliateProfile(userId);
      if (!profile) {
        throw new Error('Affiliate profile not found');
      }
      setAffiliateProfile(profile);

      // Load dashboard metrics
      const metrics = await compatibilityAffiliateService.getDashboardMetrics(profile.affiliate_code);
      setDashboardMetrics(metrics);

      // Load analytics for selected period
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString();
      const analyticsData = await compatibilityAffiliateService.getAffiliateAnalytics(profile.affiliate_code, startDate, endDate);
      setAnalytics(analyticsData);

      // Load marketing assets
      const assets = await compatibilityAffiliateService.getMarketingAssets(profile.tier);
      setMarketingAssets(assets);

      // Load commission tiers
      const tiers = await compatibilityAffiliateService.getCommissionTiers();
      setCommissionTiers(tiers);

    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = (baseUrl: string = 'https://backlinkoo.com') => {
    if (!affiliateProfile) return '';
    return compatibilityAffiliateService.generateTrackingLink(affiliateProfile.affiliate_code, baseUrl);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadAsset = async (assetId: string) => {
    try {
      const downloadUrl = await compatibilityAffiliateService.downloadAsset(assetId, affiliateProfile.affiliate_code);
      window.open(downloadUrl, '_blank');
      
      toast({
        title: "Asset downloaded",
        description: "Marketing asset downloaded with your affiliate tracking",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!affiliateProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Affiliate Profile Not Found</h3>
            <p className="text-gray-600">Please contact support to set up your affiliate account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {affiliateProfile.first_name}!</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Badge className={`${getTierColor(affiliateProfile.tier)} border`}>
                {getTierIcon(affiliateProfile.tier)}
                <span className="ml-1 capitalize">{affiliateProfile.tier} Affiliate</span>
              </Badge>
              <Badge variant={affiliateProfile.status === 'active' ? 'default' : 'secondary'}>
                {affiliateProfile.status === 'active' ? 'Active' : 'Pending Approval'}
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
                  <p className="text-3xl font-bold">{formatCurrency(affiliateProfile.total_earnings)}</p>
                  <p className="text-sm text-green-600">
                    +{formatCurrency(dashboardMetrics?.thisMonth?.commission || 0)} this month
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
                  <p className="text-3xl font-bold">{dashboardMetrics?.totalClicks || 0}</p>
                  <p className="text-sm text-blue-600">
                    +{dashboardMetrics?.today?.clicks || 0} today
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
                  <p className="text-3xl font-bold">{affiliateProfile.total_conversions}</p>
                  <p className="text-sm text-purple-600">
                    {formatPercentage(dashboardMetrics?.conversionRate || 0)} rate
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
                  <p className="text-sm font-medium text-gray-600">Commission Rate</p>
                  <p className="text-3xl font-bold">{formatPercentage(affiliateProfile.commission_rate)}</p>
                  <p className="text-sm text-orange-600">
                    {affiliateProfile.tier} tier
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="referred">Referred Users</TabsTrigger>
            <TabsTrigger value="links">Links & UTMs</TabsTrigger>
            <TabsTrigger value="assets">Marketing Assets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tiers">Tiers & Rewards</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referral Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Your Referral Links
                  </CardTitle>
                  <CardDescription>Share these links to earn commissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Homepage Link</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={generateReferralLink()}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(generateReferralLink(), 'Homepage link')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Pricing Page Link</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={generateReferralLink('/pricing')}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(generateReferralLink('/pricing'), 'Pricing link')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Blog Link</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={generateReferralLink('/blog')}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(generateReferralLink('/blog'), 'Blog link')}
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
                  <CardDescription>Last 30 days performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Clicks</span>
                      <span className="font-semibold">{analytics?.clicks || 0}</span>
                    </div>
                    <Progress value={(analytics?.clicks || 0) / 100} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversions</span>
                      <span className="font-semibold">{analytics?.conversions || 0}</span>
                    </div>
                    <Progress value={(analytics?.conversions || 0) / 10} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Commission</span>
                      <span className="font-semibold">{formatCurrency(analytics?.commission || 0)}</span>
                    </div>
                    <Progress value={(analytics?.commission || 0) / 1000} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="bg-green-100 p-2 rounded-full">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New conversion recorded</p>
                      <p className="text-xs text-gray-600">$50 commission earned • 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">15 new clicks today</p>
                      <p className="text-xs text-gray-600">Great performance! • 4 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referred Users Tab */}
          <TabsContent value="referred" className="space-y-6">
            <ReferredUsers
              affiliateId={affiliateProfile.affiliate_id}
              affiliateCode={affiliateProfile.affiliate_id}
            />
          </TabsContent>

          {/* Links & UTMs Tab */}
          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom UTM Link Generator</CardTitle>
                <CardDescription>Create custom tracking links for your campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Source</label>
                    <input
                      type="text"
                      placeholder="facebook, email, blog"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Campaign Medium</label>
                    <input
                      type="text"
                      placeholder="social, email, content"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Campaign Name</label>
                    <input
                      type="text"
                      placeholder="spring-sale-2024"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Campaign Term</label>
                    <input
                      type="text"
                      placeholder="backlink software"
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button className="w-full md:w-auto">
                    Generate Custom Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketingAssets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={asset.file_url}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center text-gray-500">
                      <Download className="w-8 h-8 mb-2" />
                      <span className="text-sm">{asset.asset_type}</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{asset.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{asset.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {asset.dimensions}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => downloadAsset(asset.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{asset.download_count} downloads</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {Object.entries(analytics?.device_breakdown || {}).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {device === 'mobile' && <Smartphone className="w-4 h-4" />}
                          {device === 'desktop' && <Monitor className="w-4 h-4" />}
                          {device === 'tablet' && <Tablet className="w-4 h-4" />}
                          <span className="capitalize">{device}</span>
                        </div>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Top Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.top_sources?.map((source: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{source.source}</span>
                        <span className="font-semibold">{source.count}</span>
                      </div>
                    )) || <p className="text-gray-500 text-sm">No data available</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tiers & Rewards Tab */}
          <TabsContent value="tiers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commissionTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`${
                    tier.tier_name === affiliateProfile.tier
                      ? 'ring-2 ring-primary shadow-lg'
                      : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize flex items-center gap-2">
                        {getTierIcon(tier.tier_name)}
                        {tier.tier_name}
                      </CardTitle>
                      {tier.tier_name === affiliateProfile.tier && (
                        <Badge>Current</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {formatPercentage(tier.commission_rate)} commission rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Min. Referrals:</span>
                        <span className="font-semibold">{tier.min_referrals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min. Revenue:</span>
                        <span className="font-semibold">{formatCurrency(tier.min_revenue)}</span>
                      </div>
                    </div>
                    
                    {tier.benefits?.perks && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">Benefits:</h4>
                        <ul className="text-xs space-y-1">
                          {tier.benefits.perks.map((perk: string, index: number) => (
                            <li key={index} className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full"></div>
                              {perk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveAffiliateDashboard;
