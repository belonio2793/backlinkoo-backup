import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Activity, 
  CreditCard, 
  Settings, 
  CheckCircle,
  Clock,
  Infinity,
  ExternalLink
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Queue */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Campaign Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Campaign {campaign.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Customer: {campaign.userEmail}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created: {campaign.createdAt}
                          </p>
                        </div>
                        <Badge 
                          variant={campaign.status === "pending" ? "secondary" : "outline"}
                          className={campaign.status === "pending" ? "bg-warning/10 text-warning" : ""}
                        >
                          {campaign.status === "pending" ? "Pending" : "In Progress"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Target URL</p>
                          <p className="font-medium flex items-center gap-1">
                            {campaign.targetUrl}
                            <ExternalLink className="h-3 w-3" />
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Requested Links</p>
                          <p className="font-medium">{campaign.requestedLinks} backlinks</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Keywords</p>
                        <p className="text-sm">{campaign.keywords}</p>
                      </div>

                      {campaign.status === "pending" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`urls-${campaign.id}`} className="text-sm font-medium">
                              Completed Backlink URLs (one per line)
                            </Label>
                            <Textarea
                              id={`urls-${campaign.id}`}
                              placeholder="https://example1.com/article
https://example2.com/blog-post
https://example3.com/resource"
                              value={completionUrls}
                              onChange={(e) => setCompletionUrls(e.target.value)}
                              className="mt-2"
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleCompleteOrder(campaign.id)}
                              disabled={!completionUrls.trim()}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete Order
                            </Button>
                            <Button variant="outline">
                              Mark In Progress
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Payment Gateway Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stripe-toggle" className="text-sm font-medium">
                    Stripe
                  </Label>
                  <Switch
                    id="stripe-toggle"
                    checked={paymentSettings.stripe}
                    // onChange handler would update Supabase
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="paypal-toggle" className="text-sm font-medium">
                    PayPal
                  </Label>
                  <Switch
                    id="paypal-toggle"
                    checked={paymentSettings.paypal}
                    // onChange handler would update Supabase
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="wise-toggle" className="text-sm font-medium">
                    Wise
                  </Label>
                  <Switch
                    id="wise-toggle"
                    checked={paymentSettings.wise}
                    // onChange handler would update Supabase
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Credit Pricing</p>
                  <p className="text-sm text-muted-foreground">$0.70 per credit</p>
                  <p className="text-sm text-muted-foreground">1 credit = 1 backlink</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View All Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Transaction History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Campaign Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;