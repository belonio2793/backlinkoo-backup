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
    <div className="space-y-10 animate-fade-in">
      {/* Enhanced Hero Section with Gradient and Glass Effects */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-3xl border border-white/20 shadow-2xl">
          <div className="p-10">
            <div className="flex items-center justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                      <Rocket className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Campaign Control Center
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2 font-medium">
                      Orchestrate powerful backlink campaigns with AI-driven precision
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">{stats.completed} Campaigns Completed</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{stats.totalLinks} Links Delivered</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{stats.inProgress} Active Now</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Campaigns</div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12%</span>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => setShowCreateForm(true)}
                  className="h-14 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 rounded-2xl text-lg font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Launch Campaign
                  <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with Beautiful Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { 
            title: 'Total Campaigns', 
            value: stats.total, 
            icon: BarChart3, 
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
            change: '+12%',
            changeIcon: TrendingUp,
            description: 'Active projects'
          },
          { 
            title: 'Active Campaigns', 
            value: stats.inProgress, 
            icon: Activity, 
            gradient: 'from-green-500 to-green-600',
            bgGradient: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20',
            change: '+5%',
            changeIcon: TrendingUp,
            description: 'Currently running'
          },
          { 
            title: 'Links Delivered', 
            value: stats.totalLinks, 
            icon: LinkIcon, 
            gradient: 'from-purple-500 to-purple-600',
            bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
            change: '+23%',
            changeIcon: TrendingUp,
            description: 'High-quality backlinks'
          },
          { 
            title: 'Credits Invested', 
            value: stats.totalCredits, 
            icon: Zap, 
            gradient: 'from-orange-500 to-orange-600',
            bgGradient: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20',
            change: '+18%',
            changeIcon: TrendingUp,
            description: 'Total investment'
          }
        ].map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-all duration-500`}></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardContent className="p-8 relative">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${stat.gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                  <stat.changeIcon className="h-3 w-3" />
                  <span className="text-xs font-semibold">{stat.change}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Filters Section with Glass Effect */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md">
        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Search Campaigns
              </label>
              <div className="relative group">
                <Input
                  placeholder="Search by name, URL, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 border-2 border-border focus:border-primary transition-all duration-300 pl-12 bg-background/50 backdrop-blur-sm group-hover:shadow-md rounded-xl"
                />
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Campaign Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-12 border-2 border-border focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm hover:shadow-md rounded-xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-md border shadow-xl rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Campaigns</SelectItem>
                  <SelectItem value="pending" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-blue-500" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="completed" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="paused" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Pause className="h-3 w-3 text-gray-500" />
                      Paused
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="w-full flex items-center justify-between">
                <Badge variant="outline" className="text-sm px-4 py-2 rounded-full bg-primary/10 border-primary/20 text-primary font-semibold">
                  {filteredCampaigns.length} campaigns
                </Badge>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="md:hidden h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card className="border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-6 mb-4">
                <Rocket className="h-12 w-12 text-primary" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              No campaigns found
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-8 text-lg">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your filters or search terms to find your campaigns'
                : 'Create your first campaign to start building high-quality backlinks and boost your SEO rankings'
              }
            </p>
            {!searchQuery && selectedStatus === 'all' && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 rounded-2xl text-lg font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Campaign
                <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCampaigns.map((campaign) => {
            const config = statusConfig[campaign.status];
            const progress = getProgressPercentage(campaign.links_delivered, campaign.links_requested);
            const StatusIcon = config.icon;
            
            return (
              <Card key={campaign.id} className="relative group hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 border-0 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-sm overflow-hidden rounded-3xl">
                {/* Enhanced gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <CardTitle className="text-xl leading-tight group-hover:text-primary transition-all duration-500 font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {campaign.name}
                      </CardTitle>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge 
                          variant="secondary" 
                          className={`${config.bgColor} ${config.textColor} ${config.borderColor} border-2 shadow-lg group-hover:shadow-xl transition-all duration-500 px-4 py-2 rounded-full font-semibold`}
                        >
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-sm bg-background/50 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500 px-3 py-1 rounded-full backdrop-blur-sm">
                          <Target className="h-3 w-3 mr-1" />
                          {campaign.keywords.length} keywords
                        </Badge>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-primary/20 rounded-2xl backdrop-blur-sm">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Enhanced Keywords preview */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-muted/40 to-muted/20 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-700 backdrop-blur-sm border border-border/50 group-hover:border-primary/30">
                    <div className="flex flex-wrap gap-2">
                      {campaign.keywords.slice(0, 3).map((keyword, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold border border-primary/20 group-hover:shadow-md transition-shadow">
                          {keyword}
                        </span>
                      ))}
                      {campaign.keywords.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-muted/60 text-muted-foreground font-medium backdrop-blur-sm">
                          +{campaign.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-500 p-3 rounded-2xl bg-gradient-to-r from-background/50 to-background/30 group-hover:from-primary/5 group-hover:to-primary/10 backdrop-blur-sm border border-border/30 group-hover:border-primary/40">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate font-semibold flex-1">{campaign.target_url}</span>
                    <Button variant="ghost" size="sm" className="p-2 h-auto hover:bg-primary/20 transition-all duration-300 rounded-xl">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Super Enhanced Progress Section */}
                  <div className="space-y-4 p-6 rounded-3xl bg-gradient-to-br from-muted/40 via-muted/20 to-transparent group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-700 border border-border/30 group-hover:border-primary/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary/30 to-primary/20">
                          <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-bold">Campaign Progress</span>
                      </div>
                      <span className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {campaign.links_delivered}/{campaign.links_requested}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <Progress value={progress} className="h-4 bg-muted/50 rounded-full overflow-hidden" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className={`font-bold px-3 py-1 rounded-full ${progress >= 100 ? 'text-green-700 bg-green-100 dark:bg-green-900/30' : progress >= 50 ? 'text-blue-700 bg-blue-100 dark:bg-blue-900/30' : 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30'}`}>
                        {progress}% complete
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {campaign.links_requested - campaign.links_delivered} remaining
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Stats Grid with Beautiful Cards */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60 group-hover:border-primary/40 transition-colors duration-500">
                    <div className="text-center p-4 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-500 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 text-lg font-bold text-primary mb-1">
                        <DollarSign className="h-4 w-4" />
                        {campaign.credits_used || 0}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">Credits Used</div>
                    </div>
                    <div className="text-center p-4 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-green-50 group-hover:to-green-100 dark:group-hover:from-green-950/20 dark:group-hover:to-green-900/20 transition-all duration-500 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 text-lg font-bold text-green-600 mb-1">
                        <CheckCircle className="h-4 w-4" />
                        {campaign.links_delivered}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">Links Live</div>
                    </div>
                    <div className="text-center p-4 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-950/20 dark:group-hover:to-blue-900/20 transition-all duration-500 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 text-lg font-bold text-blue-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        {Math.ceil((new Date().getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">Days Active</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button variant="outline" size="sm" className="flex-1 group-hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary transition-all duration-500 rounded-xl font-semibold">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 group-hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary transition-all duration-500 rounded-xl font-semibold">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="px-4 group-hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary transition-all duration-500 rounded-xl">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Super Enhanced Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="w-full max-w-3xl max-h-[95vh] overflow-y-auto animate-scale-in border-0 shadow-2xl bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-xl rounded-3xl">
            {/* Enhanced gradient header */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-primary via-primary/90 to-primary rounded-t-3xl"></div>
            
            <CardHeader className="pb-8 pt-10">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl border-4 border-white/20">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full border-2 border-white animate-bounce"></div>
                </div>
                <div className="space-y-3 flex-1">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Launch New Campaign
                  </CardTitle>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Create a targeted backlink campaign with AI-powered optimization to accelerate your SEO growth and dominate search rankings
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-10 px-10 pb-10">
              <div className="grid gap-8">
                <div className="space-y-4">
                  <Label htmlFor="campaign-name" className="text-sm font-bold flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    Campaign Name
                  </Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Q1 Brand Authority Campaign"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="h-14 border-2 focus:border-primary transition-all duration-500 rounded-2xl text-lg bg-background/50 backdrop-blur-sm"
                  />
                  <p className="text-sm text-muted-foreground">Choose a descriptive name that identifies this campaign's purpose and goals</p>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="target-url" className="text-sm font-bold flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    Target URL
                  </Label>
                  <Input
                    id="target-url"
                    placeholder="https://your-website.com/target-page"
                    value={newCampaign.target_url}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, target_url: e.target.value }))}
                    className="h-14 border-2 focus:border-primary transition-all duration-500 rounded-2xl text-lg bg-background/50 backdrop-blur-sm"
                  />
                  <p className="text-sm text-muted-foreground">The specific page you want to build authoritative backlinks to</p>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="keywords" className="text-sm font-bold flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    Target Keywords
                  </Label>
                  <Textarea
                    id="keywords"
                    placeholder="digital marketing agency, seo services, content marketing, brand strategy"
                    value={newCampaign.keywords}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, keywords: e.target.value }))}
                    rows={5}
                    className="border-2 focus:border-primary transition-all duration-500 resize-none rounded-2xl text-lg bg-background/50 backdrop-blur-sm"
                  />
                  <p className="text-sm text-muted-foreground">Separate keywords with commas. These will guide intelligent anchor text selection and content relevance</p>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="links-requested" className="text-sm font-bold flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <LinkIcon className="h-5 w-5 text-primary" />
                    </div>
                    Campaign Scale
                  </Label>
                  <Select 
                    value={newCampaign.links_requested.toString()} 
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, links_requested: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-14 border-2 focus:border-primary rounded-2xl text-lg bg-background/50 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-md border shadow-xl rounded-2xl">
                      <SelectItem value="5" className="text-lg py-4 rounded-xl">5 Links - Starter Package</SelectItem>
                      <SelectItem value="10" className="text-lg py-4 rounded-xl">10 Links - Standard Campaign</SelectItem>
                      <SelectItem value="15" className="text-lg py-4 rounded-xl">15 Links - Growth Focus</SelectItem>
                      <SelectItem value="20" className="text-lg py-4 rounded-xl">20 Links - Authority Building</SelectItem>
                      <SelectItem value="25" className="text-lg py-4 rounded-xl">25 Links - Premium Campaign</SelectItem>
                      <SelectItem value="50" className="text-lg py-4 rounded-xl">50 Links - Enterprise Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Higher volumes provide exponentially better ranking impact but require more credits investment</p>
                </div>
              </div>
              
              {/* Super Enhanced Preview Section */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/30 backdrop-blur-sm">
                <h4 className="font-bold text-lg mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  Campaign Preview & Investment
                </h4>
                <div className="grid grid-cols-2 gap-6 text-base">
                  <div className="space-y-2">
                    <span className="text-muted-foreground font-medium">Keywords Targeted:</span>
                    <p className="font-bold text-xl text-primary">{newCampaign.keywords ? newCampaign.keywords.split(',').length : 0} keywords</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground font-medium">Estimated Investment:</span>
                    <p className="font-bold text-xl text-primary">{newCampaign.links_requested * 2} credits</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground font-medium">Expected Timeline:</span>
                    <p className="font-bold text-blue-600">2-4 weeks</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground font-medium">Quality Guarantee:</span>
                    <p className="font-bold text-green-600">Premium Quality</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pt-8 border-t-2 border-border/50">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-14 hover:bg-muted transition-all duration-500 rounded-2xl text-lg font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createCampaign}
                  className="flex-1 h-14 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 rounded-2xl text-lg font-bold"
                >
                  <Rocket className="h-5 w-5 mr-3" />
                  Launch Campaign
                  <Sparkles className="h-5 w-5 ml-3 animate-pulse" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
