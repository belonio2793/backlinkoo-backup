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
  Edit
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { automationLogger } from '@/services/automationLogger';
import { targetSitesManager } from '@/services/targetSitesManager';

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Initialize logging
  useEffect(() => {
    automationLogger.info('system', 'Automation page loaded');
    if (user) {
      automationLogger.setUserId(user.id);
    }
    loadSitesInfo();
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
  
  // Form state
  const [formData, setFormData] = useState({
    keywords: '',
    anchor_texts: '',
    target_url: ''
  });

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
    if (!user) {
      automationLogger.warn('campaign', 'Campaign creation attempted without authentication');
      toast.error('Please sign in to create campaigns');
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
      const availableSites = await targetSitesManager.getAvailableSites({
        domain_rating_min: 50,
        min_success_rate: 60
      }, 100);

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert({
          user_id: user.id,
          name: generatedName,
          keywords: keywordsArray,
          anchor_texts: anchorTextsArray,
          target_url: formData.target_url,
          status: 'draft',
          links_built: 0,
          available_sites: availableSites.length,
          target_sites_used: []
        })
        .select()
        .single();

      if (error) throw error;

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
      automationLogger.error('campaign', 'Failed to create campaign', { ...formData, generatedName }, undefined, error as Error);
      toast.error('Failed to create campaign');
    } finally {
      setCreating(false);
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
      } else if (status === 'paused') {
        automationLogger.campaignPaused(campaignId);
      }

      toast.success(`Campaign ${status === 'active' ? 'started' : 'paused'}`);
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
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Campaigns
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
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target-url">Target URL</Label>
                  <Input
                    id="target-url"
                    type="url"
                    placeholder="https://yourwebsite.com/target-page"
                    value={formData.target_url}
                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  />
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

                <Button
                  onClick={createCampaign}
                  disabled={creating}
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
                      Sign In to Create Campaign
                    </>
                  )}
                </Button>
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
                              onClick={() => toast.info('Sign in to manage your campaigns')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Sign In to Control
                            </Button>
                          ) : (
                            // Authenticated mode - show normal controls
                            <>
                              {campaign.status === 'active' ? (
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
                                  Start
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
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
