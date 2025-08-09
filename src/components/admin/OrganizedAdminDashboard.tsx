import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedAdminMetrics } from "@/hooks/useEnhancedAdminMetrics";
import { EnhancedAdminOverview } from "@/components/admin/EnhancedAdminOverview";
import { AdminNavigationHeader } from "@/components/admin/AdminNavigationHeader";
import EnhancedUserManagement from "@/components/admin/EnhancedUserManagement";
import { supabase } from '@/integrations/supabase/client';

// Admin Components
import { EnhancedSecurityDashboard } from "@/components/EnhancedSecurityDashboard";
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
import EmailConfigurationTester from "@/components/EmailConfigurationTester";
import FullStoryTestComponent from "@/components/FullStoryTestComponent";
import ResendDirectTest from "@/components/ResendDirectTest";
import EmailServiceDebugger from "@/components/EmailServiceDebugger";
import CORSEmailAlert from "@/components/CORSEmailAlert";
import DatabaseSchemaFix from "@/components/DatabaseSchemaFix";
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
  const { metrics, loading, error, refreshMetrics } = useEnhancedAdminMetrics();
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
    await refreshMetrics();
    toast({
      title: "Enhanced Metrics Refreshed",
      description: "Dashboard metrics have been updated with the latest real-time data."
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
          <EnhancedAdminOverview />
        )}

        {activeSection === "users" && (
          <div className="space-y-6">
            <DatabaseSchemaFix />
            <AdminUserDashboard />
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="assessment">Systems Assessment</TabsTrigger>
              <TabsTrigger value="environment">Environment & API Keys</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
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

            <TabsContent value="network">
              <div className="space-y-6">
                <FullStoryTestComponent />
                <ServiceConnectionStatus />
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
                <CORSEmailAlert />
                <EmailServiceDebugger />
                <ResendDirectTest />
                <EmailConfigurationTester />
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
            <EnhancedSecurityDashboard />
          </div>
        )}

        {activeSection === "payment-testing" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Integration Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Test payment integration functionality including Stripe payment flows.
                  </p>
                  <Button
                    onClick={() => window.open('/admin/payment-test', '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Open Payment Test Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
