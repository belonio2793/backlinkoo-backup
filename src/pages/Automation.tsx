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
  target_links?: number;
}

export default function Automation() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    anchor_texts: '',
    target_url: '',
    target_links: 10
  });

  // Load user campaigns or demo data
  useEffect(() => {
    if (user) {
      loadCampaigns();
    } else {
      // Show demo campaigns for unauthenticated users
      setCampaigns([
        {
          id: 'demo-1',
          name: 'Demo SEO Campaign',
          keywords: ['SEO tools', 'digital marketing', 'link building'],
          anchor_texts: ['best SEO tools', 'click here', 'learn more'],
          target_url: 'https://example.com',
          status: 'active',
          created_at: new Date().toISOString(),
          user_id: 'demo',
          links_built: 15,
          target_links: 25
        },
        {
          id: 'demo-2',
          name: 'Content Marketing Links',
          keywords: ['content marketing', 'blog promotion'],
          anchor_texts: ['great content', 'read more', 'check this out'],
          target_url: 'https://example.com/blog',
          status: 'paused',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: 'demo',
          links_built: 8,
          target_links: 20
        }
      ]);
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    
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
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!user) {
      toast.error('Please sign in to create campaigns');
      return;
    }

    if (!formData.name || !formData.keywords || !formData.anchor_texts || !formData.target_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const anchorTextsArray = formData.anchor_texts.split(',').map(a => a.trim()).filter(a => a);

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert({
          user_id: user.id,
          name: formData.name,
          keywords: keywordsArray,
          anchor_texts: anchorTextsArray,
          target_url: formData.target_url,
          target_links: formData.target_links,
          status: 'draft',
          links_built: 0
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data, ...prev]);
      setFormData({
        name: '',
        keywords: '',
        anchor_texts: '',
        target_url: '',
        target_links: 10
      });
      
      toast.success('Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: Campaign['status']) => {
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

      toast.success(`Campaign ${status === 'active' ? 'started' : 'paused'}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      toast.success('Campaign deleted');
    } catch (error) {
      console.error('Error deleting campaign:', error);
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
                  Set up your automated link building campaign with target keywords and URLs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Main Product Keywords"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="target-links">Target Number of Links</Label>
                  <Input
                    id="target-links"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.target_links}
                    onChange={(e) => setFormData({ ...formData, target_links: parseInt(e.target.value) || 10 })}
                  />
                  <p className="text-sm text-gray-500">
                    How many backlinks do you want to build for this campaign?
                  </p>
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
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
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
                              <p className="text-sm text-gray-500">Progress</p>
                              <p className="text-sm font-medium">
                                {campaign.links_built || 0} / {campaign.target_links || 0} links
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Link className="h-4 w-4" />
                              {campaign.keywords?.join(', ').substring(0, 50)}
                              {campaign.keywords?.join(', ').length > 50 ? '...' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
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
