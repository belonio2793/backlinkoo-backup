import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Pause,
  ExternalLink,
  Loader2,
  Link2,
  BarChart3,
  Plus,
  CheckCircle,
  Globe,
  Target,
  Settings,
  Zap
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BacklinkDatabaseSetup } from '@/components/BacklinkDatabaseSetup';

interface Campaign {
  id: string;
  name: string;
  target_url: string;
  keyword: string;
  anchor_text: string;
  target_platform: string;
  status: 'active' | 'paused' | 'completed';
  links_found: number;
  links_posted: number;
  created_at: string;
}

interface PostingResult {
  id: string;
  target_platform: string;
  post_url: string;
  live_url: string;
  comment_content: string;
  domain: string;
  posted_at: string;
  status: 'posted' | 'failed';
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
  is_available: boolean;
  success_rate: number;
}

const AVAILABLE_PLATFORMS: Platform[] = [
  {
    id: 'substack',
    name: 'Substack',
    icon: '📰',
    description: 'Newsletter platform with comment sections',
    is_available: true,
    success_rate: 85
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: '✍️',
    description: 'Publishing platform with responses',
    is_available: false,
    success_rate: 0
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🔴',
    description: 'Forum discussions and comments',
    is_available: false,
    success_rate: 0
  },
  {
    id: 'dev_to',
    name: 'Dev.to',
    icon: '👨‍💻',
    description: 'Developer community discussions',
    is_available: false,
    success_rate: 0
  },
  {
    id: 'hashnode',
    name: 'Hashnode',
    icon: '🔗',
    description: 'Developer blogging platform',
    is_available: false,
    success_rate: 0
  }
];

export default function BacklinkAutomation() {
  const { user, isAuthenticated } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [postingResults, setPostingResults] = useState<PostingResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    target_url: '',
    keyword: '',
    anchor_text: '',
    target_platform: 'substack'
  });

  // Load campaigns
  const loadCampaigns = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('backlink_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setCampaigns(data);
        const active = data.find(c => c.status === 'active');
        if (active) {
          setActiveCampaign(active);
          setFormData({
            name: active.name,
            target_url: active.target_url,
            keyword: active.keyword,
            anchor_text: active.anchor_text || '',
            target_platform: active.target_platform
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        setShowDatabaseSetup(true);
        toast.error('Database tables not set up. Please run the database migration.');
      }
    }
  };

  // Load posting results
  const loadPostingResults = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('backlink_posts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'posted')
        .order('posted_at', { ascending: false });

      if (data && !error) {
        setPostingResults(data);
      }
    } catch (error: any) {
      console.error('Error loading results:', error);
    }
  };

  // Save campaign
  const saveCampaign = async () => {
    if (!formData.name || !formData.target_url || !formData.keyword || !formData.anchor_text) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if database tables exist first
    try {
      const { error: tableCheckError } = await supabase
        .from('backlink_campaigns')
        .select('id')
        .limit(1);

      if (tableCheckError && tableCheckError.message.includes('does not exist')) {
        setShowDatabaseSetup(true);
        toast.error('Database tables not set up. Please run the database setup first.');
        return;
      }
    } catch (tableError) {
      console.error('Table check error:', tableError);
      setShowDatabaseSetup(true);
      toast.error('Cannot access database tables. Please set up the database first.');
      return;
    }

    try {
      const campaignData = {
        user_id: user?.id,
        name: formData.name,
        target_url: formData.target_url,
        keyword: formData.keyword,
        anchor_text: formData.anchor_text,
        target_platform: formData.target_platform,
        status: 'paused',
        links_found: 0,
        links_posted: 0
      };

      console.log('Saving campaign with data:', campaignData);

      let campaign;
      if (activeCampaign) {
        // Update existing
        const { data, error } = await supabase
          .from('backlink_campaigns')
          .update(campaignData)
          .eq('id', activeCampaign.id)
          .select()
          .single();

        if (error) throw error;
        campaign = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('backlink_campaigns')
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

      // Extract meaningful error message from Supabase error object
      let errorMessage = 'Unknown error';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        // If it's still an object, try to stringify it meaningfully
        try {
          errorMessage = JSON.stringify(error, null, 2);
        } catch {
          errorMessage = 'Complex error object - check console';
        }
      }

      toast.error(`Failed to save campaign: ${errorMessage}`);
    }
  };

  // Start automation
  const startAutomation = async () => {
    if (!activeCampaign) {
      toast.error('Please save your campaign first');
      return;
    }

    const selectedPlatform = AVAILABLE_PLATFORMS.find(p => p.id === activeCampaign.target_platform);
    if (!selectedPlatform?.is_available) {
      toast.error(`${selectedPlatform?.name || 'Platform'} automation is not available yet`);
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setCurrentStep('Initializing automation...');

    try {
      // Update campaign status
      await supabase
        .from('backlink_campaigns')
        .update({ status: 'active' })
        .eq('id', activeCampaign.id);

      setActiveCampaign({ ...activeCampaign, status: 'active' });

      // Start the automation based on platform
      const response = await fetch('/.netlify/functions/backlink-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          campaignId: activeCampaign.id,
          platform: activeCampaign.target_platform,
          keyword: activeCampaign.keyword,
          targetUrl: activeCampaign.target_url,
          anchorText: activeCampaign.anchor_text
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(`${selectedPlatform.name} automation started!`);
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
        .from('backlink_campaigns')
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

  // Monitor progress
  const monitorProgress = (sessionId: string) => {
    const steps = [
      'Generating AI comment content...',
      'Searching for target posts...',
      'Analyzing post relevance...',
      'Posting comment with backlink...',
      'Capturing live URL...',
      'Saving results...'
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
        toast.success('Backlink posted successfully! Check your results.');
        
        // Refresh data
        loadPostingResults();
        loadCampaigns();
      }
    }, 3000);

    // Cleanup after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
  };

  // Initialize
  useEffect(() => {
    if (isAuthenticated) {
      loadCampaigns();
      loadPostingResults();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Link2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to access backlink automation.</p>
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Backlink Automation</h1>
          <p className="text-gray-600 text-lg">Generate AI-powered comments and post backlinks across multiple platforms</p>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Globe className="h-3 w-3 mr-1" />
              Multi-Platform
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Live Tracking
            </Badge>
          </div>
        </div>

        {/* Database Setup */}
        {showDatabaseSetup && (
          <div className="mb-6">
            <BacklinkDatabaseSetup />
          </div>
        )}

        <Tabs defaultValue="campaign" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="results">Live Results ({postingResults.length})</TabsTrigger>
            <TabsTrigger value="platforms">Platforms ({AVAILABLE_PLATFORMS.filter(p => p.is_available).length} available)</TabsTrigger>
          </TabsList>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Campaign Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Setup</CardTitle>
                    <CardDescription>Configure your backlink automation campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Backlink Campaign"
                        disabled={isRunning}
                      />
                    </div>

                    <div>
                      <Label htmlFor="target-platform">Target Platform</Label>
                      <Select 
                        value={formData.target_platform} 
                        onValueChange={(value) => setFormData({ ...formData, target_platform: value })}
                        disabled={isRunning}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_PLATFORMS.map((platform) => (
                            <SelectItem 
                              key={platform.id} 
                              value={platform.id}
                              disabled={!platform.is_available}
                            >
                              <div className="flex items-center gap-2">
                                <span>{platform.icon}</span>
                                <span>{platform.name}</span>
                                {!platform.is_available && <Badge variant="secondary" className="text-xs">Coming Soon</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="website">Your Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.target_url}
                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        disabled={isRunning}
                      />
                    </div>

                    <div>
                      <Label htmlFor="keyword">Content Keyword</Label>
                      <Input
                        id="keyword"
                        value={formData.keyword}
                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        placeholder="marketing, productivity, tech"
                        disabled={isRunning}
                      />
                    </div>

                    <div>
                      <Label htmlFor="anchor-text">Anchor Text</Label>
                      <Input
                        id="anchor-text"
                        value={formData.anchor_text}
                        onChange={(e) => setFormData({ ...formData, anchor_text: e.target.value })}
                        placeholder="best marketing tools"
                        disabled={isRunning}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This text will be hyperlinked to your website
                      </p>
                    </div>

                    {/* AI Prompt Preview */}
                    {formData.keyword && formData.anchor_text && formData.target_url && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">AI Prompt Preview:</p>
                        <p className="text-sm text-gray-800">
                          "Generate a short blog comment on <strong>{formData.keyword}</strong> including the <strong>{formData.anchor_text}</strong> hyperlinked to <strong>{formData.target_url}</strong>"
                        </p>
                      </div>
                    )}

                    {/* Progress */}
                    {isRunning && (
                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
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
                      <Button onClick={saveCampaign} disabled={isRunning} variant="outline">
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
                            <Badge variant="outline">
                              {AVAILABLE_PLATFORMS.find(p => p.id === activeCampaign.target_platform)?.icon}
                              {AVAILABLE_PLATFORMS.find(p => p.id === activeCampaign.target_platform)?.name}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Posts Found:</span>
                            <span className="font-medium">{activeCampaign.links_found}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Backlinks Posted:</span>
                            <span className="font-medium">{activeCampaign.links_posted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">
                              {activeCampaign.links_found > 0 
                                ? Math.round((activeCampaign.links_posted / activeCampaign.links_found) * 100)
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
                  Live Posted Backlinks
                </CardTitle>
                <CardDescription>
                  Real links posted across various platforms with AI-generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {postingResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No backlinks yet</h3>
                    <p className="text-gray-600">Start a campaign to see your live backlinks</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {postingResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">
                                {AVAILABLE_PLATFORMS.find(p => p.id === result.target_platform)?.icon}
                              </span>
                              <p className="font-medium text-sm">
                                {AVAILABLE_PLATFORMS.find(p => p.id === result.target_platform)?.name} - {result.domain}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              Posted: {new Date(result.posted_at).toLocaleDateString()} at {new Date(result.posted_at).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded line-clamp-3">
                              "{result.comment_content}"
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                            <Button size="sm" variant="outline" asChild>
                              <a 
                                href={result.live_url} 
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

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Available Platforms
                </CardTitle>
                <CardDescription>
                  Platforms where we can automatically post backlinks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <div key={platform.id} className={`border rounded-lg p-4 ${platform.is_available ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{platform.icon}</span>
                          <h3 className="font-medium">{platform.name}</h3>
                        </div>
                        <Badge variant={platform.is_available ? 'default' : 'secondary'}>
                          {platform.is_available ? 'Available' : 'Coming Soon'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{platform.description}</p>
                      {platform.is_available && (
                        <p className="text-xs text-green-600">
                          Success Rate: {platform.success_rate}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
