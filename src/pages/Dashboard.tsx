import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Link, 
  Search, 
  TrendingUp, 
  Globe, 
  Users,
  Infinity,
  Plus,
  Activity,
  LogOut,
  Calendar,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { CampaignForm } from "@/components/CampaignForm";
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import { Community } from "@/components/Community";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [userType, setUserType] = useState<"user" | "admin">("user");
  const [credits, setCredits] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    console.log('Dashboard mounted, fetching data...');
    fetchUserData();
    fetchCampaigns();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', user, 'Auth error:', authError);
      if (authError || !user) {
        console.log('No authenticated user found');
        return;
      }

      // Get user profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      console.log('Profile data:', profile, 'Profile error:', profileError);

      if (profile?.role === 'admin') {
        setUserType('admin');
      }

      // Get user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single();

      console.log('Credits data:', creditsData, 'Credits error:', creditsError);

      if (creditsData) {
        setCredits(creditsData.amount);
        console.log('Setting credits to:', creditsData.amount);
      } else {
        console.log('No credits data found');
      }

      // Check if user has any campaigns (first time user check)
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setIsFirstTimeUser(!campaignsData || campaignsData.length === 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleCampaignSuccess = () => {
    setShowCampaignForm(false);
    fetchUserData(); // Refresh credits
    fetchCampaigns(); // Refresh campaigns
    setIsFirstTimeUser(false);
  };


  const handleSignOut = async () => {
    try {
      // Clean up auth state first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast({
        title: "You have signed out",
        description: "You have been successfully logged out of your account.",
      });
      
      // Force redirect to home page with a slight delay to ensure toast shows
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out error",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
      
      // Still redirect even if there's an error
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = 'https://backlinkoo.com/dashboard'}>
              <Infinity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold hidden sm:block">Backlink</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
                <CreditCard className="h-3 w-3" />
                <span className="hidden xs:inline">{credits}</span>
                <span className="xs:hidden">{credits}</span>
                <span className="hidden sm:inline">Credits</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(true)} className="px-2 sm:px-4">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Buy Credits</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="px-2 sm:px-4">
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userType === "user" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Campaigns</span>
                <span className="sm:hidden">Camps</span>
              </TabsTrigger>
              <TabsTrigger value="keyword-research" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Keyword Research</span>
                <span className="sm:hidden">Keywords</span>
              </TabsTrigger>
              <TabsTrigger value="rank-tracker" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Rankings</span>
                <span className="sm:hidden">Ranks</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Comm</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {isFirstTimeUser && credits === 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Welcome to Backlink ∞!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-700 mb-4">
                      Get started by purchasing credits to create your first backlink campaign. 
                      Our high-quality backlinks will help improve your website's search engine rankings.
                    </p>
                    <Button onClick={() => setIsPaymentModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Buy Your First Credits
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{credits}</div>
                    <p className="text-xs text-muted-foreground">$0.70 per credit</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{campaigns.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {campaigns.filter(c => c.status === 'pending' || c.status === 'in_progress').length} active
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                    <Link className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaigns.reduce((sum, c) => sum + (c.links_delivered || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Delivered links</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaigns.length > 0 
                        ? Math.round((campaigns.filter(c => c.status === 'completed').length / campaigns.length) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Campaign completion</p>
                  </CardContent>
                </Card>
              </div>

              {campaigns.length > 0 && (
                <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Recent Campaigns</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Monitor your latest backlink campaigns and their performance
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {campaigns.slice(0, 3).map((campaign, index) => {
                      const progressPercentage = campaign.links_requested > 0 
                        ? Math.round((campaign.links_delivered / campaign.links_requested) * 100)
                        : 0;
                      
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case 'completed':
                            return {
                              icon: CheckCircle2,
                              color: 'text-green-600',
                              bgColor: 'bg-green-50',
                              borderColor: 'border-green-200',
                              badge: 'default'
                            };
                          case 'in_progress':
                            return {
                              icon: Clock,
                              color: 'text-blue-600',
                              bgColor: 'bg-blue-50',
                              borderColor: 'border-blue-200',
                              badge: 'secondary'
                            };
                          case 'pending':
                            return {
                              icon: AlertCircle,
                              color: 'text-yellow-600',
                              bgColor: 'bg-yellow-50',
                              borderColor: 'border-yellow-200',
                              badge: 'outline'
                            };
                          default:
                            return {
                              icon: Activity,
                              color: 'text-gray-600',
                              bgColor: 'bg-gray-50',
                              borderColor: 'border-gray-200',
                              badge: 'secondary'
                            };
                        }
                      };

                      const statusConfig = getStatusConfig(campaign.status);
                      const StatusIcon = statusConfig.icon;
                      const daysAgo = Math.floor((Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <div 
                          key={campaign.id} 
                          className={`relative overflow-hidden rounded-xl border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} p-6 transition-all duration-300 hover:shadow-md animate-fade-in`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Campaign Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg truncate">
                                    {campaign.name || 'Unnamed Campaign'}
                                  </h3>
                                  <Badge variant={statusConfig.badge as any} className="text-xs font-medium">
                                    {campaign.status.replace('_', ' ').charAt(0).toUpperCase() + campaign.status.replace('_', ' ').slice(1)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">{campaign.target_url}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Campaign Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Keywords</span>
                              </div>
                              <div className="pl-6">
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords])
                                    .slice(0, 3).map((keyword: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords]).length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords]).length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Progress</span>
                              </div>
                              <div className="pl-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-primary">
                                    {campaign.links_delivered}/{campaign.links_requested}
                                  </span>
                                  <span className="text-xs text-muted-foreground">backlinks</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                                <span className="text-xs text-muted-foreground mt-1 block">
                                  {progressPercentage}% completed
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Investment</span>
                              </div>
                              <div className="pl-6">
                                <div className="text-lg font-bold">
                                  {campaign.credits_used || campaign.links_requested} credits
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ${((campaign.credits_used || campaign.links_requested) * 0.70).toFixed(2)} value
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delivered Backlinks Preview */}
                          {campaign.completed_backlinks && campaign.completed_backlinks.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Recent Backlinks</span>
                                <Badge variant="secondary" className="text-xs">
                                  {campaign.completed_backlinks.length} delivered
                                </Badge>
                              </div>
                              <div className="pl-6 space-y-1">
                                {campaign.completed_backlinks.slice(0, 2).map((link: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                                    <a 
                                      href={link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:text-primary transition-colors truncate max-w-[300px]"
                                    >
                                      {link}
                                    </a>
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                  </div>
                                ))}
                                {campaign.completed_backlinks.length > 2 && (
                                  <div className="text-xs text-muted-foreground pl-3">
                                    +{campaign.completed_backlinks.length - 2} more backlinks
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Performance Indicator */}
                          <div className="absolute top-6 right-6">
                            {campaign.status === 'completed' && (
                              <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                Complete
                              </div>
                            )}
                            {campaign.status === 'in_progress' && progressPercentage > 50 && (
                              <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                <TrendingUp className="h-3 w-3" />
                                On Track
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* View All Button */}
                    <div className="pt-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('campaigns')}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        View All Campaigns ({campaigns.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaigns.length === 0 && credits > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">Ready to Create Your First Campaign?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700 mb-4">
                      You have {credits} credits available. Create your first backlink campaign to start building authority for your website.
                    </p>
                    <Button onClick={() => {
                      console.log('Navigating to campaigns tab...');
                      setActiveTab('campaigns');
                      setShowCampaignForm(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              {showCampaignForm ? (
                <CampaignForm 
                  onSuccess={handleCampaignSuccess}
                  onCancel={() => setShowCampaignForm(false)}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Campaign Management</h2>
                    <Button onClick={() => setShowCampaignForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </div>
                  
                  {campaigns.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {campaigns.map((campaign) => (
                            <div key={campaign.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">{campaign.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Target URL</p>
                                  <p className="font-medium">{campaign.target_url}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Keywords</p>
                                  <p className="font-medium">
                                    {Array.isArray(campaign.keywords) 
                                      ? campaign.keywords.join(', ') 
                                      : campaign.keywords}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Progress</p>
                                  <p className="font-medium">
                                    {campaign.links_delivered}/{campaign.links_requested} links
                                  </p>
                                </div>
                              </div>
                              {campaign.completed_backlinks && campaign.completed_backlinks.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-2">Delivered Backlinks:</p>
                                  <div className="space-y-1">
                                    {campaign.completed_backlinks.map((link: string, index: number) => (
                                      <p key={index} className="text-sm text-primary hover:underline cursor-pointer">
                                        {link}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Campaigns Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first campaign to start building high-quality backlinks
                        </p>
                        <Button onClick={() => setShowCampaignForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Campaign
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="keyword-research">
              <KeywordResearchTool />
            </TabsContent>

            <TabsContent value="rank-tracker">
              <RankingTracker />
            </TabsContent>

            <TabsContent value="community">
              <Community />
            </TabsContent>
          </Tabs>
        ) : (
          // Admin Dashboard
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                Administrator
              </Badge>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Live Campaign Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Manage incoming campaign orders</p>
                {/* TODO: Implement admin campaign queue */}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
