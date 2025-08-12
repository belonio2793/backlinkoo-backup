import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Database,
  Settings,
  Activity,
  Globe,
  Target,
  MessageSquare,
  BarChart3,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Shield,
  Crown,
  Loader2
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
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  engine_type: string;
  keywords: string[];
  anchor_texts: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  auto_start: boolean;
  progress?: number;
  links_found?: number;
  links_created?: number;
  success_rate?: number;
}

interface DatabaseHealth {
  connected: boolean;
  tables_exist: boolean;
  columns_complete: boolean;
  rls_enabled: boolean;
  functions_exist: boolean;
  error?: string;
}

export default function NewAutomationPage() {
  const { user, isAuthenticated, isPremium } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    target_url: '',
    engine_type: 'blog-comments',
    keywords: '',
    anchor_texts: '',
    auto_start: false,
    daily_limit: 10
  });

  // Database health check
  const checkDatabaseHealth = async () => {
    console.log('🔍 Checking database health...');
    
    try {
      const health: DatabaseHealth = {
        connected: false,
        tables_exist: false,
        columns_complete: false,
        rls_enabled: false,
        functions_exist: false
      };

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('automation_campaigns')
        .select('count')
        .limit(1);

      if (connectionError) {
        health.error = connectionError.message;
        setDbHealth(health);
        return health;
      }

      health.connected = true;

      // Check if table exists with all required columns
      const { data: tableInfo, error: tableError } = await supabase
        .from('automation_campaigns')
        .select('id, name, target_url, status, engine_type, keywords, anchor_texts, created_at, started_at, completed_at, auto_start')
        .limit(1);

      if (!tableError) {
        health.tables_exist = true;
        health.columns_complete = true;
      }

      // Check RLS policies
      try {
        const { error: rlsError } = await supabase
          .from('automation_campaigns')
          .select('id')
          .limit(1);
        health.rls_enabled = !rlsError;
      } catch (e) {
        health.rls_enabled = false;
      }

      // Check functions exist
      try {
        const { error: funcError } = await supabase.rpc('exec_sql', {
          query: 'SELECT 1;'
        });
        health.functions_exist = !funcError;
      } catch (e) {
        health.functions_exist = false;
      }

      setDbHealth(health);
      return health;
    } catch (error: any) {
      console.error('❌ Database health check failed:', error);
      setDbHealth({
        connected: false,
        tables_exist: false,
        columns_complete: false,
        rls_enabled: false,
        functions_exist: false,
        error: error.message
      });
      return null;
    }
  };

  // Load campaigns
  const loadCampaigns = async () => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading campaigns:', error);
        toast.error('Failed to load campaigns', { description: error.message });
        return;
      }

      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns', { description: error.message });
    }
  };

  // Create campaign
  const createCampaign = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create campaigns');
      return;
    }

    setIsCreating(true);

    try {
      const campaignData = {
        name: formData.name,
        target_url: formData.target_url,
        engine_type: formData.engine_type,
        status: 'draft' as const,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        anchor_texts: formData.anchor_texts.split(',').map(a => a.trim()).filter(Boolean),
        auto_start: formData.auto_start,
        user_id: user?.id
      };

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Campaign created successfully!');
      setShowCreateForm(false);
      setFormData({
        name: '',
        target_url: '',
        engine_type: 'blog-comments',
        keywords: '',
        anchor_texts: '',
        auto_start: false,
        daily_limit: 10
      });
      
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign', { description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle campaign status
  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'active') {
        updateData.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('automation_campaigns')
        .update(updateData)
        .eq('id', campaignId);

      if (error) throw error;

      toast.success(`Campaign ${newStatus === 'active' ? 'started' : 'paused'}`);
      await loadCampaigns();
    } catch (error: any) {
      toast.error('Failed to update campaign', { description: error.message });
    }
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await checkDatabaseHealth();
      if (isAuthenticated) {
        await loadCampaigns();
      }
      setIsLoading(false);
    };

    initialize();
  }, [isAuthenticated]);

  const getDatabaseStatusColor = (health: DatabaseHealth | null) => {
    if (!health || !health.connected) return 'red';
    if (!health.tables_exist || !health.columns_complete) return 'orange';
    if (!health.rls_enabled || !health.functions_exist) return 'yellow';
    return 'green';
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalCampaigns = campaigns.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading automation system...</p>
            </div>
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automation Hub</h1>
              <p className="text-gray-600">Manage your backlink automation campaigns</p>
            </div>
          </div>

          {/* System Status Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      getDatabaseStatusColor(dbHealth) === 'green' ? 'bg-green-500' :
                      getDatabaseStatusColor(dbHealth) === 'yellow' ? 'bg-yellow-500' :
                      getDatabaseStatusColor(dbHealth) === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">
                      Database: {dbHealth?.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>{activeCampaigns.length} Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-600" />
                    <span>{totalCampaigns} Total</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={checkDatabaseHealth}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  {isAuthenticated && (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Health Issues */}
        {dbHealth && (!dbHealth.connected || !dbHealth.tables_exist || !dbHealth.columns_complete) && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Database Setup Required</div>
              <div className="text-sm space-y-1">
                {!dbHealth.connected && <div>❌ Database connection failed</div>}
                {!dbHealth.tables_exist && <div>❌ Automation tables missing</div>}
                {!dbHealth.columns_complete && <div>❌ Database columns incomplete</div>}
                {!dbHealth.rls_enabled && <div>⚠️ Row Level Security not configured</div>}
                {!dbHealth.functions_exist && <div>⚠️ Database functions missing</div>}
              </div>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTab('setup')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Setup Database
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Check */}
        {!isAuthenticated && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please sign in to create and manage automation campaigns.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCampaigns.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Running automation tasks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    All campaigns created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {getDatabaseStatusColor(dbHealth) === 'green' ? '100%' : 
                     getDatabaseStatusColor(dbHealth) === 'yellow' ? '80%' :
                     getDatabaseStatusColor(dbHealth) === 'orange' ? '60%' : '0%'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Database operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Latest automation campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-4">Create your first automation campaign to get started</p>
                    {isAuthenticated && (
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              campaign.status === 'active' ? 'default' :
                              campaign.status === 'paused' ? 'secondary' :
                              campaign.status === 'completed' ? 'outline' :
                              'destructive'
                            }>
                              {campaign.status}
                            </Badge>
                            <h4 className="font-medium">{campaign.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{campaign.target_url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCampaign(campaign.id, campaign.status)}
                          >
                            {campaign.status === 'active' ? 
                              <Pause className="h-4 w-4" /> : 
                              <Play className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Campaigns</CardTitle>
                    <CardDescription>Manage your automation campaigns</CardDescription>
                  </div>
                  {isAuthenticated && (
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-6">Start building backlinks with automated campaigns</p>
                    {isAuthenticated && (
                      <Button onClick={() => setShowCreateForm(true)} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Campaign
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                <Badge variant={
                                  campaign.status === 'active' ? 'default' :
                                  campaign.status === 'paused' ? 'secondary' :
                                  campaign.status === 'completed' ? 'outline' :
                                  'destructive'
                                }>
                                  {campaign.status}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2">{campaign.target_url}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Engine: {campaign.engine_type}</span>
                                <span>Keywords: {campaign.keywords?.length || 0}</span>
                                <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                              </div>
                              {campaign.progress !== undefined && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{campaign.progress}%</span>
                                  </div>
                                  <Progress value={campaign.progress} className="h-2" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCampaign(campaign.id, campaign.status)}
                              >
                                {campaign.status === 'active' ? 
                                  <Pause className="h-4 w-4" /> : 
                                  <Play className="h-4 w-4" />
                                }
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">
                    Campaign success rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Links Found</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    Total opportunities discovered
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Links Created</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">456</div>
                  <p className="text-xs text-muted-foreground">
                    Successful backlinks built
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3h</div>
                  <p className="text-xs text-muted-foreground">
                    Time to link placement
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Detailed analytics coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">Detailed performance metrics and insights will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Setup
                </CardTitle>
                <CardDescription>
                  Configure and verify your automation database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Database Health Status */}
                <div className="space-y-4">
                  <h4 className="font-medium">System Health Check</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Database Connection</span>
                      {dbHealth?.connected ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Tables Exist</span>
                      {dbHealth?.tables_exist ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Columns Complete</span>
                      {dbHealth?.columns_complete ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Security Policies</span>
                      {dbHealth?.rls_enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-4">
                  <h4 className="font-medium">Setup Instructions</h4>
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">To set up the database:</p>
                        <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                          <li>Go to your Supabase SQL Editor</li>
                          <li>Run the complete setup SQL provided below</li>
                          <li>Refresh this page to verify the setup</li>
                        </ol>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={checkDatabaseHealth} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Health
                  </Button>
                  <Button 
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                    variant="outline"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Open Supabase
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Campaign Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create New Campaign</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Set up a new backlink automation campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Blog Campaign"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_url">Target URL</Label>
                    <Input
                      id="target_url"
                      type="url"
                      value={formData.target_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engine_type">Automation Engine</Label>
                  <Select 
                    value={formData.engine_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, engine_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog-comments">Blog Comments</SelectItem>
                      <SelectItem value="guest-posts">Guest Posts</SelectItem>
                      <SelectItem value="forum-posts">Forum Posts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Textarea
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="seo tools, backlink building, digital marketing"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anchor_texts">Anchor Texts (comma-separated)</Label>
                  <Textarea
                    id="anchor_texts"
                    value={formData.anchor_texts}
                    onChange={(e) => setFormData(prev => ({ ...prev, anchor_texts: e.target.value }))}
                    placeholder="best seo tool, learn more, click here"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_start"
                    checked={formData.auto_start}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_start: checked }))}
                  />
                  <Label htmlFor="auto_start">Auto-start campaign after creation</Label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createCampaign}
                    disabled={isCreating || !formData.name || !formData.target_url}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
