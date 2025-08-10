import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Calendar,
  DollarSign,
  Link,
  BarChart3,
  Shield,
  Globe,
  Activity,
  RefreshCw,
  Eye,
  Download,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NoHandsSEOCampaign {
  id: string;
  name: string;
  target_url: string;
  keywords: string[] | string;
  status: 'pending' | 'verified' | 'in_progress' | 'completed' | 'failed';
  links_requested: number;
  links_delivered: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  completed_backlinks?: string[];
  domain_metrics?: {
    domain_authority: number;
    trust_flow: number;
    citation_flow: number;
  };
  campaign_metrics?: {
    total_reach: number;
    estimated_traffic: number;
    ranking_improvement: number;
  };
}

const NoHandsSEODashboard = () => {
  const [campaigns, setCampaigns] = useState<NoHandsSEOCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<NoHandsSEOCampaign | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchNoHandsSEOCampaigns();
  }, []);

  const fetchNoHandsSEOCampaigns = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // Fetch all campaigns for the user and filter client-side for now to avoid query issues
      const { data: allCampaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast({
          title: "Error",
          description: `Failed to fetch campaigns: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      // Filter for Backlink ∞ Automation Link Building (beta) campaigns client-side
      const campaignsData = allCampaigns?.filter(campaign =>
        campaign.name?.includes('Backlink ∞ Automation Link Building (beta)') ||
        campaign.campaign_type === 'no_hands_seo'
      ) || [];

      setCampaigns(campaignsData);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: `Failed to fetch campaigns: ${error?.message || 'Please try again'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNoHandsSEOCampaigns();
    toast({
      title: "Refreshed",
      description: "Campaign data has been updated.",
    });
  };

  const getStatusConfig = (status: string, verificationStatus?: string) => {
    if (verificationStatus === 'pending') {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Pending Verification'
      };
    }
    
    if (verificationStatus === 'rejected') {
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Verification Failed'
      };
    }

    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Completed'
        };
      case 'in_progress':
        return {
          icon: Activity,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'In Progress'
        };
      case 'verified':
        return {
          icon: Shield,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          label: 'Verified & Queued'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Pending'
        };
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'verification_pending') return campaign.verification_status === 'pending';
    return campaign.status === statusFilter;
  });

  const calculateMetrics = () => {
    const totalCampaigns = campaigns.length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const activeCampaigns = campaigns.filter(c => ['verified', 'in_progress'].includes(c.status)).length;
    const totalBacklinks = campaigns.reduce((sum, c) => sum + (c.links_delivered || 0), 0);
    const totalInvestment = campaigns.reduce((sum, c) => sum + (c.credits_used || c.links_requested), 0);
    const successRate = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;

    return {
      totalCampaigns,
      completedCampaigns,
      activeCampaigns,
      totalBacklinks,
      totalInvestment,
      successRate
    };
  };

  const metrics = calculateMetrics();

  const CampaignCard = ({ campaign }: { campaign: NoHandsSEOCampaign }) => {
    const statusConfig = getStatusConfig(campaign.status, campaign.verification_status);
    const StatusIcon = statusConfig.icon;
    const progressPercentage = campaign.links_requested > 0 
      ? Math.round((campaign.links_delivered / campaign.links_requested) * 100)
      : 0;
    const daysAgo = Math.floor((Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${statusConfig.borderColor} ${statusConfig.bgColor} border-2`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg truncate">
                  {campaign.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Campaign Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Created</span>
              </div>
              <p className="font-medium">
                {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>Investment</span>
              </div>
              <p className="font-medium">
                {campaign.credits_used || campaign.links_requested} credits
              </p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Link className="h-3 w-3" />
                <span className="text-sm">Backlink Progress</span>
              </div>
              <span className="text-sm font-medium">
                {campaign.links_delivered}/{campaign.links_requested}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <span className="text-xs text-muted-foreground">
              {progressPercentage}% completed
            </span>
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-2">
              <Target className="h-3 w-3" />
              <span className="text-sm">Target Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords])
                .slice(0, 2).map((keyword: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords]).length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords]).length - 2}
                </Badge>
              )}
            </div>
          </div>

          {/* Verification Status */}
          {campaign.verification_status === 'pending' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Awaiting Verification
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Your campaign is being reviewed for quality and compliance before processing begins.
              </p>
            </div>
          )}

          {campaign.verification_status === 'rejected' && campaign.verification_notes && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Verification Failed
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                {campaign.verification_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Backlink ∞ Automation Link Building (beta) Dashboard</h2>
            <p className="text-muted-foreground">Monitor your automated link building campaigns</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Campaigns</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.totalCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.completedCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.activeCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Backlinks</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.totalBacklinks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Management */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaign Monitor</TabsTrigger>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="reporting">Performance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by status:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'verification_pending', label: 'Pending Verification' },
                    { value: 'verified', label: 'Verified' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' }
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={statusFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Grid */}
          {filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Backlink ∞ Automation Link Building (beta) Campaigns</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all'
                    ? "You have no active campaigns running."
                    : `No campaigns found with status: ${statusFilter}`
                  }
                </p>
                <Button onClick={() => window.location.href = '/automation-link-building'}>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Backlink ∞ Automation Link Building (beta) Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Campaign Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.filter(c => c.verification_status === 'pending').length > 0 ? (
                  campaigns.filter(c => c.verification_status === 'pending').map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted {Math.floor((Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                          Pending Review
                        </Badge>
                      </div>
                      <p className="text-sm text-yellow-700 mt-2">
                        Our team is reviewing your campaign for quality and compliance. This typically takes 24-48 hours.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No campaigns pending verification</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Campaign Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Average Delivery Time</p>
                      <p className="text-2xl font-bold">12 days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Average DA Score</p>
                      <p className="text-2xl font-bold">65</p>
                    </div>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    85% of campaigns delivered within promised timeframe
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Avg Trust Flow</p>
                      <p className="text-2xl font-bold">42</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Citation Flow</p>
                      <p className="text-2xl font-bold">38</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Domain Quality</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF Report
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Backlink List
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Detail Modal/Sidebar could be added here */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedCampaign(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedCampaign.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedCampaign.target_url}</p>
                </div>
                
                {selectedCampaign.completed_backlinks && selectedCampaign.completed_backlinks.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Delivered Backlinks</h5>
                    <div className="space-y-2">
                      {selectedCampaign.completed_backlinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <ExternalLink className="h-3 w-3" />
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {link}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NoHandsSEODashboard;
