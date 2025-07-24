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
        <section className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-tight">How It Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your free account and get your unique referral link and custom ID.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Share & Promote</h3>
                <p className="text-muted-foreground">
                  Share your referral link through your networks, websites, or marketing channels.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Earn Commission</h3>
                <p className="text-muted-foreground">
                  Get paid 50% of all spending from customers you refer, for life.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-light mb-6 tracking-tight">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of affiliates earning substantial commissions with our program.
            </p>
            <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
