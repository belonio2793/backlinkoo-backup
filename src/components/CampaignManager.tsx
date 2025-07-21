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
              <Card key={campaign.id} className="group hover:shadow-2xl transition-all duration-500 hover-scale overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 relative">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Status indicator line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${config.color} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
                
                <CardHeader className="pb-4 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors duration-300 font-semibold">
                        {campaign.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="secondary" 
                          className={`${config.bgColor} ${config.textColor} ${config.borderColor} border shadow-sm group-hover:shadow-md transition-all duration-300`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1.5" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-background/50 group-hover:bg-primary/10 transition-all duration-300">
                          <Target className="h-2.5 w-2.5 mr-1" />
                          {campaign.keywords.length} keywords
                        </Badge>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Keywords preview */}
                  <div className="mt-3 p-3 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-all duration-300">
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.keywords.slice(0, 3).map((keyword, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                          {keyword}
                        </span>
                      ))}
                      {campaign.keywords.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          +{campaign.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-5 relative">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-all duration-300">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="truncate font-medium">{campaign.target_url}</span>
                    <Button variant="ghost" size="sm" className="p-1 h-auto hover:bg-primary/20 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Enhanced Progress Section */}
                  <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Campaign Progress</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {campaign.links_delivered}/{campaign.links_requested}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <Progress value={progress} className="h-3 bg-muted" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${progress >= 100 ? 'text-green-600' : progress >= 50 ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {progress}% complete
                      </span>
                      <span className="text-muted-foreground">
                        {campaign.links_requested - campaign.links_delivered} remaining
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/60 group-hover:border-primary/30 transition-colors duration-300">
                    <div className="text-center p-2 rounded-lg group-hover:bg-primary/5 transition-all duration-300">
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-primary">
                        <DollarSign className="h-3.5 w-3.5" />
                        {campaign.credits_used || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Credits Used</div>
                    </div>
                    <div className="text-center p-2 rounded-lg group-hover:bg-green-50 dark:group-hover:bg-green-950/20 transition-all duration-300">
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {campaign.links_delivered}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Links Live</div>
                    </div>
                    <div className="text-center p-2 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 transition-all duration-300">
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-blue-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {Math.ceil((new Date().getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Days Active</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center gap-2 pt-3">
                    <Button variant="outline" size="sm" className="flex-1 group-hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 group-hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="px-3 group-hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enhanced Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border-0 shadow-2xl bg-gradient-to-br from-card via-card to-card/90">
            {/* Gradient header */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-t-lg"></div>
            
            <CardHeader className="pb-6 pt-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-2xl font-bold">Create New Campaign</CardTitle>
                  <p className="text-muted-foreground">
                    Launch a targeted backlink campaign to accelerate your SEO growth and search rankings
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="grid gap-6">
                <div className="space-y-3">
                  <Label htmlFor="campaign-name" className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Campaign Name
                  </Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Q1 Brand Authority Campaign"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 border-2 focus:border-primary transition-all duration-300"
                  />
                  <p className="text-xs text-muted-foreground">Choose a descriptive name that identifies this campaign</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="target-url" className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Target URL
                  </Label>
                  <Input
                    id="target-url"
                    placeholder="https://your-website.com/target-page"
                    value={newCampaign.target_url}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, target_url: e.target.value }))}
                    className="h-12 border-2 focus:border-primary transition-all duration-300"
                  />
                  <p className="text-xs text-muted-foreground">The specific page you want to build backlinks to</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="keywords" className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Target Keywords
                  </Label>
                  <Textarea
                    id="keywords"
                    placeholder="digital marketing agency, seo services, content marketing, brand strategy"
                    value={newCampaign.keywords}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, keywords: e.target.value }))}
                    rows={4}
                    className="border-2 focus:border-primary transition-all duration-300 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Separate keywords with commas. These will guide anchor text selection</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="links-requested" className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    Campaign Scale
                  </Label>
                  <Select 
                    value={newCampaign.links_requested.toString()} 
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, links_requested: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Links - Starter Package</SelectItem>
                      <SelectItem value="10">10 Links - Standard Campaign</SelectItem>
                      <SelectItem value="15">15 Links - Growth Focus</SelectItem>
                      <SelectItem value="20">20 Links - Authority Building</SelectItem>
                      <SelectItem value="25">25 Links - Premium Campaign</SelectItem>
                      <SelectItem value="50">50 Links - Enterprise Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Higher volumes provide better ranking impact but require more credits</p>
                </div>
              </div>
              
              {/* Enhanced Preview Section */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Campaign Preview
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Keywords:</span>
                    <p className="font-medium">{newCampaign.keywords ? newCampaign.keywords.split(',').length : 0} keywords</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimated Credits:</span>
                    <p className="font-medium text-primary">{newCampaign.links_requested * 2} credits</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Timeline:</span>
                    <p className="font-medium">2-4 weeks</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quality Score:</span>
                    <p className="font-medium text-green-600">High Quality</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-12 hover:bg-muted transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createCampaign}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
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