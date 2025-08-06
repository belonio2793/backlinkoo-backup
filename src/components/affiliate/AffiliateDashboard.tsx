import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import {
  DollarSign,
  Users,
  MousePointer,
  TrendingUp,
  Copy,
  Share2,
  Download,
  BarChart3,
  Target,
  Award,
  Link2,
  QrCode,
  Calendar,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Gift,
  Trophy,
  Zap
} from 'lucide-react';
import { affiliateService } from '../../services/affiliateService';
import type { AffiliateProfile, AffiliateStats, AffiliateAnalytics } from '../../integrations/supabase/affiliate-types';
import AffiliateGamification from './AffiliateGamification';

interface AffiliateDashboardProps {
  userId: string;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ userId }) => {
  const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [analytics, setAnalytics] = useState<AffiliateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    loadAffiliateData();
  }, [userId]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      
      // Get or create affiliate profile
      let affiliateProfile = await affiliateService.getAffiliateProfile(userId);
      if (!affiliateProfile) {
        // Create affiliate profile if doesn't exist
        affiliateProfile = await affiliateService.createAffiliateProfile(userId, 'user@example.com'); // Would get email from user context
      }
      
      setAffiliate(affiliateProfile);

      // Load stats and analytics
      const [statsData, analyticsData] = await Promise.all([
        affiliateService.getAffiliateStats(affiliateProfile.affiliate_id),
        affiliateService.getAffiliateAnalytics(
          affiliateProfile.affiliate_id,
          new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString()
        )
      ]);

      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
      toast.error('Failed to load affiliate dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = (url?: string) => {
    if (!affiliate) return '';
    
    const targetUrl = url || window.location.origin;
    const link = affiliateService.generateAffiliateLink(affiliate.affiliate_id, targetUrl);
    return link.base_url;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800 border-amber-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      partner: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getTierIcon = (tier: string) => {
    const icons = {
      bronze: Award,
      silver: Award,
      gold: Trophy,
      platinum: Trophy,
      partner: Zap
    };
    const Icon = icons[tier as keyof typeof icons] || Award;
    return <Icon className="w-4 h-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!affiliate || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Affiliate Dashboard Not Available</h3>
            <p className="text-gray-600 mb-4">Failed to load affiliate data</p>
            <Button onClick={loadAffiliateData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your referrals and track your earnings</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Badge className={`${getTierColor(affiliate.tier)} border`}>
            {getTierIcon(affiliate.tier)}
            <span className="ml-1 capitalize">{affiliate.tier} Affiliate</span>
          </Badge>
          <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
            {affiliate.status === 'active' ? 'Active' : 'Pending Approval'}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.total_earnings)}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(stats.pending_commissions)} pending
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
                <p className="text-3xl font-bold">{stats.total_clicks.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(stats.epc)} EPC
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
                <p className="text-3xl font-bold">{stats.total_conversions}</p>
                <p className="text-sm text-gray-500">
                  {formatPercentage(stats.conversion_rate)} rate
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
                <p className="text-3xl font-bold">{formatPercentage(affiliate.commission_rate * 100)}</p>
                {stats.next_tier_threshold && (
                  <p className="text-sm text-gray-500">
                    {formatCurrency(stats.next_tier_threshold - stats.total_earnings)} to next tier
                  </p>
                )}
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Tier */}
      {stats.next_tier_threshold && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Progress to Next Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Current: {formatCurrency(stats.total_earnings)}</span>
                <span>Target: {formatCurrency(stats.next_tier_threshold)}</span>
              </div>
              <Progress 
                value={(stats.total_earnings / stats.next_tier_threshold) * 100} 
                className="h-3"
              />
              <p className="text-sm text-gray-600">
                {formatCurrency(stats.next_tier_threshold - stats.total_earnings)} away from upgrading to the next tier
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-5">
          <TabsTrigger value="links">Referral Links</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Referral Links Tab */}
        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Your Referral Links
              </CardTitle>
              <CardDescription>
                Share these links to earn commissions on referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Referral Link */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Main Referral Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={generateReferralLink()} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(generateReferralLink(), 'Referral link')}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Custom URL Generator */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Custom URL Generator</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter a specific URL to track..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (customUrl) {
                        copyToClipboard(generateReferralLink(customUrl), 'Custom link');
                      }
                    }}
                    variant="outline"
                    disabled={!customUrl}
                  >
                    Generate & Copy
                  </Button>
                </div>
                {customUrl && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Generated Link:</p>
                    <p className="text-sm font-mono break-all">{generateReferralLink(customUrl)}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
                <Button variant="outline" className="justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Social Media Kit
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download Assets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Analytics
                  </CardTitle>
                  <div className="flex gap-2">
                    <select 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Period Clicks</p>
                      <p className="text-2xl font-bold">{analytics.clicks.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Period Conversions</p>
                      <p className="text-2xl font-bold">{analytics.conversions}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Period Earnings</p>
                      <p className="text-2xl font-bold">{formatCurrency(analytics.earnings)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Traffic Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.top_sources.map((source, index) => (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <span className="font-medium capitalize">{source.source}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{source.clicks} clicks</p>
                            <p className="text-sm text-gray-600">{source.conversions} conversions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.device_breakdown).map(([device, count]) => {
                        const percentage = analytics.clicks > 0 ? (count / analytics.clicks * 100).toFixed(1) : '0';
                        const Icon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
                        
                        return (
                          <div key={device} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-gray-600" />
                              <span className="font-medium capitalize">{device}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{count} clicks</p>
                              <p className="text-sm text-gray-600">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <AffiliateGamification
            affiliateId={affiliate.affiliate_id}
            currentTier={affiliate.tier}
            totalEarnings={stats.total_earnings}
            totalConversions={stats.total_conversions}
            totalReferrals={stats.total_referrals}
          />
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>
                Track your earnings and payout status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Commission Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Paid Out</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.paid_commissions)}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.pending_commissions)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Lifetime Total</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.total_earnings)}</p>
                  </div>
                </div>

                {/* Payout Request */}
                {stats.pending_commissions >= 50 && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Ready for Payout</h4>
                        <p className="text-sm text-gray-600">
                          You have {formatCurrency(stats.pending_commissions)} available for payout
                        </p>
                      </div>
                      <Button>
                        Request Payout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Marketing Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Banner Package (All Sizes)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Email Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Social Media Kit
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Video Assets
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Training & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Affiliate Marketing Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Best Practices & Tips
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  SEO Academy Access
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact Affiliate Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateDashboard;
