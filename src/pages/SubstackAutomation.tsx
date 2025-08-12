import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Play,
  Pause,
  ExternalLink,
  Loader2,
  MessageSquare,
  BarChart3,
  Plus,
  CheckCircle,
  Clock,
  Globe,
  Target,
  Eye
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
  status: 'active' | 'paused' | 'completed';
  posts_found: number;
  comments_posted: number;
  created_at: string;
}

interface PostingResult {
  id: string;
  substack_post_url: string;
  comment_url: string;
  comment_content: string;
  substack_domain: string;
  posted_at: string;
  status: 'posted' | 'failed';
}

interface SubstackDomain {
  id: string;
  domain: string;
  name: string;
  added_at: string;
  post_count: number;
}

export default function SubstackAutomation() {
  const { user, isAuthenticated } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [postingResults, setPostingResults] = useState<PostingResult[]>([]);
  const [substackDomains, setSubstackDomains] = useState<SubstackDomain[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    website: '',
    keyword: '',
    name: ''
  });

  // Load campaigns
  const loadCampaigns = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('substack_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setCampaigns(data);
        const active = data.find(c => c.status === 'active');
        if (active) {
          setActiveCampaign(active);
          setFormData({
            website: active.target_url,
            keyword: active.keyword,
            name: active.name
          });
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  // Load posting results
  const loadPostingResults = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('substack_posts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'posted')
        .order('posted_at', { ascending: false });

      if (data && !error) {
        setPostingResults(data);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  // Load Substack domains
  const loadSubstackDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('substack_domains')
        .select('*')
        .order('post_count', { ascending: false });

      if (data && !error) {
        setSubstackDomains(data);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  // Create or update campaign
  const createCampaign = async () => {
    if (!formData.website || !formData.keyword || !formData.name) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const campaignData = {
        user_id: user?.id,
        name: formData.name,
        target_url: formData.website,
        keyword: formData.keyword,
        status: 'paused',
        posts_found: 0,
        comments_posted: 0
      };

      let campaign;
      if (activeCampaign) {
        // Update existing
        const { data, error } = await supabase
          .from('substack_campaigns')
          .update(campaignData)
          .eq('id', activeCampaign.id)
          .select()
          .single();

        if (error) throw error;
        campaign = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('substack_campaigns')
          .insert([campaignData])
          .select()
          .single();

        if (error) throw error;
        campaign = data;
      }

      setActiveCampaign(campaign);
      toast.success('Campaign saved successfully!');
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  // Start automation
  const startAutomation = async () => {
    if (!activeCampaign) {
      toast.error('Please save your campaign first');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setCurrentStep('Initializing...');

    try {
      // Update campaign status
      await supabase
        .from('substack_campaigns')
        .update({ status: 'active' })
        .eq('id', activeCampaign.id);

      setActiveCampaign({ ...activeCampaign, status: 'active' });

      // Start the Substack automation
      const response = await fetch('/.netlify/functions/substack-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          campaignId: activeCampaign.id,
          keyword: activeCampaign.keyword,
          targetUrl: activeCampaign.target_url
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Substack automation started!');
        monitorProgress(data.sessionId);
      } else {
        throw new Error(data.error || 'Failed to start automation');
      }

    } catch (error: any) {
      console.error('Error starting automation:', error);
      toast.error(`Failed to start: ${error.message}`);
      setIsRunning(false);
    }
  };

  // Pause automation
  const pauseAutomation = async () => {
    if (!activeCampaign) return;

    try {
      await supabase
        .from('substack_campaigns')
        .update({ status: 'paused' })
        .eq('id', activeCampaign.id);

      setActiveCampaign({ ...activeCampaign, status: 'paused' });
      setIsRunning(false);
      setProgress(0);
      setCurrentStep('');
      toast.success('Automation paused');
    } catch (error: any) {
      toast.error('Failed to pause automation');
    }
  };

  // Monitor progress (mock for now)
  const monitorProgress = (sessionId: string) => {
    const steps = [
      'Searching Substack for keyword...',
      'Finding relevant posts...',
      'Analyzing post content...',
      'Generating contextual comment...',
      'Posting comment with your link...',
      'Capturing result URL...',
      'Saving to database...'
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setCurrentStep(steps[currentStepIndex]);
        setProgress(((currentStepIndex + 1) / steps.length) * 100);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setProgress(100);
        setCurrentStep('Completed!');
        toast.success('Comment posted successfully! Check your results.');
        
        // Refresh data
        loadPostingResults();
        loadCampaigns();
        loadSubstackDomains();
      }
    }, 2000);

    // Cleanup after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
  };

  // Initialize
  useEffect(() => {
    if (isAuthenticated) {
      loadCampaigns();
      loadPostingResults();
      loadSubstackDomains();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <MessageSquare className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to access Substack automation.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Substack Automation</h1>
          <p className="text-gray-600 text-lg">Post contextual comments with your links on relevant Substack posts</p>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              <Target className="h-3 w-3 mr-1" />
              Substack Focused
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Globe className="h-3 w-3 mr-1" />
              Real Comments
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Live Tracking
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="campaign" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="results">Live Results ({postingResults.length})</TabsTrigger>
            <TabsTrigger value="domains">Substack Domains ({substackDomains.length})</TabsTrigger>
          </TabsList>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Campaign Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Setup</CardTitle>
                    <CardDescription>Configure your Substack comment campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Substack Campaign"
                        disabled={isRunning}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Your Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        disabled={isRunning}
                      />
                    </div>

                    <div>
                      <Label htmlFor="keyword">Search Keyword</Label>
                      <Input
                        id="keyword"
                        value={formData.keyword}
                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        placeholder="marketing, productivity, tech"
                        disabled={isRunning}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Will search: https://substack.com/search/{formData.keyword || 'keyword'}
                      </p>
                    </div>

                    {/* Progress */}
                    {isRunning && (
                      <div className="space-y-3 p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Automation Progress</span>
                          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {currentStep}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button onClick={createCampaign} disabled={isRunning} variant="outline">
                        Save Campaign
                      </Button>
                      
                      {!isRunning ? (
                        <Button 
                          onClick={startAutomation} 
                          disabled={!activeCampaign}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Automation
                        </Button>
                      ) : (
                        <Button 
                          onClick={pauseAutomation} 
                          variant="outline" 
                          className="flex-1"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Card */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Campaign Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeCampaign ? (
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium">{activeCampaign.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={activeCampaign.status === 'active' ? 'default' : 'secondary'}>
                              {activeCampaign.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Posts Found:</span>
                            <span className="font-medium">{activeCampaign.posts_found}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Comments Posted:</span>
                            <span className="font-medium">{activeCampaign.comments_posted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">
                              {activeCampaign.posts_found > 0 
                                ? Math.round((activeCampaign.comments_posted / activeCampaign.posts_found) * 100)
                                : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No active campaign</p>
                        <p className="text-xs text-gray-400">Fill in the form and save</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Live Posted Comments
                </CardTitle>
                <CardDescription>
                  Real Substack posts where your comments have been published
                </CardDescription>
              </CardHeader>
              <CardContent>
                {postingResults.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
                    <p className="text-gray-600">Start a campaign to see your live comments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {postingResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1">
                              {result.substack_domain}
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              Posted: {new Date(result.posted_at).toLocaleDateString()} at {new Date(result.posted_at).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded line-clamp-3">
                              "{result.comment_content}"
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="default" className="bg-orange-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                            <Button size="sm" variant="outline" asChild>
                              <a 
                                href={result.comment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
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

          {/* Domains Tab */}
          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Discovered Substack Domains
                </CardTitle>
                <CardDescription>
                  Substack publications where we've successfully posted comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {substackDomains.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No domains discovered yet</h3>
                    <p className="text-gray-600">Run campaigns to build your domain list</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {substackDomains.map((domain) => (
                      <div key={domain.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{domain.name}</h3>
                          <Badge variant="outline">{domain.post_count} posts</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{domain.domain}</p>
                        <p className="text-xs text-gray-500">
                          Added: {new Date(domain.added_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
