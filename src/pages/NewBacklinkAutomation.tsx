import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  MessageSquare, 
  Plus, 
  Play, 
  Pause, 
  Target, 
  TrendingUp,
  Crown,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'active' | 'paused' | 'draft';
  daily_limit: number;
  links_built: number;
  created_at: string;
}

export default function NewBacklinkAutomation() {
  const { user, isAuthenticated, isPremium } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetUrl: '',
    keywords: '',
    anchorTexts: '',
    dailyLimit: 10,
    autoStart: false
  });

  // Load campaigns
  const loadCampaigns = async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Create campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) return;

    const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
    const anchorTextsArray = formData.anchorTexts.split(',').map(a => a.trim()).filter(a => a);

    if (!formData.name || !formData.targetUrl || keywordsArray.length === 0 || anchorTextsArray.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert({
          user_id: user.id,
          name: formData.name,
          target_url: formData.targetUrl,
          keywords: keywordsArray,
          anchor_texts: anchorTextsArray,
          status: formData.autoStart ? 'active' : 'draft',
          daily_limit: formData.dailyLimit,
          links_built: 0,
          engine_type: 'blog_comments'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Campaign created successfully!');
      setFormData({
        name: '',
        targetUrl: '',
        keywords: '',
        anchorTexts: '',
        dailyLimit: 10,
        autoStart: false
      });
      setShowCreateForm(false);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Toggle campaign status
  const toggleCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const newStatus = campaign.status === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, status: newStatus } : c
      ));

      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}!`);
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  // Load campaigns on auth
  useEffect(() => {
    if (isAuthenticated) {
      loadCampaigns();
    }
  }, [isAuthenticated]);

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalLinksBuilt = campaigns.reduce((total, c) => total + (c.links_built || 0), 0);
  const freeLimit = 20;
  const hasReachedLimit = !isPremium && totalLinksBuilt >= freeLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-6">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Backlink Automation
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Build high-quality backlinks automatically with our clean, simple automation platform.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {isAuthenticated ? activeCampaigns : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Active Campaigns</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {isAuthenticated ? (
                      isPremium ? totalLinksBuilt : `${totalLinksBuilt}/${freeLimit}`
                    ) : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Links Built</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {isAuthenticated ? (
                      <>
                        {isPremium ? (
                          <Crown className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Shield className="h-5 w-5 text-blue-600" />
                        )}
                        <span className="text-lg font-semibold text-gray-900">
                          {isPremium ? 'Premium' : 'Free'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-400">Guest</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Current Plan</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auth Section */}
          {!isAuthenticated && (
            <Card className="mb-8 bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Sign In to Get Started
                </h3>
                <p className="text-blue-700 mb-4">
                  Create an account to start building automated backlink campaigns
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upgrade Banner */}
          {!isPremium && hasReachedLimit && (
            <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-700 font-medium">
                    You've reached your free limit. Upgrade to Premium for unlimited campaigns.
                  </span>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaigns List */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Blog Comment Campaigns
                    </CardTitle>
                    <CardDescription>
                      {campaigns.length} total campaigns
                    </CardDescription>
                  </div>
                  {isAuthenticated && (
                    <Button
                      onClick={() => setShowCreateForm(!showCreateForm)}
                      disabled={hasReachedLimit}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sign In Required
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create an account to view and manage your campaigns
                    </p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-600">Loading campaigns...</div>
                  </div>
                ) : campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id} className="border border-gray-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                                <Badge
                                  variant={campaign.status === 'active' ? 'default' : 'secondary'}
                                  className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                                >
                                  {campaign.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Target className="h-3 w-3" />
                                  {campaign.target_url}
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3" />
                                  {campaign.links_built || 0} links built • {campaign.daily_limit} daily limit
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleCampaign(campaign.id)}
                              >
                                {campaign.status === 'active' ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Start
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No campaigns yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first campaign to get started
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      disabled={hasReachedLimit}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Create Campaign Form */}
          <div>
            {showCreateForm && isAuthenticated && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    New Campaign
                  </CardTitle>
                  <CardDescription>
                    Create a blog comment campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Campaign Name</Label>
                      <Input
                        id="name"
                        placeholder="My Website Campaign"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="url">Target Website</Label>
                      <Input
                        id="url"
                        placeholder="yourwebsite.com"
                        value={formData.targetUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords</Label>
                      <Textarea
                        id="keywords"
                        placeholder="SEO, digital marketing, backlinks"
                        value={formData.keywords}
                        onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                        rows={3}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                    </div>

                    <div>
                      <Label htmlFor="anchors">Anchor Texts</Label>
                      <Textarea
                        id="anchors"
                        placeholder="best SEO tool, learn digital marketing"
                        value={formData.anchorTexts}
                        onChange={(e) => setFormData(prev => ({ ...prev, anchorTexts: e.target.value }))}
                        rows={3}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                    </div>

                    <div>
                      <Label htmlFor="limit">Daily Link Limit</Label>
                      <select
                        id="limit"
                        value={formData.dailyLimit}
                        onChange={(e) => setFormData(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value={5}>5 links/day</option>
                        <option value={10}>10 links/day</option>
                        <option value={20}>20 links/day</option>
                        <option value={50}>50 links/day</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autostart"
                        checked={formData.autoStart}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoStart: checked }))}
                      />
                      <Label htmlFor="autostart" className="text-sm">Start immediately</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Campaign'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
