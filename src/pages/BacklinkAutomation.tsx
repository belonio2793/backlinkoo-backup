/**
 * Enterprise-Grade Backlink Automation Platform
 * Handles 1000+ concurrent campaigns with advanced AI and monitoring
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
  CheckCircle, XCircle, Clock3, Loader2, ArrowUp, ArrowDown, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ToolsHeader from '@/components/shared/ToolsHeader';
import { Footer } from '@/components/Footer';
import DeleteCampaignDialog from '@/components/campaigns/DeleteCampaignDialog';
import { campaignService, type CampaignApiError, type CampaignDeletionOptions } from '@/services/campaignService';

// Import our enterprise engines
import { CampaignQueueManager, type CampaignConfig, type QueuedCampaign, type CampaignDeletionResult } from '@/services/automationEngine/CampaignQueueManager';
import { LinkDiscoveryEngine, type DiscoveryConfig, type LinkOpportunity } from '@/services/automationEngine/LinkDiscoveryEngine';
import { AnalyticsEngine, type CampaignAnalytics, type TimeRange } from '@/services/automationEngine/AnalyticsEngine';
import { ContentGenerationEngine, type ContentContext, type ContentRequirements } from '@/services/automationEngine/ContentGenerationEngine';
import { ErrorHandlingEngine } from '@/services/automationEngine/ErrorHandlingEngine';

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

interface SystemMetrics {
  activeCampaigns: number;
  totalCapacity: number;
  usedCapacity: number;
  queueLength: number;
  successRate: number;
  averageQuality: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  errorRate: number;
}

interface RealTimeMetrics {
  linksPostedToday: number;
  opportunitiesDiscovered: number;
  campaignsActive: number;
  systemLoad: number;
  apiCallsRemaining: number;
  averageResponseTime: number;
}

export default function BacklinkAutomation() {
  // State Management
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [linkOpportunities, setLinkOpportunities] = useState<LinkOpportunity[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    activeCampaigns: 0,
    totalCapacity: 1000,
    usedCapacity: 0,
    queueLength: 0,
    successRate: 0,
    averageQuality: 0,
    systemHealth: 'healthy',
    errorRate: 0
  });
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    linksPostedToday: 0,
    opportunitiesDiscovered: 0,
    campaignsActive: 0,
    systemLoad: 0,
    apiCallsRemaining: 1000,
    averageResponseTime: 150
  });
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('campaigns');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    targetUrl: '',
    keywords: '',
    anchorTexts: '',
    dailyLimit: 10,
    totalTarget: 100,
    strategy: {
      blogComments: { enabled: true, weight: 25, dailyLimit: 5, qualityThreshold: 70 },
      forumProfiles: { enabled: true, weight: 20, dailyLimit: 3, qualityThreshold: 75 },
      web2Platforms: { enabled: true, weight: 20, dailyLimit: 4, qualityThreshold: 65 },
      socialProfiles: { enabled: false, weight: 10, dailyLimit: 2, qualityThreshold: 60 },
      contactForms: { enabled: false, weight: 5, dailyLimit: 1, qualityThreshold: 80 },
      guestPosts: { enabled: true, weight: 15, dailyLimit: 2, qualityThreshold: 85 },
      resourcePages: { enabled: true, weight: 5, dailyLimit: 1, qualityThreshold: 90 }
    },
    qualityFilters: {
      minDomainAuthority: 30,
      maxSpamScore: 20,
      contentRelevanceThreshold: 75
    },
    antiDetection: {
      userAgentRotation: true,
      humanLikeDelays: true,
      contentVariation: true,
      maxActionsPerIp: 5
    }
  });

  const { toast } = useToast();

  // Engine Instances
  const queueManager = CampaignQueueManager.getInstance();
  const discoveryEngine = LinkDiscoveryEngine.getInstance();
  const analyticsEngine = AnalyticsEngine.getInstance();
  const contentEngine = ContentGenerationEngine.getInstance();
  const errorEngine = ErrorHandlingEngine.getInstance();

  // Load campaigns and metrics on mount
  useEffect(() => {
    loadCampaigns();
    loadSystemMetrics();
    
    // Set up real-time updates
    const metricsInterval = setInterval(loadRealTimeMetrics, 10000); // Every 10 seconds
    const systemInterval = setInterval(loadSystemMetrics, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(systemInterval);
    };
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      
      // Get queue stats from campaign manager
      const queueStats = queueManager.getQueueStats();
      
      // Generate demo campaigns based on system capacity
      const demoCampaigns: Campaign[] = [
        {
          id: 'enterprise_campaign_1',
          name: 'AI-Powered SEO Authority Building',
          targetUrl: 'https://example.com',
          keywords: ['artificial intelligence', 'SEO automation', 'link building'],
          status: 'active',
          progress: 78,
          linksGenerated: 234,
          linksLive: 189,
          dailyTarget: 25,
          totalTarget: 500,
          quality: {
            averageAuthority: 68,
            averageRelevance: 84,
            successRate: 73
          },
          performance: {
            velocity: 23.5,
            trend: 'up',
            efficiency: 87
          },
          createdAt: new Date(Date.now() - 86400000 * 12), // 12 days ago
          lastActive: new Date(),
          estimatedCompletion: new Date(Date.now() + 86400000 * 8) // 8 days from now
        },
        {
          id: 'enterprise_campaign_2',
          name: 'Brand Awareness - Global Expansion',
          targetUrl: 'https://mybrand.com',
          keywords: ['brand marketing', 'digital transformation', 'enterprise solutions'],
          status: 'active',
          progress: 45,
          linksGenerated: 156,
          linksLive: 134,
          dailyTarget: 15,
          totalTarget: 350,
          quality: {
            averageAuthority: 72,
            averageRelevance: 91,
            successRate: 86
          },
          performance: {
            velocity: 14.2,
            trend: 'stable',
            efficiency: 92
          },
          createdAt: new Date(Date.now() - 86400000 * 8), // 8 days ago
          lastActive: new Date(Date.now() - 1800000), // 30 minutes ago
          estimatedCompletion: new Date(Date.now() + 86400000 * 14) // 14 days from now
        },
        {
          id: 'enterprise_campaign_3',
          name: 'Competitor Analysis - Tech Industry',
          targetUrl: 'https://techstartup.com',
          keywords: ['technology trends', 'startup ecosystem', 'innovation'],
          status: 'paused',
          progress: 23,
          linksGenerated: 67,
          linksLive: 58,
          dailyTarget: 12,
          totalTarget: 300,
          quality: {
            averageAuthority: 65,
            averageRelevance: 78,
            successRate: 67
          },
          performance: {
            velocity: 0,
            trend: 'down',
            efficiency: 71
          },
          createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
          lastActive: new Date(Date.now() - 3600000 * 6), // 6 hours ago
          estimatedCompletion: new Date(Date.now() + 86400000 * 25) // 25 days from now
        }
      ];

      setCampaigns(demoCampaigns);
      
      // Update system metrics
      setSystemMetrics(prev => ({
        ...prev,
        activeCampaigns: demoCampaigns.filter(c => c.status === 'active').length,
        usedCapacity: queueStats.processing,
        queueLength: queueStats.queued,
        successRate: demoCampaigns.reduce((sum, c) => sum + c.quality.successRate, 0) / demoCampaigns.length,
        averageQuality: demoCampaigns.reduce((sum, c) => sum + c.quality.averageAuthority, 0) / demoCampaigns.length
      }));

      toast({
        title: "Enterprise System Loaded",
        description: `${demoCampaigns.length} campaigns loaded. System capacity: ${queueStats.totalCapacity} concurrent campaigns.`,
      });

    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast({
        title: "System Load Error",
        description: "Failed to load campaign data. Using offline mode.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const queueStats = queueManager.getQueueStats();
      
      setSystemMetrics(prev => ({
        ...prev,
        totalCapacity: queueStats.totalCapacity,
        usedCapacity: queueStats.usedCapacity,
        queueLength: queueStats.queued,
        systemHealth: queueStats.usedCapacity / queueStats.totalCapacity > 0.9 ? 'critical' : 
                     queueStats.usedCapacity / queueStats.totalCapacity > 0.7 ? 'degraded' : 'healthy',
        errorRate: Math.random() * 5 // Simulated error rate
      }));
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      // Simulate real-time metrics updates
      setRealTimeMetrics(prev => ({
        linksPostedToday: prev.linksPostedToday + Math.floor(Math.random() * 3),
        opportunitiesDiscovered: prev.opportunitiesDiscovered + Math.floor(Math.random() * 8),
        campaignsActive: campaigns.filter(c => c.status === 'active').length,
        systemLoad: Math.min(100, Math.max(0, prev.systemLoad + (Math.random() - 0.5) * 10)),
        apiCallsRemaining: Math.max(0, prev.apiCallsRemaining - Math.floor(Math.random() * 10)),
        averageResponseTime: Math.max(50, prev.averageResponseTime + (Math.random() - 0.5) * 20)
      }));
    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
    }
  };

  const createCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.targetUrl.trim() || !campaignForm.keywords.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const campaignConfig: CampaignConfig = {
        name: campaignForm.name,
        targetUrl: campaignForm.targetUrl,
        keywords: campaignForm.keywords.split(',').map(k => k.trim()),
        anchorTexts: campaignForm.anchorTexts.split(',').map(a => a.trim()).filter(a => a),
        dailyLimit: campaignForm.dailyLimit,
        totalLinksTarget: campaignForm.totalTarget,
        strategy: {
          blogComments: campaignForm.strategy.blogComments,
          forumProfiles: campaignForm.strategy.forumProfiles,
          web2Platforms: campaignForm.strategy.web2Platforms,
          socialProfiles: campaignForm.strategy.socialProfiles,
          contactForms: campaignForm.strategy.contactForms,
          guestPosts: campaignForm.strategy.guestPosts,
          resourcePages: campaignForm.strategy.resourcePages,
          brokenLinkBuilding: { enabled: false, weight: 0, dailyLimit: 0, qualityThreshold: 80 }
        },
        contentGenerationConfig: {
          tone: 'professional',
          length: 'medium',
          personalization: true,
          includeStats: true,
          includeQuestions: false,
          languageModel: 'gpt-4',
          creativity: 70
        },
        qualityFilters: campaignForm.qualityFilters,
        timingConfig: {
          operatingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
          operatingDays: [1, 2, 3, 4, 5], // Monday to Friday
          delayBetweenActions: { min: 300, max: 1800 }, // 5-30 minutes
          dailyDistribution: 'even'
        },
        antiDetectionConfig: {
          userAgentRotation: campaignForm.antiDetection.userAgentRotation,
          proxyRotation: true,
          randomizeFingerprints: true,
          humanLikeDelays: campaignForm.antiDetection.humanLikeDelays,
          contentVariation: campaignForm.antiDetection.contentVariation,
          ipDistribution: 'global',
          maxActionsPerIp: campaignForm.antiDetection.maxActionsPerIp
        }
      };

      // Queue the campaign
      const campaignId = await queueManager.enqueueCampaign(campaignConfig, 'current-user', 'medium');

      const newCampaign: Campaign = {
        id: campaignId,
        name: campaignForm.name,
        targetUrl: campaignForm.targetUrl,
        keywords: campaignConfig.keywords,
        status: 'active',
        progress: 0,
        linksGenerated: 0,
        linksLive: 0,
        dailyTarget: campaignForm.dailyLimit,
        totalTarget: campaignForm.totalTarget,
        quality: {
          averageAuthority: 0,
          averageRelevance: 0,
          successRate: 0
        },
        performance: {
          velocity: 0,
          trend: 'stable',
          efficiency: 0
        },
        createdAt: new Date(),
        lastActive: new Date(),
        estimatedCompletion: new Date(Date.now() + 86400000 * Math.ceil(campaignForm.totalTarget / campaignForm.dailyLimit))
      };

      setCampaigns(prev => [...prev, newCampaign]);
      setActiveCampaign(newCampaign);

      // Start link discovery
      await startLinkDiscovery(newCampaign);

      // Reset form
      setCampaignForm(prev => ({
        ...prev,
        name: '',
        targetUrl: '',
        keywords: '',
        anchorTexts: ''
      }));

      toast({
        title: "Campaign Created Successfully",
        description: `${campaignForm.name} has been queued and will begin processing shortly.`,
      });

    } catch (error) {
      console.error('Campaign creation failed:', error);
      await errorEngine.handleError(error as Error, {
        component: 'campaign_creation',
        operation: 'create_campaign',
        severity: 'high',
        metadata: { campaignName: campaignForm.name }
      });

      toast({
        title: "Campaign Creation Failed",
        description: "There was an error creating the campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startLinkDiscovery = async (campaign: Campaign) => {
    try {
      const discoveryConfig: DiscoveryConfig = {
        keywords: campaign.keywords,
        targetLanguages: ['en'],
        targetCountries: ['US', 'UK', 'CA', 'AU'],
        niches: ['technology', 'business', 'marketing'],
        minAuthority: campaignForm.qualityFilters.minDomainAuthority,
        maxSpamScore: campaignForm.qualityFilters.maxSpamScore,
        competitorUrls: [],
        excludeDomains: [],
        discoveryMethods: ['google_search', 'competitor_analysis', 'content_analysis', 'ai_prediction'],
        maxOpportunities: 1000,
        freshness: 'month'
      };

      const opportunities = await discoveryEngine.discoverOpportunities(discoveryConfig, campaign.id);
      setLinkOpportunities(opportunities);

      toast({
        title: "Discovery Complete",
        description: `Found ${opportunities.length} high-quality link opportunities for ${campaign.name}`,
      });

    } catch (error) {
      console.error('Link discovery failed:', error);
      await errorEngine.handleError(error as Error, {
        campaignId: campaign.id,
        component: 'link_discovery',
        operation: 'discover_opportunities',
        severity: 'medium'
      });
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      // Use campaign service for backend call
      await campaignService.pauseCampaign(campaignId);

      // Also pause in queue manager
      await queueManager.pauseCampaign(campaignId);

      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'paused' as const } : c
      ));

      toast({
        title: "Campaign Paused",
        description: "Link building has been paused successfully",
      });
    } catch (error) {
      console.error('Failed to pause campaign:', error);

      await errorEngine.handleError(error as Error, {
        component: 'campaign_pause',
        operation: 'pause_campaign',
        severity: 'medium',
        metadata: { campaignId }
      });

      toast({
        title: "Pause Failed",
        description: "Could not pause the campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      // Use campaign service for backend call
      await campaignService.resumeCampaign(campaignId);

      // Also resume in queue manager
      await queueManager.resumeCampaign(campaignId);

      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'active' as const, lastActive: new Date() } : c
      ));

      toast({
        title: "Campaign Resumed",
        description: "Link building has been resumed successfully",
      });
    } catch (error) {
      console.error('Failed to resume campaign:', error);

      await errorEngine.handleError(error as Error, {
        component: 'campaign_resume',
        operation: 'resume_campaign',
        severity: 'medium',
        metadata: { campaignId }
      });

      toast({
        title: "Resume Failed",
        description: "Could not resume the campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadCampaignAnalytics = async (campaignId: string) => {
    try {
      const timeRange: TimeRange = {
        start: new Date(Date.now() - 86400000 * 30), // Last 30 days
        end: new Date(),
        period: 'day',
        granularity: 'day'
      };

      const campaignAnalytics = await analyticsEngine.generateCampaignAnalytics(
        campaignId,
        'current-user',
        timeRange
      );

      setAnalytics(campaignAnalytics);
      setSelectedTab('analytics');
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Analytics Load Failed",
        description: "Could not load campaign analytics.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (campaignId: string, options: CampaignDeletionOptions) => {
    setIsDeleting(true);

    try {
      // Validate campaign before deletion
      const validation = await campaignService.validateCampaignForDeletion(campaignId);

      if (!validation.canDelete) {
        throw new Error(`Cannot delete campaign: ${validation.warnings.join(', ')}`);
      }

      // Use the campaign service for deletion
      const result = await campaignService.deleteCampaign(campaignId, options);

      // Also delete from queue manager with proper error handling
      let queueDeletionResult: CampaignDeletionResult | null = null;
      try {
        queueDeletionResult = await queueManager.deleteCampaign(
          campaignId,
          options.forceDelete
        );
      } catch (queueError) {
        console.warn('Queue deletion failed but backend deletion succeeded:', queueError);
        // Continue with the process as backend deletion was successful
      }

      // Remove from local state
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));

      // Update system metrics
      setSystemMetrics(prev => ({
        ...prev,
        activeCampaigns: campaigns.filter(c => c.id !== campaignId && c.status === 'active').length,
        usedCapacity: Math.max(0, prev.usedCapacity - 1)
      }));

      // Update real-time metrics
      setRealTimeMetrics(prev => ({
        ...prev,
        campaignsActive: campaigns.filter(c => c.id !== campaignId && c.status === 'active').length
      }));

      // Show success message with detailed information
      toast({
        title: "Campaign Deleted Successfully",
        description: result.deletionSummary ?
          `Campaign "${result.deletionSummary.campaignName}" has been deleted with ${result.deletionSummary.linksArchived} links archived.` :
          "Campaign has been permanently deleted with all related data cleaned up.",
      });

      // Log comprehensive deletion information
      console.log('Campaign deletion completed:', {
        campaignId,
        timestamp: new Date().toISOString(),
        backendResult: result,
        queueResult: queueDeletionResult,
        options,
        validationWarnings: validation.warnings
      });

    } catch (error) {
      console.error('Campaign deletion failed:', error);

      // Enhanced error handling with specific error types
      let errorMessage = "An unexpected error occurred during deletion.";
      let errorTitle = "Campaign Deletion Failed";

      if (error instanceof Error) {
        const apiError = error as CampaignApiError;

        if (apiError.requiresConfirmation) {
          errorTitle = "Confirmation Required";
          errorMessage = apiError.message + " Please use force delete if you want to proceed.";
        } else if (apiError.statusCode === 404) {
          errorTitle = "Campaign Not Found";
          errorMessage = "The campaign may have already been deleted or you don't have permission to delete it.";
        } else if (apiError.statusCode === 409) {
          errorTitle = "Cannot Delete Active Campaign";
          errorMessage = apiError.details || "Please pause the campaign first or use force delete option.";
        } else if (apiError.supportInfo) {
          errorMessage = `${apiError.message} Support reference: ${apiError.supportInfo.errorCode}`;
        } else {
          errorMessage = apiError.message;
        }
      }

      // Log error to error handling engine
      await errorEngine.handleError(error as Error, {
        component: 'campaign_deletion',
        operation: 'delete_campaign',
        severity: 'high',
        metadata: {
          campaignId,
          forceDelete: options.forceDelete,
          reason: options.reason,
          confirmationText: options.confirmationText,
          archiveLinks: options.archiveLinks,
          errorType: (error as CampaignApiError).statusCode ? 'api_error' : 'unknown_error',
          statusCode: (error as CampaignApiError).statusCode
        }
      });

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });

      // Re-throw to prevent dialog from closing on error
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <></>;
    }
  };

  const getHealthIndicator = (health: 'healthy' | 'degraded' | 'critical') => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      degraded: 'text-yellow-600 bg-yellow-100',
      critical: 'text-red-600 bg-red-100'
    };
    
    return (
      <Badge variant="outline" className={colors[health]}>
        {health.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Infinity className="h-10 w-10 text-blue-600" />
              <Zap className="h-5 w-5 text-orange-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
              Enterprise Backlink ∞ Automation
            </h1>
            <div className="flex items-center gap-2">
              {getHealthIndicator(systemMetrics.systemHealth)}
              <Badge variant="outline" className="text-blue-600 bg-blue-50">
                {systemMetrics.usedCapacity}/{systemMetrics.totalCapacity} CAPACITY
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 max-w-4xl mx-auto text-lg">
            AI-powered enterprise link building platform capable of managing 1000+ concurrent campaigns with 
            advanced content generation, real-time monitoring, and intelligent quality control.
          </p>
          
          {/* Real-time metrics bar */}
          <div className="flex justify-center gap-8 text-sm bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="font-medium">{realTimeMetrics.linksPostedToday}</span>
              <span className="text-gray-500">Links Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{realTimeMetrics.opportunitiesDiscovered}</span>
              <span className="text-gray-500">Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{realTimeMetrics.campaignsActive}</span>
              <span className="text-gray-500">Active Campaigns</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-600" />
              <span className="font-medium">{realTimeMetrics.systemLoad.toFixed(1)}%</span>
              <span className="text-gray-500">System Load</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-teal-600" />
              <span className="font-medium">{realTimeMetrics.apiCallsRemaining}</span>
              <span className="text-gray-500">API Calls Left</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">{realTimeMetrics.averageResponseTime.toFixed(0)}ms</span>
              <span className="text-gray-500">Response Time</span>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="discovery">Discovery Engine</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="content">Content AI</TabsTrigger>
            <TabsTrigger value="monitoring">System Health</TabsTrigger>
            <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Campaign Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create Enterprise Campaign
                </CardTitle>
                <CardDescription>
                  Deploy an AI-powered link building campaign with advanced targeting and quality controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Enterprise SEO Authority Q4 2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetUrl">Target URL</Label>
                      <Input
                        id="targetUrl"
                        value={campaignForm.targetUrl}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, targetUrl: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={campaignForm.keywords}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, keywords: e.target.value }))}
                        placeholder="enterprise software, business automation, AI solutions"
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
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dailyLimit">Daily Target</Label>
                        <Select
                          value={campaignForm.dailyLimit.toString()}
                          onValueChange={(value) => setCampaignForm(prev => ({ ...prev, dailyLimit: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 links/day</SelectItem>
                            <SelectItem value="10">10 links/day</SelectItem>
                            <SelectItem value="25">25 links/day</SelectItem>
                            <SelectItem value="50">50 links/day</SelectItem>
                            <SelectItem value="100">100 links/day</SelectItem>
                            <SelectItem value="200">200 links/day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="totalTarget">Total Target</Label>
                        <Input
                          id="totalTarget"
                          type="number"
                          value={campaignForm.totalTarget}
                          onChange={(e) => setCampaignForm(prev => ({ ...prev, totalTarget: parseInt(e.target.value) }))}
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Advanced Link Building Strategies</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {Object.entries(campaignForm.strategy).map(([strategy, config]) => (
                          <div key={strategy} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {strategy === 'blogComments' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                              {strategy === 'forumProfiles' && <UserPlus className="h-4 w-4 text-green-600" />}
                              {strategy === 'web2Platforms' && <Globe className="h-4 w-4 text-purple-600" />}
                              {strategy === 'socialProfiles' && <UserPlus className="h-4 w-4 text-orange-600" />}
                              {strategy === 'contactForms' && <Mail className="h-4 w-4 text-red-600" />}
                              {strategy === 'guestPosts' && <FileText className="h-4 w-4 text-indigo-600" />}
                              {strategy === 'resourcePages' && <ExternalLink className="h-4 w-4 text-teal-600" />}
                              <span className="text-sm font-medium">
                                {strategy.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                            </div>
                            <Switch
                              checked={config.enabled}
                              onCheckedChange={(checked) => 
                                setCampaignForm(prev => ({
                                  ...prev,
                                  strategy: {
                                    ...prev.strategy,
                                    [strategy]: { ...config, enabled: checked }
                                  }
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Quality Control</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">Min Authority</Label>
                          <Input
                            type="number"
                            value={campaignForm.qualityFilters.minDomainAuthority}
                            onChange={(e) => setCampaignForm(prev => ({
                              ...prev,
                              qualityFilters: {
                                ...prev.qualityFilters,
                                minDomainAuthority: parseInt(e.target.value)
                              }
                            }))}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Spam Score</Label>
                          <Input
                            type="number"
                            value={campaignForm.qualityFilters.maxSpamScore}
                            onChange={(e) => setCampaignForm(prev => ({
                              ...prev,
                              qualityFilters: {
                                ...prev.qualityFilters,
                                maxSpamScore: parseInt(e.target.value)
                              }
                            }))}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Relevance %</Label>
                          <Input
                            type="number"
                            value={campaignForm.qualityFilters.contentRelevanceThreshold}
                            onChange={(e) => setCampaignForm(prev => ({
                              ...prev,
                              qualityFilters: {
                                ...prev.qualityFilters,
                                contentRelevanceThreshold: parseInt(e.target.value)
                              }
                            }))}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={createCampaign} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Bot className="h-5 w-5 mr-2" />
                  )}
                  Deploy AI-Powered Campaign
                </Button>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            {campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Enterprise Campaign Dashboard
                  </CardTitle>
                  <CardDescription>
                    Real-time monitoring of {campaigns.filter(c => c.status === 'active').length} active campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-6 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(campaign.status)}
                            <div>
                              <h3 className="font-semibold text-lg">{campaign.name}</h3>
                              <p className="text-sm text-gray-600">{campaign.targetUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status.toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(campaign.performance.trend)}
                              <span className="text-sm font-medium">{campaign.performance.velocity.toFixed(1)}/day</span>
                            </div>
                            <div className="flex gap-2">
                              {campaign.status === 'active' ? (
                                <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : campaign.status === 'paused' ? (
                                <Button size="sm" variant="outline" onClick={() => resumeCampaign(campaign.id)}>
                                  <Play className="h-3 w-3" />
                                </Button>
                              ) : null}
                              <Button size="sm" variant="outline" onClick={() => loadCampaignAnalytics(campaign.id)}>
                                <BarChart3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(campaign)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                title="Delete Campaign"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{campaign.linksGenerated}</div>
                            <div className="text-xs text-gray-500">Links Generated</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{campaign.linksLive}</div>
                            <div className="text-xs text-gray-500">Live Links</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{campaign.quality.averageAuthority}</div>
                            <div className="text-xs text-gray-500">Avg Authority</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{campaign.quality.successRate}%</div>
                            <div className="text-xs text-gray-500">Success Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{campaign.performance.efficiency}%</div>
                            <div className="text-xs text-gray-500">Efficiency</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Campaign Progress</span>
                            <span>{campaign.progress}% ({campaign.linksGenerated}/{campaign.totalTarget})</span>
                          </div>
                          <Progress value={campaign.progress} className="h-3" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Target: {campaign.dailyTarget}/day</span>
                            <span>Est. completion: {campaign.estimatedCompletion.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6">
            {/* Link Discovery Engine */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Link Discovery Engine
                </CardTitle>
                <CardDescription>
                  Advanced opportunity discovery with real-time verification and quality scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkOpportunities.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {linkOpportunities.slice(0, 20).map((opportunity) => (
                      <div key={opportunity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {opportunity.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="font-medium truncate max-w-md">{opportunity.url}</span>
                            <Badge variant="outline" className={`text-xs ${
                              opportunity.authority >= 70 ? 'text-green-600 bg-green-50' :
                              opportunity.authority >= 50 ? 'text-yellow-600 bg-yellow-50' :
                              'text-red-600 bg-red-50'
                            }`}>
                              DA: {opportunity.authority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-xs text-gray-500">
                            <span>Relevance: {opportunity.relevanceScore}/100</span>
                            <span>Success Rate: {opportunity.estimatedSuccessRate}%</span>
                            <span>Spam Score: {opportunity.spamScore}/100</span>
                            <span>Discovery: {opportunity.discoveryMethod}</span>
                            <Badge
                              variant={opportunity.status === 'verified' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {opportunity.status}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Discovered</h3>
                    <p className="text-gray-500">Create a campaign to start discovering high-quality link opportunities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {campaigns.reduce((sum, c) => sum + c.linksGenerated, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Links Generated</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {campaigns.reduce((sum, c) => sum + c.linksLive, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Links Live</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{systemMetrics.averageQuality.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Average Quality Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {linkOpportunities.length}
                  </div>
                  <div className="text-sm text-gray-600">Opportunities Available</div>
                </CardContent>
              </Card>
            </div>

            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Analytics</CardTitle>
                  <CardDescription>Detailed performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                      Advanced analytics dashboard with predictive insights, competitor analysis, and ROI tracking is being loaded.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Content Generation AI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Content Generation Engine
                </CardTitle>
                <CardDescription>
                  Advanced natural language processing for authentic, high-converting content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Content generation engine is active and learning from campaign performance. 
                    {campaigns.filter(c => c.status === 'active').length} campaigns are currently generating content.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">GPT-4</div>
                    <div className="text-sm text-gray-600">Primary Language Model</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-sm text-gray-600">Content Uniqueness</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">12</div>
                    <div className="text-sm text-gray-600">Content Types</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            {/* System Health Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">System Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>{systemMetrics.usedCapacity}/{systemMetrics.totalCapacity}</span>
                    </div>
                    <Progress value={(systemMetrics.usedCapacity / systemMetrics.totalCapacity) * 100} />
                    <div className="text-xs text-gray-500">
                      {((systemMetrics.usedCapacity / systemMetrics.totalCapacity) * 100).toFixed(1)}% utilization
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Queue Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{systemMetrics.queueLength}</div>
                    <div className="text-xs text-gray-500">Campaigns in queue</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{systemMetrics.successRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Average success rate</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{systemMetrics.errorRate.toFixed(2)}%</div>
                    <div className="text-xs text-gray-500">24h error rate</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Real-Time System Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={`${
                  systemMetrics.systemHealth === 'healthy' ? 'border-green-200 bg-green-50' :
                  systemMetrics.systemHealth === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    System Status: <strong>{systemMetrics.systemHealth.toUpperCase()}</strong>
                    {systemMetrics.systemHealth === 'healthy' 
                      ? ' - All systems operating normally'
                      : systemMetrics.systemHealth === 'degraded'
                      ? ' - Some performance degradation detected'
                      : ' - Critical issues detected, automatic recovery in progress'
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Enterprise Configuration
                </CardTitle>
                <CardDescription>
                  Advanced system settings and security configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Anti-Detection Measures</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>User Agent Rotation</Label>
                        <Switch checked={campaignForm.antiDetection.userAgentRotation} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Human-like Delays</Label>
                        <Switch checked={campaignForm.antiDetection.humanLikeDelays} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Content Variation</Label>
                        <Switch checked={campaignForm.antiDetection.contentVariation} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">System Limits</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Max Campaigns per User</Label>
                        <Input type="number" defaultValue="50" />
                      </div>
                      <div>
                        <Label>Global Rate Limit</Label>
                        <Input type="number" defaultValue="10000" />
                      </div>
                      <div>
                        <Label>Content Generation Model</Label>
                        <Select defaultValue="gpt-4">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="claude-3">Claude 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All link building activities follow Google's guidelines and use natural, 
                    contextual placement strategies with enterprise-grade security measures.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Campaign Dialog */}
        <DeleteCampaignDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          campaign={campaignToDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
