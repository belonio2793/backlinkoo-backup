import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Rocket, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Target, 
  Link as LinkIcon, 
  Calendar,
  DollarSign,
  BarChart3,
  Zap,
  Trophy,
  Play,
  Pause,
  MoreHorizontal,
  Filter,
  Plus,
  ExternalLink,
  Globe,
  Users,
  Star,
  ArrowUpRight,
  Activity,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  target_url: string;
  keywords: string[];
  status: string;
  links_requested: number;
  links_delivered: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
  completed_backlinks?: string[];
  user_id: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: Clock
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Activity
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle
  },
  paused: {
    label: 'Paused',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-800',
    icon: Pause
  }
};

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    target_url: '',
    keywords: '',
    links_requested: 10
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.target_url || !newCampaign.keywords) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const keywordArray = newCampaign.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create campaigns',
          variant: 'destructive'
        });
        return;
      }
      
      const { error } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaign.name,
          target_url: newCampaign.target_url,
          keywords: keywordArray,
          links_requested: newCampaign.links_requested,
          status: 'pending',
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Campaign created successfully!'
      });

      setNewCampaign({ name: '', target_url: '', keywords: '', links_requested: 10 });
      setShowCreateForm(false);
      loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      });
    }
  };

  const getProgressPercentage = (delivered: number, requested: number) => {
    return requested > 0 ? Math.round((delivered / requested) * 100) : 0;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.target_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: campaigns.length,
    pending: campaigns.filter(c => c.status === 'pending').length,
    inProgress: campaigns.filter(c => c.status === 'in_progress').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalCredits: campaigns.reduce((sum, c) => sum + (c.credits_used || 0), 0),
    totalLinks: campaigns.reduce((sum, c) => sum + (c.links_delivered || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Campaign Management</h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Orchestrate your backlink campaigns with precision
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">{stats.completed} Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{stats.totalLinks} Links Delivered</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">{stats.totalCredits} Credits Used</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg" 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Campaigns', 
            value: stats.total, 
            icon: BarChart3, 
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
            change: '+12%'
          },
          { 
            title: 'Active Projects', 
            value: stats.inProgress, 
            icon: Activity, 
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
            change: '+5%'
          },
          { 
            title: 'Links Delivered', 
            value: stats.totalLinks, 
            icon: LinkIcon, 
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20',
            change: '+23%'
          },
          { 
            title: 'Credits Invested', 
            value: stats.totalCredits, 
            icon: Zap, 
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
            change: '+18%'
          }
        ].map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover-scale">
            <CardContent className="p-6">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filteredCampaigns.length} campaigns
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Rocket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Create your first campaign to start building high-quality backlinks'
              }
            </p>
            {!searchQuery && selectedStatus === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const config = statusConfig[campaign.status];
            const progress = getProgressPercentage(campaign.links_delivered, campaign.links_requested);
            const StatusIcon = config.icon;
            
            return (
              <Card key={campaign.id} className="group hover:shadow-xl transition-all duration-300 hover-scale overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {campaign.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`${config.bgColor} ${config.textColor} ${config.borderColor} border`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.keywords.length} keywords
                        </Badge>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{campaign.target_url}</span>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {campaign.links_delivered}/{campaign.links_requested} links
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress}% complete</span>
                      <span>{campaign.links_requested - campaign.links_delivered} remaining</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-primary">{campaign.credits_used || 0}</div>
                      <div className="text-xs text-muted-foreground">Credits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">{campaign.links_delivered}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: false })}
                      </div>
                      <div className="text-xs text-muted-foreground">Age</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="px-2">
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal/Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Campaign
              </CardTitle>
              <p className="text-muted-foreground">
                Launch a new backlink campaign to boost your search rankings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Q1 SEO Campaign"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="target-url">Target URL</Label>
                  <Input
                    id="target-url"
                    placeholder="https://example.com"
                    value={newCampaign.target_url}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, target_url: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Textarea
                    id="keywords"
                    placeholder="seo services, digital marketing, backlink building"
                    value={newCampaign.keywords}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, keywords: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="links-requested">Links Requested</Label>
                  <Select 
                    value={newCampaign.links_requested.toString()} 
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, links_requested: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Links</SelectItem>
                      <SelectItem value="10">10 Links</SelectItem>
                      <SelectItem value="15">15 Links</SelectItem>
                      <SelectItem value="20">20 Links</SelectItem>
                      <SelectItem value="25">25 Links</SelectItem>
                      <SelectItem value="50">50 Links</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createCampaign}
                  className="flex-1"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}