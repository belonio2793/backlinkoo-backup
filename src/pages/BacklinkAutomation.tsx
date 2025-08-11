import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Globe,
  Users,
  Share2,
  BarChart3,
  Settings,
  Play,
  Pause,
  Activity,
  Zap,
  Target,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { CampaignForm } from '@/components/automation/CampaignForm';
import { AutomationHeader } from '@/components/automation/AutomationHeader';
import { AutomationFooter } from '@/components/automation/AutomationFooter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDatabaseCampaignManager } from '@/hooks/useDatabaseCampaignManager';
import { useLinkTracker } from '@/hooks/useLinkTracker';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Individual Engine Components
const BlogCommentsEngine = ({ 
  campaigns, 
  onCreateCampaign, 
  onToggleCampaign, 
  onDeleteCampaign,
  canCreateLinks
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Blog Comments Engine
          {!canCreateLinks && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limit Reached
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Automated blog comment posting system for building high-quality contextual backlinks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-muted-foreground">Blogs Discovered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-muted-foreground">Comments Posted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0%</div>
            <div className="text-sm text-muted-foreground">Approval Rate</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This engine finds relevant blogs accepting comments and posts contextual, valuable comments 
          with your backlinks integrated naturally.
        </p>
        {!canCreateLinks && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Link building limit reached. Upgrade to Premium for unlimited backlinks.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <CampaignForm
      engineName="Blog Comments"
      engineIcon={<MessageSquare className="h-4 w-4" />}
      onCreateCampaign={onCreateCampaign}
      activeCampaigns={campaigns}
      onToggleCampaign={onToggleCampaign}
      onDeleteCampaign={onDeleteCampaign}
    />
  </div>
);

const Web2PlatformsEngine = ({ 
  campaigns, 
  onCreateCampaign, 
  onToggleCampaign, 
  onDeleteCampaign,
  canCreateLinks
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web 2.0 Platforms Engine
          {!canCreateLinks && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limit Reached
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Create and manage high-authority content on Web 2.0 platforms for powerful backlinks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-muted-foreground">Platforms Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-muted-foreground">Articles Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-muted-foreground">Total Backlinks</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Leverages high-authority Web 2.0 platforms like WordPress.com, Blogger, Medium, and others 
          to create content with embedded backlinks.
        </p>
        {!canCreateLinks && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Link building limit reached. Upgrade to Premium for unlimited backlinks.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <CampaignForm
      engineName="Web 2.0 Platforms"
      engineIcon={<Globe className="h-4 w-4" />}
      onCreateCampaign={onCreateCampaign}
      activeCampaigns={campaigns}
      onToggleCampaign={onToggleCampaign}
      onDeleteCampaign={onDeleteCampaign}
    />
  </div>
);

const ForumProfilesEngine = ({ 
  campaigns, 
  onCreateCampaign, 
  onToggleCampaign, 
  onDeleteCampaign,
  canCreateLinks
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Forum Profiles Engine
          {!canCreateLinks && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limit Reached
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Build authority through strategic forum profile creation and intelligent engagement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-muted-foreground">Forums Joined</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-muted-foreground">Profile Links</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-muted-foreground">Posts Made</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Creates profiles on relevant forums and community sites, building authority through 
          valuable contributions while naturally incorporating backlinks.
        </p>
        {!canCreateLinks && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Link building limit reached. Upgrade to Premium for unlimited backlinks.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <CampaignForm
      engineName="Forum Profiles"
      engineIcon={<Users className="h-4 w-4" />}
      onCreateCampaign={onCreateCampaign}
      activeCampaigns={campaigns}
      onToggleCampaign={onToggleCampaign}
      onDeleteCampaign={onDeleteCampaign}
    />
  </div>
);

const SocialMediaEngine = ({ 
  campaigns, 
  onCreateCampaign, 
  onToggleCampaign, 
  onDeleteCampaign,
  canCreateLinks
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Media Engine
          {!canCreateLinks && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limit Reached
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Leverage social media platforms for brand awareness and strategic backlink opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-muted-foreground">Platforms Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-muted-foreground">Posts Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-muted-foreground">Engagement Rate</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Automates social media posting across multiple platforms with strategic content that 
          drives traffic and builds social signals for SEO.
        </p>
        {!canCreateLinks && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Link building limit reached. Upgrade to Premium for unlimited backlinks.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <CampaignForm
      engineName="Social Media"
      engineIcon={<Share2 className="h-4 w-4" />}
      onCreateCampaign={onCreateCampaign}
      activeCampaigns={campaigns}
      onToggleCampaign={onToggleCampaign}
      onDeleteCampaign={onDeleteCampaign}
    />
  </div>
);

import { ReportingDashboard } from '@/components/automation/ReportingDashboard';

const SystemSettings = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Global System Settings
        </CardTitle>
        <CardDescription>
          Configure automation engines and global campaign settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>System Settings - Coming Soon</p>
          <p className="text-sm mt-2">Global configuration, API settings, and engine management</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function BacklinkAutomation() {
  const [activeTab, setActiveTab] = useState('blog-comments');
  const { isPremium } = useAuth();
  const {
    campaigns,
    createCampaign,
    toggleCampaign,
    deleteCampaign,
    getActiveCampaignCount,
    simulateLinkBuilding,
    dashboardData
  } = useDatabaseCampaignManager();

  const {
    totalLinksBuilt,
    canCreateLinks,
    addLinks,
    canCreateMoreLinks,
    isNearLimit,
    hasReachedLimit
  } = useLinkTracker();

  const activeCampaignCount = getActiveCampaignCount();

  const handleCreateCampaign = async (campaignData: any) => {
    // Check if user can create campaigns (based on link limits)
    if (!canCreateMoreLinks(1)) {
      toast.error('Cannot Create Campaign', {
        description: 'You\'ve reached your link building limit. Upgrade to Premium for unlimited campaigns.'
      });
      return;
    }

    const newCampaign = await createCampaign({
      name: campaignData.name,
      engine_type: campaignData.engine.toLowerCase().replace(' ', '_'),
      target_url: campaignData.targetUrl,
      keywords: campaignData.keywords,
      anchor_texts: campaignData.anchorTexts,
      status: campaignData.autoStart ? 'active' : 'draft',
      daily_limit: campaignData.dailyLimit,
      auto_start: campaignData.autoStart
    });

    if (newCampaign && campaignData.autoStart) {
      // Simulate initial link creation for active campaigns
      setTimeout(() => {
        if (canCreateMoreLinks(1)) {
          simulateLinkBuilding(newCampaign.id, 1);
          addLinks(1);
        }
      }, 2000);
    }
  };

  const handleUpgrade = () => {
    toast.info('Upgrade Feature', {
      description: 'Premium upgrade functionality coming soon!'
    });
  };

  const handleViewReports = () => {
    setActiveTab('reporting');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Site Navigation Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <AutomationHeader
        totalLinksBuilt={totalLinksBuilt}
        activeCampaigns={activeCampaignCount}
        onUpgrade={handleUpgrade}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="blog-comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Blog Comments
          </TabsTrigger>
          <TabsTrigger value="web2-platforms" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Web 2.0
          </TabsTrigger>
          <TabsTrigger value="forum-profiles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Forum Profiles
          </TabsTrigger>
          <TabsTrigger value="social-media" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="reporting" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reporting
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="blog-comments">
            <BlogCommentsEngine
              campaigns={campaigns.filter(c => c.engine === 'Blog Comments')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
              canCreateLinks={canCreateLinks}
            />
          </TabsContent>

          <TabsContent value="web2-platforms">
            <Web2PlatformsEngine
              campaigns={campaigns.filter(c => c.engine === 'Web 2.0 Platforms')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
              canCreateLinks={canCreateLinks}
            />
          </TabsContent>

          <TabsContent value="forum-profiles">
            <ForumProfilesEngine
              campaigns={campaigns.filter(c => c.engine === 'Forum Profiles')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
              canCreateLinks={canCreateLinks}
            />
          </TabsContent>

          <TabsContent value="social-media">
            <SocialMediaEngine
              campaigns={campaigns.filter(c => c.engine === 'Social Media')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
              canCreateLinks={canCreateLinks}
            />
          </TabsContent>

          <TabsContent value="reporting">
            <ReportingDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <AutomationFooter
        totalLinksBuilt={totalLinksBuilt}
        activeCampaigns={activeCampaignCount}
        onViewReports={handleViewReports}
        onUpgrade={handleUpgrade}
      />
      </div>

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
