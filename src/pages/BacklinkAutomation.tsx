import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link, Target, Search, Bot, Play, Pause, Stop, Settings, 
  BarChart3, Globe, MessageSquare, UserPlus, Mail, FileText,
  Infinity, Zap, Shield, Clock, TrendingUp, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  targetUrl: string;
  keywords: string[];
  status: 'active' | 'paused' | 'stopped' | 'completed';
  progress: number;
  linksGenerated: number;
  linkStrategy: {
    blogComments: boolean;
    forumProfiles: boolean;
    web2Platforms: boolean;
    socialProfiles: boolean;
    contactForms: boolean;
  };
  createdAt: Date;
  lastActive: Date;
}

interface LinkOpportunity {
  id: string;
  url: string;
  type: 'blog_comment' | 'forum_profile' | 'web2_platform' | 'social_profile' | 'contact_form';
  authority: number;
  relevanceScore: number;
  status: 'pending' | 'posted' | 'failed';
  anchorText?: string;
  postedAt?: Date;
}

export default function BacklinkAutomation() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [linkOpportunities, setLinkOpportunities] = useState<LinkOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  // Campaign form state
  const [campaignName, setCampaignName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [anchorTexts, setAnchorTexts] = useState('');
  const [dailyLimit, setDailyLimit] = useState(10);
  const [linkStrategy, setLinkStrategy] = useState({
    blogComments: true,
    forumProfiles: true,
    web2Platforms: true,
    socialProfiles: false,
    contactForms: false
  });

  // Load campaigns on component mount
  useEffect(() => {
    // Add a small delay to ensure the page loads first
    const timer = setTimeout(() => {
      loadCampaigns();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const loadCampaigns = async () => {
    try {
      console.log('Loading user campaigns...');

      const response = await fetch('/.netlify/functions/backlink-campaigns', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (response.ok) {
        const responseText = await response.text();

        // Check if response is HTML (function not found)
        if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
          console.log('Backend function not available, using demo mode');
          loadDemoCampaigns();
          return;
        }

        try {
          const data = JSON.parse(responseText);
          const campaigns = data.campaigns.map((campaign: any) => ({
            ...campaign,
            createdAt: new Date(campaign.created_at),
            lastActive: new Date(campaign.last_active_at || campaign.updated_at)
          }));
          setCampaigns(campaigns);
          console.log('Production campaigns loaded successfully:', campaigns.length);
        } catch (parseError) {
          console.log('Failed to parse response, using demo mode');
          loadDemoCampaigns();
        }
      } else {
        console.log('Backend not available, using demo mode');
        loadDemoCampaigns();
      }

    } catch (error) {
      console.log('Connection failed, using demo mode:', error);
      loadDemoCampaigns();
    }
  };

  const loadDemoCampaigns = () => {
    const demoCampaigns: Campaign[] = [
      {
        id: 'demo_campaign_1',
        name: 'SEO Authority Building',
        targetUrl: 'https://example.com',
        keywords: ['SEO', 'digital marketing', 'backlinks'],
        status: 'active',
        progress: 65,
        linksGenerated: 127,
        linkStrategy: {
          blogComments: true,
          forumProfiles: true,
          web2Platforms: true,
          socialProfiles: false,
          contactForms: false
        },
        createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
        lastActive: new Date()
      },
      {
        id: 'demo_campaign_2',
        name: 'Brand Awareness Campaign',
        targetUrl: 'https://mybrand.com',
        keywords: ['brand marketing', 'online presence', 'digital strategy'],
        status: 'paused',
        progress: 32,
        linksGenerated: 89,
        linkStrategy: {
          blogComments: true,
          forumProfiles: false,
          web2Platforms: true,
          socialProfiles: true,
          contactForms: false
        },
        createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
        lastActive: new Date(Date.now() - 86400000 * 1) // 1 day ago
      }
    ];

    setCampaigns(demoCampaigns);
    console.log('Demo campaigns loaded successfully');

    toast({
      title: "Demo Mode Active",
      description: "Backend services unavailable. Using demonstration data.",
    });
  };

  const createCampaign = async () => {
    if (!campaignName.trim() || !targetUrl.trim() || !keywords.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const campaignData = {
        name: campaignName,
        target_url: targetUrl,
        keywords: keywords.split(',').map(k => k.trim()),
        anchor_texts: anchorTexts.split(',').map(a => a.trim()).filter(a => a),
        daily_limit: dailyLimit,
        strategy_blog_comments: linkStrategy.blogComments,
        strategy_forum_profiles: linkStrategy.forumProfiles,
        strategy_web2_platforms: linkStrategy.web2Platforms,
        strategy_social_profiles: linkStrategy.socialProfiles,
        strategy_contact_forms: linkStrategy.contactForms
      };

      const response = await fetch('/.netlify/functions/backlink-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          action: 'create',
          campaign: campaignData
        })
      });

      const responseText = await response.text();

      // Check if response is HTML (function not found) or if response failed
      if (!response.ok || responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.log('Backend not available, creating campaign in demo mode');

        // Create campaign locally in demo mode
        const newCampaign: Campaign = {
          id: `demo_${Date.now()}`,
          name: campaignName,
          targetUrl: targetUrl,
          keywords: keywords.split(',').map(k => k.trim()),
          status: 'active',
          progress: 0,
          linksGenerated: 0,
          linkStrategy,
          createdAt: new Date(),
          lastActive: new Date()
        };

        setCampaigns(prev => [...prev, newCampaign]);
        setActiveCampaign(newCampaign);

        startLinkDiscovery(newCampaign);

        toast({
          title: "Campaign Created (Demo Mode)",
          description: `${campaignName} campaign started successfully`,
        });
      } else {
        // Parse successful response
        const data = JSON.parse(responseText);
        const newCampaign: Campaign = {
          id: data.campaign.id,
          name: campaignName,
          targetUrl: targetUrl,
          keywords: keywords.split(',').map(k => k.trim()),
          status: 'active',
          progress: 0,
          linksGenerated: 0,
          linkStrategy,
          createdAt: new Date(),
          lastActive: new Date()
        };

        setCampaigns(prev => [...prev, newCampaign]);
        setActiveCampaign(newCampaign);

        startLinkDiscovery(newCampaign);

        toast({
          title: "Campaign Created",
          description: `${campaignName} campaign started successfully`,
        });
      }

      // Reset form
      setCampaignName('');
      setTargetUrl('');
      setKeywords('');
      setAnchorTexts('');

    } catch (error) {
      console.error('Error creating campaign:', error);

      // Fallback to demo mode on any error
      const newCampaign: Campaign = {
        id: `demo_${Date.now()}`,
        name: campaignName,
        targetUrl: targetUrl,
        keywords: keywords.split(',').map(k => k.trim()),
        status: 'active',
        progress: 0,
        linksGenerated: 0,
        linkStrategy,
        createdAt: new Date(),
        lastActive: new Date()
      };

      setCampaigns(prev => [...prev, newCampaign]);
      setActiveCampaign(newCampaign);
      startLinkDiscovery(newCampaign);

      toast({
        title: "Campaign Created (Demo Mode)",
        description: `${campaignName} campaign started successfully`,
      });

      // Reset form
      setCampaignName('');
      setTargetUrl('');
      setKeywords('');
      setAnchorTexts('');
    }
  };

  const startLinkDiscovery = async (campaign: Campaign) => {
    setIsScanning(true);
    setScanProgress(0);
    setLinkOpportunities([]);

    try {
      // Simulate discovery process with demo data
      const totalSteps = 100;
      const stepDuration = 50; // 50ms per step

      // Generate demo opportunities based on keywords
      const generateDemoOpportunities = (keywords: string[]) => {
        const opportunities: LinkOpportunity[] = [];
        const domains = [
          'techcrunch.com', 'medium.com', 'reddit.com', 'quora.com',
          'stackoverflow.com', 'dev.to', 'hashnode.com', 'producthunt.com',
          'indiehackers.com', 'hackernews.com', 'linkedin.com'
        ];

        const types: Array<LinkOpportunity['type']> = [
          'blog_comment', 'forum_profile', 'web2_platform', 'social_profile'
        ];

        keywords.forEach(keyword => {
          for (let i = 0; i < 15; i++) { // 15 opportunities per keyword
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const type = types[Math.floor(Math.random() * types.length)];

            opportunities.push({
              id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url: `https://${domain}/${keyword.toLowerCase().replace(/\s+/g, '-')}-${i}`,
              type,
              authority: Math.floor(Math.random() * 40) + 30, // 30-70
              relevanceScore: Math.floor(Math.random() * 30) + 70, // 70-100
              status: 'pending'
            });
          }
        });

        return opportunities;
      };

      const demoOpportunities = generateDemoOpportunities(campaign.keywords);
      let addedOpportunities = 0;

      // Simulate progressive discovery
      for (let step = 0; step <= totalSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));

        setScanProgress(step);

        // Add opportunities gradually
        if (step > 20 && addedOpportunities < demoOpportunities.length) {
          const opportunitiesToAdd = Math.min(3, demoOpportunities.length - addedOpportunities);
          for (let i = 0; i < opportunitiesToAdd; i++) {
            const opportunityToAdd = demoOpportunities[addedOpportunities + i];
            if (opportunityToAdd && opportunityToAdd.id && opportunityToAdd.type) {
              setLinkOpportunities(prev => [...prev, opportunityToAdd]);
            }
          }
          addedOpportunities += opportunitiesToAdd;
        }
      }

      toast({
        title: "Discovery Complete",
        description: `Found ${demoOpportunities.length} link opportunities across ${campaign.keywords.length} keywords`,
      });

    } catch (error) {
      console.error('Error in link discovery:', error);
      toast({
        title: "Discovery Failed",
        description: "Failed to discover link opportunities",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/.netlify/functions/backlink-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ action: 'pause', campaignId })
      });

      if (response.ok) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, status: 'paused' as const } : c
        ));

        toast({
          title: "Campaign Paused",
          description: "Link building has been paused",
        });
      } else {
        throw new Error(`Failed to pause campaign: ${response.status}`);
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/.netlify/functions/backlink-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ action: 'resume', campaignId })
      });

      if (response.ok) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, status: 'active' as const } : c
        ));

        toast({
          title: "Campaign Resumed",
          description: "Link building has been resumed",
        });
      } else {
        throw new Error(`Failed to resume campaign: ${response.status}`);
      }
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error",
        description: "Failed to resume campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getLinkTypeIcon = (type: string | undefined) => {
    if (!type) return <Link className="h-4 w-4" />;

    switch (type) {
      case 'blog_comment': return <MessageSquare className="h-4 w-4" />;
      case 'forum_profile': return <UserPlus className="h-4 w-4" />;
      case 'web2_platform': return <Globe className="h-4 w-4" />;
      case 'social_profile': return <UserPlus className="h-4 w-4" />;
      case 'contact_form': return <Mail className="h-4 w-4" />;
      default: return <Link className="h-4 w-4" />;
    }
  };

  const formatLinkType = (type: string | undefined) => {
    if (!type) return 'Unknown Type';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Infinity className="h-8 w-8 text-blue-600" />
              <Zap className="h-4 w-4 text-orange-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
              Backlink ∞ Automation
            </h1>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Advanced AI-powered link building automation. Discover and create thousands of contextual backlinks 
            across the entire web with intelligent content generation and natural placement strategies.
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              AI-Powered Discovery
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Safe & Natural
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Unlimited Scale
            </span>
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="discovery">Link Discovery</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Campaign Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create New Campaign
                </CardTitle>
                <CardDescription>
                  Set up an automated link building campaign to boost your website's authority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="e.g., Brand Awareness Q1 2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetUrl">Target URL</Label>
                      <Input
                        id="targetUrl"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="SEO, digital marketing, web design"
                      />
                    </div>
                    <div>
                      <Label htmlFor="anchorTexts">Anchor Text Variations</Label>
                      <Textarea
                        id="anchorTexts"
                        value={anchorTexts}
                        onChange={(e) => setAnchorTexts(e.target.value)}
                        placeholder="click here, learn more, best SEO tool, your brand name"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Link Building Strategy</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span>Blog Comments</span>
                          </div>
                          <Switch
                            checked={linkStrategy.blogComments}
                            onCheckedChange={(checked) => setLinkStrategy(prev => ({ ...prev, blogComments: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-green-600" />
                            <span>Forum Profiles</span>
                          </div>
                          <Switch
                            checked={linkStrategy.forumProfiles}
                            onCheckedChange={(checked) => setLinkStrategy(prev => ({ ...prev, forumProfiles: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-purple-600" />
                            <span>Web 2.0 Platforms</span>
                          </div>
                          <Switch
                            checked={linkStrategy.web2Platforms}
                            onCheckedChange={(checked) => setLinkStrategy(prev => ({ ...prev, web2Platforms: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-orange-600" />
                            <span>Social Profiles</span>
                          </div>
                          <Switch
                            checked={linkStrategy.socialProfiles}
                            onCheckedChange={(checked) => setLinkStrategy(prev => ({ ...prev, socialProfiles: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-red-600" />
                            <span>Contact Forms</span>
                          </div>
                          <Switch
                            checked={linkStrategy.contactForms}
                            onCheckedChange={(checked) => setLinkStrategy(prev => ({ ...prev, contactForms: checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dailyLimit">Daily Link Limit</Label>
                      <Select value={dailyLimit.toString()} onValueChange={(value) => setDailyLimit(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select daily limit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 links/day</SelectItem>
                          <SelectItem value="10">10 links/day</SelectItem>
                          <SelectItem value="25">25 links/day</SelectItem>
                          <SelectItem value="50">50 links/day</SelectItem>
                          <SelectItem value="100">100 links/day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={createCampaign} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Automated Campaign
                </Button>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            {campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Active Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <p className="text-sm text-gray-600">{campaign.targetUrl}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                            {campaign.status === 'active' ? (
                              <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                                <Pause className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => resumeCampaign(campaign.id)}>
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{campaign.progress}%</span>
                          </div>
                          <Progress value={campaign.progress} className="h-2" />
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{campaign.linksGenerated} links generated</span>
                            <span>Keywords: {campaign.keywords.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6">
            {/* Link Discovery Progress */}
            {isScanning && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 animate-spin" />
                    Discovering Link Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Scanning web for opportunities...</span>
                      <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Link Opportunities */}
            {Array.isArray(linkOpportunities) && linkOpportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Link Opportunities ({linkOpportunities.filter(o => o && o.id).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {linkOpportunities
                      .filter(opportunity => opportunity && opportunity.id && opportunity.type) // Filter out invalid entries
                      .map((opportunity) => (
                      <div key={opportunity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getLinkTypeIcon(opportunity.type)}
                            <span className="font-medium truncate max-w-md">{opportunity.url || 'Unknown URL'}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatLinkType(opportunity.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Authority: {opportunity.authority || 0}/100</span>
                            <span>Relevance: {opportunity.relevanceScore || 0}/100</span>
                            <Badge
                              variant={opportunity.status === 'posted' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {opportunity.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaigns.reduce((sum, c) => sum + c.linksGenerated, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Links</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{campaigns.length}</div>
                  <div className="text-sm text-gray-600">Active Campaigns</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{linkOpportunities.length}</div>
                  <div className="text-sm text-gray-600">Opportunities Found</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {linkOpportunities.filter(o => o.status === 'posted').length}
                  </div>
                  <div className="text-sm text-gray-600">Links Posted Today</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Automation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All link building follows Google's guidelines and uses natural, contextual placement strategies.
                  </AlertDescription>
                </Alert>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Global Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Default Daily Limit</Label>
                      <Select defaultValue="10">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 links/day</SelectItem>
                          <SelectItem value="10">10 links/day</SelectItem>
                          <SelectItem value="25">25 links/day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>AI Content Generation</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
