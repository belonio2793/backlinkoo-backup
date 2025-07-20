import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LogOut
} from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { CampaignForm } from "@/components/CampaignForm";
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import { SEOTools } from "@/components/SEOTools";
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
              <h1 className="text-xl font-semibold">Backlink ∞</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <CreditCard className="h-3 w-3" />
                {credits} Credits
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Buy Credits
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userType === "user" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="keyword-research">Keyword Research</TabsTrigger>
              <TabsTrigger value="rank-tracker">Rankings</TabsTrigger>
              <TabsTrigger value="seo-tools">SEO Tools</TabsTrigger>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns.slice(0, 3).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{campaign.target_url}</p>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(campaign.keywords) ? campaign.keywords.join(', ') : campaign.keywords}
                            </p>
                          </div>
                          <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
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

            <TabsContent value="seo-tools">
              <SEOTools />
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