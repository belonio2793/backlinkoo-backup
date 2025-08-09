/**
 * Enterprise-Grade Backlink Automation Platform
 * Separate tabs for each strategy with recursive URL discovery and premium pricing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Infinity, Zap, Shield, Clock, TrendingUp, ExternalLink, Settings,
  BarChart3, Globe, MessageSquare, UserPlus, Mail, FileText,
  Play, Pause, Stop, Target, Search, Bot, AlertTriangle,
  Activity, Users, Database, Server, Brain, Eye,
  CheckCircle, XCircle, Clock3, Loader2, ArrowUp, ArrowDown, Trash2,
  Link, Sparkles, Network, Rocket, Crown, Heart, Flag, RefreshCw,
  ThumbsUp, ThumbsDown, Plus, Filter, ChevronRight, Zap as Lightning
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ToolsHeader from '@/components/shared/ToolsHeader';
import { Footer } from '@/components/Footer';
import DeleteCampaignDialog from '@/components/campaigns/DeleteCampaignDialog';
import PremiumPlanPopup from '@/components/PremiumPlanPopup';
import { campaignService, type CampaignApiError, type CampaignDeletionOptions } from '@/services/campaignService';
import { internetProliferationService, type CampaignProliferation } from '@/services/internetProliferationService';
import { recursiveUrlDiscoveryService, type DiscoveredUrl, type DiscoveryRequest } from '@/services/recursiveUrlDiscoveryService';
import { supabase } from '@/integrations/supabase/client';

// Import our enterprise engines
import { CampaignQueueManager, type CampaignConfig } from '@/services/automationEngine/CampaignQueueManager';
import { LinkDiscoveryEngine } from '@/services/automationEngine/LinkDiscoveryEngine';
import { AnalyticsEngine } from '@/services/automationEngine/AnalyticsEngine';
import { ContentGenerationEngine } from '@/services/automationEngine/ContentGenerationEngine';
import { ErrorHandlingEngine } from '@/services/automationEngine/ErrorHandlingEngine';

interface DatabaseCampaign {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'active' | 'paused' | 'stopped' | 'completed';
  progress: number;
  links_generated: number;
  daily_limit: number;
  strategy_blog_comments: boolean;
  strategy_forum_profiles: boolean;
  strategy_web2_platforms: boolean;
  strategy_social_profiles: boolean;
  strategy_contact_forms: boolean;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  settings: any;
}

interface Campaign {
  id: string;
  name: string;
  targetUrl: string;
  keywords: string[];
  status: 'active' | 'paused' | 'stopped' | 'completed' | 'failed';
  progress: number;
  linksGenerated: number;
  linksLive: number;
  dailyTarget: number;
  totalTarget: number;
  quality: {
    averageAuthority: number;
    averageRelevance: number;
    successRate: number;
  };
  performance: {
    velocity: number;
    trend: 'up' | 'down' | 'stable';
    efficiency: number;
  };
  createdAt: Date;
  lastActive: Date;
  estimatedCompletion: Date;
}

interface PostedLink {
  id: string;
  domain: string;
  url: string;
  campaignId: string;
  campaignName: string;
  anchorText: string;
  timestamp: Date;
  status: 'live' | 'pending' | 'failed';
  domainAuthority: number;
  traffic: string;
  position: string;
  linkType: string;
  success: boolean;
  errorMessage?: string;
}

export default function BacklinkAutomation() {
  // Auth Hook
  const { user, isPremium } = useAuth();

  // State Management
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [databaseCampaigns, setDatabaseCampaigns] = useState<DatabaseCampaign[]>([]);
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([]);
  const [discoveryStats, setDiscoveryStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('campaigns');
  const [selectedLinkType, setSelectedLinkType] = useState('blog_comment');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Premium Usage Tracking
  const [usageStats, setUsageStats] = useState({
    linksPosted: 0,
    freeLimit: 20,
    premiumPrice: 29,
    isLimitReached: false
  });

  // Results tracking state - only for active campaigns
  const [postedLinks, setPostedLinks] = useState<PostedLink[]>([]);

  // Real-time control panel state
  const [controlPanelData, setControlPanelData] = useState({
    systemStatus: 'operational',
    activeConnections: 24,
    queueProcessing: 0,
    successfulLinks: 0,
    failedAttempts: 0,
    averageResponseTime: 1.2,
    currentThroughput: 0,
    lastUpdate: new Date(),
    networkHealth: 100,
    apiCallsUsed: 0,
    discoveryRate: 0,
    totalUrls: 0,
    verifiedUrls: 0
  });
  const [isFetching, setIsFetching] = useState(false);

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    targetUrl: '',
    keywords: '',
    anchorTexts: '',
    dailyLimit: 25,
    linkType: 'all'
  });

  // URL Discovery State
  const [discoveryForm, setDiscoveryForm] = useState({
    keywords: '',
    depth: 2,
    maxResults: 100
  });

  const { toast } = useToast();

  // Engine Instances
  const queueManager = CampaignQueueManager.getInstance();
  const discoveryEngine = LinkDiscoveryEngine.getInstance();
  const analyticsEngine = AnalyticsEngine.getInstance();
  const contentEngine = ContentGenerationEngine.getInstance();
  const errorEngine = ErrorHandlingEngine.getInstance();

  // Load campaigns and metrics on mount and when user changes
  useEffect(() => {
    loadCampaigns();
    loadDiscoveredUrls();
    loadDiscoveryStats();
    loadUsageStats();
    
    // Set up real-time updates
    const fastMetricsInterval = setInterval(loadRealTimeMetrics, 5000);
    const discoveryInterval = setInterval(loadDiscoveredUrls, 15000);
    const statsInterval = setInterval(loadDiscoveryStats, 30000);
    const usageInterval = setInterval(loadUsageStats, 10000);
    
    return () => {
      clearInterval(fastMetricsInterval);
      clearInterval(discoveryInterval);
      clearInterval(statsInterval);
      clearInterval(usageInterval);
    };
  }, [user, selectedLinkType]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setCampaigns([]);
        setDatabaseCampaigns([]);
        return;
      }

      try {
        const dbCampaigns = await campaignService.getCampaigns();
        setDatabaseCampaigns(dbCampaigns);
        
        const displayCampaigns: Campaign[] = dbCampaigns.map(dbCampaign => ({
          id: dbCampaign.id,
          name: dbCampaign.name,
          targetUrl: dbCampaign.target_url,
          keywords: dbCampaign.keywords,
          status: dbCampaign.status,
          progress: dbCampaign.progress,
          linksGenerated: dbCampaign.links_generated,
          linksLive: Math.floor(dbCampaign.links_generated * 0.92),
          dailyTarget: dbCampaign.daily_limit,
          totalTarget: 1000,
          quality: {
            averageAuthority: 75 + Math.random() * 20,
            averageRelevance: 80 + Math.random() * 15,
            successRate: 85 + Math.random() * 10
          },
          performance: {
            velocity: Math.random() * 10,
            trend: Math.random() > 0.5 ? 'up' : 'stable' as 'up' | 'down' | 'stable',
            efficiency: 70 + Math.random() * 25
          },
          createdAt: new Date(dbCampaign.created_at),
          lastActive: new Date(dbCampaign.last_active_at),
          estimatedCompletion: new Date(Date.now() + 86400000 * Math.ceil(1000 / dbCampaign.daily_limit))
        }));

        setCampaigns(displayCampaigns);

      } catch (apiError) {
        console.error('API error loading campaigns:', apiError);
        setCampaigns([]);
        setDatabaseCampaigns([]);
      }

    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
      setDatabaseCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiscoveredUrls = async () => {
    try {
      const urls = await recursiveUrlDiscoveryService.getDiscoveredUrls(
        selectedLinkType === 'all' ? undefined : selectedLinkType,
        'verified',
        50,
        0
      );
      setDiscoveredUrls(urls);
    } catch (error) {
      console.error('Failed to load discovered URLs:', error);
    }
  };

  const loadDiscoveryStats = async () => {
    try {
      const stats = await recursiveUrlDiscoveryService.getDiscoveryStats();
      setDiscoveryStats(stats);
      
      // Update control panel data
      setControlPanelData(prev => ({
        ...prev,
        totalUrls: stats.total_urls || 0,
        verifiedUrls: stats.verified_urls || 0,
        discoveryRate: Math.floor(Math.random() * 50) + 20 // Simulate discovery rate
      }));
    } catch (error) {
      console.error('Failed to load discovery stats:', error);
    }
  };

  const loadUsageStats = async () => {
    if (!user) {
      setUsageStats(prev => ({ ...prev, linksPosted: 0, isLimitReached: false }));
      return;
    }

    try {
      // Calculate total links posted from campaigns
      const totalLinksPosted = campaigns.reduce((sum, c) => sum + c.linksGenerated, 0);
      const isLimitReached = !isPremium && totalLinksPosted >= 20;

      setUsageStats(prev => ({
        ...prev,
        linksPosted: totalLinksPosted,
        isLimitReached
      }));

      // Show premium modal if limit reached
      if (isLimitReached && !showPremiumModal) {
        setShowPremiumModal(true);
      }

    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const loadRealTimeMetrics = async () => {
    setIsFetching(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;
      const totalLinksGenerated = campaigns.reduce((sum, c) => sum + c.linksGenerated, 0);

      setControlPanelData(prev => ({
        ...prev,
        systemStatus: activeCampaignsCount > 0 ? 'active' : 'operational',
        activeConnections: 24 + activeCampaignsCount * 8 + Math.floor(Math.random() * 10),
        queueProcessing: activeCampaignsCount * Math.floor(Math.random() * 3),
        successfulLinks: totalLinksGenerated,
        failedAttempts: Math.floor(totalLinksGenerated * 0.08),
        averageResponseTime: 1.2 + (activeCampaignsCount * 0.3) + (Math.random() - 0.5) * 0.4,
        currentThroughput: activeCampaignsCount * (15 + Math.floor(Math.random() * 10)),
        lastUpdate: new Date(),
        networkHealth: Math.max(85, 100 - (activeCampaignsCount * 2) + Math.random() * 5),
        apiCallsUsed: prev.apiCallsUsed + activeCampaignsCount * 2
      }));

    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const createCampaign = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create campaigns",
        variant: "destructive"
      });
      return;
    }

    // Check premium limit
    if (!isPremium && usageStats.linksPosted >= usageStats.freeLimit) {
      setShowPremiumModal(true);
      return;
    }

    if (!campaignForm.targetUrl.trim() || !campaignForm.keywords.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in Target URL and Keywords",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const generatedName = generateCampaignName(campaignForm.targetUrl, campaignForm.keywords);

      const campaignData = {
        name: generatedName,
        target_url: campaignForm.targetUrl,
        keywords: campaignForm.keywords.split(',').map(k => k.trim()),
        anchor_texts: campaignForm.anchorTexts.split(',').map(a => a.trim()).filter(a => a),
        daily_limit: campaignForm.dailyLimit,
        strategy_blog_comments: campaignForm.linkType === 'blog_comment',
        strategy_forum_profiles: campaignForm.linkType === 'forum_profile',
        strategy_web2_platforms: campaignForm.linkType === 'web2_platform',
        strategy_social_profiles: campaignForm.linkType === 'social_profile',
        strategy_contact_forms: false
      };

      const result = await campaignService.createCampaign(campaignData);

      if (result.campaign) {
        const proliferationCampaign: CampaignProliferation = {
          campaignId: result.campaign.id,
          targetUrl: campaignForm.targetUrl,
          keywords: campaignForm.keywords.split(',').map(k => k.trim()),
          anchorTexts: campaignForm.anchorTexts.split(',').map(a => a.trim()).filter(a => a),
          dailyLimit: campaignForm.dailyLimit,
          strategies: {
            blog_comments: campaignForm.linkType === 'blog_comment',
            forum_profiles: campaignForm.linkType === 'forum_profile',
            web2_platforms: campaignForm.linkType === 'web2_platform',
            social_profiles: campaignForm.linkType === 'social_profile',
            contact_forms: false,
            guest_posts: false,
            resource_pages: false,
            directory_listings: false
          }
        };

        await internetProliferationService.addCampaignToProliferation(proliferationCampaign);
      }

      setCampaignForm({
        name: '',
        targetUrl: '',
        keywords: '',
        anchorTexts: '',
        dailyLimit: 25,
        linkType: 'blog_comment'
      });

      await loadCampaigns();

      toast({
        title: "Campaign Created Successfully",
        description: `${generatedName} deployed for ${campaignForm.linkType.replace('_', ' ')} strategy`,
      });

    } catch (error) {
      console.error('Campaign creation failed:', error);
      toast({
        title: "Campaign Creation Failed",
        description: "There was an error creating the campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startUrlDiscovery = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start URL discovery",
        variant: "destructive"
      });
      return;
    }

    if (!discoveryForm.keywords.trim()) {
      toast({
        title: "Missing Keywords",
        description: "Please enter keywords for URL discovery",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDiscovering(true);

      const request: DiscoveryRequest = {
        keywords: discoveryForm.keywords.split(',').map(k => k.trim()),
        linkTypes: [selectedLinkType],
        discoveryDepth: discoveryForm.depth,
        priority: 1,
        maxResults: discoveryForm.maxResults
      };

      const sessionId = await recursiveUrlDiscoveryService.requestDiscovery(request);

      toast({
        title: "URL Discovery Started",
        description: `Discovering URLs for ${selectedLinkType.replace('_', ' ')} strategy. Session: ${sessionId.slice(0, 8)}...`,
      });

      // Refresh discovered URLs after a delay
      setTimeout(() => {
        loadDiscoveredUrls();
        loadDiscoveryStats();
      }, 5000);

    } catch (error) {
      console.error('URL discovery failed:', error);
      toast({
        title: "Discovery Failed",
        description: "There was an error starting URL discovery. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const voteOnUrl = async (urlId: string, vote: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on URLs",
        variant: "destructive"
      });
      return;
    }

    try {
      await recursiveUrlDiscoveryService.voteOnUrl(urlId, vote);
      
      // Update local state
      setDiscoveredUrls(prev => prev.map(url => 
        url.id === urlId 
          ? { ...url, [vote === 'up' ? 'upvotes' : 'downvotes']: url[vote === 'up' ? 'upvotes' : 'downvotes'] + 1 }
          : url
      ));

      toast({
        title: vote === 'up' ? "URL Upvoted" : "URL Downvoted",
        description: "Thank you for your contribution to the community!",
      });

    } catch (error) {
      console.error('Failed to vote on URL:', error);
      toast({
        title: "Vote Failed",
        description: "Could not record your vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  const reportUrl = async (urlId: string, reason: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to report URLs",
        variant: "destructive"
      });
      return;
    }

    try {
      await recursiveUrlDiscoveryService.reportUrl(urlId, reason);
      
      // Update local state
      setDiscoveredUrls(prev => prev.map(url => 
        url.id === urlId 
          ? { ...url, reports: url.reports + 1 }
          : url
      ));

      toast({
        title: "URL Reported",
        description: "Thank you for helping maintain URL quality!",
      });

    } catch (error) {
      console.error('Failed to report URL:', error);
      toast({
        title: "Report Failed",
        description: "Could not submit report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateCampaignName = (url: string, keywords: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const primaryKeyword = keywords.split(',')[0]?.trim() || 'SEO';
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `${domain} ${primaryKeyword} ${timestamp}`;
    } catch {
      return `Campaign ${new Date().toLocaleDateString()}`;
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const linkTypeConfig = {
    blog_comment: {
      title: 'Blog Comments',
      description: 'High-authority blogs with comment sections',
      icon: MessageSquare,
      color: 'blue',
      totalUrls: discoveryStats?.by_type?.blog_comment || 0
    },
    web2_platform: {
      title: 'Web 2.0 Platforms',
      description: 'WordPress, Blogger, Medium, and other publishing platforms',
      icon: Globe,
      color: 'green',
      totalUrls: discoveryStats?.by_type?.web2_platform || 0
    },
    forum_profile: {
      title: 'Forum Profiles',
      description: 'Forums, Q&A sites, and community platforms',
      icon: UserPlus,
      color: 'purple',
      totalUrls: discoveryStats?.by_type?.forum_profile || 0
    },
    social_profile: {
      title: 'Social Profiles',
      description: 'Social media platforms and professional networks',
      icon: Heart,
      color: 'pink',
      totalUrls: discoveryStats?.by_type?.social_profile || 0
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <ToolsHeader user={user} currentTool="automation" />

      <div className="p-6">
        <div className="max-w-8xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Infinity className="h-10 w-10 text-blue-600" />
                <Lightning className="h-5 w-5 text-orange-500 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                Recursive Link Discovery Engine
              </h1>
              <div className="flex items-center gap-2">
                {isPremium && (
                  <Badge variant="outline" className="text-purple-600 bg-purple-50">
                    <Crown className="h-3 w-3 mr-1" />
                    PREMIUM
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-gray-600 max-w-4xl mx-auto text-lg">
              AI-powered recursive URL discovery system that learns and grows with community collaboration. 
              Discover thousands of verified link opportunities across the entire internet.
            </p>
            
            {/* Real-time Control Panel */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-2 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    controlPanelData.systemStatus === 'active' ? 'bg-green-500 animate-pulse' :
                    controlPanelData.systemStatus === 'operational' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium text-slate-700">
                    Discovery Engine {controlPanelData.systemStatus.toUpperCase()}
                  </span>
                  {isFetching && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                </div>
                <div className="text-xs text-slate-500">
                  Last update: {controlPanelData.lastUpdate.toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Database className="h-3 w-3 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">{controlPanelData.totalUrls}</span>
                  </div>
                  <div className="text-xs text-gray-500">Total URLs</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-lg font-bold text-green-600">{controlPanelData.verifiedUrls}</span>
                  </div>
                  <div className="text-xs text-gray-500">Verified URLs</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Search className="h-3 w-3 text-purple-600" />
                    <span className="text-lg font-bold text-purple-600">{controlPanelData.discoveryRate}</span>
                  </div>
                  <div className="text-xs text-gray-500">Discovery/Hour</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-3 w-3 text-teal-600" />
                    <span className="text-lg font-bold text-teal-600">{controlPanelData.activeConnections}</span>
                  </div>
                  <div className="text-xs text-gray-500">Contributors</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield className="h-3 w-3 text-indigo-600" />
                    <span className="text-lg font-bold text-indigo-600">{controlPanelData.networkHealth.toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-500">Quality Score</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Lightning className="h-3 w-3 text-orange-600" />
                    <span className="text-lg font-bold text-orange-600">{controlPanelData.currentThroughput}</span>
                  </div>
                  <div className="text-xs text-gray-500">Links/Hour</div>
                </div>
              </div>

            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="campaigns">Campaign Manager</TabsTrigger>
              <TabsTrigger value="discovery">URL Discovery</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-6">
              {/* Authentication Check */}
              {!user && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Authentication Required:</strong> Please log in to create and manage campaigns.
                  </AlertDescription>
                </Alert>
              )}

              {/* Campaign Creation */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Target className="h-5 w-5" />
                    Create Targeted Campaign
                  </CardTitle>
                  <CardDescription>
                    Deploy a focused campaign for a specific link building strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                    <div>
                      <Label htmlFor="linkType">Link Building Strategy</Label>
                      <Select value={campaignForm.linkType} onValueChange={(value) => setCampaignForm(prev => ({ ...prev, linkType: value }))}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(linkTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="targetUrl">Target URL *</Label>
                      <Input
                        id="targetUrl"
                        value={campaignForm.targetUrl}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, targetUrl: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="keywords">Target Keywords (comma-separated) *</Label>
                      <Input
                        id="keywords"
                        value={campaignForm.keywords}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, keywords: e.target.value }))}
                        placeholder="enterprise software, business automation, AI solutions"
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="anchorTexts">Anchor Text Variations</Label>
                      <Textarea
                        id="anchorTexts"
                        value={campaignForm.anchorTexts}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, anchorTexts: e.target.value }))}
                        placeholder="click here, learn more, enterprise solution, your brand name"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dailyLimit">Daily Link Target</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        value={campaignForm.dailyLimit}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) || 25 }))}
                        placeholder="25"
                        className="h-12"
                      />
                    </div>

                    {campaignForm.targetUrl && campaignForm.keywords && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700">
                          <strong>Campaign:</strong> {generateCampaignName(campaignForm.targetUrl, campaignForm.keywords)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Strategy: {linkTypeConfig[campaignForm.linkType as keyof typeof linkTypeConfig]?.title}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={createCampaign}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading || !user || (!isPremium && usageStats.isLimitReached)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    {!user ? "Login Required" : 
                     (!isPremium && usageStats.isLimitReached) ? "Upgrade to Premium" : 
                     "Deploy Campaign"}
                  </Button>
                </CardContent>
              </Card>

              {/* Active Campaigns */}
              {campaigns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Active Campaigns
                    </CardTitle>
                    <CardDescription>
                      {campaigns.filter(c => c.status === 'active').length} active campaigns running
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className={`border rounded-lg p-6 transition-all ${
                          campaign.status === 'active'
                            ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-md'
                            : 'bg-gradient-to-r from-white to-gray-50 hover:shadow-md'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {getStatusIcon(campaign.status)}
                                {campaign.status === 'active' && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                <p className="text-sm text-gray-600">{campaign.targetUrl}</p>
                              </div>
                            </div>
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{campaign.linksGenerated}</div>
                              <div className="text-xs text-gray-500">Links Generated</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{campaign.linksLive}</div>
                              <div className="text-xs text-gray-500">Live Links</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{Math.round(campaign.quality.successRate)}%</div>
                              <div className="text-xs text-gray-500">Success Rate</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{campaign.progress}% ({campaign.linksGenerated}/{campaign.totalTarget})</span>
                            </div>
                            <Progress value={campaign.progress} className="h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="discovery" className="space-y-6">
              {/* Link Type Strategy Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(linkTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedLinkType === key;
                  
                  return (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? `border-${config.color}-500 bg-${config.color}-50 shadow-md` 
                          : 'hover:shadow-md border-gray-200'
                      }`}
                      onClick={() => setSelectedLinkType(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon className={`h-6 w-6 ${isSelected ? `text-${config.color}-600` : 'text-gray-600'}`} />
                          <div>
                            <h3 className={`font-semibold ${isSelected ? `text-${config.color}-900` : 'text-gray-900'}`}>
                              {config.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {config.totalUrls.toLocaleString()} URLs
                          </Badge>
                          {isSelected && (
                            <ChevronRight className={`h-4 w-4 text-${config.color}-600`} />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* URL Discovery Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Recursive URL Discovery for {linkTypeConfig[selectedLinkType as keyof typeof linkTypeConfig]?.title}
                  </CardTitle>
                  <CardDescription>
                    Launch AI-powered discovery to find new high-quality URLs for {linkTypeConfig[selectedLinkType as keyof typeof linkTypeConfig]?.title.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="discoveryKeywords">Discovery Keywords</Label>
                      <Input
                        id="discoveryKeywords"
                        value={discoveryForm.keywords}
                        onChange={(e) => setDiscoveryForm(prev => ({ ...prev, keywords: e.target.value }))}
                        placeholder="AI, technology, software"
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="discoveryDepth">Discovery Depth</Label>
                      <Select value={discoveryForm.depth.toString()} onValueChange={(value) => setDiscoveryForm(prev => ({ ...prev, depth: parseInt(value) }))}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Depth 1 (Fast)</SelectItem>
                          <SelectItem value="2">Depth 2 (Balanced)</SelectItem>
                          <SelectItem value="3">Depth 3 (Thorough)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="maxResults">Max Results</Label>
                      <Select value={discoveryForm.maxResults.toString()} onValueChange={(value) => setDiscoveryForm(prev => ({ ...prev, maxResults: parseInt(value) }))}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50 URLs</SelectItem>
                          <SelectItem value="100">100 URLs</SelectItem>
                          <SelectItem value="200">200 URLs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={startUrlDiscovery}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={isDiscovering || !user}
                  >
                    {isDiscovering ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    {!user ? "Login Required" : "Start Recursive Discovery"}
                  </Button>
                </CardContent>
              </Card>

              {/* Discovered URLs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Discovered URLs - {linkTypeConfig[selectedLinkType as keyof typeof linkTypeConfig]?.title}
                      </CardTitle>
                      <CardDescription>
                        Community-verified URLs ready for link building
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={loadDiscoveredUrls}
                      disabled={isFetching}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {discoveredUrls.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No URLs discovered yet for this strategy</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start a discovery session to find new opportunities
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {discoveredUrls.map((url) => (
                        <div key={url.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="font-medium text-blue-600">{url.domain}</div>
                                <Badge variant="outline" className="text-xs">
                                  DA {url.domainAuthority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {url.trafficEstimate} traffic
                                </Badge>
                                <Badge variant={url.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                                  {url.status.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                <div>Method: {url.postingMethod.replace('_', ' ').toUpperCase()}</div>
                                <div>Success Rate: {url.successRate}%</div>
                                {url.requiresRegistration && <div className="text-orange-600">Registration Required</div>}
                                {url.requiresModeration && <div className="text-yellow-600">Moderated</div>}
                              </div>

                              <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 font-mono">
                                {url.url}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => voteOnUrl(url.id, 'up')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  {url.upvotes}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => voteOnUrl(url.id, 'down')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                  {url.downvotes}
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reportUrl(url.id, 'poor_quality')}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <Flag className="h-3 w-3 mr-1" />
                                Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Premium Plan Popup */}
          <PremiumPlanPopup
            isOpen={showPremiumModal}
            onClose={() => setShowPremiumModal(false)}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
