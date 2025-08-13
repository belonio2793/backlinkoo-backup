import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  RefreshCw,
  Plus,
  CheckCircle,
  X,
  ExternalLink,
  Loader2,
  Target,
  MessageSquare,
  Globe,
  BarChart3,
  Eye,
  Settings,
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
  keyword: string;
  anchor_text: string;
  status: 'active' | 'paused' | 'completed';
  automation_enabled: boolean;
  links_found: number;
  links_posted: number;
  created_at: string;
}

interface PostingResult {
  id: string;
  target_url: string;
  live_url: string;
  status: string;
  posted_at: string;
  comment_content: string;
}

export default function WorkingAutomation() {
  const { user, isAuthenticated } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [results, setResults] = useState<PostingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    target_url: '',
    keyword: '',
    anchor_text: '',
    automation_enabled: true
  });

  const [accounts, setAccounts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    email: '',
    website: ''
  });

  // Load campaigns
  const loadCampaigns = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      
      if (data && data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  // Load posting accounts
  const loadAccounts = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('posting_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
    }
  };

  // Load campaign results
  const loadResults = async (campaignId: string) => {
    try {
      const response = await fetch('/.netlify/functions/campaign-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_results',
          campaignId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results.liveUrls || []);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  // Create campaign
  const createCampaign = async () => {
    if (!formData.name || !formData.target_url || !formData.keyword) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blog_campaigns')
        .insert([{
          user_id: user?.id,
          name: formData.name,
          target_url: formData.target_url,
          keyword: formData.keyword,
          anchor_text: formData.anchor_text,
          automation_enabled: formData.automation_enabled,
          status: 'paused'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Campaign created successfully!');
      setShowCreateForm(false);
      setFormData({
        name: '',
        target_url: '',
        keyword: '',
        anchor_text: '',
        automation_enabled: true
      });
      
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  // Create posting account
  const createAccount = async () => {
    if (!accountFormData.name || !accountFormData.email) {
      toast.error('Please fill in name and email');
      return;
    }

    try {
      const { error } = await supabase
        .from('posting_accounts')
        .insert([{
          user_id: user?.id,
          name: accountFormData.name,
          email: accountFormData.email,
          website: accountFormData.website
        }]);

      if (error) throw error;

      toast.success('Account created successfully!');
      setShowAccountForm(false);
      setAccountFormData({ name: '', email: '', website: '' });
      await loadAccounts();
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    }
  };

  // Run campaign automation
  const runCampaign = async (campaignId: string, settings = {}) => {
    if (!campaignId) return;
    
    setIsRunning(true);
    setProgress(0);
    
    try {
      toast.loading('Starting blog comment automation...');
      
      const response = await fetch('/.netlify/functions/campaign-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_campaign',
          campaignId,
          settings: {
            maxTargets: 10,
            maxPosts: 5,
            autoPost: true,
            dryRun: false,
            ...settings
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Campaign started successfully!');
        
        // Monitor progress
        monitorJobProgress(data.jobId);
        
        // Update campaign status
        await supabase
          .from('blog_campaigns')
          .update({ status: 'active' })
          .eq('id', campaignId);
          
      } else {
        throw new Error(data.error || 'Failed to start campaign');
      }
      
    } catch (error: any) {
      console.error('Error running campaign:', error);
      toast.error(`Failed to start campaign: ${error.message}`);
      setIsRunning(false);
    }
  };

  // Monitor job progress
  const monitorJobProgress = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('automation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error fetching job status:', error);
          return;
        }

        setJobStatus(data);
        setProgress(data.progress || 0);
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setIsRunning(false);
          
          if (data.status === 'completed') {
            toast.success('Campaign completed successfully!');
            await loadCampaigns();
            if (selectedCampaign) {
              await loadResults(selectedCampaign);
            }
          } else {
            toast.error(`Campaign failed: ${data.error_message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error monitoring job:', error);
      }
    }, 3000);

    // Cleanup after 30 minutes
    setTimeout(() => clearInterval(interval), 1800000);
  };

  // Test single URL posting
  const testUrlPosting = async (url: string) => {
    try {
      toast.loading('Testing comment posting on URL...');
      
      const response = await fetch('/.netlify/functions/comment-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url,
          content: 'This is a test comment to verify the automation system is working properly.',
          dryRun: true // Safe test mode
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Test successful! Comment form detected and validated.');
        return data;
      } else {
        throw new Error(data.error || 'Test failed');
      }
    } catch (error: any) {
      console.error('Error testing URL:', error);
      toast.error(`Test failed: ${error.message}`);
    }
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      if (isAuthenticated) {
        await Promise.all([
          loadCampaigns(),
          loadAccounts()
        ]);
      }
      
      setIsLoading(false);
    };

    initialize();
  }, [isAuthenticated]);

  // Load results when campaign changes
  useEffect(() => {
    if (selectedCampaign) {
      loadResults(selectedCampaign);
    }
  }, [selectedCampaign]);

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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Working Blog Comment Automation</h1>
              <p className="text-gray-600 text-lg">Real automation that discovers blogs and posts live comments with your links</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Live Posting
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Target className="h-3 w-3 mr-1" />
                  Real URLs
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Globe className="h-3 w-3 mr-1" />
                  Full Automation
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isRunning && (
            <Card className="mb-6 border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span className="font-medium">Automation Running</span>
                    {jobStatus && (
                      <Badge variant="outline">{jobStatus.job_type}</Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{progress}% complete</span>
                </div>
                <Progress value={progress} className="w-full" />
                {jobStatus?.result && (
                  <p className="text-sm text-gray-600 mt-2">
                    Status: {JSON.stringify(jobStatus.result)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Authentication Check */}
        {!isAuthenticated && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access the blog comment automation system.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {isAuthenticated && (
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="results">Live Results</TabsTrigger>
              <TabsTrigger value="test">Quick Test</TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Blog Comment Campaigns</CardTitle>
                      <CardDescription>Create and manage automated comment campaigns</CardDescription>
                    </div>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
                      <p className="text-gray-600 mb-6">Create your first automation campaign</p>
                      <Button onClick={() => setShowCreateForm(true)} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{campaign.name}</h3>
                              <p className="text-sm text-gray-600">Keyword: {campaign.keyword}</p>
                              <p className="text-sm text-gray-600">Target: {campaign.target_url}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                  {campaign.status}
                                </Badge>
                                {campaign.automation_enabled && (
                                  <Badge variant="outline">Auto-posting enabled</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right text-sm">
                                <div>Found: {campaign.links_found}</div>
                                <div>Posted: {campaign.links_posted}</div>
                              </div>
                              <Button
                                onClick={() => runCampaign(campaign.id)}
                                disabled={isRunning}
                                size="sm"
                              >
                                {isRunning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                Run
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create Campaign Form */}
                  {showCreateForm && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="font-medium mb-4">Create New Campaign</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="campaign-name">Campaign Name</Label>
                          <Input
                            id="campaign-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Blog Campaign"
                          />
                        </div>
                        <div>
                          <Label htmlFor="target-url">Target URL</Label>
                          <Input
                            id="target-url"
                            value={formData.target_url}
                            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                            placeholder="https://mywebsite.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="keyword">Keyword</Label>
                          <Input
                            id="keyword"
                            value={formData.keyword}
                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            placeholder="marketing tools"
                          />
                        </div>
                        <div>
                          <Label htmlFor="anchor-text">Anchor Text (optional)</Label>
                          <Input
                            id="anchor-text"
                            value={formData.anchor_text}
                            onChange={(e) => setFormData({ ...formData, anchor_text: e.target.value })}
                            placeholder="best marketing tools"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <Button onClick={createCampaign}>Create Campaign</Button>
                        <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Posting Accounts</CardTitle>
                      <CardDescription>Manage accounts used for commenting</CardDescription>
                    </div>
                    <Button onClick={() => setShowAccountForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No posting accounts configured</p>
                      <Button onClick={() => setShowAccountForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account: any) => (
                        <div key={account.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-600">{account.email}</p>
                              {account.website && (
                                <p className="text-sm text-gray-600">{account.website}</p>
                              )}
                            </div>
                            <Badge variant={account.is_active ? 'default' : 'secondary'}>
                              {account.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create Account Form */}
                  {showAccountForm && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="font-medium mb-4">Add Posting Account</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="account-name">Name</Label>
                          <Input
                            id="account-name"
                            value={accountFormData.name}
                            onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="account-email">Email</Label>
                          <Input
                            id="account-email"
                            type="email"
                            value={accountFormData.email}
                            onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="account-website">Website (optional)</Label>
                          <Input
                            id="account-website"
                            value={accountFormData.website}
                            onChange={(e) => setAccountFormData({ ...accountFormData, website: e.target.value })}
                            placeholder="https://johndoe.com"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <Button onClick={createAccount}>Add Account</Button>
                        <Button variant="outline" onClick={() => setShowAccountForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Live Posted URLs
                  </CardTitle>
                  <CardDescription>
                    Real URLs where your comments have been successfully posted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No live posts yet. Run a campaign to see results!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div key={index} className="border rounded p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                Posted on: {new URL(result.target_url).hostname}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(result.posted_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {result.comment_content?.substring(0, 100)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Live</Badge>
                              <Button size="sm" variant="outline" asChild>
                                <a href={result.live_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </a>
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

            {/* Quick Test Tab */}
            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick URL Test</CardTitle>
                  <CardDescription>
                    Test comment posting on a specific blog URL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-url">Blog URL to Test</Label>
                      <Input
                        id="test-url"
                        placeholder="https://example.com/blog-post"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const url = (e.target as HTMLInputElement).value;
                            if (url) testUrlPosting(url);
                          }
                        }}
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        const url = (document.getElementById('test-url') as HTMLInputElement)?.value;
                        if (url) testUrlPosting(url);
                      }}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Test URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
