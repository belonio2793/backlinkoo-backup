import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useToast } from "@/hooks/use-toast";
import { useUnifiedAdminMetrics } from "@/hooks/useUnifiedAdminMetrics";
import { AdminNavigationHeader } from "@/components/admin/AdminNavigationHeader";
import { supabase } from '@/integrations/supabase/client';
import { adminAuditLogger } from '@/services/adminAuditLogger';

// Essential Components Only
import { SimplifiedUserManagement } from "@/components/admin/SimplifiedUserManagement";
import { AdminConnectionDebugger } from "@/components/admin/AdminConnectionDebugger";
import { QuickConnectionTest } from "@/components/admin/QuickConnectionTest";
import { MetricsRefreshButton } from "@/components/admin/MetricsRefreshButton";
import { BlogPostsDebugger } from "@/components/admin/BlogPostsDebugger";
import { BlogManagerTestButton } from "@/components/admin/BlogManagerTestButton";
import { AdminBlogManager } from "@/components/admin/AdminBlogManager";
import { SystemStatusPanelWithTester } from "@/components/admin/SystemStatusPanel";
import { ServiceConnectionStatus } from "@/components/admin/ServiceConnectionStatus";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { NetlifyEnvironmentManager } from "@/components/admin/NetlifyEnvironmentManager";
import { EmailSystemManagerSafe } from "@/components/admin/EmailSystemManagerSafe";
import { SecurityDashboard } from "@/components/SecurityDashboard";

import {
  Users,
  Activity,
  CreditCard,
  FileText,
  RefreshCw,
  MonitorSpeaker,
  Database,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export function StreamlinedAdminDashboard() {
  const { toast } = useToast();
  const { metrics, loading, error, refetch, clearCache } = useUnifiedAdminMetrics();
  const [activeSection, setActiveSection] = useState("overview");
  const [adminEmail, setAdminEmail] = useState<string | undefined>();

  // Get admin user info and initialize audit logger
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setAdminEmail(user.email);

          // Initialize audit logger
          await adminAuditLogger.initialize();

          // Log admin dashboard access
          await adminAuditLogger.logSystemAction(
            'ADMIN_LOGIN',
            {
              section: 'admin_dashboard',
              action: 'dashboard_access',
              timestamp: new Date().toISOString()
            }
          );
        }
      } catch (error) {
        console.warn('Could not initialize admin:', error);
      }
    };

    initializeAdmin();
  }, []);

  const handleRefreshMetrics = async () => {
    try {
      clearCache();
      await refetch();

      // Log the metrics refresh action
      await adminAuditLogger.logSystemAction(
        'METRICS_VIEWED',
        {
          section: 'admin_dashboard',
          action: 'refresh_metrics',
          timestamp: new Date().toISOString()
        }
      );

      toast({
        title: "Metrics Refreshed",
        description: "Dashboard metrics have been updated with the latest data from Supabase."
      });
    } catch (error) {
      // Log failed metrics refresh
      await adminAuditLogger.logSystemAction(
        'METRICS_VIEWED',
        {
          section: 'admin_dashboard',
          action: 'refresh_metrics_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        error instanceof Error ? error.message : 'Failed to refresh metrics'
      );

      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard metrics",
        variant: "destructive"
      });
    }
  };

  const getMetricCard = (
    title: string,
    value: number | undefined,
    description: string,
    icon: React.ElementType,
    format: 'number' | 'currency' = 'number',
    trend?: number
  ) => {
    const formatValue = (val: number) => {
      if (format === 'currency') {
        return `$${val.toFixed(2)}`;
      }
      return val.toLocaleString();
    };

    const getTrendIcon = () => {
      if (!trend) return null;
      if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
      if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
      return null;
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value !== undefined ? formatValue(value) : '—'}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{description}</span>
            {getTrendIcon()}
          </div>
        </CardContent>
      </Card>
    );
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
        {/* Error State */}
        {error && (
          <div className="space-y-4 mb-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <div className="font-medium">Failed to load metrics</div>
                <div className="text-sm mt-1">{error}</div>
              </AlertDescription>
            </Alert>
            <QuickConnectionTest />
          </div>
        )}

        {/* Database Connection Status */}
        {metrics && (
          <Alert className={`mb-6 ${metrics.databaseConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {metrics.databaseConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={metrics.databaseConnected ? 'text-green-700' : 'text-red-700'}>
              <div className="flex items-center justify-between">
                <span>
                  {metrics.databaseConnected 
                    ? `✅ Database connected - ${metrics.tablesAccessible}/7 tables accessible`
                    : '❌ Database connection issues detected'
                  }
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshMetrics}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <MetricsRefreshButton />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Section Content */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getMetricCard(
                "Total Users",
                metrics?.totalUsers,
                `${metrics?.recentSignups || 0} new this week`,
                Users
              )}
              
              {getMetricCard(
                "Premium Subscribers",
                metrics?.activeUsers,
                "Active subscriptions",
                Activity
              )}
              
              {getMetricCard(
                "Monthly Revenue",
                metrics?.monthlyRevenue,
                "This month",
                CreditCard,
                'currency'
              )}
              
              {getMetricCard(
                "Blog Posts",
                metrics?.totalBlogPosts,
                `${metrics?.publishedBlogPosts || 0} published`,
                FileText
              )}
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getMetricCard(
                "Campaigns",
                metrics?.totalCampaigns,
                `${metrics?.activeCampaigns || 0} active`,
                Database
              )}
              
              {getMetricCard(
                "Trial Posts",
                metrics?.trialBlogPosts,
                `${metrics?.claimedPosts || 0} claimed`,
                FileText
              )}
              
              {getMetricCard(
                "Total Revenue",
                metrics?.totalRevenue,
                `${metrics?.completedOrders || 0} orders`,
                CreditCard,
                'currency'
              )}
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Connection Status:</span>
                      <Badge variant={metrics?.databaseConnected ? "default" : "destructive"}>
                        {metrics?.databaseConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Accessible Tables:</span>
                      <span className="font-mono">{metrics?.tablesAccessible || 0}/7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeSection === "users" && (
          <div className="space-y-6">
            <QuickConnectionTest />
            <SimplifiedUserManagement />
          </div>
        )}

        {activeSection === "content" && (
          <div className="space-y-6">
            <BlogPostsDebugger />
            <div className="flex gap-4">
              <BlogManagerTestButton />
            </div>
            <AdminBlogManager />
          </div>
        )}

        {activeSection === "system" && (
          <Tabs defaultValue="status" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">System Status</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <div className="space-y-6">
                <AdminConnectionDebugger />
                <SystemStatusPanel />
              </div>
            </TabsContent>

            <TabsContent value="environment">
              <NetlifyEnvironmentManager />
            </TabsContent>

            <TabsContent value="deployment">
              <DeploymentStatus />
            </TabsContent>
          </Tabs>
        )}

        {activeSection === "communications" && (
          <div className="space-y-6">
            <EmailSystemManagerSafe />
          </div>
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
