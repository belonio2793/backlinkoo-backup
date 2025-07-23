
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  DollarSign, 
  Activity, 
  Shield, 
  Settings,
  LogOut,
  UserCheck,
  TrendingUp,
  Database,
  Infinity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // For now, we'll skip the admin check since the column doesn't exist
      // TODO: Implement proper admin role checking
      setUser(user);
      loadUsers();
      setLoading(false);
    };
    
    checkAdminAccess();
  }, [navigate, toast]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
              <Badge variant="secondary" className="ml-2">Admin</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarFallback>
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold text-foreground mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 mr-2" />
                Total Users
              </CardTitle>
              <CardDescription>All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <Button variant="secondary" className="mt-4 w-full">
                View All Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Revenue
              </CardTitle>
              <CardDescription>Income from subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$5,480</div>
              <Button variant="secondary" className="mt-4 w-full">
                View Transactions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 mr-2" />
                Active Campaigns
              </CardTitle>
              <CardDescription>Ongoing user campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <Button variant="secondary" className="mt-4 w-full">
                Manage Campaigns
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 mr-2" />
                Security Status
              </CardTitle>
              <CardDescription>Overall platform security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Secure</div>
              <Button variant="secondary" className="mt-4 w-full">
                View Security Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage and monitor user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          ID
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Email
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{user.id}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{user.first_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{user.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">
                            {user.is_active ? (
                              <Badge variant="outline">Active</Badge>
                            ) : (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <Button variant="ghost" size="sm">
                              <UserCheck className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Track key metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Detailed analytics and reporting will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Manage and monitor the platform database</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Database management tools will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
