import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowRight, Users, TrendingUp, Shield } from 'lucide-react';

const AffiliateProgram = () => {
  const navigate = useNavigate();

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

      {/* Hero Section */}
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
            Join our affiliate program and earn substantial recurring commissions by referring customers to our premium SEO platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
              Join Now - It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
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

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">50% Commission</h3>
                <p className="text-muted-foreground">
                  Earn 50% of all customer spending. No caps, no limits on your earning potential.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Lifetime Value</h3>
                <p className="text-muted-foreground">
                  Once referred, customers are permanently yours. Earn from all future purchases.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Monthly Payouts</h3>
                <p className="text-muted-foreground">
                  Get paid monthly when you reach $100. Fast, reliable payments via PayPal.
                </p>
              </CardContent>
            </Card>
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
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">$8,400</div>
                <div className="text-sm text-muted-foreground mb-4">Monthly earnings</div>
                <p className="text-muted-foreground italic mb-4">
                  "The 50% commission is incredible. I earn more from referrals than my consulting!"
                </p>
                <div>
                  <div className="font-medium">Sarah K.</div>
                  <div className="text-sm text-muted-foreground">SEO Consultant</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">$3,200</div>
                <div className="text-sm text-muted-foreground mb-4">First month</div>
                <p className="text-muted-foreground italic mb-4">
                  "I shared with my email list and earned $3,200 in my first month."
                </p>
                <div>
                  <div className="font-medium">Mike R.</div>
                  <div className="text-sm text-muted-foreground">Digital Marketer</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">$12,000</div>
                <div className="text-sm text-muted-foreground mb-4">Best month</div>
                <p className="text-muted-foreground italic mb-4">
                  "The lifetime value is amazing. Old customers still generate commissions!"
                </p>
                <div>
                  <div className="font-medium">Alex M.</div>
                  <div className="text-sm text-muted-foreground">Agency Owner</div>
                </div>
              </CardContent>
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
            <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
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
};

export default AffiliateProgram;
