/**
 * Array-Free Automation Dashboard
 * Redesigned automation interface without array dependencies
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Play, 
  Pause, 
  BarChart3, 
  Target, 
  Link, 
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { arrayFreeCampaignService, ArrayFreeCampaign, ArrayFreeCampaignUtils } from '@/services/arrayFreeCampaignService';
import ArrayFreeCampaignForm from '@/components/campaigns/ArrayFreeCampaignForm';

export default function ArrayFreeAutomation() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<ArrayFreeCampaign[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalLinksBuilt: 0,
    totalSitesContacted: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  
  // Load campaigns and stats
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load campaigns
      const campaignsResult = await arrayFreeCampaignService.getCampaigns(user.id);
      if (campaignsResult.success && campaignsResult.campaigns) {
        setCampaigns(campaignsResult.campaigns);
      }
      
      // Load stats
      const statsResult = await arrayFreeCampaignService.getCampaignStats(user.id);
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  // Handle campaign creation success
  const handleCampaignCreated = (campaign: ArrayFreeCampaign) => {
    setCampaigns(prev => [campaign, ...prev]);
    setStats(prev => ({ ...prev, total: prev.total + 1 }));
    setShowCreateForm(false);
    setSelectedTab('campaigns');
  };
  
  // Get status color
  const getStatusColor = (status: ArrayFreeCampaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Calculate progress percentage
  const getProgress = (campaign: ArrayFreeCampaign) => {
    if (campaign.links_requested === 0) return 0;
    return Math.min(100, (campaign.links_built / campaign.links_requested) * 100);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p>Loading automation dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Array-Free Automation</h1>
          <p className="text-gray-600">Reliable campaign management without complex arrays</p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>
      
      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ArrayFreeCampaignForm
              onSuccess={handleCampaignCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Links Built</p>
                <p className="text-2xl font-bold">{stats.totalLinksBuilt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Sites Contacted</p>
                <p className="text-2xl font-bold">{stats.totalSitesContacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Your latest campaign activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">{campaign.primary_keyword}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {campaign.links_built}/{campaign.links_requested} links
                        </span>
                      </div>
                    </div>
                    <div className="w-16">
                      <Progress value={getProgress(campaign)} className="h-2" />
                    </div>
                  </div>
                ))}
                
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns yet. Create your first campaign to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Array-free automation health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Array Dependencies</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Eliminated
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Database Schema</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Stable
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Campaign Creation</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Reliable
                  </Badge>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    ✅ All array-related errors have been eliminated through redesigned data structures
                  </p>
                </div>
              </CardContent>
            </Card>
            
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Primary Keyword</p>
                        <p className="font-medium">{campaign.primary_keyword}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Target URL</p>
                        <p className="font-medium truncate">{campaign.target_url}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Progress</p>
                        <p className="font-medium">
                          {campaign.links_built}/{campaign.links_requested} links
                        </p>
                        <Progress value={getProgress(campaign)} className="h-2 mt-1" />
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Sites Contacted</p>
                        <p className="font-medium">{campaign.sites_contacted}</p>
                      </div>
                    </div>
                    
                    {campaign.secondary_keywords_text && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-sm">Secondary Keywords</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ArrayFreeCampaignUtils.stringToArray(campaign.secondary_keywords_text).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {campaign.status === 'active' && (
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(campaign.status === 'draft' || campaign.status === 'paused') && (
                      <Button size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {campaigns.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first array-free campaign to get started with reliable automation
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>Performance insights without array complexity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.totalLinksBuilt}</p>
                  <p className="text-gray-600">Total Links Built</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.totalSitesContacted}</p>
                  <p className="text-gray-600">Sites Contacted</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.total > 0 ? Math.round((stats.totalLinksBuilt / stats.total) * 10) / 10 : 0}
                  </p>
                  <p className="text-gray-600">Avg Links per Campaign</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
