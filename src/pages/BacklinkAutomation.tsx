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
import { testAutomationTablesAccess, testDatabaseConnectivity } from '@/utils/simpleDatabaseTest';
import { RoutePreservingAuth } from '@/components/RoutePreservingAuth';
import { RuntimeReporting } from '@/components/automation/RuntimeReporting';
import { RuntimeStatus } from '@/components/automation/RuntimeStatus';
import { LiveAutomationEngine } from '@/services/liveAutomationEngine';
import { CampaignErrorHandler } from '@/utils/campaignErrorHandler';
import { CampaignCreationTest } from '@/components/testing/CampaignCreationTest';
import { DatabaseMigrationTest } from '@/components/testing/DatabaseMigrationTest';
import { DatabaseHealthChecker } from '@/components/system/DatabaseHealthChecker';
import { QuickDatabaseStatus } from '@/components/system/QuickDatabaseStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
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
    getActiveCampaignCount,
    loadCampaigns
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

  // Enhanced toggle campaign with live monitoring
  const handleToggleCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Use campaign error handler to prevent unhandled promise rejections
    const success = await CampaignErrorHandler.safeToggleCampaign(campaignId, async (id) => {
      await toggleCampaign(id);

      // Clear stable metrics cache to force refresh
      const { stableCampaignMetrics } = await import('@/services/stableCampaignMetrics');
      stableCampaignMetrics.clearCache();

      // If activating, start live monitoring
      if (campaign.status !== 'active') {
        console.log(`🚀 Starting live monitoring for campaign: ${campaign.name}`);
        await CampaignErrorHandler.safeStartLiveMonitoring(id, LiveAutomationEngine.startLiveMonitoring);

        toast.success('Campaign activated!', {
          description: `${campaign.name} is now running with live monitoring.`
        });
      } else {
        toast.success('Campaign paused!', {
          description: `${campaign.name} has been paused.`
        });
      }

      // Force a full page refresh to sync all data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    if (!success) {
      console.warn(`Campaign toggle failed for campaign: ${campaignId}`);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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

    // Import the enhanced campaign creation helper
    const { CampaignCreationHelper } = await import('@/utils/campaignCreationHelper');

    // Use enhanced campaign creation with unique identifier
    const result = await CampaignCreationHelper.createCampaignWithUniqueId(user.id, {
      name: formData.name,
      engine_type: selectedEngine.replace('-', '_'),
      target_url: formData.targetUrl,
      keywords: keywordsArray,
      anchor_texts: anchorTextsArray,
      status: formData.autoStart ? 'active' : 'draft',
      daily_limit: formData.dailyLimit,
      auto_start: formData.autoStart
    });

    if (result.success && result.data) {
      // Verify the campaign was saved correctly
      const verification = await CampaignCreationHelper.verifyCampaignSaved(result.campaignId!);

      if (verification.isValid) {
        toast.success('Campaign Created Successfully!', {
          description: `"${result.data.name}" is ready with ${result.data.keywords.length} keywords and ${result.data.anchor_texts.length} anchor texts.`
        });

        console.log('✅ Campaign successfully created and verified:', {
          id: result.data.id,
          name: result.data.name,
          target_url: result.data.target_url,
          keywords: result.data.keywords,
          anchor_texts: result.data.anchor_texts,
          unique_identifier: result.data.name
        });

        // Reset form
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

        // Refresh campaigns list to ensure sync
        loadCampaigns();
      } else {
        toast.error('Campaign Verification Failed', {
          description: `Campaign was created but has issues: ${verification.errors?.join(', ')}`
        });
      }
    } else {
      toast.error('Campaign Creation Failed', {
        description: result.error || 'Unknown error occurred'
      });
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
    try {
      // First test basic connectivity
      console.log('🔗 Testing database connectivity...');
      const connectivity = await testDatabaseConnectivity();
      console.log('Database connectivity:', JSON.stringify(connectivity, null, 2));

      // Then test automation tables
      console.log('🔧 Testing automation tables...');
      const tablesStatus = await testAutomationTablesAccess();
      console.log('Automation tables status:', JSON.stringify(tablesStatus, null, 2));

      const tablesExist = tablesStatus.allTablesAccessible;
      setAutomationTablesExist(tablesExist);

      if (!tablesExist) {
        console.warn('⚠️ Some automation tables are not accessible:', tablesStatus.errors);
      }

      return tablesExist;
    } catch (error: any) {
      console.error('❌ Error checking automation tables:', error.message);
      setAutomationTablesExist(false);
      return false;
    }
  }, []);

  // Handle authentication success
  const handleAuthSuccess = (user: any) => {
    setShowAuthModal(false);
    toast.success('Welcome! You can now create automation campaigns.');
  };

  // Run health check on mount for debugging
  React.useEffect(() => {
    // Run the improved automation tables check
    checkAutomationTables();

    // Optionally run full health check in development
    if (import.meta.env.DEV) {
      DatabaseHealthCheck.logHealthCheck();
    }
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
          {!isAuthenticated && (
            <div className="mb-8">
              <RoutePreservingAuth
                buttonVariant="default"
                buttonSize="lg"
                className="justify-center"
              />
              <p className="text-sm text-gray-500 mt-3">
                Sign in to create and manage your automation campaigns
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {isAuthenticated ? activeCampaignCount : '—'}
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
                      limit === Infinity ? totalLinksBuilt : `${totalLinksBuilt}/${limit}`
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
                        <span className="text-lg font-semibold text-gray-900">{plan}</span>
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

        {/* Runtime Status Widget - Always visible for authenticated users */}
        {isAuthenticated && (
          <RuntimeStatus
            campaignsCount={campaigns.length}
            activeCampaigns={activeCampaignCount}
            systemStatus={automationTablesExist ? 'online' : 'maintenance'}
            onRefresh={checkAutomationTables}
          />
        )}

        {/* Quick Database Status - Always visible for critical issues */}
        <div className="mb-6">
          <QuickDatabaseStatus />
        </div>

        {/* Show notice if automation tables are missing */}
        {!automationTablesExist && (
          <AutomationTablesMissingNotice
            onRetry={checkAutomationTables}
          />
        )}

        {/* Database Health & Migration Test Section - Only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-8 space-y-6">
            <DatabaseHealthChecker />
            <DatabaseMigrationTest />
          </div>
        )}

        {/* Campaign Creation Test Section - Only show for authenticated users */}
        {isAuthenticated && import.meta.env.DEV && (
          <div className="mb-8">
            <CampaignCreationTest />
          </div>
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

        {/* Runtime & Reporting Section */}
        {isAuthenticated && activeCampaignCount > 0 && (
          <ErrorBoundary
            title="Runtime Reporting Error"
            description="There was an issue loading the campaign reporting dashboard."
            onError={(error, errorInfo) => {
              console.error('RuntimeReporting error:', error, errorInfo);
            }}
          >
            <RuntimeReporting
              onToggleCampaign={handleToggleCampaign}
              onRefreshData={async () => {
                // Clear all caches and refresh data
                const { stableCampaignMetrics } = await import('@/services/stableCampaignMetrics');
                stableCampaignMetrics.clearCache();

                // Refresh campaigns data in the hook
                try {
                  // Force refresh the campaign manager hook data
                  window.dispatchEvent(new Event('campaign-data-refresh'));
                } catch (error) {
                  console.error('Error refreshing campaign data:', error);
                }

                // Check automation tables
                await checkAutomationTables();

                // Force a complete reload to ensure sync
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
            />
          </ErrorBoundary>
        )}

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
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthModal(true);
                        return;
                      }
                      setShowCreateForm(!showCreateForm);
                    }}
                    disabled={isAuthenticated && !canCreateLinks}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isAuthenticated ? 'New Campaign' : 'Sign In to Create Campaign'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {selectedEngineData && <selectedEngineData.icon className="h-8 w-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sign In Required
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create an account to view and manage your {selectedEngineData?.name.toLowerCase()} campaigns
                    </p>
                    <Button
                      onClick={() => setShowAuthModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Sign In to Get Started
                    </Button>
                  </div>
                ) : currentEngineCampaigns.length > 0 ? (
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
                                onClick={() => handleToggleCampaign(campaign.id)}
                              >
                                {campaign.status === 'active' ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Start Live
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
                      onClick={() => {
                        if (!isAuthenticated) {
                          setShowAuthModal(true);
                          return;
                        }
                        setShowCreateForm(true);
                      }}
                      disabled={isAuthenticated && !canCreateLinks}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isAuthenticated ? 'Create Campaign' : 'Sign In to Create Campaign'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Campaign Creation Form */}
          <div>
            {showCreateForm && isAuthenticated && (
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

      {/* Authentication Modal - only render invisible one when not showing modal */}
      {!showAuthModal && <RoutePreservingAuth showAuthButtons={false} />}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">
              You need to sign in to create and manage automation campaigns.
            </p>
            <div className="flex gap-3">
              <RoutePreservingAuth className="flex-1" />
              <Button
                variant="outline"
                onClick={() => setShowAuthModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
