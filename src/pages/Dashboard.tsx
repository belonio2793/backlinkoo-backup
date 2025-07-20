import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [userType] = useState<"user" | "admin">("user"); // TODO: Get from auth context
  const [credits] = useState(47); // TODO: Get from Supabase
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();

  const campaigns = [
    {
      id: "BL-001",
      targetUrl: "example.com",
      keywords: "SEO, backlinks, digital marketing",
      requestedLinks: 10,
      deliveredLinks: 8,
      status: "In Progress",
      createdAt: "2024-01-15"
    },
    {
      id: "BL-002",
      targetUrl: "mysite.com/blog",
      keywords: "content marketing, blog",
      requestedLinks: 5,
      deliveredLinks: 5,
      status: "Completed",
      createdAt: "2024-01-10"
    }
  ];

  const deliveredLinks = [
    "https://techblog.com/seo-guide",
    "https://marketingsite.com/backlink-strategies",
    "https://digitalagency.com/resources"
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Sign out error",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="keyword-research">Keywords</TabsTrigger>
              <TabsTrigger value="rank-tracker">Rankings</TabsTrigger>
              <TabsTrigger value="seo-tools">SEO Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
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
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">2 in progress</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                    <Link className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">127</div>
                    <p className="text-xs text-muted-foreground">+23 this month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground">Campaign delivery</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{campaign.targetUrl}</p>
                          <p className="text-sm text-muted-foreground">{campaign.keywords}</p>
                        </div>
                        <Badge variant={campaign.status === "Completed" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Campaign Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
              
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
                            <p className="font-medium">Campaign {campaign.id}</p>
                            <p className="text-sm text-muted-foreground">Created: {campaign.createdAt}</p>
                          </div>
                          <Badge variant={campaign.status === "Completed" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Target URL</p>
                            <p className="font-medium">{campaign.targetUrl}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Keywords</p>
                            <p className="font-medium">{campaign.keywords}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Progress</p>
                            <p className="font-medium">{campaign.deliveredLinks}/{campaign.requestedLinks} links</p>
                          </div>
                        </div>
                        {campaign.status === "Completed" && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Delivered Backlinks:</p>
                            <div className="space-y-1">
                              {deliveredLinks.map((link, index) => (
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
            </TabsContent>

            <TabsContent value="keyword-research">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Keyword Research Tool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Search for profitable keywords with low competition</p>
                  {/* TODO: Implement keyword research tool */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rank-tracker">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ranking Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Track your keyword rankings on Google and Bing</p>
                  {/* TODO: Implement rank tracker */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo-tools">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    SEO Analysis Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Analyze domain authority, page authority, and indexing status</p>
                  {/* TODO: Implement SEO tools */}
                </CardContent>
              </Card>
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