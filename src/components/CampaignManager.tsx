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
  Trash2,
  Sparkles,
  TrendingDown
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
    label: 'Paused',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: Pause
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
      <div className="flex items-center justify-center p-16">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">Loading Campaigns</p>
            <p className="text-muted-foreground">Fetching your campaign data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Manager</h1>
          <p className="text-muted-foreground">Manage and track your backlink campaigns</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Campaigns', value: stats.total, icon: BarChart3, color: 'text-blue-600' },
          { title: 'Active Campaigns', value: stats.inProgress, icon: Activity, color: 'text-green-600' },
          { title: 'Links Delivered', value: stats.totalLinks, icon: LinkIcon, color: 'text-purple-600' },
          { title: 'Credits Used', value: stats.totalCredits, icon: Zap, color: 'text-orange-600' }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search Campaigns</Label>
              <Input
                placeholder="Search by name, URL, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Badge variant="outline" className="text-sm">
                {filteredCampaigns.length} campaigns found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your filters to find campaigns'
                : 'Create your first campaign to start building backlinks'
              }
            </p>
            {!searchQuery && selectedStatus === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => {
            const config = statusConfig[campaign.status];
            const progress = getProgressPercentage(campaign.links_delivered, campaign.links_requested);
            const StatusIcon = config.icon;
            
            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${config.textColor}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.keywords.length} keywords
                        </Badge>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="truncate">{campaign.target_url}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{campaign.links_delivered}/{campaign.links_requested} links</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {progress}% complete
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="font-semibold text-primary">{campaign.credits_used || 0}</div>
                      <div className="text-xs text-muted-foreground">Credits</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{campaign.links_delivered}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">
                        {Math.ceil((new Date().getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                      </div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
              <p className="text-muted-foreground">Set up a new backlink campaign</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="Enter campaign name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-url">Target URL</Label>
                <Input
                  id="target-url"
                  placeholder="https://your-website.com"
                  value={newCampaign.target_url}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, target_url: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma separated)</Label>
                <Textarea
                  id="keywords"
                  placeholder="keyword1, keyword2, keyword3"
                  value={newCampaign.keywords}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, keywords: e.target.value }))}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="links-requested">Number of Links</Label>
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
              
              <div className="flex items-center gap-4 pt-4">
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
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
