import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateRegistration } from '@/components/affiliate/AffiliateRegistration';
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard';
import { AffiliateService } from '@/services/affiliateService';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { AffiliateProgram } from '@/integrations/supabase/affiliate-types';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const AffiliateProgram = () => {
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const affiliateData = await AffiliateService.getAffiliateByUserId(user.id);
        setAffiliate(affiliateData);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationComplete = (newAffiliate: AffiliateProgram) => {
    setAffiliate(newAffiliate);
    toast({
      title: 'Welcome!',
      description: 'You have successfully joined our affiliate program.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <DollarSign className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Affiliate Program</h1>
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

        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-blue-50/30">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-light mb-6 tracking-tight">
              Partner with Us & Earn 50%
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
              Join thousands of marketers earning substantial commissions by referring clients to our premium SEO platform.
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get your unique tracking link, share it with your audience, and earn 50% of everything they spend — forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
                Join Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6"
              >
                Learn How It Works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">50%</div>
                <div className="text-sm text-muted-foreground">Commission Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">$100</div>
                <div className="text-sm text-muted-foreground">Min. Payout</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">∞</div>
                <div className="text-sm text-muted-foreground">Lifetime Value</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-tight">Why Join Our Program?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We offer one of the most generous affiliate programs in the SEO industry with industry-leading commission rates and lifetime customer value.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center p-8 border-0 shadow-lg">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-4">50% Commission</h3>
                <p className="text-muted-foreground mb-4">
                  Earn 50% of all spending from customers you refer. No caps, no limits on your earnings potential.
                </p>
                <div className="text-sm text-primary font-medium">Industry-leading rate</div>
              </Card>

              <Card className="text-center p-8 border-0 shadow-lg">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-4">Monthly Payouts</h3>
                <p className="text-muted-foreground mb-4">
                  Get paid monthly when your earnings reach $100 minimum threshold via PayPal or bank transfer.
                </p>
                <div className="text-sm text-primary font-medium">Fast & reliable payments</div>
              </Card>

              <Card className="text-center p-8 border-0 shadow-lg">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-4">Lifetime Value</h3>
                <p className="text-muted-foreground mb-4">
                  Once referred, customers are permanently tied to your account. Earn from all their future purchases.
                </p>
                <div className="text-sm text-primary font-medium">Recurring income potential</div>
              </Card>
            </div>

            {/* Additional Benefits */}
            <div className="bg-muted/50 rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-center mb-8">Additional Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Real-time Tracking</div>
                  <div className="text-sm text-muted-foreground">Monitor clicks, conversions & earnings live</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Marketing Materials</div>
                  <div className="text-sm text-muted-foreground">Banners, email templates & landing pages</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Dedicated Support</div>
                  <div className="text-sm text-muted-foreground">Personal affiliate manager for top performers</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">No Minimum Traffic</div>
                  <div className="text-sm text-muted-foreground">Start earning regardless of audience size</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-tight">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start earning in minutes with our simple 3-step process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Sign Up & Get Your Links</h3>
                <p className="text-muted-foreground mb-4">
                  Create your free account and instantly receive your unique referral link and custom tracking ID.
                </p>
                <div className="text-sm bg-background p-3 rounded-lg border">
                  <code className="text-primary">backlinkoo.com/?ref=YOUR_CODE</code>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent -translate-x-1/2 z-0"></div>
              </div>

              <div className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Share & Promote</h3>
                <p className="text-muted-foreground mb-4">
                  Share your link through social media, email, your website, or any marketing channel you prefer.
                </p>
                <div className="flex justify-center gap-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Blog Posts</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Social Media</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Email</span>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent -translate-x-1/2 z-0"></div>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Earn Commissions</h3>
                <p className="text-muted-foreground mb-4">
                  Get paid 50% of all spending from customers you refer — for their entire lifetime as customers.
                </p>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-green-800">$350 spent = $175 earned</div>
                  <div className="text-sm text-green-600">Example commission calculation</div>
                </div>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-center mb-6">Payment Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mx-auto mb-3">
                    Day 1
                  </div>
                  <div className="font-medium mb-1">Customer Signs Up</div>
                  <div className="text-sm text-muted-foreground">Via your referral link</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold mx-auto mb-3">
                    Day 2
                  </div>
                  <div className="font-medium mb-1">Customer Purchases</div>
                  <div className="text-sm text-muted-foreground">Credits or subscription</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold mx-auto mb-3">
                    Real-time
                  </div>
                  <div className="font-medium mb-1">Commission Tracked</div>
                  <div className="text-sm text-muted-foreground">Instantly in your dashboard</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold mx-auto mb-3">
                    Monthly
                  </div>
                  <div className="font-medium mb-1">Get Paid</div>
                  <div className="text-sm text-muted-foreground">When you reach $100</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about our affiliate program
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="p-6">
                <h3 className="font-semibold mb-3">How much can I earn?</h3>
                <p className="text-muted-foreground">
                  There's no limit to your earnings. You earn 50% of everything your referred customers spend. Top affiliates earn $5,000+ per month.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">When do I get paid?</h3>
                <p className="text-muted-foreground">
                  Payments are processed monthly when your balance reaches $100. We support PayPal, bank transfers, and cryptocurrency.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">How long do referrals last?</h3>
                <p className="text-muted-foreground">
                  Forever! Once someone signs up through your link, they're permanently tied to your account. You earn from all their future purchases.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">Do I need technical skills?</h3>
                <p className="text-muted-foreground">
                  Not at all! We provide you with ready-to-use links, banners, and marketing materials. Just share and start earning.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">What marketing materials do you provide?</h3>
                <p className="text-muted-foreground">
                  We provide banners, email templates, landing pages, and social media content. Plus detailed analytics to track performance.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">Can I promote on social media?</h3>
                <p className="text-muted-foreground">
                  Absolutely! Share on Facebook, Twitter, LinkedIn, YouTube, or any platform. We encourage honest, value-driven promotion.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-tight">Success Stories</h2>
              <p className="text-xl text-muted-foreground">
                See what our top-performing affiliates are saying
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$8,400</div>
                <div className="text-sm text-muted-foreground mb-4">Monthly earnings</div>
                <p className="text-muted-foreground italic mb-4">
                  "I started promoting Backlink ∞ to my SEO clients and now earn more from referrals than my consulting work!"
                </p>
                <div className="font-medium">Sarah K.</div>
                <div className="text-sm text-muted-foreground">SEO Consultant</div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$3,200</div>
                <div className="text-sm text-muted-foreground mb-4">First month earnings</div>
                <p className="text-muted-foreground italic mb-4">
                  "The 50% commission rate is incredible. I shared with my email list and earned $3,200 in my first month."
                </p>
                <div className="font-medium">Mike R.</div>
                <div className="text-sm text-muted-foreground">Digital Marketer</div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$12,000</div>
                <div className="text-sm text-muted-foreground mb-4">Best month so far</div>
                <p className="text-muted-foreground italic mb-4">
                  "The lifetime value is amazing. Customers I referred 6 months ago are still generating commissions!"
                </p>
                <div className="font-medium">Alex M.</div>
                <div className="text-sm text-muted-foreground">Agency Owner</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="container mx-auto text-center">
            <div className="bg-gradient-to-br from-primary/10 to-blue-50 rounded-3xl p-12 max-w-4xl mx-auto">
              <h2 className="text-4xl font-light mb-6 tracking-tight">
                Ready to Start Earning?
              </h2>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of marketers earning substantial commissions with our industry-leading affiliate program.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
                  Start Earning Today - Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="text-sm text-muted-foreground">
                  ✓ No cost to join ✓ Instant approval ✓ Start earning immediately
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 max-w-md mx-auto text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">50%</div>
                  <div className="text-sm text-muted-foreground">Commission</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">∞</div>
                  <div className="text-sm text-muted-foreground">Lifetime Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">$0</div>
                  <div className="text-sm text-muted-foreground">Join Cost</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <DollarSign className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Affiliate Program</h1>
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

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue={affiliate ? "dashboard" : "signup"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">
              {affiliate ? "Program Info" : "Join Program"}
            </TabsTrigger>
            <TabsTrigger value="dashboard" disabled={!affiliate}>
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="space-y-6">
            <AffiliateRegistration 
              userId={user.id} 
              onRegistrationComplete={handleRegistrationComplete}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {affiliate && <AffiliateDashboard userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AffiliateProgram;
