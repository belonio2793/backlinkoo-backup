import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Zap,
  Mail,
  Globe,
  BarChart3,
  Calendar,
  Shield,
  Target,
  Brain,
  TrendingUp,
  Users,
  Link2,
  FileText,
  Settings,
  Play,
  Pause,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Upload,
  Briefcase,
  Clock,
  Award,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled' | 'completed';
  keywords: string[];
  target_url: string;
  strategy: 'fast_boost' | 'natural_growth' | 'competitive' | 'branded';
  created_at: string;
  metrics: {
    links_built: number;
    domains_reached: number;
    dr_average: number;
    traffic_gained: number;
  };
}

interface CompetitorData {
  domain: string;
  backlinks: number;
  referring_domains: number;
  dr: number;
  opportunities: number;
}

interface LinkOpportunity {
  id: string;
  domain: string;
  url: string;
  type: 'guest_post' | 'web2' | 'forum' | 'directory' | 'social' | 'niche';
  dr: number;
  da: number;
  relevance_score: number;
  success_rate: number;
  status: 'discovered' | 'contacted' | 'approved' | 'published' | 'failed';
}

export default function AutomatedLinkBuilding() {
  const { user, isAuthenticated } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [opportunities, setOpportunities] = useState<LinkOpportunity[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [stats, setStats] = useState({
    linksBuiltToday: 0,
    domainsReached: 0,
    avgDomainRating: 0,
    successRate: 0,
    trafficGained: 0
  });
  const [loading, setLoading] = useState(true);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    keywords: '',
    target_url: '',
    strategy: 'natural_growth',
    competitor_urls: '',
    content_tone: 'professional',
    auto_publish: false,
    drip_speed: 'medium'
  });

  const [scanForm, setScanForm] = useState({
    keyword: '',
    competitor_domain: '',
    location: 'US',
    depth: 'medium'
  });

  const [outreachSettings, setOutreachSettings] = useState({
    template_style: 'friendly',
    follow_up_enabled: true,
    follow_up_delay: 7,
    personalization_level: 'high'
  });

  // Load automation data from database
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadAutomationData = async () => {
      try {
        setLoading(true);

        // Fetch real campaign statistics
        const { data: campaignStats, error: statsError } = await supabase
          .from('automation_campaigns')
          .select(`
            id,
            status,
            links_built_today,
            domains_reached,
            avg_domain_rating,
            success_rate,
            traffic_gained
          `)
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (statsError) throw statsError;

        // Calculate aggregate stats
        let totalLinksToday = 0;
        let totalDomains = 0;
        let avgDR = 0;
        let avgSuccessRate = 0;
        let totalTraffic = 0;

        if (campaignStats && campaignStats.length > 0) {
          totalLinksToday = campaignStats.reduce((sum, campaign) => sum + (campaign.links_built_today || 0), 0);
          totalDomains = campaignStats.reduce((sum, campaign) => sum + (campaign.domains_reached || 0), 0);
          avgDR = Math.round(campaignStats.reduce((sum, campaign) => sum + (campaign.avg_domain_rating || 0), 0) / campaignStats.length);
          avgSuccessRate = Math.round(campaignStats.reduce((sum, campaign) => sum + (campaign.success_rate || 0), 0) / campaignStats.length);
          totalTraffic = campaignStats.reduce((sum, campaign) => sum + (campaign.traffic_gained || 0), 0);
        }

        setStats({
          linksBuiltToday: totalLinksToday,
          domainsReached: totalDomains,
          avgDomainRating: avgDR,
          successRate: avgSuccessRate,
          trafficGained: totalTraffic
        });

        // Fetch campaigns
        const { data: campaigns, error: campaignsError } = await supabase
          .from('automation_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;

        setCampaigns(campaigns || []);

      } catch (error) {
        console.error('Error loading automation data:', error);
        toast.error('Failed to load automation data');
      } finally {
        setLoading(false);
      }
    };

    loadAutomationData();
  }, [user, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to access the automated link building platform.</p>
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Link Building Engine</h1>
          <p className="text-gray-600 text-lg">Complete automated link building with AI-powered content generation</p>
          
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Search className="h-3 w-3 mr-1" />
              SERP Scanner
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Mail className="h-3 w-3 mr-1" />
              Smart Outreach
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              <Globe className="h-3 w-3 mr-1" />
              Auto-Publish
            </Badge>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
              <BarChart3 className="h-3 w-3 mr-1" />
              Real-Time Analytics
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="scanner" className="text-xs">Scanner</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">AI Content</TabsTrigger>
            <TabsTrigger value="outreach" className="text-xs">Outreach</TabsTrigger>
            <TabsTrigger value="auto-publish" className="text-xs">Auto-Publish</TabsTrigger>
            <TabsTrigger value="diversification" className="text-xs">Diversify</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Campaign Setup */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Campaign Setup
                    </CardTitle>
                    <CardDescription>Configure your automated link building campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={campaignForm.name}
                          onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                          placeholder="My Link Building Campaign"
                        />
                      </div>
                      <div>
                        <Label htmlFor="strategy">Strategy</Label>
                        <Select 
                          value={campaignForm.strategy} 
                          onValueChange={(value) => setCampaignForm({ ...campaignForm, strategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fast_boost">🚀 Fast Rank Boost</SelectItem>
                            <SelectItem value="natural_growth">🌱 Natural Growth</SelectItem>
                            <SelectItem value="competitive">⚔️ Competitive Attack</SelectItem>
                            <SelectItem value="branded">🏢 Branded Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="target-url">Target URL</Label>
                      <Input
                        id="target-url"
                        type="url"
                        value={campaignForm.target_url}
                        onChange={(e) => setCampaignForm({ ...campaignForm, target_url: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Textarea
                        id="keywords"
                        value={campaignForm.keywords}
                        onChange={(e) => setCampaignForm({ ...campaignForm, keywords: e.target.value })}
                        placeholder="SEO tools, link building, digital marketing"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="competitors">Competitor URLs (optional)</Label>
                      <Textarea
                        id="competitors"
                        value={campaignForm.competitor_urls}
                        onChange={(e) => setCampaignForm({ ...campaignForm, competitor_urls: e.target.value })}
                        placeholder="competitor1.com, competitor2.com"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="content-tone">Content Tone</Label>
                        <Select 
                          value={campaignForm.content_tone} 
                          onValueChange={(value) => setCampaignForm({ ...campaignForm, content_tone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="authoritative">Authoritative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="drip-speed">Drip Speed</Label>
                        <Select 
                          value={campaignForm.drip_speed} 
                          onValueChange={(value) => setCampaignForm({ ...campaignForm, drip_speed: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">🐌 Slow (1-2 links/day)</SelectItem>
                            <SelectItem value="medium">⚡ Medium (3-5 links/day)</SelectItem>
                            <SelectItem value="fast">🚀 Fast (5-10 links/day)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="auto-publish"
                        checked={campaignForm.auto_publish}
                        onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, auto_publish: checked })}
                      />
                      <Label htmlFor="auto-publish">Enable Auto-Publish to Partner Network</Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={() => {}} variant="outline">
                        Save Campaign
                      </Button>
                      <Button onClick={() => {}} className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Start Automation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Live Campaign Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Links Built Today</span>
                        <span className="font-medium">{loading ? '-' : stats.linksBuiltToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Domains Reached</span>
                        <span className="font-medium">{loading ? '-' : stats.domainsReached}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg. Domain Rating</span>
                        <span className="font-medium">{loading ? '-' : stats.avgDomainRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium text-green-600">{loading ? '-' : `${stats.successRate}%`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Traffic Gained</span>
                        <span className="font-medium">{loading ? '-' : `+${stats.trafficGained.toLocaleString()}`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Automation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Link Discovery</span>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Content Generation</span>
                        <Badge variant="default" className="bg-blue-600">Running</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Outreach Engine</span>
                        <Badge variant="default" className="bg-purple-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-Publisher</span>
                        <Badge variant="secondary">Paused</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recent Link Building Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Link published on TechCrunch</p>
                      <p className="text-xs text-gray-600">Domain Rating: 93 • Guest post about AI tools</p>
                    </div>
                    <Badge variant="outline" className="text-green-700">Live</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Outreach sent to 12 prospects</p>
                      <p className="text-xs text-gray-600">2 positive responses received</p>
                    </div>
                    <Badge variant="outline" className="text-blue-700">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI generated 5 unique articles</p>
                      <p className="text-xs text-gray-600">Ready for Web 2.0 publication</p>
                    </div>
                    <Badge variant="outline" className="text-purple-700">Ready</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Keyword & Competitor Scanner
                  </CardTitle>
                  <CardDescription>Discover link opportunities from SERPs and competitor analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="scan-keyword">Keyword or Phrase</Label>
                    <Input
                      id="scan-keyword"
                      value={scanForm.keyword}
                      onChange={(e) => setScanForm({ ...scanForm, keyword: e.target.value })}
                      placeholder="AI tools for marketing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="competitor-domain">Competitor Domain (optional)</Label>
                    <Input
                      id="competitor-domain"
                      value={scanForm.competitor_domain}
                      onChange={(e) => setScanForm({ ...scanForm, competitor_domain: e.target.value })}
                      placeholder="competitor.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Select value={scanForm.location} onValueChange={(value) => setScanForm({ ...scanForm, location: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="depth">Scan Depth</Label>
                      <Select value={scanForm.depth} onValueChange={(value) => setScanForm({ ...scanForm, depth: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light (Top 10)</SelectItem>
                          <SelectItem value="medium">Medium (Top 50)</SelectItem>
                          <SelectItem value="deep">Deep (Top 100)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={() => {}} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Start SERP Scan
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scan Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">techcrunch.com/guest-posts</p>
                        <Badge variant="outline" className="bg-green-50 text-green-700">DR: 93</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Guest posting opportunity for tech content</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">Guest Post</Badge>
                        <Badge variant="secondary" className="text-xs">High Authority</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">medium.com/@publications</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">DR: 78</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Web 2.0 platform accepting submissions</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">Web 2.0</Badge>
                        <Badge variant="secondary" className="text-xs">Easy Approval</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Competitor Backlink Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">competitor1.com</h3>
                    <p className="text-sm text-gray-600">DR: 67 • 2,341 backlinks</p>
                    <p className="text-xs text-gray-500 mt-1">156 opportunities found</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">competitor2.com</h3>
                    <p className="text-sm text-gray-600">DR: 72 • 1,892 backlinks</p>
                    <p className="text-xs text-gray-500 mt-1">203 opportunities found</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">competitor3.com</h3>
                    <p className="text-sm text-gray-600">DR: 59 • 1,156 backlinks</p>
                    <p className="text-xs text-gray-500 mt-1">89 opportunities found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Content Generation
                  </CardTitle>
                  <CardDescription>Generate contextual content for different platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select defaultValue="guest_post">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest_post">Guest Post Article</SelectItem>
                        <SelectItem value="blog_comment">Blog Comment</SelectItem>
                        <SelectItem value="forum_post">Forum Post</SelectItem>
                        <SelectItem value="social_post">Social Media Post</SelectItem>
                        <SelectItem value="email_outreach">Email Outreach</SelectItem>
                        <SelectItem value="resource_submission">Resource Submission</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target-platform">Target Platform</Label>
                    <Input placeholder="e.g., TechCrunch, Medium, Dev.to" />
                  </div>
                  <div>
                    <Label htmlFor="content-angle">Content Angle</Label>
                    <Select defaultValue="educational">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educational">Educational Guide</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                        <SelectItem value="opinion">Opinion Piece</SelectItem>
                        <SelectItem value="list">List Article</SelectItem>
                        <SelectItem value="comparison">Tool Comparison</SelectItem>
                        <SelectItem value="news">Industry News</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="word-count">Word Count</Label>
                    <Select defaultValue="1000">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500-800 words</SelectItem>
                        <SelectItem value="1000">1000-1500 words</SelectItem>
                        <SelectItem value="2000">2000+ words</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Content
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generated Content Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2">Title: "The Ultimate Guide to AI-Powered Marketing Tools in 2024"</h3>
                      <p className="text-sm text-gray-600 mb-3">Marketing automation has evolved significantly with the introduction of artificial intelligence...</p>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">1,247 words</Badge>
                        <Badge variant="secondary" className="text-xs">Professional tone</Badge>
                        <Badge variant="secondary" className="text-xs">Educational</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <Button size="sm">
                          Use Content
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Library */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-sm mb-1">AI Marketing Tools Guide</h3>
                    <p className="text-xs text-gray-600 mb-2">Guest post • 1,500 words</p>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">Ready</Badge>
                      <Badge variant="secondary" className="text-xs">Professional</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">Use Content</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-sm mb-1">SEO Automation Strategies</h3>
                    <p className="text-xs text-gray-600 mb-2">Forum post • 800 words</p>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">Published</Badge>
                      <Badge variant="secondary" className="text-xs">Technical</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">View Results</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-sm mb-1">Digital Marketing Trends</h3>
                    <p className="text-xs text-gray-600 mb-2">Blog comment • 200 words</p>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">Generating</Badge>
                      <Badge variant="secondary" className="text-xs">Casual</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Smart Outreach Engine
                  </CardTitle>
                  <CardDescription>AI-powered personalized email outreach</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email-template">Email Template Style</Label>
                    <Select 
                      value={outreachSettings.template_style} 
                      onValueChange={(value) => setOutreachSettings({ ...outreachSettings, template_style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly & Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="collaborative">Collaborative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="personalization">Personalization Level</Label>
                    <Select 
                      value={outreachSettings.personalization_level} 
                      onValueChange={(value) => setOutreachSettings({ ...outreachSettings, personalization_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (Name + Company)</SelectItem>
                        <SelectItem value="medium">Medium (+ Recent Content)</SelectItem>
                        <SelectItem value="high">High (+ Social Research)</SelectItem>
                        <SelectItem value="ai_deep">AI Deep Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="follow-up"
                      checked={outreachSettings.follow_up_enabled}
                      onCheckedChange={(checked) => setOutreachSettings({ ...outreachSettings, follow_up_enabled: checked })}
                    />
                    <Label htmlFor="follow-up">Enable automatic follow-ups</Label>
                  </div>
                  {outreachSettings.follow_up_enabled && (
                    <div>
                      <Label htmlFor="follow-up-delay">Follow-up delay (days)</Label>
                      <Select 
                        value={outreachSettings.follow_up_delay.toString()} 
                        onValueChange={(value) => setOutreachSettings({ ...outreachSettings, follow_up_delay: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Start Outreach Campaign
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outreach Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">156</p>
                        <p className="text-xs text-gray-600">Emails Sent</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">23%</p>
                        <p className="text-xs text-gray-600">Response Rate</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">18</p>
                        <p className="text-xs text-gray-600">Positive Responses</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">12</p>
                        <p className="text-xs text-gray-600">Link Placements</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Outreach */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Outreach Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">john@techblog.com</p>
                      <p className="text-xs text-gray-600">Positive response • Ready to publish guest post</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Accepted</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">sarah@digitalmarketing.com</p>
                      <p className="text-xs text-gray-600">Initial outreach sent • Awaiting response</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">Pending</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">mike@seoblog.net</p>
                      <p className="text-xs text-gray-600">Follow-up scheduled for tomorrow</p>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">Follow-up</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto-Publish Tab */}
          <TabsContent value="auto-publish" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Partner Network Auto-Publisher
                  </CardTitle>
                  <CardDescription>Instantly publish to pre-approved partner sites</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Globe className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Medium Publications</p>
                          <p className="text-xs text-gray-600">24 partner publications</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Dev.to Community</p>
                          <p className="text-xs text-gray-600">8 approved accounts</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Industry Forums</p>
                          <p className="text-xs text-gray-600">15 forum accounts</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">WordPress Network</p>
                          <p className="text-xs text-gray-600">12 partner sites</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Configure API Connections
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publishing Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">AI Marketing Tools Guide</p>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Ready</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Scheduled for: Medium Tech Publication</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm">Publish Now</Button>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">SEO Automation Strategies</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Scheduled</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Publishing in: 2 hours to Dev.to</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reschedule</Button>
                        <Button size="sm" variant="outline">Cancel</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Publishing Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Auto-Publishing Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">47</p>
                    <p className="text-sm text-gray-600">Articles Published</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">94%</p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xs text-gray-500">Auto-approval</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">68</p>
                    <p className="text-sm text-gray-600">Avg. Domain Rating</p>
                    <p className="text-xs text-gray-500">Partner network</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">12.3k</p>
                    <p className="text-sm text-gray-600">Traffic Generated</p>
                    <p className="text-xs text-gray-500">Monthly estimate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diversification Tab */}
          <TabsContent value="diversification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Link Diversification Engine
                </CardTitle>
                <CardDescription>Maintain a healthy, natural backlink profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Guest Posts</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current %</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target %</span>
                        <span className="font-medium">30-40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-medium">12 links</span>
                      </div>
                      <Progress value={35} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Web 2.0</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current %</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target %</span>
                        <span className="font-medium">20-30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-medium">8 links</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <h3 className="font-medium">Forum Profiles</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current %</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target %</span>
                        <span className="font-medium">15-25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-medium">6 links</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-5 w-5 text-orange-600" />
                      <h3 className="font-medium">Directories</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current %</span>
                        <span className="font-medium">10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target %</span>
                        <span className="font-medium">5-15%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-medium">3 links</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-medium">Social Profiles</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current %</span>
                        <span className="font-medium">8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target %</span>
                        <span className="font-medium">5-10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-medium">2 links</span>
                      </div>
                      <Progress value={8} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-red-600" />
                      <h3 className="font-medium">Other</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current %</span>
                        <span className="font-medium">2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target %</span>
                        <span className="font-medium">5-10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-medium">1 link</span>
                      </div>
                      <Progress value={2} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anchor Text Diversification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Anchor Text Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Current Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Exact Match</span>
                        <div className="flex items-center gap-2">
                          <Progress value={15} className="w-20 h-2" />
                          <span className="text-sm font-medium">15%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Partial Match</span>
                        <div className="flex items-center gap-2">
                          <Progress value={25} className="w-20 h-2" />
                          <span className="text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Branded</span>
                        <div className="flex items-center gap-2">
                          <Progress value={30} className="w-20 h-2" />
                          <span className="text-sm font-medium">30%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Generic</span>
                        <div className="flex items-center gap-2">
                          <Progress value={20} className="w-20 h-2" />
                          <span className="text-sm font-medium">20%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Naked URL</span>
                        <div className="flex items-center gap-2">
                          <Progress value={10} className="w-20 h-2" />
                          <span className="text-sm font-medium">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Health Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Natural Distribution</p>
                          <p className="text-xs text-gray-600">Anchor text ratios look natural</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Balanced Growth</p>
                          <p className="text-xs text-gray-600">Link velocity is appropriate</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">Monitor Exact Match</p>
                          <p className="text-xs text-gray-600">Keep below 20% for safety</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Total Links Built</span>
                  </div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-green-600">+23% this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Referring Domains</span>
                  </div>
                  <p className="text-2xl font-bold">534</p>
                  <p className="text-xs text-green-600">+18% this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Avg. Domain Rating</span>
                  </div>
                  <p className="text-2xl font-bold">67</p>
                  <p className="text-xs text-blue-600">+5 this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Traffic Impact</span>
                  </div>
                  <p className="text-2xl font-bold">+34.2k</p>
                  <p className="text-xs text-green-600">Monthly organic</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Link Building Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Chart: Links built over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Domain Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Chart: DR distribution of acquired links</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance by Platform */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Platform Type</th>
                        <th className="text-left p-2">Links Built</th>
                        <th className="text-left p-2">Avg. DR</th>
                        <th className="text-left p-2">Success Rate</th>
                        <th className="text-left p-2">Traffic Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Guest Posts</td>
                        <td className="p-2">47</td>
                        <td className="p-2">72</td>
                        <td className="p-2">68%</td>
                        <td className="p-2">+12.3k</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Web 2.0</td>
                        <td className="p-2">89</td>
                        <td className="p-2">58</td>
                        <td className="p-2">94%</td>
                        <td className="p-2">+8.7k</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Forums</td>
                        <td className="p-2">156</td>
                        <td className="p-2">45</td>
                        <td className="p-2">78%</td>
                        <td className="p-2">+5.2k</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Directories</td>
                        <td className="p-2">23</td>
                        <td className="p-2">38</td>
                        <td className="p-2">85%</td>
                        <td className="p-2">+1.8k</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Built-in Compliance Checks
                </CardTitle>
                <CardDescription>Ensure your link building follows best practices and guidelines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Safety Checks</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">PBN Detection</p>
                          <p className="text-xs text-gray-600">Automatically avoids PBN-looking sites</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Content Variation</p>
                          <p className="text-xs text-gray-600">AI varies content structure and style</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Natural Timing</p>
                          <p className="text-xs text-gray-600">Randomized publishing schedules</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Footprint Avoidance</p>
                          <p className="text-xs text-gray-600">Different IP addresses and patterns</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Quality Standards</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Filter className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Domain Authority Filter</p>
                          <p className="text-xs text-gray-600">Minimum DA: 30, Maximum Spam Score: 20</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Content Relevance</p>
                          <p className="text-xs text-gray-600">Minimum relevance score: 70%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Traffic Validation</p>
                          <p className="text-xs text-gray-600">Sites must have organic traffic</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Geographic Diversity</p>
                          <p className="text-xs text-gray-600">Balanced across regions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="font-medium text-green-800">Low Risk</p>
                    <p className="text-sm text-green-600">Current campaign profile</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="font-medium text-blue-800">Protected</p>
                    <p className="text-sm text-blue-600">All safety measures active</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="font-medium text-purple-800">Optimized</p>
                    <p className="text-sm text-purple-600">Following best practices</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Guidelines Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Google Guidelines</p>
                      <p className="text-xs text-gray-600">Natural link patterns, quality content</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Medium Terms of Service</p>
                      <p className="text-xs text-gray-600">Original content, proper attribution</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Forum Community Rules</p>
                      <p className="text-xs text-gray-600">Helpful contributions, no spam</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Compliant</Badge>
                  </div>
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
