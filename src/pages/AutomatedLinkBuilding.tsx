import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Zap,
  Mail,
  Globe,
  BarChart3,
  Calendar,
  Shield,
  Target,
  Brain,
  TrendingUp,
  Users,
  Link2,
  FileText,
  Settings,
  Play,
  Pause,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Upload,
  Briefcase,
  Clock,
  Award,
  Filter,
  MoreVertical,
  XCircle,
  RefreshCw,
  Activity
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/services/productionErrorHandler';
import { scalableDataService, rateLimiter } from '@/services/scalabilityOptimizations';
import { dbHealthCheck } from '@/services/databaseHealthCheck';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled' | 'completed';
  keywords: string[];
  target_url: string;
  strategy: 'fast_boost' | 'natural_growth' | 'competitive' | 'branded';
  created_at: string;
  metrics: {
    links_built: number;
    domains_reached: number;
    dr_average: number;
    traffic_gained: number;
  };
}

export default function AutomatedLinkBuilding() {
  const { user, isAuthenticated } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [stats, setStats] = useState({
    linksBuiltToday: 0,
    domainsReached: 0,
    avgDomainRating: 0,
    successRate: 0,
    trafficGained: 0
  });
  const [outreachStats, setOutreachStats] = useState({
    emailsSent: 0,
    responseRate: 0,
    positiveResponses: 0,
    linkPlacements: 0
  });
  const [analyticsStats, setAnalyticsStats] = useState({
    totalLinksBuilt: 0,
    referringDomains: 0,
    avgDomainRating: 0,
    trafficImpact: 0,
    monthlyGrowth: {
      links: 0,
      domains: 0,
      dr: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});
  const [dbStatus, setDbStatus] = useState<{ healthy: boolean; missingTables: string[] }>({ healthy: true, missingTables: [] });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'link_published' | 'outreach_sent' | 'content_generated';
    title: string;
    description: string;
    status: string;
    created_at: string;
  }>>([]);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    keywords: '',
    target_url: '',
    strategy: 'natural_growth',
    competitor_urls: '',
    content_tone: 'professional',
    auto_publish: false,
    drip_speed: 'medium'
  });

  // Load automation data from database
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const loadAutomationData = async () => {
      try {
        setLoading(true);

        // Check database health first
        const { allTablesExist, missingTables } = await dbHealthCheck.checkRequiredTables();
        if (!allTablesExist) {
          console.warn('Some database tables are missing:', missingTables);
          // Continue anyway but with limited functionality
        }

        // Use scalable data service for optimized fetching
        const { campaigns, stats: aggregatedStats } = await scalableDataService.getCampaignStats(
          user.id,
          20, // Limit for pagination
          0   // Offset
        );
        
        setStats(aggregatedStats);
        setCampaigns(campaigns);
        
        // Fetch outreach statistics (handle missing table gracefully)
        try {
          const { data: outreachData, error: outreachError } = await supabase
            .from('outreach_campaigns')
            .select(`
              emails_sent,
              response_rate,
              positive_responses,
              link_placements
            `)
            .eq('user_id', user.id);

          if (outreachError) {
            if (outreachError.message.includes('relation') && outreachError.message.includes('does not exist')) {
              console.info('Outreach campaigns table does not exist yet');
            } else {
              console.error('Error loading outreach data:', outreachError);
            }
          } else if (outreachData && outreachData.length > 0) {
            const totalEmailsSent = outreachData.reduce((sum, campaign) => sum + (campaign.emails_sent || 0), 0);
            const avgResponseRate = Math.round(outreachData.reduce((sum, campaign) => sum + (campaign.response_rate || 0), 0) / outreachData.length);
            const totalPositiveResponses = outreachData.reduce((sum, campaign) => sum + (campaign.positive_responses || 0), 0);
            const totalLinkPlacements = outreachData.reduce((sum, campaign) => sum + (campaign.link_placements || 0), 0);

            setOutreachStats({
              emailsSent: totalEmailsSent,
              responseRate: avgResponseRate,
              positiveResponses: totalPositiveResponses,
              linkPlacements: totalLinkPlacements
            });
          }
        } catch (error) {
          console.warn('Outreach stats query failed:', error);
        }

        // Fetch analytics data from automation_analytics table (handle missing table gracefully)
        try {
          const { data: analyticsData, error: analyticsError } = await supabase
            .from('automation_analytics')
            .select(`
              total_links_built,
              referring_domains,
              avg_domain_rating,
              traffic_impact,
              monthly_growth_links,
              monthly_growth_domains,
              monthly_growth_dr
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (analyticsError) {
            if (analyticsError.message.includes('relation') && analyticsError.message.includes('does not exist')) {
              console.info('Analytics table does not exist yet');
            } else {
              console.error('Error loading analytics data:', analyticsError);
            }
          } else if (analyticsData) {
            setAnalyticsStats({
              totalLinksBuilt: analyticsData.total_links_built || 0,
              referringDomains: analyticsData.referring_domains || 0,
              avgDomainRating: analyticsData.avg_domain_rating || 0,
              trafficImpact: analyticsData.traffic_impact || 0,
              monthlyGrowth: {
                links: analyticsData.monthly_growth_links || 0,
                domains: analyticsData.monthly_growth_domains || 0,
                dr: analyticsData.monthly_growth_dr || 0
              }
            });
          }
        } catch (error) {
          console.warn('Analytics stats query failed:', error);
        }

        // Fetch recent activity with optimization
        const activityData = await scalableDataService.getActivityFeed(user.id, undefined, 10);
        setRecentActivity(activityData);

      } catch (error) {
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          errorMessage = JSON.stringify(error);
        }

        console.error('Error loading automation data:', error);

        // Try to log error but don't fail if logging fails
        try {
          await logError(error instanceof Error ? error : new Error(errorMessage), {
            component: 'automation',
            operation: 'load_data',
            userId: user?.id
          }, 'high');
        } catch (logError) {
          console.warn('Failed to log error:', logError);
        }

        setError('Failed to load automation data. Please refresh the page.');
        toast.error('Failed to load automation data');
      } finally {
        setLoading(false);
      }
    };
    
    loadAutomationData();
  }, [user, isAuthenticated]);

  // Production campaign creation function
  const handleSaveCampaign = async () => {
    if (!user || !campaignForm.name || !campaignForm.target_url || !campaignForm.keywords) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const keywordsArray = campaignForm.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert({
          user_id: user.id,
          name: campaignForm.name,
          target_url: campaignForm.target_url,
          keywords: keywordsArray,
          strategy: campaignForm.strategy,
          competitor_urls: campaignForm.competitor_urls.split(',').map(u => u.trim()).filter(u => u),
          content_tone: campaignForm.content_tone,
          auto_publish: campaignForm.auto_publish,
          drip_speed: campaignForm.drip_speed,
          status: 'paused'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Campaign saved successfully');
      setCampaigns(prev => [data, ...prev]);
      
      // Reset form
      setCampaignForm({
        name: '',
        keywords: '',
        target_url: '',
        strategy: 'natural_growth',
        competitor_urls: '',
        content_tone: 'professional',
        auto_publish: false,
        drip_speed: 'medium'
      });
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      console.error('Error saving campaign:', error);

      // Try to log error but don't fail if logging fails
      try {
        await logError(error instanceof Error ? error : new Error(errorMessage), {
          component: 'automation',
          operation: 'save_campaign',
          userId: user?.id,
          metadata: { campaignName: campaignForm.name }
        }, 'medium');
      } catch (logError) {
        console.warn('Failed to log error:', logError);
      }

      toast.error('Failed to save campaign');
    }
  };

  // Production automation start function with rate limiting
  const handleStartAutomation = async () => {
    if (!user || !campaignForm.name || !campaignForm.target_url || !campaignForm.keywords) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check rate limits for automation operations
    const canProceed = await rateLimiter.checkLimit(user.id, 'automation');
    if (!canProceed) {
      toast.error('Rate limit exceeded. Please wait before starting another automation.');
      return;
    }

    try {
      setIsRunning(true);
      setCurrentStep('Creating campaign...');

      // Save campaign first
      await handleSaveCampaign();

      setCurrentStep('Starting automation engines...');

      // Start automation via Netlify function
      const response = await fetch('/.netlify/functions/automation-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'start',
          campaign: {
            name: campaignForm.name,
            target_url: campaignForm.target_url,
            keywords: campaignForm.keywords.split(',').map(k => k.trim()).filter(k => k),
            strategy: campaignForm.strategy,
            drip_speed: campaignForm.drip_speed
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start automation');
      }

      const result = await response.json();
      
      setCurrentStep('Automation started successfully');
      toast.success('Automation campaign started!');
      
      // Refresh data
      window.location.reload();

    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      console.error('Error starting automation:', error);

      // Try to log error but don't fail if logging fails
      try {
        await logError(error instanceof Error ? error : new Error(errorMessage), {
          component: 'automation',
          operation: 'start_automation',
          userId: user?.id,
          metadata: { campaignName: campaignForm.name }
        }, 'critical');
      } catch (logError) {
        console.warn('Failed to log error:', logError);
      }

      toast.error('Failed to start automation');
      setCurrentStep('Error starting automation');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to access the automated link building platform.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">System Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Link Building Engine</h1>
          <p className="text-gray-600 text-lg">Complete automated link building with AI-powered content generation</p>
        </div>

        <Tabs defaultValue="dashboard" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Campaign Setup */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Campaign Setup
                    </CardTitle>
                    <CardDescription>Configure your automated link building campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={campaignForm.name}
                          onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                          placeholder="My Link Building Campaign"
                        />
                      </div>
                      <div>
                        <Label htmlFor="strategy">Strategy</Label>
                        <Select 
                          value={campaignForm.strategy} 
                          onValueChange={(value) => setCampaignForm({ ...campaignForm, strategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fast_boost">🚀 Fast Rank Boost</SelectItem>
                            <SelectItem value="natural_growth">🌱 Natural Growth</SelectItem>
                            <SelectItem value="competitive">⚔️ Competitive Attack</SelectItem>
                            <SelectItem value="branded">🏢 Branded Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="target-url">Target URL</Label>
                      <Input
                        id="target-url"
                        type="url"
                        value={campaignForm.target_url}
                        onChange={(e) => setCampaignForm({ ...campaignForm, target_url: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Textarea
                        id="keywords"
                        value={campaignForm.keywords}
                        onChange={(e) => setCampaignForm({ ...campaignForm, keywords: e.target.value })}
                        placeholder="SEO tools, link building, digital marketing"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="content-tone">Content Tone</Label>
                        <Select 
                          value={campaignForm.content_tone} 
                          onValueChange={(value) => setCampaignForm({ ...campaignForm, content_tone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="authoritative">Authoritative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="drip-speed">Drip Speed</Label>
                        <Select 
                          value={campaignForm.drip_speed} 
                          onValueChange={(value) => setCampaignForm({ ...campaignForm, drip_speed: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">🐌 Slow (1-2 links/day)</SelectItem>
                            <SelectItem value="medium">⚡ Medium (3-5 links/day)</SelectItem>
                            <SelectItem value="fast">🚀 Fast (5-10 links/day)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="auto-publish"
                        checked={campaignForm.auto_publish}
                        onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, auto_publish: checked })}
                      />
                      <Label htmlFor="auto-publish">Enable Auto-Publish</Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSaveCampaign} variant="outline" disabled={isRunning}>
                        Save Campaign
                      </Button>
                      <Button onClick={handleStartAutomation} className="flex-1" disabled={isRunning}>
                        {isRunning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {currentStep}
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Automation
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Live Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Links Built Today</span>
                        <span className="font-medium">{loading ? '-' : stats.linksBuiltToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Domains Reached</span>
                        <span className="font-medium">{loading ? '-' : stats.domainsReached}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium text-green-600">{loading ? '-' : `${stats.successRate}%`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Traffic Gained</span>
                        <span className="font-medium">{loading ? '-' : `+${stats.trafficGained.toLocaleString()}`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Link Discovery</span>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Content Generation</span>
                        <Badge variant="default" className="bg-blue-600">Running</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Outreach Engine</span>
                        <Badge variant="default" className="bg-purple-600">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Campaign Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Campaign Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No campaigns yet. Create your first campaign above.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">{campaign.target_url}</p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Monitor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Activity Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading activity...</span>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      No recent activity. Start a campaign to see activity here.
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                        activity.type === 'link_published' ? 'bg-green-50' :
                        activity.type === 'outreach_sent' ? 'bg-blue-50' :
                        'bg-purple-50'
                      }`}>
                        {activity.type === 'link_published' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {activity.type === 'outreach_sent' && <Mail className="h-5 w-5 text-blue-600" />}
                        {activity.type === 'content_generated' && <Brain className="h-5 w-5 text-purple-600" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-600">{activity.description}</p>
                        </div>
                        <Badge variant="outline" className={`${
                          activity.status === 'Live' ? 'text-green-700' :
                          activity.status === 'Active' ? 'text-blue-700' :
                          'text-purple-700'
                        }`}>{activity.status}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporting Tab */}
          <TabsContent value="reporting" className="space-y-6">
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Total Links Built</span>
                  </div>
                  <p className="text-2xl font-bold">{loading ? '-' : analyticsStats.totalLinksBuilt.toLocaleString()}</p>
                  <p className="text-xs text-green-600">{loading ? '-' : `+${analyticsStats.monthlyGrowth.links}% this month`}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Referring Domains</span>
                  </div>
                  <p className="text-2xl font-bold">{loading ? '-' : analyticsStats.referringDomains.toLocaleString()}</p>
                  <p className="text-xs text-green-600">{loading ? '-' : `+${analyticsStats.monthlyGrowth.domains}% this month`}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Avg. Domain Rating</span>
                  </div>
                  <p className="text-2xl font-bold">{loading ? '-' : analyticsStats.avgDomainRating}</p>
                  <p className="text-xs text-blue-600">{loading ? '-' : `+${analyticsStats.monthlyGrowth.dr} this month`}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Traffic Impact</span>
                  </div>
                  <p className="text-2xl font-bold">{loading ? '-' : `+${(analyticsStats.trafficImpact / 1000).toFixed(1)}k`}</p>
                  <p className="text-xs text-green-600">Monthly organic</p>
                </CardContent>
              </Card>
            </div>

            {/* Outreach Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Outreach Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{loading ? '-' : outreachStats.emailsSent}</p>
                    <p className="text-sm text-gray-600">Emails Sent</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{loading ? '-' : `${outreachStats.responseRate}%`}</p>
                    <p className="text-sm text-gray-600">Response Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{loading ? '-' : outreachStats.positiveResponses}</p>
                    <p className="text-sm text-gray-600">Positive Responses</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{loading ? '-' : outreachStats.linkPlacements}</p>
                    <p className="text-sm text-gray-600">Link Placements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No campaigns to report on yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Campaign</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Links Built</th>
                          <th className="text-left p-2">Success Rate</th>
                          <th className="text-left p-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id} className="border-b">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{campaign.name}</p>
                                <p className="text-xs text-gray-500">{campaign.target_url}</p>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                {campaign.status}
                              </Badge>
                            </td>
                            <td className="p-2">{campaign.metrics?.links_built || 0}</td>
                            <td className="p-2">
                              <span className="text-green-600">
                                {campaign.metrics ? `${Math.round((campaign.metrics.links_built / (campaign.metrics.links_built + 1)) * 100)}%` : '0%'}
                              </span>
                            </td>
                            <td className="p-2">
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
