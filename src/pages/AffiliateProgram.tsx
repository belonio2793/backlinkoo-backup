import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateService } from '@/services/affiliateService';
import type { User } from '@supabase/supabase-js';
import type { AffiliateProgram, AffiliateReferral } from '@/integrations/supabase/affiliate-types';
import { 
  DollarSign, 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Shield,
  Copy,
  ExternalLink,
  Eye,
  MousePointer,
  UserPlus,
  CreditCard,
  Calendar,
  Mail,
  Target
} from 'lucide-react';

const AffiliateProgram = () => {
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateProgram | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [stats, setStats] = useState({
    total_clicks: 0,
    total_conversions: 0,
    conversion_rate: 0,
    total_commission: 0,
    pending_commission: 0,
    paid_commission: 0
  });
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [customId, setCustomId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      setUser(authUser);
      await loadAffiliateData(authUser.id);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAffiliateData = async (userId: string) => {
    try {
      const affiliateData = await AffiliateService.getAffiliateByUserId(userId);
      setAffiliate(affiliateData);

      if (affiliateData) {
        const [referralsData, statsData] = await Promise.all([
          AffiliateService.getAffiliateReferrals(affiliateData.id),
          AffiliateService.getAffiliateStats(affiliateData.id)
        ]);

        setReferrals(referralsData);
        setStats(statsData);

        // Load detailed referred users data
        await loadReferredUsers(referralsData);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate data.',
        variant: 'destructive'
      });
    }
  };

  const loadReferredUsers = async (referralsData: AffiliateReferral[]) => {
    try {
      const userIds = referralsData
        .filter(r => r.referred_user_id)
        .map(r => r.referred_user_id);

      if (userIds.length === 0) {
        setReferredUsers([]);
        return;
      }

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, created_at')
        .in('user_id', userIds);

      // Get user spending data
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, amount, created_at, status')
        .in('user_id', userIds)
        .eq('status', 'completed');

      // Combine data
      const usersWithData = profiles?.map(profile => {
        const userOrders = orders?.filter(o => o.user_id === profile.user_id) || [];
        const totalSpent = userOrders.reduce((sum, order) => sum + order.amount, 0);
        const referralData = referralsData.find(r => r.referred_user_id === profile.user_id);

        return {
          ...profile,
          total_spent: totalSpent,
          orders_count: userOrders.length,
          commission_earned: referralData?.commission_earned || 0,
          last_order: userOrders.length > 0 ? userOrders[userOrders.length - 1].created_at : null,
          referral_date: referralData?.created_at
        };
      }) || [];

      setReferredUsers(usersWithData);
    } catch (error) {
      console.error('Error loading referred users:', error);
    }
  };

  const createAffiliateAccount = async () => {
    if (!user) return;

    try {
      const newAffiliate = await AffiliateService.createAffiliateProgram(user.id, customId);
      setAffiliate(newAffiliate);
      await loadAffiliateData(user.id);
      
      toast({
        title: 'Welcome to our Affiliate Program!',
        description: 'Your affiliate account has been created successfully.',
      });
    } catch (error) {
      console.error('Affiliate registration error:', error);
      toast({
        title: 'Registration Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, show marketing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold">Affiliate Program</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/login")}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Marketing Content */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-blue-50/30">
          <div className="container mx-auto text-center max-w-4xl">
            <Badge variant="outline" className="mb-4">
              💰 Industry-Leading Commission
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Earn <span className="text-primary">50% Commission</span>
              <br />
              On Every Referral
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create an account to join our affiliate program and start earning substantial commissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
                Sign Up to Join Program
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50%</div>
                <div className="text-sm text-muted-foreground">Commission</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Lifetime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">$100</div>
                <div className="text-sm text-muted-foreground">Min Payout</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Join Our Program?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Track everything in real-time with detailed analytics
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <MousePointer className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Click Tracking</h3>
                  <p className="text-muted-foreground">
                    Monitor every click on your affiliate links with real-time analytics.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">User Details</h3>
                  <p className="text-muted-foreground">
                    See detailed information about users you refer, including their spending.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Commission Tracking</h3>
                  <p className="text-muted-foreground">
                    Track your 50% commission on every transaction in real-time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If user is logged in but not an affiliate
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold">Affiliate Program</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Join Our Affiliate Program
              </CardTitle>
              <CardDescription>
                Create your affiliate account and start earning 50% commission on referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">50% Commission</div>
                  <div className="text-sm text-muted-foreground">On all referral spending</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">Monthly Payouts</div>
                  <div className="text-sm text-muted-foreground">$100 minimum threshold</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">Real-time Tracking</div>
                  <div className="text-sm text-muted-foreground">Monitor your performance</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customId">Custom Affiliate ID (Optional)</Label>
                  <Input
                    id="customId"
                    placeholder="Enter your preferred custom ID (8 characters max)"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value.toUpperCase().slice(0, 8))}
                    maxLength={8}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to auto-generate. Only letters and numbers allowed.
                  </p>
                </div>

                <Button 
                  onClick={createAffiliateAccount} 
                  size="lg" 
                  className="w-full"
                >
                  Create Affiliate Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is logged in and is an affiliate - show dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Affiliate Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and earnings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                      <p className="text-3xl font-bold">${affiliate.total_earnings.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-3xl font-bold text-orange-600">${affiliate.pending_earnings.toFixed(2)}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Referrals</p>
                      <p className="text-3xl font-bold">{referredUsers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                      <p className="text-3xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Links</CardTitle>
                <CardDescription>Share these links to start earning commissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your Affiliate ID</Label>
                  <div className="flex items-center gap-2">
                    <Input value={affiliate.custom_id} readOnly className="font-mono" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(affiliate.custom_id, 'Affiliate ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Referral URL</Label>
                  <div className="flex items-center gap-2">
                    <Input value={affiliate.referral_url} readOnly className="text-sm" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(affiliate.referral_url, 'Referral URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(affiliate.referral_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referred Users</CardTitle>
                <CardDescription>Users you've referred and their lifetime value</CardDescription>
              </CardHeader>
              <CardContent>
                {referredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No referrals yet. Start sharing your link!</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Your Commission</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Last Order</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referredUsers.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {user.display_name || 'Anonymous User'}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(user.referral_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono">
                              ${user.total_spent.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-mono text-green-600">
                              ${user.commission_earned.toFixed(2)}
                            </TableCell>
                            <TableCell>{user.orders_count}</TableCell>
                            <TableCell>
                              {user.last_order 
                                ? new Date(user.last_order).toLocaleDateString()
                                : 'No orders yet'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Click & Conversion Tracking</CardTitle>
                <CardDescription>Monitor your referral link performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <MousePointer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.total_clicks || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <UserPlus className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.total_conversions}</div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{stats.conversion_rate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground">
                  <p>Detailed click tracking analytics will be displayed here.</p>
                  <p className="text-sm">Track every interaction with your referral links in real-time.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout Management</CardTitle>
                <CardDescription>Request payouts and view payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">${affiliate.total_paid.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">${affiliate.pending_earnings.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">Monthly</div>
                    <div className="text-sm text-muted-foreground">Payout Schedule</div>
                  </div>
                </div>

                {affiliate.pending_earnings >= 100 ? (
                  <div className="text-center">
                    <Button size="lg">
                      Request Payout (${affiliate.pending_earnings.toFixed(2)})
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Minimum payout threshold reached
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Minimum payout amount is $100</p>
                    <p className="text-sm">
                      You need ${(100 - affiliate.pending_earnings).toFixed(2)} more in commissions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AffiliateProgram;
