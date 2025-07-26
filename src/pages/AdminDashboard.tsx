import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { CampaignManager } from "@/components/CampaignManager";
import { AdminAffiliateManager } from "@/components/admin/AdminAffiliateManager";
import { EmailVerificationTest } from "@/components/EmailVerificationTest";
import { EmailVerificationStatus } from "@/components/EmailVerificationStatus";
import { ResendConnectionTest } from "@/components/ResendConnectionTest";
import { TestEmailSender } from "@/components/TestEmailSender";
import { EmailSystemManager } from "@/components/admin/EmailSystemManager";
import { EmailTest } from "@/components/EmailTest";
import { SMTPConfigTest } from "@/components/SMTPConfigTest";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { TestSupabaseConnection } from "@/components/TestSupabaseConnection";
import { SystemStatusCheck } from "@/components/SystemStatusCheck";
import {
  Users,
  Activity,
  CreditCard,
  Settings,
  CheckCircle,
  Clock,
  Infinity,
  ExternalLink,
  Shield
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
              <h1 className="text-xl font-semibold">Backlink ∞ Admin</h1>
            </div>
            <Badge variant="default" className="gap-1">
              <Users className="h-3 w-3" />
              Administrator
            </Badge>
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

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliate Program</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="smtp-test">SMTP Test</TabsTrigger>
            <TabsTrigger value="email-test">Email System</TabsTrigger>
            <TabsTrigger value="security">Security & Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <CampaignManager />
          </TabsContent>

          <TabsContent value="affiliates">
            <AdminAffiliateManager />
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
              <Card>
                <CardHeader>
                  <CardTitle>Email System Test</CardTitle>
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
    </div>
  );
};

export default AdminDashboard;
