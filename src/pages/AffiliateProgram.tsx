import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateService } from '@/services/affiliateService';
import type { User } from '@supabase/supabase-js';
import {
  DollarSign,
  ArrowRight,
  Users,
  TrendingUp,
  Shield,
  Copy,
  ExternalLink,
  MousePointer,
  UserPlus,
  CreditCard,
  Calendar,
  Mail,
  Target,
  Infinity,
  Code,
  BarChart,
  Globe,
  Share2,
  Download,
  Image,
  MessageSquare
} from 'lucide-react';

const AffiliateProgram = () => {
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [customId, setCustomId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_clicks: 0,
    total_conversions: 0,
    conversion_rate: 0,
    total_commission: 0
  });
  const [trackingPixels, setTrackingPixels] = useState<any[]>([]);
  const [newPixelName, setNewPixelName] = useState('');
  const [newPixelCode, setNewPixelCode] = useState('');
  const [referralSources, setReferralSources] = useState<any[]>([]);
  const [previousStats, setPreviousStats] = useState<any>(null);
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
        const statsData = await AffiliateService.getAffiliateStats(affiliateData.id);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
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

  const addTrackingPixel = () => {
    if (!newPixelName.trim() || !newPixelCode.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both name and pixel code.',
        variant: 'destructive'
      });
      return;
    }

    const newPixel = {
      id: Date.now().toString(),
      name: newPixelName,
      code: newPixelCode,
      platform: detectPlatform(newPixelCode),
      created_at: new Date().toISOString()
    };

    setTrackingPixels([...trackingPixels, newPixel]);
    setNewPixelName('');
    setNewPixelCode('');

    toast({
      title: 'Pixel Added',
      description: `${newPixel.name} tracking pixel has been saved.`,
    });
  };

  const detectPlatform = (code: string) => {
    if (code.includes('facebook') || code.includes('fbq')) return 'Facebook';
    if (code.includes('google') || code.includes('gtag')) return 'Google';
    if (code.includes('twitter') || code.includes('twq')) return 'Twitter';
    if (code.includes('tiktok')) return 'TikTok';
    if (code.includes('linkedin')) return 'LinkedIn';
    return 'Custom';
  };

  const removeTrackingPixel = (id: string) => {
    setTrackingPixels(trackingPixels.filter(pixel => pixel.id !== id));
    toast({
      title: 'Pixel Removed',
      description: 'Tracking pixel has been deleted.',
    });
  };

  const resetAnalytics = () => {
    // Save current stats for undo
    setPreviousStats({ ...stats });

    // Reset stats to zero
    setStats({
      total_clicks: 0,
      total_conversions: 0,
      conversion_rate: 0,
      total_commission: 0
    });

    toast({
      title: 'Analytics Reset',
      description: 'All analytics values have been reset to 0.',
    });
  };

  const undoReset = () => {
    if (previousStats) {
      setStats(previousStats);
      setPreviousStats(null);

      toast({
        title: 'Reset Undone',
        description: 'Analytics values have been restored.',
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

  // If user is not logged in, show sign up prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <Infinity className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
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
              🔒 Account Required
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Earn <span className="text-primary">50% Commission</span>
              <br />
              With Detailed Tracking
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create an account to access our comprehensive affiliate dashboard with click tracking, user details, and commission analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
                Sign Up to Join Program
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
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
                    See detailed information about users you refer, including email and spending.
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
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <Infinity className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/login');
                }}>
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
                Create your affiliate account to access detailed tracking and analytics
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
                  <MousePointer className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">Click Analytics</div>
                  <div className="text-sm text-muted-foreground">Real-time tracking</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">User Details</div>
                  <div className="text-sm text-muted-foreground">Email & spending data</div>
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

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">What you'll get:</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ Unique affiliate ID and tracking links</li>
                  <li>✓ Real-time click and conversion analytics</li>
                  <li>✓ Detailed user information including emails</li>
                  <li>✓ Lifetime spending tracking per user</li>
                  <li>✓ 50% commission on all transactions</li>
                  <li>✓ Monthly payouts when you reach $100</li>
                </ul>
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
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Infinity className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={async () => {
                await supabase.auth.signOut();
                navigate('/login');
              }}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              ← Home
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and earnings in real-time</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                      <p className="text-3xl font-bold">${affiliate.total_earnings?.toFixed(2) || '0.00'}</p>
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
                      <p className="text-3xl font-bold text-orange-600">${affiliate.pending_earnings?.toFixed(2) || '0.00'}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                      <p className="text-3xl font-bold">{stats.total_clicks}</p>
                    </div>
                    <MousePointer className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                      <p className="text-3xl font-bold">{stats.total_conversions}</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Your Affiliate Links</CardTitle>
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

            {/* Promotion Materials */}
            <Card>
              <CardHeader>
                <CardTitle>Marketing Resources</CardTitle>
                <CardDescription>Access professional promotional materials to boost your referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Download className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Promotion Materials</h3>
                      <p className="text-sm text-muted-foreground">Email templates, banners, social media posts & more</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/affiliate/promotion-materials')}
                    className="ml-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Access Materials
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referred Users</CardTitle>
                <CardDescription>Detailed information about users you've referred</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No referrals yet</p>
                  <p className="text-sm text-muted-foreground">
                    When users sign up through your link, their details will appear here including:
                  </p>
                  <div className="mt-4 text-sm space-y-1 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Email addresses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Lifetime expenditure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span>Transaction history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>50% commission calculations</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Analytics</CardTitle>
                    <CardDescription>Detailed tracking of clicks, conversions, and referral sources</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      onClick={resetAnalytics}
                      className="text-primary hover:text-primary/80 hover:underline"
                    >
                      Reset to 0
                    </button>
                    {previousStats && (
                      <button
                        onClick={undoReset}
                        className="text-primary hover:text-primary/80 hover:underline"
                      >
                        Undo Reset
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <MousePointer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.total_clicks}</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <UserPlus className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.total_conversions}</div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{stats.conversion_rate?.toFixed(1) || '0.0'}%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>



                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Referral Sources</CardTitle>
                    <CardDescription>Track exactly where your users are coming from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-4">Detailed Referral Tracking</h4>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground mb-3">
                            URLs will auto-populate here when users sign up through your referral links:
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="p-2 bg-muted/30 rounded text-muted-foreground italic">
                              • https://example.com/signup?ref={affiliate.custom_id} - 0 signups, $0.00 spend
                            </div>
                            <div className="p-2 bg-muted/30 rounded text-muted-foreground italic">
                              • https://social-media.com/link?ref={affiliate.custom_id} - 0 signups, $0.00 spend
                            </div>
                            <div className="p-2 bg-muted/30 rounded text-muted-foreground italic">
                              • https://blog-post.com/article?ref={affiliate.custom_id} - 0 signups, $0.00 spend
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Auto-Detection:</strong> Each successful signup will automatically detect and list the exact URL where the user clicked your referral link, along with signup count and total spending for that specific URL.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Pixels & Conversion Codes</CardTitle>
                <CardDescription>Manage your tracking pixels for ad spend analysis and conversion optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Pixel */}
                <div className="border rounded-lg p-6 bg-gradient-to-br from-primary/5 to-blue-50">
                  <h3 className="text-lg font-semibold mb-4">Add New Tracking Pixel</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="pixelName">Pixel Name</Label>
                      <Input
                        id="pixelName"
                        placeholder="e.g., Facebook Conversion Pixel"
                        value={newPixelName}
                        onChange={(e) => setNewPixelName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pixelCode">Platform</Label>
                      <Input
                        placeholder="Auto-detected from code"
                        value={detectPlatform(newPixelCode)}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="pixelCode">Tracking Code</Label>
                    <textarea
                      id="pixelCode"
                      className="w-full p-3 border rounded-lg font-mono text-sm"
                      rows={4}
                      placeholder="Paste your tracking pixel code here..."
                      value={newPixelCode}
                      onChange={(e) => setNewPixelCode(e.target.value)}
                    />
                  </div>
                  <Button onClick={addTrackingPixel} className="w-full">
                    <Code className="h-4 w-4 mr-2" />
                    Save Tracking Pixel
                  </Button>
                </div>

                {/* Saved Pixels */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Tracking Pixels</h3>
                  {trackingPixels.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2">No tracking pixels added yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add tracking pixels from platforms like Facebook, Google, Twitter, TikTok, etc.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {trackingPixels.map((pixel) => (
                        <Card key={pixel.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">{pixel.name}</h4>
                                <Badge variant="outline" className="mt-1">
                                  {pixel.platform}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTrackingPixel(pixel.id)}
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                              {pixel.code}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(pixel.code, 'Pixel code')}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Code
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                Added {new Date(pixel.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conversion Tracking Info */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">💡 Conversion Tracking Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-green-700">
                    <div className="space-y-2 text-sm">
                      <p>• Use these pixels to track the effectiveness of your advertising campaigns</p>
                      <p>• Monitor which traffic sources convert best for affiliate referrals</p>
                      <p>• Calculate your customer acquisition cost (CAC) vs commission earned</p>
                      <p>• Optimize ad spend by focusing on highest-converting sources</p>
                      <p>• Track lifetime value of referred customers for better ROI analysis</p>
                    </div>
                  </CardContent>
                </Card>
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
                    <div className="text-2xl font-bold text-green-600">${affiliate.total_paid?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">${affiliate.pending_earnings?.toFixed(2) || '0.00'}</div>
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
                      You need ${(100 - (affiliate.pending_earnings || 0)).toFixed(2)} more in commissions
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
