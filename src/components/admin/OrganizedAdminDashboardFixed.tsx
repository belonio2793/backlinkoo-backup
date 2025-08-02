import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useWorkingAdminDashboardMetrics } from "@/hooks/useWorkingAdminDashboardMetrics";
import { AdminNavigationHeader } from "@/components/admin/AdminNavigationHeader";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { UserRegistrationDiagnostic } from "@/components/admin/UserRegistrationDiagnostic";
import { ConfigurationDiagnostic } from "@/components/admin/ConfigurationDiagnostic";
import { supabase } from '@/integrations/supabase/client';

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
import { UserManagement } from "@/components/admin/UserManagement";

// Testing Tools
import { AuthEmailTest } from "@/components/AuthEmailTest";
import { EmailTest } from "@/components/EmailTest";
import { SupabaseEmailTest } from "@/components/SupabaseEmailTest";
import { SupabaseEmailGuide } from "@/components/SupabaseEmailGuide";
import { SMTPConfigTest } from "@/components/SMTPConfigTest";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { DatabaseTestComponent } from "../DatabaseTestComponent";

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
  const { metrics, loading, error, refetch } = useWorkingAdminDashboardMetrics();
  const [activeSection, setActiveSection] = useState("overview");
  const [adminEmail, setAdminEmail] = useState<string | undefined>();

  // Get admin user info
  useEffect(() => {
    const getAdminInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setAdminEmail(user.email);
        }
      } catch (error) {
        console.warn('Could not get admin user info:', error);
      }
    };
    
    getAdminInfo();
  }, []);

  const handleRefreshMetrics = async () => {
    await refetch();
    toast({
      title: "Metrics Refreshed",
      description: "Dashboard metrics have been updated with the latest data."
    });
  };

  const handleSignOut = () => {
    AuthService.signOut();
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <AdminNavigationHeader 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        adminEmail={adminEmail}
      />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Section Content */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Connection Status Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  <div className="font-medium">Dashboard Error</div>
                  <div className="text-sm mt-1">{error.message}</div>
                  <div className="text-sm mt-2 text-red-600">
                    This usually means you need to sign in as an admin user or fix the database connection.
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                      <p className="text-xs text-muted-foreground">Current month total</p>
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

        {activeSection === "users" && (
          <div className="space-y-6">
            <ConfigurationDiagnostic />
            <UserRegistrationDiagnostic />
            <AdminUserManagement />
          </div>
        )}

        {activeSection === "content" && (
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

        {activeSection === "system" && (
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
              <div className="space-y-6">
                <DatabaseTestComponent />
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
              </div>
            </TabsContent>
          </Tabs>
        )}

        {activeSection === "communications" && (
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

        {activeSection === "security" && (
          <div className="space-y-6">
            <SecurityDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
