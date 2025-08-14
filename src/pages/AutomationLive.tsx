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
  BarChart3,
  Target,
  Zap,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useUserFlow, useAuthWithProgress } from '@/contexts/UserFlowContext';
import { toast } from 'sonner';
import { automationLogger } from '@/services/automationLogger';
import { liveCampaignManager, type LiveCampaign } from '@/services/liveCampaignManager';
import { campaignReportingSystem, type PublishedLink, type CampaignReport } from '@/services/campaignReportingSystem';
import { LoginModal } from '@/components/LoginModal';
import { DatabaseInit } from '@/utils/databaseInit';
import { internalLogger } from '@/services/internalLogger';
import { PLATFORM_CONFIGS } from '@/services/platformConfigs';

export default function AutomationLive() {
  const { user } = useAuth();
  const { requireAuth, restoreFormData, shouldRestoreProgress } = useAuthWithProgress();
  const {
    showSignInModal,
    setShowSignInModal,
    defaultAuthTab,
    pendingAction,
    clearSavedFormData
  } = useUserFlow();

  // State management
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>([]);
  const [publishedLinks, setPublishedLinks] = useState<PublishedLink[]>([]);
  const [savedReports, setSavedReports] = useState<CampaignReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    keywords: '',
    anchor_texts: '',
    target_url: ''
  });

  // Dashboard analytics
  const [analytics, setAnalytics] = useState<{
    total_links: number;
    total_campaigns: number;
    success_rate: number;
    total_word_count: number;
    platform_breakdown: Array<{
      platform: string;
      count: number;
      percentage: number;
    }>;
  }>({
    total_links: 0,
    total_campaigns: 0,
    success_rate: 0,
    total_word_count: 0,
    platform_breakdown: []
  });

  // Initialize and load data
  useEffect(() => {
    automationLogger.info('system', 'Live Automation page loaded');
    if (user) {
      automationLogger.setUserId(user.id);
      loadUserData();
    }

    DatabaseInit.ensureTablesExist().catch(error => {
      console.warn('Database check failed:', error);
    });
  }, [user]);

  // Restore form data after auth
  useEffect(() => {
    if (shouldRestoreProgress && user) {
      const restoredData = restoreFormData();
      if (restoredData) {
        setFormData(restoredData);
        clearSavedFormData();
        toast.success('Welcome back! Your progress has been restored.');
      }
    }
  }, [shouldRestoreProgress, user, restoreFormData, clearSavedFormData]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load campaigns
      const userCampaigns = await liveCampaignManager.getUserCampaigns(user.id);
      setCampaigns(userCampaigns);
      
      // Load published links
      const userLinks = await campaignReportingSystem.getUserPublishedLinks(user.id);
      setPublishedLinks(userLinks);
      
      // Load saved reports
      const userReports = await campaignReportingSystem.getUserReports(user.id);
      setSavedReports(userReports);
      
      // Load analytics
      const dashboardData = await campaignReportingSystem.getDashboardAnalytics(user.id);
      setAnalytics(dashboardData);
      
      automationLogger.info('system', `Loaded user data: ${userCampaigns.length} campaigns, ${userLinks.length} links`);
    } catch (error) {
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle object errors by extracting meaningful information
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.error || errorObj.details ||
                      (errorObj.toString && errorObj.toString !== '[object Object]' ? errorObj.toString() : '') ||
                      'An error occurred with no additional details';
      }

      automationLogger.error('system', 'Failed to load user data', { errorMessage, originalError: error }, undefined, error as Error);
      toast.error(`Failed to load user data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!user) return;
    await loadUserData();
    toast.success('Data refreshed successfully');
  };

  // Auto-format URL
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

  // Generate campaign name
  const generateCampaignName = (keywords: string, targetUrl: string): string => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');

    let domain = '';
    try {
      const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = targetUrl.split('/')[0].replace('www.', '');
    }

    const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
    const primaryKeywords = keywordsList.slice(0, 3).join(' & ');
    const shortKeywords = primaryKeywords.length > 30
      ? primaryKeywords.substring(0, 27) + '...'
      : primaryKeywords;

    return `${shortKeywords} → ${domain} (${timestamp})`;
  };

  // Create campaign
  const createCampaign = async () => {
    const hasAuth = requireAuth(
      'campaign creation',
      formData.keywords || formData.anchor_texts || formData.target_url ? formData : undefined,
      false
    );

    if (!hasAuth) return;

    if (!user || !user.id) {
      toast.error('Authentication error. Please sign in again.');
      return;
    }

    if (!formData.keywords || !formData.anchor_texts || !formData.target_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      // Enhanced array processing with validation
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k && k.length > 0);

      const anchorTextsArray = formData.anchor_texts
        .split(',')
        .map(a => a.trim())
        .filter(a => a && a.length > 0);

      if (keywordsArray.length === 0) {
        toast.error('Please provide at least one valid keyword');
        return;
      }

      if (anchorTextsArray.length === 0) {
        toast.error('Please provide at least one valid anchor text');
        return;
      }

      const generatedName = generateCampaignName(formData.keywords, formData.target_url);

      console.log('🔍 Campaign creation debug:', {
        formData,
        keywordsArray,
        anchorTextsArray,
        keywordsArrayType: Array.isArray(keywordsArray),
        anchorTextsArrayType: Array.isArray(anchorTextsArray),
        keywordsLength: keywordsArray.length,
        anchorTextsLength: anchorTextsArray.length,
        keywordsSample: keywordsArray.slice(0, 3),
        anchorTextsSample: anchorTextsArray.slice(0, 3)
      });

      // Ensure all data is properly typed and cleaned
      // Validate target_url before trimming
      if (!formData.target_url || typeof formData.target_url !== 'string') {
        toast.error('Please provide a valid target URL');
        return;
      }

      const cleanTargetUrl = formData.target_url.trim();
      if (!cleanTargetUrl) {
        toast.error('Target URL cannot be empty');
        return;
      }

      const campaignParams = {
        name: generatedName,
        keywords: keywordsArray, // Guaranteed to be a valid array of strings
        anchor_texts: anchorTextsArray, // Guaranteed to be a valid array of strings
        target_url: cleanTargetUrl,
        user_id: user.id,
        auto_start: false
      };

      console.log('🔍 Campaign params being sent:', {
        ...campaignParams,
        keywords_validation: {
          is_array: Array.isArray(campaignParams.keywords),
          length: campaignParams.keywords.length,
          all_strings: campaignParams.keywords.every(k => typeof k === 'string'),
          sample: campaignParams.keywords.slice(0, 2)
        },
        anchor_texts_validation: {
          is_array: Array.isArray(campaignParams.anchor_texts),
          length: campaignParams.anchor_texts.length,
          all_strings: campaignParams.anchor_texts.every(a => typeof a === 'string'),
          sample: campaignParams.anchor_texts.slice(0, 2)
        }
      });

      internalLogger.info('ui_campaign_creation', 'User initiated campaign creation', {
        campaignParams: {
          ...campaignParams,
          keywords_count: campaignParams.keywords.length,
          anchor_texts_count: campaignParams.anchor_texts.length
        },
        formData,
        userInfo: { id: user.id, email: user.email }
      });

      // Log the exact params being sent for debugging
      console.log('🚀 Final campaign params validation:', {
        name: typeof campaignParams.name,
        keywords: {
          type: Array.isArray(campaignParams.keywords) ? 'array' : typeof campaignParams.keywords,
          length: Array.isArray(campaignParams.keywords) ? campaignParams.keywords.length : 'N/A',
          sample: Array.isArray(campaignParams.keywords) ? campaignParams.keywords.slice(0, 2) : 'N/A',
          allStrings: Array.isArray(campaignParams.keywords) ? campaignParams.keywords.every(k => typeof k === 'string') : false
        },
        anchor_texts: {
          type: Array.isArray(campaignParams.anchor_texts) ? 'array' : typeof campaignParams.anchor_texts,
          length: Array.isArray(campaignParams.anchor_texts) ? campaignParams.anchor_texts.length : 'N/A',
          sample: Array.isArray(campaignParams.anchor_texts) ? campaignParams.anchor_texts.slice(0, 2) : 'N/A',
          allStrings: Array.isArray(campaignParams.anchor_texts) ? campaignParams.anchor_texts.every(a => typeof a === 'string') : false
        },
        target_url: typeof campaignParams.target_url,
        user_id: typeof campaignParams.user_id,
        auto_start: typeof campaignParams.auto_start
      });

      const result = await liveCampaignManager.createCampaign(campaignParams);

      internalLogger.info('ui_campaign_creation', 'Campaign creation result received', {
        success: result.success,
        hasCampaign: !!result.campaign,
        error: result.error,
        campaignId: result.campaign?.id || 'No ID',
        errorDetails: result.error ? {
          message: result.error,
          containsJsonArray: result.error.includes('expected JSON array'),
          containsColumn: result.error.includes('column'),
          containsPermission: result.error.includes('permission')
        } : null
      });

      if (result.success && result.campaign) {
        internalLogger.info('ui_campaign_creation', 'Campaign created successfully', {
          campaignId: result.campaign.id,
          campaignName: result.campaign.name
        });

        setCampaigns(prev => [result.campaign!, ...prev]);
        setFormData({ keywords: '', anchor_texts: '', target_url: '' });
        toast.success(`Campaign '${result.campaign.name}' created successfully!`);
        await refreshData();
      } else {
        internalLogger.error('ui_campaign_creation', 'Campaign creation failed', {
          result,
          formData: campaignParams
        });
        throw new Error(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      let isKnownIssue = false;

      // Handle specific Response stream errors
      if (error instanceof Error && error.message.includes('body stream already read')) {
        errorMessage = 'Network request error. Please try again.';
        isKnownIssue = true;
        console.error('🔍 Response stream error detected:', {
          message: error.message,
          stack: error.stack,
          errorType: 'body_stream_already_read'
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle object errors by extracting meaningful information
        const errorObj = error as any;

        // Enhanced debugging for object errors
        console.error('🔍 Campaign Creation Error Debug:', {
          errorType: typeof error,
          errorConstructor: error.constructor?.name,
          errorKeys: Object.keys(error),
          rawError: error,
          stringified: JSON.stringify(error, null, 2)
        });

        errorMessage = errorObj.message || errorObj.error || errorObj.details ||
                      (errorObj.toString && errorObj.toString !== '[object Object]' ? errorObj.toString() : '') ||
                      'Campaign creation failed with no additional details';
      }

      // Check for specific known issues
      if (errorMessage.includes('expected JSON array')) {
        isKnownIssue = true;
        errorMessage = 'Database configuration error. Please try again or contact support if the issue persists.';

        // Log additional debugging information with better serialization
        console.error('🔍 JSON Array Error Debug:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : 'No stack trace',
          formDataValidation: {
            keywords_string: typeof formData.keywords === 'string' ? formData.keywords.substring(0, 100) : 'Not a string',
            anchor_texts_string: typeof formData.anchor_texts === 'string' ? formData.anchor_texts.substring(0, 100) : 'Not a string',
            target_url_string: typeof formData.target_url === 'string' ? formData.target_url : 'Not a string'
          },
          processedArrays: {
            keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
            anchor_texts: formData.anchor_texts ? formData.anchor_texts.split(',').map(a => a.trim()).filter(a => a) : []
          },
          userInfo: {
            hasUser: !!user,
            userId: user?.id || 'No ID'
          }
        });
      }

      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        isKnownIssue = true;
        errorMessage = 'Database schema issue detected. The system will attempt to fix this automatically.';
      }

      if (errorMessage.includes('permission denied') || errorMessage.includes('policy violation')) {
        isKnownIssue = true;
        errorMessage = 'Permission error. Please sign out and sign back in, then try again.';
      }

      // Safe error logging - avoid passing Response objects that may have consumed body streams
      const safeErrorData = {
        errorMessage,
        isKnownIssue,
        formData: {
          keywords_length: formData.keywords.length,
          anchor_texts_length: formData.anchor_texts.length,
          target_url_length: formData.target_url.length
        },
        errorInfo: {
          type: typeof error,
          constructor: error?.constructor?.name,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      };

      automationLogger.error('campaign', 'Failed to create campaign', safeErrorData);

      // Show user-friendly error message
      if (isKnownIssue) {
        toast.error(errorMessage);
      } else {
        toast.error(`Failed to create campaign: ${errorMessage}`);
      }

      // Additional error recovery suggestion
      if (errorMessage.includes('JSON array') || errorMessage.includes('schema')) {
        setTimeout(() => {
          toast.info('💡 Tip: Try refreshing the page and signing in again if the error persists.');
        }, 2000);
      }
    } finally {
      setCreating(false);
    }
  };


  const handleAuthSuccess = (user: any) => {
    setShowSignInModal(false);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Link Building Automation</h1>
          <p className="text-gray-600 text-lg">Create and manage production-ready automated campaigns</p>
          
          {/* Analytics Dashboard */}
          {user && analytics.total_campaigns > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{analytics.total_campaigns}</div>
                <div className="text-sm text-gray-600">Campaigns</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{analytics.total_links}</div>
                <div className="text-sm text-gray-600">Links Built</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{analytics.success_rate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{Math.round(analytics.total_word_count / 1000)}k</div>
                <div className="text-sm text-gray-600">Words</div>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="create" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results & Reporting
              {publishedLinks.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {publishedLinks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Campaign Creation Form */}
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create New Campaign
                </CardTitle>
                <CardDescription>
                  Generate high-quality content with ChatGPT and publish to Telegraph with your anchor text links.
                </CardDescription>
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

                {/* Campaign Analytics Summary */}
                {user && analytics.total_campaigns > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Campaign Overview</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">
                        {campaigns.filter(c => c.status === 'active').length} Active Campaigns
                      </span>
                      <span className="text-blue-600">
                        {analytics.total_links} Links Published
                      </span>
                      <span className="text-blue-600">
                        {analytics.success_rate.toFixed(0)}% Success Rate
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={createCampaign}
                  disabled={creating || !user}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>

                {!user && (
                  <div className="text-center text-sm text-gray-600">
                    <Button
                      variant="outline"
                      onClick={() => setShowSignInModal(true)}
                      className="w-full"
                    >
                      Sign In to Create Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Target Platforms Container */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Target Platforms
                </CardTitle>
                <CardDescription>
                  Publishing domains for link building rotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Scrollable Domain List */}
                <div className="h-64 overflow-y-auto border rounded-lg bg-white text-xs">
                  {Object.values(PLATFORM_CONFIGS).map((platform) => (
                    <div key={platform.id} className="border-b border-gray-100 last:border-b-0 px-2 py-1.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              platform.implementation.status === 'implemented' ? 'bg-green-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="font-medium text-gray-900 text-xs">{platform.domain}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 h-4 ${
                                platform.implementation.status === 'implemented'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {platform.implementation.status === 'implemented' ? 'Active' : 'Ready'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600">
                            <div>
                              <span className="text-gray-500">DR:</span>
                              <span className="ml-0.5 font-medium">
                                {platform.domain === 'telegra.ph' ? '85+' :
                                 platform.domain === 'write.as' ? '75+' :
                                 platform.domain === 'rentry.co' ? '60+' : '55+'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Traffic:</span>
                              <span className="ml-0.5 font-medium">
                                {platform.domain === 'telegra.ph' ? '2.5M' :
                                 platform.domain === 'write.as' ? '180K' :
                                 platform.domain === 'rentry.co' ? '95K' : '45K'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Success:</span>
                              <span className="ml-0.5 font-medium">
                                {platform.domain === 'telegra.ph' ? '95%' :
                                 platform.domain === 'write.as' ? '90%' :
                                 platform.domain === 'rentry.co' ? '85%' : '80%'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(platform.documentation, '_blank')}
                          className="ml-1 text-gray-400 hover:text-gray-600 p-0.5 h-5 w-5"
                        >
                          <ExternalLink className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

              </CardContent>
            </Card>
            </div>
          </TabsContent>


          {/* Results & Reporting Tab */}
          <TabsContent value="reporting" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Published Links</h3>
              <Button onClick={refreshData} variant="outline" disabled={loading}>
                {loading ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {!user ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view reports</h3>
                  <p className="text-gray-500 mb-4">Track your published articles and campaign performance</p>
                  <Button onClick={() => setShowSignInModal(true)}>
                    Sign In to View Reports
                  </Button>
                </CardContent>
              </Card>
            ) : publishedLinks.length === 0 ? (
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
                {publishedLinks.map((link) => (
                  <Card key={link.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{link.title}</h3>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Platform</p>
                              <p className="text-sm font-medium">{link.platform}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Word Count</p>
                              <p className="text-sm font-medium">{link.word_count} words</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Anchor Text</p>
                              <p className="text-sm font-medium">{link.anchor_text_used}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Published</p>
                              <p className="text-sm font-medium">{new Date(link.published_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(link.url, '_blank')}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Article
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Saved Reports Section */}
            {savedReports.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Saved Reports</h3>
                <div className="grid gap-4">
                  {savedReports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold mb-2">{report.report_name}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Type</p>
                                <p className="font-medium">{report.report_type}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total Links</p>
                                <p className="font-medium">{report.summary.total_links}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Success Rate</p>
                                <p className="font-medium">{report.performance_metrics.success_rate.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Generated</p>
                                <p className="font-medium">{new Date(report.generated_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportReportCSV(report)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              CSV
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>


        </Tabs>
      </div>

      <Footer />

      {/* Login Modal */}
      <LoginModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        defaultTab={defaultAuthTab}
        onSuccess={handleAuthSuccess}
        pendingAction={pendingAction}
      />
    </div>
  );
}
