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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { automationLogger } from '@/services/automationLogger';
import { automationEngine, type PublishedArticle } from '@/services/automationEngine';
import { LoginModal } from '@/components/LoginModal';

interface Campaign {
  id: string;
  name: string;
  keywords: string[];
  anchor_texts: string[];
  target_url: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  user_id: string;
  links_built?: number;
  available_sites?: number;
  target_sites_used?: string[];
}

interface PublishedArticle {
  id: string;
  article_title: string;
  article_url: string;
  status: 'published';
  published_date: string;
  anchor_text: string;
  word_count?: number;
  platform: string;
  campaign_name?: string;
  target_url?: string;
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

  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    keywords: '',
    anchor_texts: '',
    target_url: ''
  });

  // Analytics
  const [analytics, setAnalytics] = useState({
    total_campaigns: 0,
    total_links: 0,
    success_rate: 0,
    total_word_count: 0
  });

  // Initialize
  useEffect(() => {
    automationLogger.info('system', 'Automation page loaded');
    if (user) {
      automationLogger.setUserId(user.id);
      loadUserData();
    } else {
      // Load demo data for non-authenticated users
      loadDemoData();
    }
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

  const loadDemoData = () => {
    const demoTimestamp1 = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const demoTimestamp2 = new Date(Date.now() - 86400000).toISOString().slice(0, 16).replace('T', ' ');

    setCampaigns([
      {
        id: 'demo-1',
        name: `SEO tools & digital marketing → example.com (${demoTimestamp1})`,
        keywords: ['SEO tools', 'digital marketing', 'link building'],
        anchor_texts: ['best SEO tools', 'click here', 'learn more'],
        target_url: 'https://example.com',
        status: 'active',
        created_at: new Date().toISOString(),
        user_id: 'demo',
        links_built: 15,
        available_sites: 47,
        target_sites_used: ['telegraph', 'medium']
      },
      {
        id: 'demo-2',
        name: `content marketing → example.com (${demoTimestamp2})`,
        keywords: ['content marketing', 'blog promotion'],
        anchor_texts: ['great content', 'read more', 'check this out'],
        target_url: 'https://example.com/blog',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_id: 'demo',
        links_built: 8,
        available_sites: 32,
        target_sites_used: ['telegraph', 'write.as']
      }
    ]);

    setPublishedArticles([
      {
        id: 'demo-article-1',
        article_title: 'Complete Guide to SEO Tools & Digital Marketing',
        article_url: 'https://telegra.ph/demo-article-1',
        status: 'published',
        published_date: new Date().toISOString(),
        anchor_text: 'best SEO tools',
        word_count: 847,
        platform: 'Telegraph',
        campaign_name: 'SEO tools & digital marketing → example.com',
        target_url: 'https://example.com'
      },
      {
        id: 'demo-article-2',
        article_title: 'Content Marketing Strategies for Growth',
        article_url: 'https://telegra.ph/demo-article-2',
        status: 'published',
        published_date: new Date(Date.now() - 3600000).toISOString(),
        anchor_text: 'learn more',
        word_count: 692,
        platform: 'Telegraph',
        campaign_name: 'content marketing → example.com',
        target_url: 'https://example.com/blog'
      }
    ]);

    setAnalytics({
      total_campaigns: 2,
      total_links: 23,
      success_rate: 95.7,
      total_word_count: 15390
    });
  };

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Load published articles (from submissions table)
      const { data: articlesData, error: articlesError } = await supabase
        .from('article_submissions')
        .select(`
          id,
          article_title,
          article_url,
          status,
          published_date,
          anchor_text,
          metadata,
          automation_campaigns (
            name,
            target_url
          )
        `)
        .eq('user_id', user.id)
        .order('published_date', { ascending: false });

      if (articlesError) throw articlesError;

      const formattedArticles: PublishedArticle[] = (articlesData || []).map(article => ({
        id: article.id,
        article_title: article.article_title,
        article_url: article.article_url,
        status: article.status as 'published',
        published_date: article.published_date,
        anchor_text: article.anchor_text,
        word_count: article.metadata?.word_count || 0,
        platform: 'Telegraph', // Default platform
        campaign_name: article.automation_campaigns?.name || 'Unknown Campaign',
        target_url: article.automation_campaigns?.target_url || ''
      }));

      setPublishedArticles(formattedArticles);

      // Calculate analytics
      const totalLinks = formattedArticles.length;
      const totalWords = formattedArticles.reduce((sum, article) => sum + (article.word_count || 0), 0);
      const successRate = campaignsData?.length > 0 ? (totalLinks / campaignsData.length) * 100 : 0;

      setAnalytics({
        total_campaigns: campaignsData?.length || 0,
        total_links: totalLinks,
        success_rate: Math.min(successRate, 100),
        total_word_count: totalWords
      });

      automationLogger.info('system', `Loaded user data: ${campaignsData?.length || 0} campaigns, ${totalLinks} articles`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      automationLogger.error('system', 'Failed to load user data', { errorMessage }, undefined, error as Error);
      toast.error(`Failed to load user data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadUserData();
    } else {
      loadDemoData();
    }
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
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const anchorTextsArray = formData.anchor_texts.split(',').map(a => a.trim()).filter(a => a);
      const generatedName = generateCampaignName(formData.keywords, formData.target_url);

      const campaignData = {
        user_id: user.id,
        name: generatedName,
        keywords: keywordsArray,
        anchor_texts: anchorTextsArray,
        target_url: formData.target_url,
        status: 'draft' as const,
        links_built: 0,
        available_sites: 4, // Current available platforms
        target_sites_used: []
      };

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data, ...prev]);
      setFormData({ keywords: '', anchor_texts: '', target_url: '' });
      toast.success(`Campaign '${data.name}' created successfully!`);
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        total_campaigns: prev.total_campaigns + 1
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      automationLogger.error('campaign', 'Failed to create campaign', { errorMessage }, undefined, error as Error);
      toast.error(`Failed to create campaign: ${errorMessage}`);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Link Building Automation</h1>
          <p className="text-gray-600 text-lg">Create and track your automated link building campaigns</p>
          
          {/* Analytics Dashboard */}
          {(user || analytics.total_campaigns > 0) && (
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
              Reports & Analytics
              {publishedArticles.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {publishedArticles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Creation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Create New Campaign
                  </CardTitle>
                  <CardDescription>
                    Generate keyword-relevant content with your anchor text links and publish to high-authority websites for instant backlinks.
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

              {/* Target Platforms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Target Platforms
                  </CardTitle>
                  <CardDescription>
                    High-authority publishing platforms for link building
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Telegraph
                          </p>
                          <p className="text-blue-600 text-xs">DR 85+ • Instant publishing</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Write.as
                          </p>
                          <p className="text-blue-600 text-xs">DR 82+ • Minimalist platform</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Medium
                          </p>
                          <p className="text-blue-600 text-xs">DR 95+ • High-traffic platform</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Dev.to
                          </p>
                          <p className="text-blue-600 text-xs">DR 88+ • Developer community</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <p className="text-blue-700 text-xs">
                      <span className="font-semibold">Multi-Platform Rotation:</span> Automatically distributes content across all available platforms for maximum reach
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaigns Preview */}
            {campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Campaigns</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.querySelector('[value="reporting"]')?.click()}
                    >
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium truncate">{campaign.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{campaign.target_url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500 text-white text-xs">
                            {campaign.links_built || 0} links
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              campaign.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                              campaign.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reporting" className="space-y-6">
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Demo Mode</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  You're viewing demo reports. Sign in to see your actual campaign results and published articles.
                </p>
              </div>
            )}

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                      <p className="text-2xl font-bold">{analytics.total_campaigns}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Articles Published</p>
                      <p className="text-2xl font-bold">{analytics.total_links}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold">{analytics.success_rate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Words</p>
                      <p className="text-2xl font-bold">{Math.round(analytics.total_word_count / 1000)}k</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Published Articles */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Published Articles</h3>
              <Button onClick={refreshData} variant="outline" disabled={loading}>
                {loading ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {publishedArticles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                {publishedArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{article.article_title}</h3>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Platform</p>
                              <p className="text-sm font-medium">{article.platform}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Word Count</p>
                              <p className="text-sm font-medium">{article.word_count} words</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Anchor Text</p>
                              <p className="text-sm font-medium">{article.anchor_text}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Published</p>
                              <p className="text-sm font-medium">{new Date(article.published_date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Campaign: {article.campaign_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Target: {article.target_url}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(article.article_url, '_blank')}
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

            {/* Campaign Summary */}
            {campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-gray-500">{campaign.target_url}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{campaign.keywords?.length || 0} keywords</span>
                            <span>{campaign.anchor_texts?.length || 0} anchor texts</span>
                            <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-blue-500 text-white">
                            {campaign.links_built || 0} links
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`${
                              campaign.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                              campaign.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
