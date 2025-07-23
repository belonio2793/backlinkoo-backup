
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  Users, 
  LinkIcon, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  Plus,
  ExternalLink,
  Calendar,
  Target,
  Activity,
  Infinity,
  LogOut,
  Shield
} from "lucide-react";
import { CampaignManager } from "@/components/CampaignManager";
import { RankingTracker } from "@/components/RankingTracker";
import { SEOTools } from "@/components/SEOTools";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    
    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Infinity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Backlink</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Plan</CardTitle>
                <CardDescription>Current subscription status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <Badge variant="secondary">Pro</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Payment:</span>
                    <span>July 20, 2024</span>
                  </div>
                  <Button className="w-full">Manage Subscription</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user?.user_metadata?.first_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <Tabs defaultValue="campaigns" className="w-full">
              <TabsList>
                <TabsTrigger value="campaigns">
                  <Target className="h-4 w-4 mr-2" />
                  Campaigns
                </TabsTrigger>
                <TabsTrigger value="ranking">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ranking
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <Search className="h-4 w-4 mr-2" />
                  SEO Tools
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
              <TabsContent value="campaigns" className="mt-6">
                <CampaignManager />
              </TabsContent>
              <TabsContent value="ranking" className="mt-6">
                <RankingTracker />
              </TabsContent>
              <TabsContent value="seo" className="mt-6">
                <SEOTools />
              </TabsContent>
              <TabsContent value="security" className="mt-6">
                <SecurityDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
