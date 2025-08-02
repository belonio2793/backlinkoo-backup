import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useAdminDashboardMetrics } from "@/hooks/useAdminDashboardMetrics";

// Admin Components
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { CampaignManager } from "@/components/CampaignManager";
import { AdminAffiliateManager } from "@/components/admin/AdminAffiliateManager";
import { EmailSystemManagerSafe } from "@/components/admin/EmailSystemManagerSafe";
import { AdminBlogManager } from "@/components/admin/AdminBlogManager";
import { TrialPostCleanupManager } from "@/components/admin/TrialPostCleanupManager";
import { BlogManagementPanel } from "@/components/admin/BlogManagementPanel";
import { ContentFilterManager } from "@/components/admin/ContentFilterManager";
import { ContentModerationQueue } from "@/components/admin/ContentModerationQueue";
import { AIPostsManager } from "@/components/admin/AIPostsManager";
import { BlogPostClaimsManager } from "@/components/admin/BlogPostClaimsManager";
import { BlogSystemAdmin } from "@/components/admin/BlogSystemAdmin";
import { SystemsAssessmentDashboard } from "@/components/admin/SystemsAssessmentDashboard";
import { EnvironmentVariablesManager } from "@/components/admin/EnvironmentVariablesManager";
import { NetlifyEnvironmentManager } from "@/components/admin/NetlifyEnvironmentManager";
import { ServiceConnectionStatus } from "@/components/admin/ServiceConnectionStatus";
import { DirectOpenAITest } from "@/components/admin/DirectOpenAITest";

// Testing Tools
import { AuthEmailTest } from "@/components/AuthEmailTest";
import { EmailTest } from "@/components/EmailTest";
import { SupabaseEmailTest } from "@/components/SupabaseEmailTest";
import { SupabaseEmailGuide } from "@/components/SupabaseEmailGuide";
import { SMTPConfigTest } from "@/components/SMTPConfigTest";
import { DeploymentStatus } from "@/components/DeploymentStatus";

import {
  Users,
  Activity,
  CreditCard,
  Clock,
  Infinity,
  LogOut,
  Brain,
  Settings,
  Server,
  FileText,
  Mail,
  Shield,
  Zap,
  Database,
  Globe,
  Code,
  BarChart3,
  MonitorSpeaker,
  RefreshCw,
  AlertCircle,
  Target
} from "lucide-react";



export function OrganizedAdminDashboard() {
  const { toast } = useToast();
  const { metrics, loading, error, refetch } = useAdminDashboardMetrics();
  const [activeCategory, setActiveCategory] = useState("overview");

  const handleRefreshMetrics = async () => {
    await refetch();
    toast({
      title: "Metrics Refreshed",
      description: "Dashboard metrics have been updated with the latest data."
    });
  };

  const handleSignOut = () => {
    // Navigate immediately for instant UX
    window.location.href = '/';

    // Do sign out in background
    setTimeout(() => {
      AuthService.signOut().catch((error) => {
        console.warn('Background admin sign out error (non-critical):', error);
      });
    }, 0);
  };

  const categories = [
    {
      id: "overview",
      name: "Overview",
      icon: BarChart3,
      description: "System status & health"
    },
    {
      id: "content",
      name: "Content",
      icon: FileText,
      description: "Posts, AI content & moderation"
    },
    {
      id: "system",
      name: "System",
      icon: Server,
      description: "APIs, deployment & infrastructure"
    },
    {
      id: "communications",
      name: "Communications",
      icon: Mail,
      description: "Email systems & campaigns"
    },
    {
      id: "business",
      name: "Business",
      icon: Users,
      description: "Affiliates & user management"
    },
    {
      id: "security",
      name: "Security",
      icon: Shield,
      description: "Security settings & monitoring"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your backlink service platform</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Key Metrics</h2>
          <div className="flex items-center gap-2">
            {error && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshMetrics}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  metrics?.totalUsers || 0
                )}
              </div>
              {loading ? (
                <div className="h-3 bg-muted animate-pulse rounded w-20" />
              ) : (
                <p className="text-xs text-muted-foreground">All registered users</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  metrics?.activeUsers || 0
                )}
              </div>
              {loading ? (
                <div className="h-3 bg-muted animate-pulse rounded w-20" />
              ) : (
                <p className="text-xs text-muted-foreground">Currently subscribed</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  `$${metrics?.monthlyRevenue?.toFixed(2) || '0.00'}`
                )}
              </div>
              {loading ? (
                <div className="h-3 bg-muted animate-pulse rounded w-20" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {metrics?.monthlyRevenueChange !== undefined
                    ? `${metrics.monthlyRevenueChange >= 0 ? '+' : ''}${metrics.monthlyRevenueChange.toFixed(1)}% from last month`
                    : "Current month total"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Campaigns</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  metrics?.runningCampaigns || 0
                )}
              </div>
              {loading ? (
                <div className="h-3 bg-muted animate-pulse rounded w-20" />
              ) : (
                <p className="text-xs text-muted-foreground">Active credit campaigns</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administration Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-center gap-2 min-h-[80px] relative group"
                  onClick={() => setActiveCategory(category.id)}
                >
                  <IconComponent className="h-5 w-5 shrink-0" />
                  <div className="text-center w-full">
                    <div className="font-medium text-sm leading-tight">{category.name}</div>
                  </div>

                  {/* Tooltip for description on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap hidden lg:block">
                    {category.description}
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Content */}
      <div className="space-y-6">
        {activeCategory === "overview" && (
          <div className="space-y-6">
            {/* Streamlined System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorSpeaker className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceConnectionStatus />
              </CardContent>
            </Card>

            {/* Direct OpenAI Connection Test */}
            <DirectOpenAITest />
          </div>
        )}

        {activeCategory === "content" && (
          <Tabs defaultValue="blog-posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="blog-posts">Blog Posts</TabsTrigger>
              <TabsTrigger value="ai-posts">AI Posts</TabsTrigger>
              <TabsTrigger value="blog-claims">Claims</TabsTrigger>
              <TabsTrigger value="blog-system">System</TabsTrigger>
              <TabsTrigger value="content-filter">Content Filter</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
            </TabsList>

            <TabsContent value="blog-posts">
              <div className="space-y-6">
                <AdminBlogManager />
                <BlogManagementPanel />
              </div>
            </TabsContent>

            <TabsContent value="ai-posts">
              <AIPostsManager />
            </TabsContent>

            <TabsContent value="blog-claims">
              <BlogPostClaimsManager />
            </TabsContent>

            <TabsContent value="blog-system">
              <BlogSystemAdmin />
            </TabsContent>

            <TabsContent value="content-filter">
              <ContentFilterManager />
            </TabsContent>

            <TabsContent value="moderation">
              <ContentModerationQueue />
            </TabsContent>
          </Tabs>
        )}

        {activeCategory === "system" && (
          <Tabs defaultValue="assessment" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assessment">Systems Assessment</TabsTrigger>
              <TabsTrigger value="environment">Environment & API Keys</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
            </TabsList>

            <TabsContent value="assessment">
              <SystemsAssessmentDashboard />
            </TabsContent>

            <TabsContent value="environment">
              <NetlifyEnvironmentManager />
            </TabsContent>

            <TabsContent value="deployment">
              <DeploymentStatus />
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrialPostCleanupManager />
                  <Separator />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {activeCategory === "communications" && (
          <Tabs defaultValue="email-system" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="email-system">Email System</TabsTrigger>
              <TabsTrigger value="smtp-config">SMTP Config</TabsTrigger>
              <TabsTrigger value="email-test">Testing</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            </TabsList>

            <TabsContent value="email-system">
              <EmailSystemManagerSafe />
            </TabsContent>

            <TabsContent value="smtp-config">
              <SMTPConfigTest />
            </TabsContent>

            <TabsContent value="email-test">
              <div className="space-y-6">
                <AuthEmailTest />
                <EmailTest />
                <SupabaseEmailTest />
                <SupabaseEmailGuide />
              </div>
            </TabsContent>

            <TabsContent value="campaigns">
              <CampaignManager />
            </TabsContent>
          </Tabs>
        )}

        {activeCategory === "business" && (
          <Tabs defaultValue="affiliates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="affiliates">Affiliate Program</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="affiliates">
              <AdminAffiliateManager />
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Business Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Advanced analytics and reporting coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {activeCategory === "security" && (
          <div className="space-y-6">
            <SecurityDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
