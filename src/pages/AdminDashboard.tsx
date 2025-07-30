import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { CampaignManager } from "@/components/CampaignManager";
import { AdminAffiliateManager } from "@/components/admin/AdminAffiliateManager";

import { EmailSystemManager } from "@/components/admin/EmailSystemManager";
import { AdminBlogManager } from "@/components/admin/AdminBlogManager";

import { TrialPostCleanupManager } from "@/components/admin/TrialPostCleanupManager";
import { BlogManagementPanel } from "@/components/admin/BlogManagementPanel";
import { ContentFilterManager } from "@/components/admin/ContentFilterManager";
import { ContentModerationQueue } from "@/components/admin/ContentModerationQueue";
import { AIPostsManager } from "@/components/admin/AIPostsManager";
import { BlogPostClaimsManager } from "@/components/admin/BlogPostClaimsManager";
import { EnvironmentVariablesManager } from "@/components/admin/EnvironmentVariablesManager";
import { AuthEmailTest } from "@/components/AuthEmailTest";

import { EmailTest } from "@/components/EmailTest";
import { SupabaseEmailTest } from "@/components/SupabaseEmailTest";
import { SupabaseEmailGuide } from "@/components/SupabaseEmailGuide";
import { SMTPConfigTest } from "@/components/SMTPConfigTest";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { Footer } from "@/components/Footer";

import { SystemStatusCheck } from "@/components/SystemStatusCheck";
import { PurgeStorageButton } from "@/components/PurgeStorageButton";
import { AdminAuthService } from "@/services/adminAuthService";
import { ServiceConnectionStatus } from "@/components/admin/ServiceConnectionStatus";
import { APIConfigurationManager } from "@/components/admin/APIConfigurationManager";
import { OpenAIConnectionTester } from "@/components/OpenAIConnectionTester";
import { OpenAIConnectionTest } from "@/components/OpenAIConnectionTest";
import { APIKeyDebug } from "@/components/APIKeyDebug";
import {
  Users,
  Activity,
  CreditCard,
  Clock,
  Infinity,
  LogOut,
  Brain
} from "lucide-react";

const AdminDashboard = () => {
  const [paymentSettings] = useState({
    stripe: true,
    paypal: true,
    wise: false
  });

  const [completionUrls, setCompletionUrls] = useState("");

  const activeCampaigns = [
    {
      id: "BL-003",
      userId: "user-123",
      userEmail: "john@example.com",
      targetUrl: "newsite.com",
      keywords: "web development, React, TypeScript",
      requestedLinks: 8,
      createdAt: "2024-01-16",
      status: "pending"
    },
    {
      id: "BL-004",
      userId: "user-456",
      userEmail: "sarah@company.com",
      targetUrl: "ecommerce-store.com",
      keywords: "online shopping, products",
      requestedLinks: 12,
      createdAt: "2024-01-16",
      status: "pending"
    },
    {
      id: "BL-005",
      userId: "user-789",
      userEmail: "mike@startup.io",
      targetUrl: "tech-blog.com",
      keywords: "AI, machine learning, tech",
      requestedLinks: 6,
      createdAt: "2024-01-15",
      status: "in_progress"
    }
  ];

  const handleCompleteOrder = (campaignId: string) => {
    // TODO: Implement order completion logic with Supabase
    console.log(`Completing order ${campaignId} with URLs:`, completionUrls);
    setCompletionUrls("");
  };

  const stats = {
    pendingOrders: activeCampaigns.filter(c => c.status === "pending").length,
    inProgress: activeCampaigns.filter(c => c.status === "in_progress").length,
    totalUsers: 247,
    monthlyRevenue: 8420
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Infinity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <PurgeStorageButton
                variant="ghost"
                size="sm"
                showIcon={true}
                className="text-muted-foreground hover:text-foreground"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  AdminAuthService.signOutAdmin();
                  window.location.reload();
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Sign out admin"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Badge variant="default" className="gap-1">
                <Users className="h-3 w-3" />
                Administrator
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Awaiting completion</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Being worked on</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${stats.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList>
            <TabsTrigger value="connections">Service Status</TabsTrigger>
            <TabsTrigger value="api-config">API Configuration</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
            <TabsTrigger value="environment-vars">Environment Variables</TabsTrigger>
            <TabsTrigger value="blog-posts">Blog Posts</TabsTrigger>
            <TabsTrigger value="blog-claims">Blog Claims</TabsTrigger>
            <TabsTrigger value="ai-posts">AI Posts</TabsTrigger>

            <TabsTrigger value="content-filter">Content Filter</TabsTrigger>
            <TabsTrigger value="moderation-queue">Moderation Queue</TabsTrigger>
            <TabsTrigger value="trial-cleanup">Trial Cleanup</TabsTrigger>
            <TabsTrigger value="blog-management">Blog Management</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliate Program</TabsTrigger>
            <TabsTrigger value="auth-test">Auth & Email Test</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="smtp-test">SMTP Test</TabsTrigger>
            <TabsTrigger value="email-test">Email System</TabsTrigger>
            <TabsTrigger value="security">Security & Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            <ServiceConnectionStatus />
          </TabsContent>

          <TabsContent value="api-config">
            <div className="space-y-6">
              <APIKeyDebug />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OpenAIConnectionTest />
                <OpenAIConnectionTester />
              </div>
              <APIConfigurationManager />
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignManager />
          </TabsContent>

          <TabsContent value="environment-vars">
            <EnvironmentVariablesManager />
          </TabsContent>

          <TabsContent value="blog-posts">
            <AdminBlogManager />
          </TabsContent>

          <TabsContent value="blog-claims">
            <BlogPostClaimsManager />
          </TabsContent>

          <TabsContent value="ai-posts">
            <AIPostsManager />
          </TabsContent>



          <TabsContent value="content-filter">
            <ContentFilterManager />
          </TabsContent>

          <TabsContent value="moderation-queue">
            <ContentModerationQueue />
          </TabsContent>

          <TabsContent value="trial-cleanup">
            <TrialPostCleanupManager />
          </TabsContent>

          <TabsContent value="blog-management">
            <BlogManagementPanel />
          </TabsContent>

          <TabsContent value="affiliates">
            <AdminAffiliateManager />
          </TabsContent>

          <TabsContent value="auth-test">
            <AuthEmailTest />
          </TabsContent>



          <TabsContent value="deployment">
            <DeploymentStatus />
          </TabsContent>

          <TabsContent value="database">
            <SystemStatusCheck />
          </TabsContent>

          <TabsContent value="smtp-test">
            <SMTPConfigTest />
          </TabsContent>

          <TabsContent value="email-test">
            <div className="space-y-6">
              <SupabaseEmailGuide />
              <SupabaseEmailTest />
              <Card>
                <CardHeader>
                  <CardTitle>Manual Email Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailTest />
                </CardContent>
              </Card>
              <EmailSystemManager />
            </div>
          </TabsContent>



          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminDashboard;
