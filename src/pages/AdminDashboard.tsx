import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BlogClaimDebugPanel } from "@/components/BlogClaimDebugPanel";
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
  Bug,
  Calendar,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Zap,
  User,
  Settings,
  ChevronDown,
  Eye,
  Sparkles,
  Crown,
  RefreshCw,
  Home
} from "lucide-react";
import { PricingModal } from "@/components/PricingModal";
import { CampaignForm } from "@/components/CampaignForm";
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import NoHandsSEODashboard from "@/components/NoHandsSEODashboard";
import AdminVerificationQueue from "@/components/AdminVerificationQueue";
import SEOToolsSection from "@/components/SEOToolsSection";
import { ProfileSettings } from "@/components/ProfileSettings";
import { ApiConfigStatus } from "@/components/ApiConfigStatus";
import { TrialBlogShowcase } from "@/components/TrialBlogShowcase";
import { TrialBlogPostsDisplay as NewTrialBlogPostsDisplay } from "@/components/TrialBlogPostsDisplay";
import { EnhancedTrialBlogPosts } from "@/components/EnhancedTrialBlogPosts";
import { Footer } from "@/components/Footer";

import { ApiUsageDashboard } from "@/components/ApiUsageDashboard";
import { GlobalBlogGenerator } from "@/components/GlobalBlogGenerator";

import { AIPostsManager } from "@/components/admin/AIPostsManager";
import { OrganizedAdminDashboard } from "@/components/admin/OrganizedAdminDashboard";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User } from '@supabase/supabase-js';

// TrialBlogPostsDisplay component for the trial tab
const TrialBlogPostsDisplay = ({ user }: { user: User | null }) => {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [claimingPostId, setClaimingPostId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAllPosts();

    // Refresh every 30 seconds to check for new posts
    const interval = setInterval(() => {
      loadAllPosts(true); // Silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllPosts = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setLoading(true);
        setError(null);
      }
      setLoadingStatus('Connecting to database...');

      // Fetch all blog posts
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        throw postsError;
      }

      setAllPosts(posts || []);
      setLastRefresh(new Date());
      setLoadingStatus('Posts loaded successfully');
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setError(error.message);
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !lastRefresh) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Trial Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={33} className="w-full" />
            <p className="text-sm text-muted-foreground">{loadingStatus}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => loadAllPosts()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Trial Blog Posts ({allPosts.length})
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className="text-sm text-muted-foreground">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
              <Button onClick={() => loadAllPosts()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trial posts found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {allPosts.map((post) => (
                <Card key={post.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {post.excerpt || 'No excerpt available'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                          <Badge variant="outline">{post.status || 'draft'}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
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
    </div>
  );
};

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsUserLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  const stats = {
    pendingOrders: 2,
    inProgress: 1,
    totalUsers: 247,
    monthlyRevenue: 8420
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your backlink service platform</p>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Admin
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveSection("profile")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Active campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${stats.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="space-y-6">
          <div className="border-b">
            <div className="flex space-x-8 overflow-x-auto">
              <Button
                variant={activeSection === "dashboard" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("dashboard")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>

              <Button
                variant={activeSection === "campaigns" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("campaigns")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Target className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Campaigns</span>
              </Button>

              <Button
                variant={activeSection === "seo-tools" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("seo-tools")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Zap className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">SEO Tools</span>
              </Button>

              <Button
                variant={activeSection === "trial" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("trial")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Trial</span>
              </Button>

              <Button
                variant={activeSection === "admin" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("admin")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {activeSection === "dashboard" && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveSection("campaigns")}
                      >
                        <Plus className="h-5 w-5" />
                        New Campaign
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveSection("seo-tools")}
                      >
                        <Search className="h-5 w-5" />
                        SEO Analysis
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveSection("trial")}
                      >
                        <Sparkles className="h-5 w-5" />
                        Trial Posts
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveSection("admin")}
                      >
                        <Settings className="h-5 w-5" />
                        Admin Panel
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Recent activity will be displayed here</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ApiConfigStatus />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeSection === "campaigns" && (
              <div className="space-y-6">
                <CampaignForm />
                <NoHandsSEODashboard />
              </div>
            )}

            {activeSection === "seo-tools" && (
              <div className="space-y-6">
                <SEOToolsSection user={user} />
              </div>
            )}

            {activeSection === "trial" && (
              <div className="space-y-6">
                <TrialBlogPostsDisplay user={user} />
                <EnhancedTrialBlogPosts />
              </div>
            )}

            {activeSection === "admin" && (
              <div className="space-y-6">
                <OrganizedAdminDashboard />
              </div>
            )}

            {activeSection === "profile" && (
              <div className="space-y-6">
                <ProfileSettings user={user} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminDashboard;
