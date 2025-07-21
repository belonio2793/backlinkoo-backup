import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Infinity, 
  TrendingUp, 
  Shield, 
  Globe, 
  Search,
  Link,
  BarChart3,
  CheckCircle,
  CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentModal } from "@/components/PaymentModal";
import { AnimatedHeadline } from "@/components/AnimatedHeadline";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check for authenticated user on component mount
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Animated headline variations
  const headlineVariations = [
    "Premium Backlinks",
    "Authority Backlinks", 
    "Competition Similar Backlinks",
    "High-DA Backlinks",
    "Niche-Relevant Backlinks",
    "White-Hat Backlinks",
    "Editorial Backlinks",
    "Contextual Backlinks"
  ];

  const features = [
    {
      icon: Link,
      title: "Premium Backlinks",
      description: "High-quality backlinks from authoritative domains to boost your SEO rankings"
    },
    {
      icon: Search,
      title: "Keyword Research",
      description: "Advanced keyword research tools powered by Google Keyword Planner API"
    },
    {
      icon: BarChart3,
      title: "Rank Tracking",
      description: "Monitor your keyword rankings on Google and Bing in real-time"
    },
    {
      icon: Globe,
      title: "SEO Analysis",
      description: "Comprehensive SEO metrics including domain authority (DA), page authority (PA), citation flow (CF), trust factor (TF) analysis"
    },
    {
      icon: TrendingUp,
      title: "Competitor Analysis",
      description: "Analyze top-ranking competitors and predict ranking requirements"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with real-time sync across all devices"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = 'https://backlinkoo.com'}>
              <Infinity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Backlink ∞</h1>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/login")}>
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
      <section className="relative py-32 px-4 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto text-center relative">
          <Badge variant="outline" className="mb-6 bg-primary/10 border-primary/30">
            🚀 The #1 SEO Agency's Secret Weapon
          </Badge>
          <AnimatedHeadline
            baseText="Dominate Google with"
            animatedTexts={headlineVariations}
            className="text-4xl md:text-7xl font-bold mb-8 text-foreground"
          />
          <p className="text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
            The ONLY backlink platform that SEO agencies trust. We deliver results that others promise.
          </p>
          <p className="text-xl text-primary mb-12 font-semibold max-w-3xl mx-auto">
            💎 Premium, tested, proven backlinks • ⚡ Lightning-fast campaigns • 🎯 Guaranteed rankings or money back
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/login")}>
              🎯 Start Dominating Google Now
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              💰 See Pricing (Starting $0.70)
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.2%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2,847</div>
              <div className="text-sm text-muted-foreground">SEO Agencies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500K+</div>
              <div className="text-sm text-muted-foreground">Backlinks Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">DA 80+</div>
              <div className="text-sm text-muted-foreground">Average Domain Auth</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why SEO Agencies Choose Us */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 bg-primary/10">
              🏆 Industry Leaders Choose Backlinkoo
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why 2,847 SEO Agencies Trust Us</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              We don't just provide backlinks – we provide the competitive edge that separates elite agencies from the rest. 
              Our clients consistently outrank their competition because our backlinks actually work.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4">Lightning Fast Deployment</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Other services take weeks or months. We deliver premium backlinks in days, not months. 
                Your clients see results while your competitors are still planning.
              </p>
            </Card>
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-primary/5 border-primary/20">
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Unmatched Quality</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                DA 80+ domains, editorial placements, contextual links. Every backlink is manually vetted 
                and placed by real editors. No PBNs, no spam, no shortcuts.
              </p>
            </Card>
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4">Guaranteed Results</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We're so confident in our backlinks that we offer a 100% money-back guarantee. 
                If you don't see ranking improvements, you don't pay.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Overview Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-600 border-blue-200">
                📊 Dashboard Overview
              </Badge>
              <h2 className="text-4xl font-bold mb-6">Command Center for SEO Domination</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Get the 30,000-foot view of all your campaigns, rankings, and performance metrics. 
                Our dashboard gives you the intelligence you need to make data-driven decisions that actually move the needle.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Real-time campaign performance tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Competitor intelligence and gap analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>ROI calculations and profit reporting</span>
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")}>
                Explore Dashboard →
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-primary/10 p-8 rounded-2xl">
              <BarChart3 className="h-32 w-32 text-primary mx-auto mb-4" />
              <p className="text-center text-muted-foreground">
                Comprehensive analytics and reporting at your fingertips
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Management Hero */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-green-500/10 to-primary/10 p-8 rounded-2xl order-2 lg:order-1">
              <TrendingUp className="h-32 w-32 text-primary mx-auto mb-4" />
              <p className="text-center text-muted-foreground">
                Set it and forget it campaign automation
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-4 bg-green-50 text-green-600 border-green-200">
                🚀 Campaign Management
              </Badge>
              <h2 className="text-4xl font-bold mb-6">Create Winning Campaigns in 60 Seconds</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Stop wasting time on complex campaign setups. Our intelligent system analyzes your target keywords, 
                finds the perfect backlink opportunities, and executes everything automatically.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>AI-powered campaign optimization</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Automatic competitor analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Smart budget allocation and bidding</span>
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")}>
                Launch Campaign →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Keyword Research Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 bg-purple-50 text-purple-600 border-purple-200">
                🔍 Keyword Research
              </Badge>
              <h2 className="text-4xl font-bold mb-6">Uncover Million-Dollar Keywords</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Our advanced keyword research tools are powered by direct API access to Google Keyword Planner, 
                giving you data that's fresher and more accurate than any third-party tool.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Direct Google Keyword Planner API integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Competitor keyword gap analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Search intent classification and clustering</span>
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")}>
                Research Keywords →
              </Button>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-primary/10 p-8 rounded-2xl">
              <Search className="h-32 w-32 text-primary mx-auto mb-4" />
              <p className="text-center text-muted-foreground">
                Advanced keyword intelligence and opportunity discovery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings Hero */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-orange-500/10 to-primary/10 p-8 rounded-2xl order-2 lg:order-1">
              <BarChart3 className="h-32 w-32 text-primary mx-auto mb-4" />
              <p className="text-center text-muted-foreground">
                Real-time ranking surveillance across all search engines
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-4 bg-orange-50 text-orange-600 border-orange-200">
                📈 Ranking Tracker
              </Badge>
              <h2 className="text-4xl font-bold mb-6">Watch Your Rankings Soar</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Monitor your keyword rankings across Google and Bing with minute-by-minute precision. 
                Get instant alerts when you hit page 1, and track every fluctuation that matters.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Real-time Google & Bing rank tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>SERP feature monitoring (snippets, images, etc.)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Competitor ranking surveillance</span>
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")}>
                Track Rankings →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 bg-pink-50 text-pink-600 border-pink-200">
                🌍 Global Community
              </Badge>
              <h2 className="text-4xl font-bold mb-6">Join 2,847 Elite SEO Agencies</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                See real-time campaign completions from agencies around the world. Watch as thousands of 
                high-quality backlinks get delivered every day, driving rankings and revenue for our community.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Live campaign completion feed</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Global performance statistics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Industry benchmarking and insights</span>
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")}>
                Join Community →
              </Button>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-primary/10 p-8 rounded-2xl">
              <Globe className="h-32 w-32 text-primary mx-auto mb-4" />
              <p className="text-center text-muted-foreground">
                Real-time global community activity and achievements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 bg-primary/20">
              🥇 Why We're #1
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Better Than Every Other Backlink Service</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              We didn't become the #1 choice of SEO agencies by accident. Here's what makes us absolutely unbeatable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-white/50">
              <div className="text-6xl mb-6">⚡</div>
              <h3 className="text-2xl font-bold mb-4">Lightning Speed</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                While competitors take 30-90 days, we deliver premium backlinks in 3-7 days.
              </p>
              <div className="text-sm text-primary font-semibold">10x Faster Than Competitors</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-white/50">
              <div className="text-6xl mb-6">💎</div>
              <h3 className="text-2xl font-bold mb-4">Premium Quality</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                DA 80+ domains only. Editorial placements by real editors, not automated bots.
              </p>
              <div className="text-sm text-primary font-semibold">Average DA: 82.3</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-white/50">
              <div className="text-6xl mb-6">💰</div>
              <h3 className="text-2xl font-bold mb-4">Unbeatable Pricing</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                $0.70 per premium backlink. Competitors charge $50-200 for the same quality.
              </p>
              <div className="text-sm text-primary font-semibold">75% Less Than Competitors</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-white/50">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold mb-4">Guaranteed Results</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                99.2% of our clients see ranking improvements within 30 days or full refund.
              </p>
              <div className="text-sm text-primary font-semibold">Money-Back Guarantee</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-white/50">
              <div className="text-6xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold mb-4">AI Intelligence</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Our AI analyzes 500M+ backlinks daily to find perfect placement opportunities.
              </p>
              <div className="text-sm text-primary font-semibold">Advanced ML Algorithms</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all bg-white/50">
              <div className="text-6xl mb-6">🔒</div>
              <h3 className="text-2xl font-bold mb-4">100% White Hat</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                No PBNs, no spam, no black hat tactics. Only editorial backlinks that last.
              </p>
              <div className="text-sm text-primary font-semibold">Google Compliant</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Money-Back Guarantee Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-500/10 to-primary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 bg-green-100 text-green-700 border-green-300">
              💰 100% Risk-Free Guarantee
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Better Results or Your Money Back
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              We're so confident in our backlinks that we offer an iron-clad guarantee: If you don't see ranking 
              improvements within 30 days, we'll refund every penny. No questions asked. No fine print.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">30-Day Results</h3>
                <p className="text-muted-foreground">See ranking improvements within 30 days or get refunded</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💯</div>
                <h3 className="text-xl font-bold mb-2">No Questions Asked</h3>
                <p className="text-muted-foreground">Simple refund process with no hoops to jump through</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold mb-2">99.2% Success Rate</h3>
                <p className="text-muted-foreground">Less than 1% of clients request refunds</p>
              </div>
            </div>
            <Button size="lg" className="text-xl px-12 py-6" onClick={() => navigate("/login")}>
              🎯 Start Risk-Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6">
              💎 Premium Yet Affordable
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Unbeatable Value</h2>
            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              While competitors charge $50-200 per backlink, we deliver the same premium quality for just $0.70. 
            </p>
            <p className="text-2xl font-bold text-primary">That's 75% less than our closest competitor!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <Badge variant="secondary" className="mb-4">Perfect for Testing</Badge>
                <CardTitle className="text-2xl">Starter Pack</CardTitle>
                <div className="text-4xl font-bold text-primary mt-4">
                  $35
                  <span className="text-lg text-muted-foreground font-normal">/50 credits</span>
                </div>
                <p className="text-muted-foreground">50 premium backlinks</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>50 DA 80+ backlinks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>All SEO tools included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>30-day money-back guarantee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={() => navigate("/login")}>
                  Start Small
                </Button>
              </CardContent>
            </Card>

            {/* Professional - Most Popular */}
            <Card className="border-primary shadow-xl scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-6 py-2">
                  🔥 Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <Badge variant="secondary" className="mb-4 bg-primary/10">SEO Agency Favorite</Badge>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-5xl font-bold text-primary mt-4">
                  $140
                  <span className="text-lg text-muted-foreground font-normal">/200 credits</span>
                </div>
                <p className="text-muted-foreground">200 premium backlinks</p>
                <p className="text-sm text-primary font-semibold">Save $40 vs Starter pricing!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>200 DA 80+ backlinks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority campaign processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Advanced competitor analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full text-lg py-6" onClick={() => setPaymentModalOpen(true)}>
                  🚀 Most Popular Choice
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <Badge variant="secondary" className="mb-4 bg-gold/10 text-gold">For SEO Agencies</Badge>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-primary mt-4">
                  $350
                  <span className="text-lg text-muted-foreground font-normal">/500 credits</span>
                </div>
                <p className="text-muted-foreground">500 premium backlinks</p>
                <p className="text-sm text-primary font-semibold">Save $100 vs Starter pricing!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>500 DA 80+ backlinks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>White-label reporting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>24/7 priority support</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => setPaymentModalOpen(true)}>
                  Scale Your Agency
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <p className="text-lg text-muted-foreground mb-6">
              Need more than 500 backlinks? <span className="text-primary font-semibold">Contact us for custom enterprise pricing.</span>
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No monthly commitments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Credits never expire</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Ready to Dominate Your Competition?
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 leading-relaxed">
              Join 2,847 SEO agencies who trust Backlinkoo to deliver results that move the needle. 
              Start your risk-free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <Button size="lg" className="text-xl px-12 py-6" onClick={() => navigate("/login")}>
                🚀 Start Dominating Now
              </Button>
              <Button variant="outline" size="lg" className="text-xl px-12 py-6" onClick={() => setPaymentModalOpen(true)}>
                💳 Buy Credits Instantly
              </Button>
            </div>
            <p className="text-lg text-muted-foreground">
              ✅ 30-day money-back guarantee &nbsp;&nbsp;|&nbsp;&nbsp; 🔒 100% secure payment &nbsp;&nbsp;|&nbsp;&nbsp; ⚡ Instant access
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Infinity className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Backlink ∞</span>
          </div>
          <p className="text-muted-foreground">
            © Backlinkoo.com. All rights reserved.
          </p>
        </div>
      </footer>

      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
