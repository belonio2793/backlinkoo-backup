import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Globe,
  Target,
  BarChart3,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Shield,
  Crown,
  Loader2,
  Link,
  Search,
  Bot,
  Settings,
  Activity,
  Database,
  FileText,
  CheckSquare,
  XSquare,
  ExternalLink,
  Copy,
  Zap
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  user_id: string;
  destination_url: string;
  keyword: string;
  anchor_text: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface BlogDiscovery {
  id: string;
  url: string;
  discovered_for: string[];
  last_tried_at?: string;
  is_active: boolean;
  created_at: string;
}

interface Backlink {
  id: string;
  campaign_id: string;
  candidate_url: string;
  anchor_text?: string;
  comment_text?: string;
  posted_at?: string;
  indexed_status: 'pending' | 'indexed' | 'failed';
  created_at: string;
}

interface CampaignLog {
  id: string;
  campaign_id: string;
  level: 'info' | 'success' | 'error';
  message: string;
  meta?: any;
  created_at: string;
}

interface Job {
  id: number;
  job_type: 'discover' | 'post_comment' | 'verify';
  payload: any;
  status: 'queued' | 'running' | 'done' | 'failed';
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

interface PendingPost {
  id: string;
  campaign_id: string;
  candidate_url: string;
  comment_text: string;
  anchor_text: string;
  keyword: string;
  posted_at?: string;
}

export default function BlogCommentAutomation() {
  const { user, isAuthenticated, isPremium } = useAuth();
  
  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [discoveredUrls, setDiscoveredUrls] = useState<BlogDiscovery[]>([]);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    destination_url: '',
    keyword: '',
    anchor_text: '',
    auto_discover: true,
    auto_post: false,
    daily_limit: 10
  });

  // Load data
  const loadCampaigns = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  const loadPendingPosts = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('backlinks')
        .select('*')
        .is('posted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPendingPosts(data || []);
    } catch (error: any) {
      console.error('Error loading pending posts:', error);
    }
  };

  const loadDiscoveredUrls = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_urls_discovery')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setDiscoveredUrls(data || []);
    } catch (error: any) {
      console.error('Error loading discovered URLs:', error);
    }
  };

  const loadCampaignLogs = async (campaignId?: string) => {
    try {
      let query = supabase
        .from('campaign_logs')
        .select('*');
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCampaignLogs(data || []);
    } catch (error: any) {
      console.error('Error loading campaign logs:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadBacklinks = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('backlinks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setBacklinks(data || []);
    } catch (error: any) {
      console.error('Error loading backlinks:', error);
    }
  };

  // Create campaign
  const createCampaign = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create campaigns');
      return;
    }

    if (!formData.destination_url || !formData.keyword) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      // Create campaign directly in Supabase since Netlify functions aren't ready
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          user_id: user?.id,
          destination_url: formData.destination_url,
          keyword: formData.keyword,
          anchor_text: formData.anchor_text || '',
          status: 'pending'
        }])
        .select('*')
        .single();

      if (campaignError) {
        throw new Error(campaignError.message || 'Failed to create campaign');
      }

      // Log campaign creation
      await supabase.from('campaign_logs').insert([{
        campaign_id: campaign.id,
        level: 'info',
        message: `Campaign created for keyword: ${formData.keyword}`,
        meta: {
          destination_url: formData.destination_url,
          keyword: formData.keyword,
          anchor_text: formData.anchor_text
        }
      }]);

      // If auto-discover is enabled, add a demo discovery job
      if (formData.auto_discover) {
        await supabase.from('jobs').insert([{
          job_type: 'discover',
          payload: {
            campaign_id: campaign.id,
            keyword: formData.keyword,
            destination_url: formData.destination_url,
            auto_post: formData.auto_post || false
          },
          status: 'queued'
        }]);

        await supabase.from('campaign_logs').insert([{
          campaign_id: campaign.id,
          level: 'info',
          message: 'Discovery job queued',
          meta: { keyword: formData.keyword }
        }]);
      }

      toast.success('Campaign created successfully!');
      setShowCreateForm(false);
      setFormData({
        destination_url: '',
        keyword: '',
        anchor_text: '',
        auto_discover: true,
        auto_post: false,
        daily_limit: 10
      });

      await loadCampaigns();
      await loadJobs();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  // Start discovery for a campaign
  const startDiscovery = async (campaignId: string) => {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Check if there's already a pending discovery job
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('job_type', 'discover')
        .contains('payload', { campaign_id: campaignId })
        .in('status', ['queued', 'running'])
        .single();

      if (existingJob) {
        toast.info('Discovery job already queued or running');
        return;
      }

      // Create discovery job
      await supabase.from('jobs').insert([{
        job_type: 'discover',
        payload: {
          campaign_id: campaign.id,
          keyword: campaign.keyword,
          destination_url: campaign.destination_url,
          auto_post: false
        },
        status: 'queued'
      }]);

      // Update campaign status
      await supabase
        .from('campaigns')
        .update({
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Log the discovery start
      await supabase.from('campaign_logs').insert([{
        campaign_id: campaignId,
        level: 'info',
        message: `Discovery job queued for keyword: ${campaign.keyword}`,
        meta: { keyword: campaign.keyword }
      }]);

      toast.success('Discovery started');
      await loadJobs();
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error starting discovery:', error);
      toast.error('Failed to start discovery');
    }
  };

  // Approve a pending post
  const approvePendingPost = async (post: PendingPost) => {
    try {
      // Generate a simple comment
      const comment_text = `Great insights about ${post.keyword}! Thanks for sharing this valuable information.`;

      // Update the backlink record
      await supabase
        .from('backlinks')
        .update({
          comment_text,
          indexed_status: 'pending'
        })
        .eq('id', post.id);

      // Enqueue post_comment job
      await supabase.from('jobs').insert([{
        job_type: 'post_comment',
        payload: {
          campaign_id: post.campaign_id,
          candidate_url: post.candidate_url,
          comment_text,
          anchor_text: post.anchor_text,
          name: 'Blog Commenter',
          email: 'noreply@example.com',
          keyword: post.keyword
        },
        status: 'queued'
      }]);

      // Log the event
      await supabase.from('campaign_logs').insert([{
        campaign_id: post.campaign_id,
        level: 'info',
        message: `Comment approved and queued for posting to ${post.candidate_url}`,
        meta: { candidate_url: post.candidate_url }
      }]);

      toast.success('Post approved and queued for submission');
      await loadPendingPosts();
      await loadJobs();
    } catch (error: any) {
      console.error('Error approving post:', error);
      toast.error('Failed to approve post');
    }
  };

  // Reject a pending post
  const rejectPendingPost = async (post: PendingPost) => {
    try {
      const { error } = await supabase
        .from('backlinks')
        .update({ indexed_status: 'failed' })
        .eq('id', post.id);

      if (error) throw error;

      toast.success('Post rejected');
      await loadPendingPosts();
    } catch (error: any) {
      console.error('Error rejecting post:', error);
      toast.error('Failed to reject post');
    }
  };

  // Toggle campaign status
  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'running' ? 'pending' : 'running';
      
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;

      toast.success(`Campaign ${newStatus === 'running' ? 'started' : 'paused'}`);
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      if (isAuthenticated) {
        await Promise.all([
          loadCampaigns(),
          loadPendingPosts(),
          loadDiscoveredUrls(),
          loadCampaignLogs(),
          loadJobs(),
          loadBacklinks()
        ]);
      }
      
      setIsLoading(false);
    };

    initialize();
  }, [isAuthenticated]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const campaignChannel = supabase
      .channel('campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        loadCampaigns();
      })
      .subscribe();

    const logsChannel = supabase
      .channel('campaign_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_logs' }, () => {
        loadCampaignLogs();
      })
      .subscribe();

    const jobsChannel = supabase
      .channel('jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        loadJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(jobsChannel);
    };
  }, [isAuthenticated]);

  const activeCampaigns = campaigns.filter(c => c.status === 'running');
  const completedBacklinks = backlinks.filter(b => b.posted_at);
  const runningJobs = jobs.filter(j => j.status === 'running');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading automation system...</p>
            </div>
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Comment Automation</h1>
              <p className="text-gray-600">Automated link building through strategic blog commenting</p>
            </div>
          </div>

          {/* Status Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">{activeCampaigns.length}</div>
                    <div className="text-xs text-gray-600">Active</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{campaigns.length}</div>
                    <div className="text-xs text-gray-600">Total Campaigns</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">{discoveredUrls.length}</div>
                    <div className="text-xs text-gray-600">Discovered URLs</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">{completedBacklinks.length}</div>
                    <div className="text-xs text-gray-600">Posted</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium">{pendingPosts.length}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{runningJobs.length}</div>
                    <div className="text-xs text-gray-600">Jobs Running</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Check */}
        {!isAuthenticated && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please sign in to create and manage blog comment campaigns.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="logs">Activity</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {backlinks.length > 0 ? Math.round((completedBacklinks.length / backlinks.length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comment posting success rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'queued').length}</div>
                  <p className="text-xs text-muted-foreground">
                    Jobs waiting to process
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Discovery Pool</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{discoveredUrls.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Available blog opportunities
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {isAuthenticated && (
                    <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Campaign
                    </Button>
                  )}
                  <Button variant="outline" onClick={loadDiscoveredUrls} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Discovery
                  </Button>
                  <Button variant="outline" onClick={loadJobs} className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Check Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {log.level === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : log.level === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{log.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {campaignLogs.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Blog Comment Campaigns</CardTitle>
                    <CardDescription>Manage your automated commenting campaigns</CardDescription>
                  </div>
                  {isAuthenticated && (
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-6">Create your first blog comment campaign to start building backlinks</p>
                    {isAuthenticated && (
                      <Button onClick={() => setShowCreateForm(true)} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Campaign
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  Keyword: <span className="text-blue-600">{campaign.keyword}</span>
                                </h3>
                                <Badge variant={
                                  campaign.status === 'running' ? 'default' :
                                  campaign.status === 'pending' ? 'secondary' :
                                  campaign.status === 'completed' ? 'outline' :
                                  'destructive'
                                }>
                                  {campaign.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><strong>Target URL:</strong> {campaign.destination_url}</p>
                                <p><strong>Anchor Text:</strong> {campaign.anchor_text}</p>
                                <p><strong>Created:</strong> {new Date(campaign.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCampaign(campaign.id, campaign.status)}
                              >
                                {campaign.status === 'running' ? 
                                  <Pause className="h-4 w-4" /> : 
                                  <Play className="h-4 w-4" />
                                }
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startDiscovery(campaign.id)}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCampaign(campaign.id);
                                  loadCampaignLogs(campaign.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Pending Posts Moderation
                </CardTitle>
                <CardDescription>
                  Review and approve generated comments before posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No pending posts</h3>
                    <p className="text-gray-600">Generated comments will appear here for approval</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPosts.map((post) => (
                      <Card key={post.id} className="border">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Globe className="h-4 w-4 text-blue-500" />
                                  <a 
                                    href={post.candidate_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {post.candidate_url}
                                  </a>
                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Keyword:</strong> {post.keyword}
                                  </div>
                                  <div>
                                    <strong>Anchor Text:</strong> {post.anchor_text}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">Generated Comment:</h4>
                              <p className="text-gray-700 italic">"{post.comment_text}"</p>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectPendingPost(post)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XSquare className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => approvePendingPost(post)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Approve & Post
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discovery Tab */}
          <TabsContent value="discovery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Discovered Blog URLs
                </CardTitle>
                <CardDescription>
                  Blogs found with comment capabilities for your keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                {discoveredUrls.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No URLs discovered yet</h3>
                    <p className="text-gray-600">Start a campaign to begin discovering blog opportunities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discoveredUrls.map((url) => (
                      <div key={url.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <a 
                              href={url.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {url.url}
                            </a>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Keywords:</span>
                            {url.discovered_for.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Discovered: {new Date(url.created_at).toLocaleDateString()}
                            {url.last_tried_at && ` | Last tried: ${new Date(url.last_tried_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={url.is_active ? 'default' : 'secondary'}>
                            {url.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Campaign Activity Logs
                </CardTitle>
                <CardDescription>
                  Detailed logs of all automation activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      {log.level === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : log.level === 'error' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : (
                        <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            log.level === 'success' ? 'default' :
                            log.level === 'error' ? 'destructive' :
                            'secondary'
                          }>
                            {log.level}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.meta && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                  {campaignLogs.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No activity logs</h3>
                      <p className="text-gray-600">Campaign activities will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Job Queue Status
                </CardTitle>
                <CardDescription>
                  Monitor automation jobs and their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            job.status === 'done' ? 'default' :
                            job.status === 'running' ? 'secondary' :
                            job.status === 'failed' ? 'destructive' :
                            'outline'
                          }>
                            {job.status}
                          </Badge>
                          <span className="font-medium">{job.job_type}</span>
                          <span className="text-sm text-gray-500">
                            (ID: {job.id})
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Attempts: {job.attempts}</p>
                          <p>Created: {new Date(job.created_at).toLocaleString()}</p>
                          {job.last_error && (
                            <details className="mt-2">
                              <summary className="text-red-600 cursor-pointer">Error details</summary>
                              <p className="text-red-600 text-xs mt-1">{job.last_error}</p>
                            </details>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'running' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="text-center py-12">
                      <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs in queue</h3>
                      <p className="text-gray-600">Automation jobs will appear here when campaigns are active</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Campaign Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Blog Comment Campaign</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Set up automated blog commenting for your target keyword and URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination_url">Target URL (Your Website)</Label>
                    <Input
                      id="destination_url"
                      type="url"
                      value={formData.destination_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination_url: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      required
                    />
                    <p className="text-xs text-gray-500">The URL you want to build backlinks to</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="keyword">Target Keyword</Label>
                    <Input
                      id="keyword"
                      value={formData.keyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
                      placeholder="seo tools, backlink building, etc."
                      required
                    />
                    <p className="text-xs text-gray-500">The keyword to search for relevant blogs</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="anchor_text">Anchor Text</Label>
                    <Input
                      id="anchor_text"
                      value={formData.anchor_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, anchor_text: e.target.value }))}
                      placeholder="best seo tool, learn more, click here"
                    />
                    <p className="text-xs text-gray-500">Text to use for the link (optional)</p>
                  </div>
                </div>

                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Automation Settings</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_discover"
                      checked={formData.auto_discover}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_discover: checked }))}
                    />
                    <Label htmlFor="auto_discover">Auto-discover blog URLs</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_post"
                      checked={formData.auto_post}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_post: checked }))}
                    />
                    <Label htmlFor="auto_post">Auto-post after manual approval</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily_limit">Daily posting limit</Label>
                    <Input
                      id="daily_limit"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.daily_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_limit: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createCampaign}
                    disabled={isCreating || !formData.destination_url || !formData.keyword}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
