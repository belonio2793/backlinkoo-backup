import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Infinity, Users, Shield, AlertTriangle, Play, Pause, Trash2, 
  Search, Filter, BarChart3, Activity, Globe, UserCheck,
  TrendingUp, Clock, Target, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminCampaign {
  id: string;
  user_id: string;
  user_email?: string;
  name: string;
  target_url: string;
  keywords: string[];
  status: 'active' | 'paused' | 'stopped' | 'completed';
  progress: number;
  links_generated: number;
  daily_limit: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  strategy_blog_comments: boolean;
  strategy_forum_profiles: boolean;
  strategy_web2_platforms: boolean;
  strategy_social_profiles: boolean;
  strategy_contact_forms: boolean;
}

interface AdminStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalUsers: number;
  totalLinksGenerated: number;
  campaignsToday: number;
  averageSuccessRate: number;
}

export default function AdminCampaignManager() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<AdminCampaign[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalUsers: 0,
    totalLinksGenerated: 0,
    campaignsToday: 0,
    averageSuccessRate: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, statusFilter]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/.netlify/functions/admin-campaign-manager', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setStats(data.stats || stats);
      } else {
        throw new Error(`Failed to load admin data: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load campaign data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    setFilteredCampaigns(filtered);
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/.netlify/functions/admin-campaign-manager', {
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
          description: "Campaign has been paused successfully",
        });
      } else {
        throw new Error(`Failed to pause campaign: ${response.status}`);
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/.netlify/functions/admin-campaign-manager', {
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
          description: "Campaign has been resumed successfully",
        });
      } else {
        throw new Error(`Failed to resume campaign: ${response.status}`);
      }
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error",
        description: "Failed to resume campaign",
        variant: "destructive"
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/admin-campaign-manager', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ action: 'delete', campaignId })
      });

      if (response.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        toast({
          title: "Campaign Deleted",
          description: "Campaign has been permanently deleted",
        });
      } else {
        throw new Error(`Failed to delete campaign: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="h-8 w-8 text-blue-600" />
              <Infinity className="h-4 w-4 text-orange-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Campaign Administration
              </h1>
              <p className="text-gray-600">Full oversight and management of all user campaigns</p>
            </div>
          </div>
          <Button onClick={loadAdminData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCampaigns}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalLinksGenerated}</div>
              <div className="text-sm text-gray-600">Links Generated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.campaignsToday}</div>
              <div className="text-sm text-gray-600">Created Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.averageSuccessRate}%</div>
              <div className="text-sm text-gray-600">Avg Success Rate</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search campaigns, URLs, users, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="stopped">Stopped</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns List */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Overview ({filteredCampaigns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                            {campaign.progress > 0 && (
                              <Badge variant="outline">{campaign.progress}% complete</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Target URL:</p>
                              <a href={campaign.target_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline flex items-center gap-1">
                                {campaign.target_url}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            
                            <div>
                              <p className="text-gray-600">User:</p>
                              <p className="font-medium">{campaign.user_email || campaign.user_id}</p>
                            </div>
                            
                            <div>
                              <p className="text-gray-600">Keywords:</p>
                              <p className="font-medium">{campaign.keywords.join(', ')}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-600">Links Generated:</p>
                              <p className="font-bold text-green-600">{campaign.links_generated}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Daily Limit:</p>
                              <p className="font-medium">{campaign.daily_limit}/day</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Created:</p>
                              <p className="font-medium">{formatDate(campaign.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Last Active:</p>
                              <p className="font-medium">{formatDate(campaign.last_active_at)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-gray-500">Active Strategies:</span>
                            {campaign.strategy_blog_comments && <Badge variant="outline" className="text-xs">Blog Comments</Badge>}
                            {campaign.strategy_forum_profiles && <Badge variant="outline" className="text-xs">Forum Profiles</Badge>}
                            {campaign.strategy_web2_platforms && <Badge variant="outline" className="text-xs">Web 2.0</Badge>}
                            {campaign.strategy_social_profiles && <Badge variant="outline" className="text-xs">Social Profiles</Badge>}
                            {campaign.strategy_contact_forms && <Badge variant="outline" className="text-xs">Contact Forms</Badge>}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {campaign.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => pauseCampaign(campaign.id)}
                              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => resumeCampaign(campaign.id)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteCampaign(campaign.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredCampaigns.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No campaigns found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Alert>
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                Campaign analytics and detailed reporting will be available in this section.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                User management and account oversight features will be available here.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
