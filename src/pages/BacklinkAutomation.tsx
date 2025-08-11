import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Globe,
  Users,
  Share2,
  BarChart3,
  Play,
  Pause,
  Target,
  Crown,
  AlertTriangle,
  Plus,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDatabaseCampaignManager } from '@/hooks/useDatabaseCampaignManager';
import { useLinkTracker } from '@/hooks/useLinkTracker';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DatabaseHealthCheck } from '@/utils/databaseHealthCheck';
import { AutomationTablesMissingNotice } from '@/components/AutomationTablesMissingNotice';
import { initializeAutomationTables } from '@/utils/createAutomationTables';
import { RoutePreservingAuth } from '@/components/RoutePreservingAuth';

const engines = [
  {
    id: 'blog-comments',
    name: 'Blog Comments',
    icon: MessageSquare,
    description: 'Post contextual comments on relevant blogs',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    id: 'web2-platforms',
    name: 'Web 2.0 Sites',
    icon: Globe,
    description: 'Create content on high-authority platforms',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    id: 'forum-profiles',
    name: 'Forum Profiles',
    icon: Users,
    description: 'Build authority through forum engagement',
    color: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  {
    id: 'social-media',
    name: 'Social Media',
    icon: Share2,
    description: 'Leverage social platforms for brand awareness',
    color: 'bg-pink-100 text-pink-700 border-pink-200'
  }
];

export default function BacklinkAutomation() {
  const [selectedEngine, setSelectedEngine] = useState('blog-comments');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [automationTablesExist, setAutomationTablesExist] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    targetUrl: '',
    keywords: '',
    anchorTexts: '',
    dailyLimit: 10,
    autoStart: false
  });

  const { isPremium, user, isAuthenticated } = useAuth();
  const {
    campaigns,
    createCampaign,
    toggleCampaign,
    deleteCampaign,
    getActiveCampaignCount
  } = useDatabaseCampaignManager();

  const {
    totalLinksBuilt,
    canCreateLinks,
    addLinks,
    canCreateMoreLinks,
    hasReachedLimit
  } = useLinkTracker();

  const activeCampaignCount = getActiveCampaignCount();
  const selectedEngineData = engines.find(e => e.id === selectedEngine);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateMoreLinks(1)) {
      toast.error('Cannot Create Campaign', {
        description: 'You\'ve reached your link building limit. Upgrade to Premium for unlimited campaigns.'
      });
      return;
    }

    const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
    const anchorTextsArray = formData.anchorTexts.split(',').map(a => a.trim()).filter(a => a);

    if (!formData.name || !formData.targetUrl || keywordsArray.length === 0 || anchorTextsArray.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newCampaign = await createCampaign({
      name: formData.name,
      engine_type: selectedEngine.replace('-', '_'),
      target_url: formData.targetUrl.includes('://') ? formData.targetUrl : `https://${formData.targetUrl}`,
      keywords: keywordsArray,
      anchor_texts: anchorTextsArray,
      status: formData.autoStart ? 'active' : 'draft',
      daily_limit: formData.dailyLimit,
      auto_start: formData.autoStart
    });

    if (newCampaign) {
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

      if (formData.autoStart) {
        setTimeout(() => {
          if (canCreateMoreLinks(1)) {
            addLinks(1);
          }
        }, 2000);
      }
    }
  };

  const currentEngineCampaigns = campaigns.filter(c =>
    c.engine_type?.replace('_', '-') === selectedEngine ||
    (c.engine === selectedEngineData?.name)
  );

  const getUserPlan = () => {
    if (isPremium) return { plan: 'Premium', limit: Infinity };
    return { plan: 'Free', limit: 20 };
  };

  const { plan, limit } = getUserPlan();

  // Check automation tables status
  const checkAutomationTables = React.useCallback(async () => {
    const status = await initializeAutomationTables();
    setAutomationTablesExist(status.allTablesExist);
    return status.allTablesExist;
  }, []);

  // Run health check on mount for debugging
  React.useEffect(() => {
    DatabaseHealthCheck.logHealthCheck();
    checkAutomationTables();
  }, [checkAutomationTables]);

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
            Build high-quality backlinks automatically across multiple platforms.
            Choose your strategy and let our AI do the work.
          </p>

          {/* Authentication Section */}
          {!isPremium && (
            <div className="mb-8">
              <RoutePreservingAuth
                buttonVariant="default"
                buttonSize="lg"
                className="justify-center"
              />
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{activeCampaignCount}</div>
                  <div className="text-sm text-gray-600">Active Campaigns</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {limit === Infinity ? totalLinksBuilt : `${totalLinksBuilt}/${limit}`}
                  </div>
                  <div className="text-sm text-gray-600">Links Built</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {isPremium ? (
                      <Crown className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="text-lg font-semibold text-gray-900">{plan}</span>
                  </div>
                  <div className="text-sm text-gray-600">Current Plan</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Banner for Free Users */}
          {!isPremium && hasReachedLimit && (
            <Card className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
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

        {/* Show notice if automation tables are missing */}
        {!automationTablesExist && (
          <AutomationTablesMissingNotice
            onRetry={checkAutomationTables}
          />
        )}

        {/* Engine Selection */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Strategy</CardTitle>
            <CardDescription>
              Select the backlink building approach that best fits your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {engines.map((engine) => {
                const Icon = engine.icon;
                const isSelected = selectedEngine === engine.id;

                return (
                  <Card
                    key={engine.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-blue-500 shadow-md'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedEngine(engine.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${engine.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {engine.name}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {engine.description}
                        </p>
                        {isSelected && (
                          <Badge className="mt-3" variant="default">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Campaigns */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedEngineData && <selectedEngineData.icon className="h-5 w-5" />}
                      {selectedEngineData?.name} Campaigns
                    </CardTitle>
                    <CardDescription>
                      {currentEngineCampaigns.length} active campaigns
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    disabled={!canCreateLinks}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentEngineCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {currentEngineCampaigns.map((campaign) => (
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
                      {selectedEngineData && <selectedEngineData.icon className="h-8 w-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No campaigns yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first {selectedEngineData?.name.toLowerCase()} campaign to get started
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      disabled={!canCreateLinks}
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

          {/* Campaign Creation Form */}
          <div>
            {showCreateForm && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    New Campaign
                  </CardTitle>
                  <CardDescription>
                    Create a {selectedEngineData?.name.toLowerCase()} campaign
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
                        placeholder="best SEO tool, learn digital marketing, get backlinks"
                        value={formData.anchorTexts}
                        onChange={(e) => setFormData(prev => ({ ...prev, anchorTexts: e.target.value }))}
                        rows={3}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                    </div>

                    <div>
                      <Label htmlFor="limit">Daily Link Limit</Label>
                      <Select
                        value={formData.dailyLimit.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, dailyLimit: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 links/day</SelectItem>
                          <SelectItem value="10">10 links/day</SelectItem>
                          <SelectItem value="20">20 links/day</SelectItem>
                          <SelectItem value="50">50 links/day</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Create Campaign
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
