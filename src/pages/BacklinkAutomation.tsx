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
  Target
} from 'lucide-react';
import { CampaignForm } from '@/components/automation/CampaignForm';
import { useCampaignManager } from '@/hooks/useCampaignManager';
import { toast } from 'sonner';

// Individual Engine Components
const BlogCommentsEngine = ({ 
  campaigns, 
  onCreateCampaign, 
  onToggleCampaign, 
  onDeleteCampaign 
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Blog Comments Engine
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
  onDeleteCampaign 
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web 2.0 Platforms Engine
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
  onDeleteCampaign 
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Forum Profiles Engine
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
  onDeleteCampaign 
}: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Media Engine
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

const ReportingDashboard = ({ campaigns, totalLinks }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Campaign Analytics & Reporting
        </CardTitle>
        <CardDescription>
          Comprehensive analytics and postback URL management for all your campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
            <div className="text-sm text-muted-foreground">Total Campaigns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalLinks}</div>
            <div className="text-sm text-muted-foreground">Links Built</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">85%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-muted-foreground">Postback URLs</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Postback URL Management</CardTitle>
        <CardDescription>
          Configure URLs to receive real-time notifications when backlinks are created
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Postback URL Management - Coming Soon</p>
          <p className="text-sm mt-2">Real-time webhook notifications for successful backlink creation</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

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
  const {
    campaigns,
    createCampaign,
    toggleCampaign,
    deleteCampaign,
    getTotalLinksBuilt,
    getActiveCampaignCount
  } = useCampaignManager();

  const totalLinks = getTotalLinksBuilt();
  const activeCampaignCount = getActiveCampaignCount();

  const handleCreateCampaign = (campaignData: any) => {
    const newCampaign = createCampaign({
      ...campaignData,
      engine: campaignData.engine
    });

    if (campaignData.status === 'active') {
      toast.success('Campaign Started!', {
        description: `${newCampaign.name} is now actively building backlinks`
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Backlink Automation System</h1>
        <p className="text-muted-foreground">
          Advanced multi-engine automation platform for intelligent backlink building across the web
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            System Online
          </Badge>
          <Badge variant={activeCampaignCount > 0 ? "default" : "secondary"} className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {activeCampaignCount} Active Campaign{activeCampaignCount !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {totalLinks} Total Links
          </Badge>
        </div>
      </div>

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
            />
          </TabsContent>

          <TabsContent value="web2-platforms">
            <Web2PlatformsEngine
              campaigns={campaigns.filter(c => c.engine === 'Web 2.0 Platforms')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
            />
          </TabsContent>

          <TabsContent value="forum-profiles">
            <ForumProfilesEngine
              campaigns={campaigns.filter(c => c.engine === 'Forum Profiles')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
            />
          </TabsContent>

          <TabsContent value="social-media">
            <SocialMediaEngine
              campaigns={campaigns.filter(c => c.engine === 'Social Media')}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaign={toggleCampaign}
              onDeleteCampaign={deleteCampaign}
            />
          </TabsContent>

          <TabsContent value="reporting">
            <ReportingDashboard
              campaigns={campaigns}
              totalLinks={totalLinks}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
