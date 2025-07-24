import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  Star,
  Clock,
  Target,
  Zap,
  BarChart3,
  Globe,
  CreditCard,
  Mail,
  MessageSquare
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, show marketing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Affiliate Program</span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/login")}>
                Get Started
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              💰 Industry-Leading Commission
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Earn <span className="text-primary">50% Commission</span>
              <br />
              On Every Referral
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our affiliate program and earn substantial recurring commissions by referring customers to our premium SEO platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg">
                Join Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg">
                Learn More
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
              <h2 className="text-3xl font-bold mb-4">Why Choose Our Program?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We offer one of the most generous affiliate programs in the industry
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center p-6">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">50% Commission</h3>
                <p className="text-muted-foreground">
                  Earn 50% of all customer spending. No caps, no limits on your earning potential.
                </p>
              </Card>

              <Card className="text-center p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Lifetime Value</h3>
                <p className="text-muted-foreground">
                  Once referred, customers are permanently yours. Earn from all future purchases.
                </p>
              </Card>

              <Card className="text-center p-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Monthly Payouts</h3>
                <p className="text-muted-foreground">
                  Get paid monthly when you reach $100. Fast, reliable payments via PayPal.
                </p>
              </Card>
            </div>

            {/* Additional Benefits */}
            <div className="bg-muted/50 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-center mb-8">What You Get</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Real-time Analytics</div>
                  <div className="text-sm text-muted-foreground">Track performance live</div>
                </div>
                <div className="text-center">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Marketing Materials</div>
                  <div className="text-sm text-muted-foreground">Banners, emails & more</div>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Dedicated Support</div>
                  <div className="text-sm text-muted-foreground">Personal affiliate manager</div>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="font-medium">Instant Approval</div>
                  <div className="text-sm text-muted-foreground">Start earning immediately</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground">Start earning in 3 simple steps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your free account and get your unique referral link instantly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Share & Promote</h3>
                <p className="text-muted-foreground">
                  Share your link through social media, email, or your website.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Earn Commission</h3>
                <p className="text-muted-foreground">
                  Get paid 50% of all spending from your referred customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
              <p className="text-xl text-muted-foreground">What our affiliates are earning</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$8,400</div>
                <div className="text-sm text-muted-foreground mb-4">Monthly earnings</div>
                <p className="text-muted-foreground italic">
                  "The 50% commission is incredible. I earn more from referrals than my consulting!"
                </p>
                <div className="mt-4">
                  <div className="font-medium">Sarah K.</div>
                  <div className="text-sm text-muted-foreground">SEO Consultant</div>
                </div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$3,200</div>
                <div className="text-sm text-muted-foreground mb-4">First month</div>
                <p className="text-muted-foreground italic">
                  "I shared with my email list and earned $3,200 in my very first month."
                </p>
                <div className="mt-4">
                  <div className="font-medium">Mike R.</div>
                  <div className="text-sm text-muted-foreground">Digital Marketer</div>
                </div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$12,000</div>
                <div className="text-sm text-muted-foreground mb-4">Best month</div>
                <p className="text-muted-foreground italic">
                  "The lifetime value is amazing. Old customers still generate commissions!"
                </p>
                <div className="mt-4">
                  <div className="font-medium">Alex M.</div>
                  <div className="text-sm text-muted-foreground">Agency Owner</div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">How much can I earn?</h3>
                <p className="text-muted-foreground">
                  There's no limit. You earn 50% of everything your customers spend, forever.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">When do I get paid?</h3>
                <p className="text-muted-foreground">
                  Monthly payments when you reach $100 minimum via PayPal or bank transfer.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">How long do referrals last?</h3>
                <p className="text-muted-foreground">
                  Forever! Once someone signs up through your link, they're yours for life.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Do I need experience?</h3>
                <p className="text-muted-foreground">
                  No! We provide all marketing materials and support you need to succeed.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands earning substantial commissions with our program.
              </p>
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg">
                Start Earning Today - Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="mt-6 text-sm text-muted-foreground">
                ✓ No cost to join ✓ Instant approval ✓ Start earning immediately
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If user is logged in, show affiliate dashboard/registration
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Affiliate Program</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
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
