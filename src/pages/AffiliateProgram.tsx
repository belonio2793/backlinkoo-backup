import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Zap,
  BarChart3,
  Globe,
  Star
} from 'lucide-react';

const AffiliateProgram = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Affiliate Program</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/login")}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/login")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            💰 Industry-Leading Commission Rate
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
            <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
              Join Now - It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
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
            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">50% Commission</h3>
              <p className="text-muted-foreground">
                Earn 50% of all customer spending. No caps, no limits on your earning potential.
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lifetime Value</h3>
              <p className="text-muted-foreground">
                Once referred, customers are permanently yours. Earn from all future purchases.
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Monthly Payouts</h3>
              <p className="text-muted-foreground">
                Get paid monthly when you reach $100. Fast, reliable payments via PayPal.
              </p>
            </Card>
          </div>

          {/* Additional Benefits */}
          <div className="bg-muted/50 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-center mb-8">What You Get</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-medium">Real-time Analytics</div>
                <div className="text-sm text-muted-foreground">Track clicks and conversions live</div>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-medium">Marketing Materials</div>
                <div className="text-sm text-muted-foreground">Banners, emails & landing pages</div>
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
      <section id="how-it-works" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Start earning in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up & Get Links</h3>
              <p className="text-muted-foreground mb-4">
                Create your free account and get your unique referral link and custom tracking ID instantly.
              </p>
              <div className="text-sm bg-background p-3 rounded-lg border font-mono">
                backlinkoo.com/?ref=YOUR_CODE
              </div>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Promote</h3>
              <p className="text-muted-foreground mb-4">
                Share your link through social media, email, your website, or any marketing channel.
              </p>
              <div className="flex justify-center gap-2 text-sm flex-wrap">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Blog Posts</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Social Media</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Email Lists</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Commission</h3>
              <p className="text-muted-foreground mb-4">
                Get paid 50% of all spending from your referred customers for their entire lifetime.
              </p>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="text-lg font-semibold text-green-800">$350 spent = $175 earned</div>
                <div className="text-sm text-green-600">Example commission calculation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground">What our top affiliates are earning</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-0 shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <div className="text-3xl font-bold text-primary mb-2">$8,400</div>
              <div className="text-sm text-muted-foreground mb-4">Monthly earnings</div>
              <p className="text-muted-foreground italic mb-4">
                "The 50% commission is incredible. I earn more from referrals than my consulting work!"
              </p>
              <div className="mt-4">
                <div className="font-medium">Sarah K.</div>
                <div className="text-sm text-muted-foreground">SEO Consultant</div>
              </div>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <div className="text-3xl font-bold text-primary mb-2">$3,200</div>
              <div className="text-sm text-muted-foreground mb-4">First month</div>
              <p className="text-muted-foreground italic mb-4">
                "I shared with my email list and earned $3,200 in my very first month."
              </p>
              <div className="mt-4">
                <div className="font-medium">Mike R.</div>
                <div className="text-sm text-muted-foreground">Digital Marketer</div>
              </div>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <div className="text-3xl font-bold text-primary mb-2">$12,000</div>
              <div className="text-sm text-muted-foreground mb-4">Best month so far</div>
              <p className="text-muted-foreground italic mb-4">
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
            <p className="text-xl text-muted-foreground">Everything you need to know</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">How much can I earn?</h3>
              <p className="text-muted-foreground">
                There's no limit to your earnings. You earn 50% of everything your customers spend, forever. Top affiliates earn $5,000+ monthly.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">When do I get paid?</h3>
              <p className="text-muted-foreground">
                Monthly payments when you reach $100 minimum via PayPal, bank transfer, or cryptocurrency.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">How long do referrals last?</h3>
              <p className="text-muted-foreground">
                Forever! Once someone signs up through your link, they're permanently tied to your account.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do I need experience?</h3>
              <p className="text-muted-foreground">
                No experience required! We provide all marketing materials and dedicated support to help you succeed.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">What marketing support do you provide?</h3>
              <p className="text-muted-foreground">
                Banners, email templates, landing pages, social media content, and a personal affiliate manager for top performers.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I promote on social media?</h3>
              <p className="text-muted-foreground">
                Absolutely! Promote on Facebook, Twitter, LinkedIn, YouTube, or any platform with honest, value-driven content.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Timeline */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Payment Timeline</h2>
            <p className="text-xl text-muted-foreground">How and when you get paid</p>
          </div>

          <div className="bg-background rounded-2xl p-8 shadow-lg border max-w-4xl mx-auto">
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

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-12 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of marketers earning substantial commissions with our industry-leading affiliate program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
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
                <div className="text-sm text-muted-foreground">Commission Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">∞</div>
                <div className="text-sm text-muted-foreground">Lifetime Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">$0</div>
                <div className="text-sm text-muted-foreground">Setup Cost</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-muted-foreground">
            Questions about our affiliate program? 
            <a href="mailto:affiliates@backlinkoo.com" className="text-primary hover:underline ml-1">
              Contact our affiliate team
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AffiliateProgram;
