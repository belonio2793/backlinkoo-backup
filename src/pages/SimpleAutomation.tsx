import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Play,
  Pause,
  ExternalLink,
  Loader2,
  MessageSquare,
  Globe,
  AlertTriangle,
  Eye,
  CheckCircle,
  X
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
  links_found: number;
  links_posted: number;
}

interface LiveLink {
  id: string;
  target_url: string;
  live_url: string;
  posted_at: string;
  comment_content: string;
  domain: string;
}

export default function SimpleAutomation() {
  const { user, isAuthenticated } = useAuth();
  
  const [website, setWebsite] = useState('');
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [liveLinks, setLiveLinks] = useState<LiveLink[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);

  // Load existing campaign
  const loadActiveCampaign = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setCurrentCampaign(data);
        setWebsite(data.target_url);
        setKeyword(data.keyword);
        setAnchorText(data.anchor_text || '');
        loadLiveLinks(data.id);
      }
    } catch (error) {
      // No active campaign found
    }
  };

  // Load live links
  const loadLiveLinks = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('posting_results')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'posted')
        .not('live_url', 'is', null)
        .order('posted_at', { ascending: false });

      if (data && !error) {
        setLiveLinks(data.map(result => ({
          id: result.id,
          target_url: result.target_url,
          live_url: result.live_url,
          posted_at: result.posted_at,
          comment_content: result.comment_content,
          domain: new URL(result.target_url).hostname
        })));
      }
    } catch (error) {
      console.error('Error loading live links:', error);
    }
  };

  // Start campaign
  const startCampaign = async () => {
    if (!website || !keyword) {
      toast.error('Please enter both website and keyword');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to start automation');
      return;
    }

    setIsRunning(true);
    setProgress(0);

    try {
      // Create or update campaign
      const campaignData = {
        user_id: user?.id,
        name: `${keyword} - ${new URL(website).hostname}`,
        target_url: website,
        keyword: keyword,
        anchor_text: anchorText,
        status: 'active',
        automation_enabled: true
      };

      let campaign;
      if (currentCampaign) {
        // Update existing campaign
        const { data, error } = await supabase
          .from('blog_campaigns')
          .update(campaignData)
          .eq('id', currentCampaign.id)
          .select()
          .single();

        if (error) throw error;
        campaign = data;
      } else {
        // Create new campaign
        const { data, error } = await supabase
          .from('blog_campaigns')
          .insert([campaignData])
          .select()
          .single();

        if (error) throw error;
        campaign = data;
      }

      setCurrentCampaign(campaign);
      toast.loading('Starting blog comment automation...');

      // Start the automation
      const response = await fetch('/.netlify/functions/campaign-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_campaign',
          campaignId: campaign.id,
          settings: {
            maxTargets: 15,
            maxPosts: 8,
            autoPost: true,
            dryRun: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Automation started! Finding blogs and posting comments...');
        monitorProgress(data.jobId);
      } else {
        throw new Error(data.error || 'Failed to start automation');
      }

    } catch (error: any) {
      console.error('Error starting campaign:', error);
      toast.error(`Failed to start: ${error.message}`);
      setIsRunning(false);
    }
  };

  // Pause campaign
  const pauseCampaign = async () => {
    if (!currentCampaign) return;

    try {
      await supabase
        .from('blog_campaigns')
        .update({ status: 'paused' })
        .eq('id', currentCampaign.id);

      setCurrentCampaign({ ...currentCampaign, status: 'paused' });
      setIsRunning(false);
      setProgress(0);
      toast.success('Campaign paused');
    } catch (error: any) {
      toast.error('Failed to pause campaign');
    }
  };

  // Monitor progress
  const monitorProgress = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('automation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (data && !error) {
          setJobStatus(data);
          setProgress(data.progress || 0);
          
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            setIsRunning(false);
            
            if (data.status === 'completed') {
              toast.success('Automation completed! Check your live links.');
              if (currentCampaign) {
                loadLiveLinks(currentCampaign.id);
                loadActiveCampaign(); // Refresh campaign data
              }
            } else {
              toast.error(`Automation failed: ${data.error_message || 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring progress:', error);
      }
    }, 3000);

    // Cleanup after 30 minutes
    setTimeout(() => clearInterval(interval), 1800000);
  };

  // Initialize
  useEffect(() => {
    if (isAuthenticated) {
      loadActiveCampaign();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to access the blog comment automation system.
              </AlertDescription>
            </Alert>
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
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Blog Comment Automation</h1>
          <p className="text-gray-600 text-lg">Enter your details and let our AI find blogs and post comments with your links</p>
        </div>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Start Your Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Website Input */}
              <div>
                <Label htmlFor="website" className="text-base font-medium">Your Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="mt-2 h-12 text-base"
                  disabled={isRunning}
                />
              </div>

              {/* Keyword Input */}
              <div>
                <Label htmlFor="keyword" className="text-base font-medium">Target Keyword</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="marketing tools"
                  className="mt-2 h-12 text-base"
                  disabled={isRunning}
                />
              </div>

              {/* Anchor Text Input */}
              <div>
                <Label htmlFor="anchor-text" className="text-base font-medium">Anchor Text (Optional)</Label>
                <Input
                  id="anchor-text"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  placeholder="best marketing tools"
                  className="mt-2 h-12 text-base"
                  disabled={isRunning}
                />
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Automation Progress</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-3" />
                  {jobStatus && (
                    <p className="text-sm text-gray-600 text-center">
                      {jobStatus.job_type === 'discover' && 'Finding relevant blogs...'}
                      {jobStatus.job_type === 'detect' && 'Analyzing comment forms...'}
                      {jobStatus.job_type === 'post' && 'Posting comments with your links...'}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                {!isRunning ? (
                  <Button 
                    onClick={startCampaign} 
                    size="lg" 
                    className="flex-1 h-12 text-base"
                    disabled={!website || !keyword}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Automation
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseCampaign} 
                    variant="outline" 
                    size="lg" 
                    className="flex-1 h-12 text-base"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause Campaign
                  </Button>
                )}

                {/* Live Links Modal */}
                <Dialog open={showResults} onOpenChange={setShowResults}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="h-12 px-6"
                      disabled={liveLinks.length === 0}
                    >
                      <Eye className="h-5 w-5 mr-2" />
                      View Live Links ({liveLinks.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Live Posted Links
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {liveLinks.length === 0 ? (
                        <div className="text-center py-8">
                          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No live links yet. Start a campaign to see results!</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">
                              {liveLinks.length} live comment{liveLinks.length !== 1 ? 's' : ''} posted
                            </p>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active Links
                            </Badge>
                          </div>
                          
                          {liveLinks.map((link) => (
                            <Card key={link.id} className="border-l-4 border-l-green-500">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm mb-1">
                                      {link.domain}
                                    </p>
                                    <p className="text-xs text-gray-600 mb-2">
                                      Posted: {new Date(link.posted_at).toLocaleDateString()} at {new Date(link.posted_at).toLocaleTimeString()}
                                    </p>
                                    <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                                      "{link.comment_content.substring(0, 120)}..."
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Badge variant="default" className="bg-green-600">Live</Badge>
                                    <Button size="sm" variant="outline" asChild>
                                      <a 
                                        href={link.live_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Current Campaign Status */}
              {currentCampaign && (
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentCampaign.name}</p>
                      <p className="text-sm text-gray-600">
                        Status: <Badge variant={currentCampaign.status === 'active' ? 'default' : 'secondary'}>
                          {currentCampaign.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div>Found: {currentCampaign.links_found} blogs</div>
                      <div>Posted: {currentCampaign.links_posted} comments</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-medium mb-2">Smart Blog Discovery</h3>
                <p className="text-sm text-gray-600">Automatically finds relevant blogs in your niche</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-medium mb-2">Real Comment Posting</h3>
                <p className="text-sm text-gray-600">Posts genuine comments with your links</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <ExternalLink className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-medium mb-2">Live Link Tracking</h3>
                <p className="text-sm text-gray-600">Track all your live posted links in one place</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
