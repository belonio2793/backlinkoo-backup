import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Play,
  Pause,
  Settings,
  BarChart3,
  Target,
  Link,
  Zap,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useUserFlow, useAuthWithProgress } from '@/contexts/UserFlowContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { automationLogger } from '@/services/automationLogger';
import { targetSitesManager } from '@/services/targetSitesManager';
import { automationOrchestrator } from '@/services/automationOrchestrator';
import AutomationTestDashboard from '@/components/automation/AutomationTestDashboard';
import { LoginModal } from '@/components/LoginModal';
import { DatabaseInit } from '@/utils/databaseInit';
import { directAutomationExecutor, DirectExecutionResult } from '@/services/directAutomationExecutor';

interface Campaign {
  id: string;
  name: string;
  keywords: string[];
  anchor_texts: string[];
  target_url: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  created_at: string;
  user_id: string;
  links_built?: number;
  available_sites?: number;
  target_sites_used?: string[];
}

export default function Automation() {
  const { user } = useAuth();
  const { requireAuth, restoreFormData, shouldRestoreProgress } = useAuthWithProgress();
  const {
    showSignInModal,
    setShowSignInModal,
    defaultAuthTab,
    pendingAction,
    clearSavedFormData
  } = useUserFlow();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Direct execution state
  const [directExecuting, setDirectExecuting] = useState(false);
  const [directResults, setDirectResults] = useState<DirectExecutionResult[]>([]);

  // Initialize logging and database check
  useEffect(() => {
    automationLogger.info('system', 'Automation page loaded');
    if (user) {
      automationLogger.setUserId(user.id);
    }
    loadSitesInfo();

    // Check database tables exist
    DatabaseInit.ensureTablesExist().then(async (tablesExist) => {
      if (tablesExist && user) {
        // Test campaign insertion capability
        const canInsert = await DatabaseInit.testCampaignInsertion(user.id);
        if (!canInsert) {
          console.warn('⚠️ Campaign insertion test failed - there may be database permission or structure issues');
        }
      }
    }).catch(error => {
      console.warn('Database check failed:', error);
    });
  }, [user]);

  const loadSitesInfo = async () => {
    try {
      const stats = targetSitesManager.getStats();
      setSitesStats(stats);
      setAvailableSites(stats.active_sites);
      automationLogger.debug('system', 'Sites info loaded', stats);
    } catch (error) {
      automationLogger.error('system', 'Failed to load sites info', {}, undefined, error as Error);
    }
  };
  
  // Form state with restoration capability
  const [formData, setFormData] = useState({
    keywords: '',
    anchor_texts: '',
    target_url: ''
  });

  // Restore form data when component mounts if user was previously working on something
  useEffect(() => {
    if (shouldRestoreProgress && user) {
      const restoredData = restoreFormData();
      if (restoredData) {
        console.log('🎯 Automation: Restoring form data after auth:', restoredData);
        setFormData(restoredData);
        clearSavedFormData();
        toast.success('Welcome back! Your progress has been restored.');
      }
    }
  }, [shouldRestoreProgress, user, restoreFormData, clearSavedFormData]);

  // Auto-format URL to add https:// if missing
  const formatUrl = (url: string): string => {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, target_url: e.target.value });
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formattedUrl = formatUrl(e.target.value);
    setFormData({ ...formData, target_url: formattedUrl });
  };

  // Auto-generate campaign name based on keywords, URL, and timestamp
  const generateCampaignName = (keywords: string, targetUrl: string): string => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');

    // Extract main domain from URL
    let domain = '';
    try {
      const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = targetUrl.split('/')[0].replace('www.', '');
    }

    // Get first 2-3 keywords and clean them
    const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
    const primaryKeywords = keywordsList.slice(0, 3).join(' & ');

    // Generate name: "Keywords → Domain (YYYY-MM-DD HH:MM)"
    const shortKeywords = primaryKeywords.length > 30
      ? primaryKeywords.substring(0, 27) + '...'
      : primaryKeywords;

    return `${shortKeywords} → ${domain} (${timestamp})`;
  };

  // Available sites info
  const [availableSites, setAvailableSites] = useState(0);
  const [sitesStats, setSitesStats] = useState<any>(null);

  // Submissions and reporting
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  // Load user campaigns or demo data
  useEffect(() => {
    if (user) {
      loadCampaigns();
    } else {
      // Show demo campaigns for unauthenticated users with auto-generated names
      const demoTimestamp1 = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const demoTimestamp2 = new Date(Date.now() - 86400000).toISOString().slice(0, 16).replace('T', ' ');

      setCampaigns([
        {
          id: 'demo-1',
          name: `SEO tools & digital marketing & link building → example.com (${demoTimestamp1})`,
          keywords: ['SEO tools', 'digital marketing', 'link building'],
          anchor_texts: ['best SEO tools', 'click here', 'learn more'],
          target_url: 'https://example.com',
          status: 'active',
          created_at: new Date().toISOString(),
          user_id: 'demo',
          links_built: 15,
          available_sites: 47,
          target_sites_used: ['medium.com', 'dev.to', 'hashnode.com']
        },
        {
          id: 'demo-2',
          name: `content marketing & blog promotion → example.com (${demoTimestamp2})`,
          keywords: ['content marketing', 'blog promotion'],
          anchor_texts: ['great content', 'read more', 'check this out'],
          target_url: 'https://example.com/blog',
          status: 'paused',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: 'demo',
          links_built: 8,
          available_sites: 32,
          target_sites_used: ['substack.com', 'hackernoon.com']
        }
      ]);
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;

    setLoading(true);
    automationLogger.debug('database', 'Loading user campaigns', { userId: user.id });

    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      automationLogger.info('database', `Loaded ${data?.length || 0} campaigns`);
    } catch (error) {
      automationLogger.error('database', 'Failed to load campaigns', {}, undefined, error as Error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    // Check if user needs to authenticate and save progress
    const hasAuth = requireAuth(
      'campaign creation',
      formData.keywords || formData.anchor_texts || formData.target_url ? formData : undefined,
      false // Prefer login over signup for returning users
    );

    if (!hasAuth) {
      return; // User will be prompted to sign in, progress is saved
    }

    // Validate user object
    if (!user || !user.id) {
      automationLogger.error('campaign', 'Campaign creation attempted with invalid user object', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email
      });
      toast.error('Authentication error. Please sign in again.');
      return;
    }

    if (!formData.keywords || !formData.anchor_texts || !formData.target_url) {
      automationLogger.warn('campaign', 'Campaign creation attempted with missing fields', formData);
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);

    // Auto-generate campaign name
    const generatedName = generateCampaignName(formData.keywords, formData.target_url);
    automationLogger.info('campaign', 'Creating new campaign', { generatedName });

    try {
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const anchorTextsArray = formData.anchor_texts.split(',').map(a => a.trim()).filter(a => a);

      // Get available sites for this campaign
      let availableSites = [];
      try {
        availableSites = await targetSitesManager.getAvailableSites({
          domain_rating_min: 50,
          min_success_rate: 60
        }, 100);
        automationLogger.debug('campaign', `Found ${availableSites.length} available sites for campaign`);
      } catch (sitesError) {
        automationLogger.warn('campaign', 'Failed to load target sites, using fallback', {}, undefined, sitesError as Error);
        availableSites = []; // Fallback to empty array
      }

      // Prepare campaign data
      const campaignData = {
        user_id: user.id,
        name: generatedName,
        keywords: keywordsArray,
        anchor_texts: anchorTextsArray,
        target_url: formData.target_url,
        status: 'draft' as const,
        links_built: 0,
        available_sites: availableSites.length,
        target_sites_used: []
      };

      automationLogger.debug('campaign', 'Inserting campaign data', {
        userId: user.id,
        name: generatedName,
        keywordCount: keywordsArray.length,
        anchorTextCount: anchorTextsArray.length
      });

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) {
        automationLogger.error('campaign', 'Database insert failed', {
          campaignData,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details
        }, undefined, error);
        throw error;
      }

      if (!data) {
        throw new Error('Campaign created but no data returned from database');
      }

      automationLogger.campaignCreated(data.id, {
        name: data.name,
        keywords: keywordsArray.length,
        anchor_texts: anchorTextsArray.length,
        available_sites: availableSites.length
      });

      setCampaigns(prev => [data, ...prev]);
      setFormData({
        keywords: '',
        anchor_texts: '',
        target_url: ''
      });

      toast.success(`Campaign '${data.name}' created with ${availableSites.length} target sites available!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        formData,
        generatedName,
        userId: user?.id,
        errorType: typeof error,
        errorMessage
      };

      automationLogger.error('campaign', 'Failed to create campaign', errorDetails, undefined, error as Error);

      console.error('🎯 Campaign creation error details:', {
        error,
        formData,
        user: user?.id,
        errorMessage
      });

      // Show user-friendly error message
      toast.error(`Failed to create campaign: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const executeDirectly = async () => {
    if (!formData.keywords || !formData.anchor_texts || !formData.target_url) {
      toast.error('Please fill in all required fields for direct execution');
      return;
    }

    setDirectExecuting(true);
    automationLogger.info('direct_execution', 'Starting direct automation execution', {
      keywords: formData.keywords.split(',').length,
      anchor_texts: formData.anchor_texts.split(',').length,
      target_url: formData.target_url
    });

    try {
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const anchorTextsArray = formData.anchor_texts.split(',').map(a => a.trim()).filter(a => a);

      toast.info('🚀 Starting content generation and publishing...', { duration: 3000 });

      const result = await directAutomationExecutor.executeWorkflow({
        keywords: keywordsArray,
        anchor_texts: anchorTextsArray,
        target_url: formData.target_url,
        user_id: user?.id || 'anonymous-user'
      });

      if (result.success) {
        // Add to results at the top
        setDirectResults(prev => [result, ...prev]);

        // Clear form
        setFormData({
          keywords: '',
          anchor_texts: '',
          target_url: ''
        });

        automationLogger.info('direct_execution', 'Direct execution completed successfully', {
          article_url: result.article_url,
          execution_time: result.execution_time_ms,
          word_count: result.word_count
        });

        toast.success(
          `🎉 Article published successfully!
          ${result.word_count} words in ${Math.round((result.execution_time_ms || 0) / 1000)}s`,
          { duration: 5000 }
        );
      } else {
        automationLogger.error('direct_execution', 'Direct execution failed', {
          error: result.error,
          execution_time: result.execution_time_ms
        });
        toast.error(`Direct execution failed: ${result.error}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      automationLogger.error('direct_execution', 'Direct execution error', {
        errorMessage,
        formData
      }, undefined, error as Error);
      toast.error(`Execution failed: ${errorMessage}`);
    } finally {
      setDirectExecuting(false);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: Campaign['status']) => {
    automationLogger.info('campaign', `Updating campaign status to ${status}`, {}, campaignId);

    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .update({ status })
        .eq('id', campaignId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status } : c
      ));

      if (status === 'active') {
        automationLogger.campaignStarted(campaignId);
        toast.success('Campaign started - Beginning automation process...');

        // Automatically start processing when campaign is activated
        setTimeout(() => {
          processCampaignAutomation(campaignId);
        }, 1000);
      } else if (status === 'paused') {
        automationLogger.campaignPaused(campaignId);
        toast.success('Campaign paused');
      }
    } catch (error) {
      automationLogger.error('campaign', 'Failed to update campaign status',
        { status }, campaignId, error as Error);
      toast.error('Failed to update campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    automationLogger.info('campaign', 'Deleting campaign', {}, campaignId);

    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      automationLogger.info('campaign', 'Campaign deleted successfully', {}, campaignId);
      toast.success('Campaign deleted');
    } catch (error) {
      automationLogger.error('campaign', 'Failed to delete campaign', {}, campaignId, error as Error);
      toast.error('Failed to delete campaign');
    }
  };

  const processCampaignAutomation = async (campaignId: string) => {
    if (!user) {
      toast.error('Please sign in to process campaigns');
      return;
    }

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      toast.error('Campaign not found');
      return;
    }

    setProcessing(prev => ({ ...prev, [campaignId]: true }));
    automationLogger.info('campaign', 'Starting automation processing', {}, campaignId);

    try {
      toast.info('Starting automation workflow...', { duration: 3000 });

      const result = await automationOrchestrator.processCampaign({
        id: campaign.id,
        name: campaign.name,
        keywords: campaign.keywords,
        anchor_texts: campaign.anchor_texts,
        target_url: campaign.target_url,
        user_id: campaign.user_id,
        status: campaign.status
      });

      if (result.success) {
        toast.success(`Article published successfully! View at: ${result.articleUrl?.substring(0, 50)}...`);

        // Refresh campaigns and submissions
        await loadCampaigns();
        await loadSubmissions();
      } else {
        toast.error(`Automation failed: ${result.error}`);
      }

    } catch (error) {
      automationLogger.error('campaign', 'Automation processing error', {}, campaignId, error as Error);
      toast.error('Failed to process automation');
    } finally {
      setProcessing(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const loadSubmissions = async () => {
    if (!user) return;

    setLoadingSubmissions(true);
    try {
      const userSubmissions = await automationOrchestrator.getUserSubmissions(user.id, 20);
      setSubmissions(userSubmissions);
      automationLogger.debug('database', `Loaded ${userSubmissions.length} submissions`);

      // If no submissions and user is authenticated, show helpful message
      if (userSubmissions.length === 0 && user) {
        console.log('ℹ️ No submissions found for user, this is normal for new accounts');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      automationLogger.error('database', 'Failed to load submissions', {
        errorMessage,
        userId: user.id
      }, undefined, error as Error);

      console.error('📊 Submission loading error details:', {
        error,
        user: user?.id,
        errorType: typeof error,
        errorMessage
      });

      // Show a user-friendly error message
      toast.error('Unable to load submission history. Database tables may not be initialized.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Load submissions when user changes
  useEffect(() => {
    if (user) {
      loadSubmissions();
    } else {
      // Show demo submissions for unauthenticated users
      setSubmissions([
        {
          id: 'demo-sub-1',
          article_title: 'Complete Guide to SEO Tools & Digital Marketing',
          article_url: 'https://telegra.ph/demo-article-1',
          status: 'published',
          published_date: new Date().toISOString(),
          anchor_text: 'best SEO tools',
          metadata: { word_count: 847, views: 156 },
          automation_campaigns: { name: 'SEO tools & digital marketing → example.com', target_url: 'https://example.com' }
        },
        {
          id: 'demo-sub-2',
          article_title: 'Content Marketing Strategies for Growth',
          article_url: 'https://telegra.ph/demo-article-2',
          status: 'published',
          published_date: new Date(Date.now() - 3600000).toISOString(),
          anchor_text: 'learn more',
          metadata: { word_count: 692, views: 89 },
          automation_campaigns: { name: 'content marketing → example.com', target_url: 'https://example.com/blog' }
        }
      ]);
    }
  }, [user]);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };


  // Handle auth success from modal
  const handleAuthSuccess = (user: any) => {
    console.log('🎯 Automation: Auth success, user:', user?.email);
    setShowSignInModal(false);
    // Form restoration will happen via useEffect above
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Link Building Automation</h1>
          <p className="text-gray-600 text-lg">Create and manage your automated link building campaigns</p>
        </div>

        <Tabs defaultValue="create" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger value="direct-results" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Direct Results
              {directResults.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {directResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Campaigns
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reporting
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              System Testing
            </TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create New Campaign
                </CardTitle>
                <CardDescription>
                  Set up your automated link building campaign. Campaign names are automatically generated based on your keywords and target URL.
                </CardDescription>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2">Two Execution Modes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-blue-700">📊 Create Campaign</p>
                      <p className="text-blue-600">Saves to database for tracking and management</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700">⚡ Execute Directly</p>
                      <p className="text-green-600">Immediate execution without database storage</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target-url">Target URL</Label>
                  <Input
                    id="target-url"
                    type="url"
                    placeholder="https://yourwebsite.com/target-page"
                    value={formData.target_url}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                  />
                  <p className="text-xs text-gray-500">
                    URL will automatically be formatted with https:// if needed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Textarea
                    id="keywords"
                    placeholder="SEO tools, link building, digital marketing, content optimization"
                    rows={3}
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                  <p className="text-sm text-gray-500">
                    Enter keywords you want to rank for, separated by commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anchor-texts">Anchor Texts (comma-separated)</Label>
                  <Textarea
                    id="anchor-texts"
                    placeholder="best SEO tools, click here, learn more, your brand name"
                    rows={3}
                    value={formData.anchor_texts}
                    onChange={(e) => setFormData({ ...formData, anchor_texts: e.target.value })}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the anchor texts you want to use for backlinks
                  </p>
                </div>

                {/* Available Sites Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Target Sites Available</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">
                        <span className="font-semibold">{availableSites}</span> active publishing sites
                      </p>
                      <p className="text-blue-600">
                        High-quality domains ready for articles
                      </p>
                    </div>
                    {sitesStats && (
                      <div>
                        <p className="text-blue-700">
                          <span className="font-semibold">{sitesStats.average_success_rate}%</span> average success rate
                        </p>
                        <p className="text-blue-600">
                          Rotating through top-performing sites
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={createCampaign}
                    disabled={creating || directExecuting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Creating Campaign...
                      </>
                    ) : user ? (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {formData.keywords || formData.anchor_texts || formData.target_url
                          ? 'Save Progress & Sign In'
                          : 'Sign In to Create Campaign'
                        }
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or</span>
                    </div>
                  </div>

                  <Button
                    onClick={executeDirectly}
                    disabled={directExecuting || creating}
                    variant="outline"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-600 hover:border-green-700"
                  >
                    {directExecuting ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Generating & Publishing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Execute Directly (No Database)
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Direct execution: Generate content and publish immediately without saving to database
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Campaigns Tab */}
          <TabsContent value="manage" className="space-y-6">
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Demo Mode</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  You're viewing demo campaigns. Sign in to create and manage your own automated link building campaigns.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{user ? 'Your Campaigns' : 'Demo Campaigns'}</h2>
              <Button 
                onClick={loadCampaigns}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-500 mb-4">Create your first automation campaign to get started</p>
                  <Button 
                    onClick={() => document.querySelector('[value="create"]')?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <Badge 
                              className={`${getStatusColor(campaign.status)} text-white flex items-center gap-1`}
                            >
                              {getStatusIcon(campaign.status)}
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Target URL</p>
                              <p className="text-sm font-medium truncate">{campaign.target_url}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Keywords</p>
                              <p className="text-sm font-medium">{campaign.keywords?.length || 0} keywords</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Sites & Progress</p>
                              <p className="text-sm font-medium">
                                {campaign.links_built || 0} links built
                              </p>
                              <p className="text-xs text-gray-400">
                                {campaign.available_sites || 0} sites available
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {campaign.target_sites_used?.length ?
                                `Sites used: ${campaign.target_sites_used.join(', ').substring(0, 40)}${campaign.target_sites_used.join(', ').length > 40 ? '...' : ''}` :
                                'No sites used yet'
                              }
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!user ? (
                            // Demo mode - show sign in prompt
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toast.info('Sign in to start real automation campaigns with OpenAI content generation and Telegraph posting')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Sign In to Start Automation
                            </Button>
                          ) : (
                            // Authenticated mode - show normal controls
                            <>
                              {processing[campaign.id] ? (
                                <Button
                                  size="sm"
                                  disabled
                                  className="bg-blue-600"
                                >
                                  <div className="animate-spin mr-2 h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                                  Processing...
                                </Button>
                              ) : campaign.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                                >
                                  <Pause className="h-4 w-4 mr-1" />
                                  Pause
                                </Button>
                              ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                                <Button
                                  size="sm"
                                  onClick={() => updateCampaignStatus(campaign.id, 'active')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Start Automation
                                </Button>
                              ) : null}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteCampaign(campaign.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Direct Execution Results Tab */}
          <TabsContent value="direct-results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Direct Execution Results</h2>
              <Button
                onClick={() => setDirectResults([])}
                variant="outline"
                disabled={directResults.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            </div>

            {directResults.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No direct executions yet</h3>
                  <p className="text-gray-500 mb-4">Use "Execute Directly" to generate and publish content instantly</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {directResults.map((result, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{result.article_title}</h3>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Platform</p>
                              <p className="text-sm font-medium">{result.target_platform}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Word Count</p>
                              <p className="text-sm font-medium">{result.word_count} words</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Execution Time</p>
                              <p className="text-sm font-medium">{Math.round((result.execution_time_ms || 0) / 1000)}s</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Anchor Text</p>
                              <p className="text-sm font-medium">{result.anchor_text_used}</p>
                            </div>
                          </div>

                          {result.debug_info && (
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                Keyword: {result.debug_info.keyword_used}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Generated in {Math.round((result.debug_info.content_generation_ms || 0) / 1000)}s
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {result.article_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(result.article_url, '_blank')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Article
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reporting Tab */}
          <TabsContent value="reporting" className="space-y-6">
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Demo Reporting</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  You're viewing demo submission reports. Sign in to see your actual campaign results and published articles.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{user ? 'Your Published Articles' : 'Demo Article Reports'}</h2>
              <Button
                onClick={loadSubmissions}
                variant="outline"
                disabled={loadingSubmissions || !user}
              >
                {loadingSubmissions ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Refresh Reports
              </Button>
            </div>

            {loadingSubmissions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles published yet</h3>
                  <p className="text-gray-500 mb-4">Start a campaign to begin generating and publishing articles</p>
                  <Button
                    onClick={() => document.querySelector('[value="create"]')?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{submission.article_title}</h3>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Campaign</p>
                              <p className="text-sm font-medium truncate">
                                {submission.automation_campaigns?.name || 'Unknown Campaign'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Target URL</p>
                              <p className="text-sm font-medium truncate">
                                {submission.automation_campaigns?.target_url || 'Unknown URL'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Article Stats</p>
                              <p className="text-sm font-medium">
                                {submission.metadata?.word_count || 0} words
                              </p>
                              <p className="text-xs text-gray-400">
                                {submission.metadata?.views || 0} views
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(submission.published_date).toLocaleDateString()}
                            </div>
                            {submission.anchor_text && (
                              <div className="flex items-center gap-1">
                                <Link className="h-4 w-4" />
                                Anchor: "{submission.anchor_text}"
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              telegra.ph
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {submission.article_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(submission.article_url, '_blank')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Article
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* System Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <AutomationTestDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      {/* Auth Modal */}
      <LoginModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab={defaultAuthTab}
        pendingAction={pendingAction}
      />
    </div>
  );
}
