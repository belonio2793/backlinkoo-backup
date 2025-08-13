import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Zap,
  Mail,
  Globe,
  BarChart3,
  AlertTriangle,
  Brain,
  TrendingUp,
  Users,
  Link2,
  Settings,
  Play,
  Loader2,
  CheckCircle,
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
import { UniversalPaymentComponent, QuickCreditButton, PremiumUpgradeButton } from '@/components/UniversalPaymentComponent';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled' | 'completed';
  keywords: string[];
  target_url: string;
  strategy: 'fast_boost' | 'natural_growth' | 'competitive' | 'branded';
  created_at: string;
  metrics?: {
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
        setDbStatus({ healthy: allTablesExist, missingTables });

        const { campaigns, stats: aggregatedStats } = await scalableDataService.getCampaignStats(user.id, 20, 0);
        setStats(aggregatedStats);
        setCampaigns(campaigns);

        // Outreach stats
        if (!missingTables.includes('outreach_campaigns')) {
          const { data: outreachData } = await supabase
            .from('outreach_campaigns')
            .select(`emails_sent, response_rate, positive_responses, link_placements`)
            .eq('user_id', user.id);

          if (outreachData && outreachData.length > 0) {
            setOutreachStats({
              emailsSent: outreachData.reduce((sum, c) => sum + (c.emails_sent || 0), 0),
              responseRate: Math.round(outreachData.reduce((sum, c) => sum + (c.response_rate || 0), 0) / outreachData.length),
              positiveResponses: outreachData.reduce((sum, c) => sum + (c.positive_responses || 0), 0),
              linkPlacements: outreachData.reduce((sum, c) => sum + (c.link_placements || 0), 0)
            });
          }
        }

        // Analytics stats
        if (!missingTables.includes('automation_analytics')) {
          const { data: analyticsData } = await supabase
            .from('automation_analytics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (analyticsData) {
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
        }

        // Recent activity
        const activityData = await scalableDataService.getActivityFeed(user.id, undefined, 10);
        setRecentActivity(activityData);

      } catch (err) {
        console.error('Error loading automation data:', err);
        setError('Failed to load automation data. Please refresh the page.');
        toast.error('Failed to load automation data');
      } finally {
        setLoading(false);
      }
    };
    
    loadAutomationData();
  }, [user, isAuthenticated]);

  // Save campaign and return saved object
  const handleSaveCampaign = async () => {
    if (!user || !campaignForm.name || !campaignForm.target_url || !campaignForm.keywords) {
      toast.error('Please fill in all required fields');
      return null;
    }

    try {
      const keywordsArray = campaignForm.keywords.split(',').map(k => k.trim()).filter(Boolean);
      
      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert({
          user_id: user.id,
          name: campaignForm.name,
          target_url: campaignForm.target_url,
          keywords: keywordsArray,
          strategy: campaignForm.strategy,
          competitor_urls: campaignForm.competitor_urls.split(',').map(u => u.trim()).filter(Boolean),
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

      return data;
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error('Failed to save campaign');
      return null;
    }
  };

  // Start automation with optional new campaign creation
  const handleStartAutomation = async () => {
    if (!user) return;

    const canProceed = await rateLimiter.checkLimit(user.id, 'automation');
    if (!canProceed) {
      toast.error('Rate limit exceeded. Please wait before starting another automation.');
      return;
    }

    try {
      setIsRunning(true);
      setCurrentStep('Creating campaign...');

      const newCampaign = await handleSaveCampaign();
      if (!newCampaign) return;

      setCurrentStep('Starting automation engines...');

      const response = await fetch('/.netlify/functions/automation-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'start',
          campaign: {
            name: newCampaign.name,
            target_url: newCampaign.target_url,
            keywords: newCampaign.keywords,
            strategy: newCampaign.strategy,
            drip_speed: newCampaign.drip_speed
          }
        })
      });

      if (!response.ok) throw new Error('Failed to start automation');

      toast.success('Automation campaign started!');
      window.location.reload();

    } catch (err) {
      console.error('Error starting automation:', err);
      toast.error('Failed to start automation');
      setCurrentStep('Error starting automation');
    } finally {
      setIsRunning(false);
    }
  };

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access the automated link building platform.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">System Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      {/* The rest of your UI remains unchanged */}
      <Footer />
    </div>
  );
}
