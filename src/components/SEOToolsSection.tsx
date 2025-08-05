import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from '@/utils/errorFormatter';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Target,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
  Calendar,
  BarChart3,
  Shield,
  Globe,
  Link,
  RefreshCw,
  Eye,
  Filter,
  Settings,
  CreditCard,
  Crown,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Download,
  X,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import NoHandsSEODashboard from "@/components/NoHandsSEODashboard";
import SubscriptionService, { type SubscriptionStatus } from "@/services/subscriptionService";
import FeatureAccessGuard from "@/components/FeatureAccessGuard";
import { useOpenPremiumPopup } from "@/components/PremiumPopupProvider";

interface SEOToolsSectionProps {
  user: User | null;
}

interface NoHandsSEOProject {
  id: string;
  name: string;
  target_url: string;
  keywords: string[];
  status: 'active' | 'paused' | 'completed';
  blogs_found: number;
  successful_posts: number;
  created_at: string;
  last_run: string;
}

interface BlogPost {
  id: string;
  project_id: string;
  blog_url: string;
  post_url: string;
  keyword: string;
  status: 'pending' | 'posted' | 'failed';
  posted_at: string;
  name_used: string;
  website_field: string;
}

const SEOToolsSection = ({ user }: SEOToolsSectionProps) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    subscriptionTier: null,
    features: {
      keywordResearch: false,
      automatedCampaigns: false,
      rankTracker: false,
      unlimitedAccess: false,
    }
  });
  const [projects, setProjects] = useState<NoHandsSEOProject[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("keyword-research");
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [billingEmailNotifications, setBillingEmailNotifications] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const { toast } = useToast();
  const { openPremiumPopup, isPremium } = useOpenPremiumPopup();

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      fetchProjects();
      fetchRecentPosts();
      loadBillingEmailPreferences();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await SubscriptionService.getSubscriptionStatus(user);
      setSubscriptionStatus(status);

      // Also get subscription info for the modal
      const info = await SubscriptionService.getSubscriptionInfo(user);
      setSubscriptionInfo(info);
    } catch (error: any) {
      logError('Error checking subscription', error);
      setSubscriptionStatus({
        isSubscribed: false,
        subscriptionTier: null,
        features: {
          keywordResearch: false,
          automatedCampaigns: false,
          rankTracker: false,
          unlimitedAccess: false,
        }
      });
    }
  };

  const fetchProjects = async () => {
    try {
      // For now, set empty projects since the table doesn't exist yet
      setProjects([]);

      // Uncomment when the table is created:
      // const { data, error } = await supabase
      //   .from('no_hands_seo_projects')
      //   .select('*')
      //   .eq('user_id', user?.id)
      //   .order('created_at', { ascending: false });
      //
      // if (!error && data) {
      //   setProjects(data);
      // }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      // For now, set empty posts since the table doesn't exist yet
      setRecentPosts([]);

      // Uncomment when the table is created:
      // const { data, error } = await supabase
      //   .from('blog_posts')
      //   .select('*')
      //   .eq('user_id', user?.id)
      //   .order('posted_at', { ascending: false })
      //   .limit(10);
      //
      // if (!error && data) {
      //   setRecentPosts(data);
      // }
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      setRecentPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const result = await SubscriptionService.createSubscription(user);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Redirect to Stripe checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Use subscription info from service
  const subscriptionData = subscriptionInfo || {
    plan: "Premium SEO Tools",
    price: "$29.00",
    billing: "Monthly",
    nextBillingDate: "March 15, 2024",
    cardLast4: "4242",
    cardBrand: "Visa",
    email: user?.email || "user@example.com",
    status: "Active",
    features: [
      "Unlimited keyword research",
      "Advanced SERP analysis",
      "Automated campaign management",
      "Real-time rank tracking",
      "Priority support",
      "Export capabilities"
    ]
  };

  const handleCancelSubscription = async () => {
    setIsCancellingSubscription(true);
    try {
      const result = await SubscriptionService.cancelSubscription(user);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You'll continue to have access until your current billing period ends.",
      });

      setIsSubscriptionModalOpen(false);
      setShowCancelConfirmation(false);

      // Refresh subscription status
      await checkSubscriptionStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const downloadInvoice = () => {
    toast({
      title: "Invoice Downloaded",
      description: "Your latest invoice has been downloaded to your device.",
    });
  };

  const loadBillingEmailPreferences = async () => {
    try {
      // For now, we'll use localStorage. In production, this would be stored in the database
      const savedPreference = localStorage.getItem(`billing_email_notifications_${user?.id}`);
      if (savedPreference !== null) {
        setBillingEmailNotifications(savedPreference === 'true');
      }
    } catch (error) {
      console.error('Error loading billing email preferences:', error);
    }
  };

  const updateBillingEmailPreferences = async (enabled: boolean) => {
    try {
      // For now, we'll use localStorage. In production, this would update the database
      localStorage.setItem(`billing_email_notifications_${user?.id}`, enabled.toString());

      // Future implementation would call an API to update user preferences
      // const { error } = await supabase
      //   .from('user_preferences')
      //   .upsert({
      //     user_id: user?.id,
      //     billing_email_notifications: enabled,
      //     updated_at: new Date().toISOString()
      //   });

      setBillingEmailNotifications(enabled);
      toast({
        title: enabled ? "Notifications Enabled" : "Notifications Disabled",
        description: `You will ${enabled ? 'now' : 'no longer'} receive billing email notifications.`,
      });
    } catch (error) {
      console.error('Error updating billing email preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update email notification preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!subscriptionStatus.isSubscribed) {
    return (
      <div className="space-y-6">
        {/* Subscription CTA */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">Backlink ∞ Automation Link Building (beta)</CardTitle>
            <p className="text-muted-foreground">
              Automate your link building with our advanced blog scraping and posting system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Unlimited Campaigns</div>
                  <div className="text-sm text-muted-foreground">Create as many projects as you need</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Unlimited Keywords</div>
                  <div className="text-sm text-muted-foreground">Target any number of keywords</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Blog Scraping</div>
                  <div className="text-sm text-muted-foreground">Find relevant blogs automatically</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Auto Posting</div>
                  <div className="text-sm text-muted-foreground">Post backlinks automatically</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Real-time Reporting</div>
                  <div className="text-sm text-muted-foreground">Track successful posts live</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">24/7 Automation</div>
                  <div className="text-sm text-muted-foreground">Works around the clock</div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white p-6 rounded-lg border-2 border-primary/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold">Premium Plan</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">$29</div>
              <div className="text-sm text-muted-foreground mb-4">per month</div>
              <Button onClick={() => {
                console.log('SEO Tools Start Subscription clicked');
                if (isPremium) {
                  toast({
                    title: "Already Premium",
                    description: "You already have an active premium subscription. Enjoy all premium features!",
                    variant: "default",
                  });
                  console.log('User is already premium, showing notification');
                  return;
                }
                console.log('Opening premium popup for non-premium user');
                openPremiumPopup(user?.email);
              }} size="lg" className="w-full" variant={isPremium ? "outline" : "default"}>
                {isPremium ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Premium Active
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Start Subscription
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Cancel anytime • No setup fees • 30-day money back guarantee
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">SEO Tools</h2>
          <Badge variant="secondary" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Premium Active
          </Badge>
        </div>
        <Button variant="outline" onClick={() => setIsSubscriptionModalOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Subscription
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keyword-research">Keyword Research</TabsTrigger>
          <TabsTrigger value="rank-tracker">Rankings</TabsTrigger>
          <TabsTrigger value="no-hands-seo">Backlink ∞ Automation Link Building (beta)</TabsTrigger>
        </TabsList>

        <TabsContent value="no-hands-seo" className="space-y-6">
          <FeatureAccessGuard
            feature="automatedCampaigns"
            featureName="Automated Link Building"
            fallbackMessage="Upgrade to Premium to access our automated link building system with unlimited campaigns and 24/7 automation."
          >
            <NoHandsSEODashboard />
          </FeatureAccessGuard>
        </TabsContent>

        <TabsContent value="keyword-research" className="space-y-6">
          <FeatureAccessGuard
            feature="keywordResearch"
            featureName="Advanced Keyword Research"
            fallbackMessage="Upgrade to Premium for unlimited keyword research with geographic targeting, difficulty analysis, and SERP insights."
          >
            <KeywordResearchTool />
          </FeatureAccessGuard>
        </TabsContent>

        <TabsContent value="rank-tracker" className="space-y-6">
          <FeatureAccessGuard
            feature="rankTracker"
            featureName="Real-time Rank Tracking"
            fallbackMessage="Upgrade to Premium for unlimited rank tracking across multiple search engines with historical data and trend analysis."
          >
            <RankingTracker />
          </FeatureAccessGuard>
        </TabsContent>
      </Tabs>

      {/* Subscription Management Modal */}
      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </DialogTitle>
            <DialogDescription>
              Manage your subscription, billing information, and payment settings.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subscription">Plan</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[50vh] mt-4">
              <TabsContent value="subscription" className="space-y-4 mt-0">
                {/* Current Plan */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Current Plan</h3>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {subscriptionData.status}
                    </Badge>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Plan</p>
                          <p className="font-medium">{subscriptionData.plan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">{subscriptionData.price}/{subscriptionData.billing.toLowerCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Next Billing</p>
                          <p className="font-medium">{subscriptionData.nextBillingDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{subscriptionData.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Features Included */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Features Included</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {subscriptionData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4 mt-0">
                {/* Payment Method */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{subscriptionData.cardBrand} ••••{subscriptionData.cardLast4}</p>
                            <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Update
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Billing History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recent Invoices</h3>
                    <Button variant="outline" size="sm" onClick={downloadInvoice}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Feb 15, 2024</span>
                          <span className="font-medium">$29.00</span>
                          <Badge variant="outline" className="text-xs">Paid</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Jan 15, 2024</span>
                          <span className="font-medium">$29.00</span>
                          <Badge variant="outline" className="text-xs">Paid</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Dec 15, 2023</span>
                          <span className="font-medium">$29.00</span>
                          <Badge variant="outline" className="text-xs">Paid</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-0">
                {/* Account Settings */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Account Settings</h3>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Billing Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive billing and payment alerts</p>
                        </div>
                        <Switch
                          checked={billingEmailNotifications}
                          onCheckedChange={updateBillingEmailPreferences}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cancellation */}
                {!showCancelConfirmation ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                    <Card className="border-red-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-red-800">Cancel Subscription</p>
                            <p className="text-sm text-red-600">You'll continue to have access until your current billing period ends.</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowCancelConfirmation(true)}
                            className="w-full"
                          >
                            Cancel Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <h3 className="font-semibold text-red-800">Confirm Cancellation</h3>
                          </div>
                          <p className="text-sm text-red-700">
                            Are you sure you want to cancel your subscription? You'll lose access to all premium features
                            after {subscriptionData.nextBillingDate}.
                          </p>
                          <div className="space-y-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleCancelSubscription}
                              disabled={isCancellingSubscription}
                              className="w-full"
                            >
                              {isCancellingSubscription ? "Cancelling..." : "Yes, Cancel Subscription"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCancelConfirmation(false)}
                              disabled={isCancellingSubscription}
                              className="w-full"
                            >
                              Keep Subscription
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default SEOToolsSection;
