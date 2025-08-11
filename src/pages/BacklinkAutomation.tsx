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
