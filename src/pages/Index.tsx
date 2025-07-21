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
  CreditCard,
  ArrowRight,
  Users,
  Target,
  Zap
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
  const [selectedPlan, setSelectedPlan] = useState<'starter_100' | 'starter_200' | 'starter_300'>('starter_200');

  // Check for authenticated user on component mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const headlineVariations = [
    "Enterprise Backlinks",
    "Expert Professional Oversight",
    "Authority Links", 
    "Industry Leading Tools",
    "Competitive Intelligence",
    "Low Outbound Links (OBL)",
    "Unique C-Class IP Addresses",
    "99.99% Indexing Rate Guaranteed",
    "High-DA Networks",
    "Permanent Links",
    "Strategic Placements",
    "Editorial Links",
    "Private Block Networks",
    "Contextual Authority"
  ];

  const pricingPlans = [
    {
      id: 'starter_100' as const,
      name: 'Starter 100',
      credits: 100,
      price: 70,
      pricePerLink: 0.70,
      description: 'Perfect for testing our platform',
      features: [
        'High DA backlinks',
        'Competitive analysis',
        'Real-time reporting',
        'Campaign management'
      ]
    },
    {
      id: 'starter_200' as const,
      name: 'Starter 200',
      credits: 200,
      price: 140,
      pricePerLink: 0.70,
      description: 'Most popular starting package',
      features: [
        'High DA backlinks',
        'Advanced analytics',
        'Priority support',
        'Campaign optimization'
      ],
      popular: true
    },
    {
      id: 'starter_300' as const,
      name: 'Starter 300',
      credits: 300,
      price: 210,
      pricePerLink: 0.70,
      description: 'Maximum starter value',
      features: [
        'High DA backlinks',
        'Full feature access',
        'Dedicated support',
        'Custom reporting'
      ]
    }
  ];

  const handleGetStarted = (planId: 'starter_100' | 'starter_200' | 'starter_300') => {
    setSelectedPlan(planId);
    if (user) {
      setPaymentModalOpen(true);
    } else {
      navigate("/login");
    }
  };

  const stats = [
    { value: "99%", label: "Success Rate", description: "Proven ranking improvements" },
    { value: "2,800+", label: "Agencies", description: "Trust our platform" },
    { value: "500K+", label: "Links Delivered", description: "Across all campaigns" },
    { value: "High DA", label: "Average Authority", description: "Premium domain quality" }
  ];

  const features = [
    {
      icon: Target,
      title: "Precision Targeting",
      description: "Intelligent competitor analysis and strategic link placement for maximum ranking impact."
    },
    {
      icon: Zap,
      title: "Rapid Deployment",
      description: "Campaign setup and execution in minutes, not weeks. Start seeing results immediately."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with comprehensive audit trails and compliance reporting."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time performance metrics with predictive ranking intelligence."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-light">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = 'https://backlinkoo.com'}>
              <Infinity className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink ∞</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Button onClick={() => navigate("/dashboard")} className="font-medium">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/login")} className="font-medium">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/login")} className="font-medium">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-32 px-6 bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="outline" className="mb-8 bg-gray-100 border-gray-300 text-gray-900 font-mono text-xs px-4 py-2">
            ENTERPRISE BACKLINK PLATFORM
          </Badge>
          
          <AnimatedHeadline
            baseText="Professional SEO with"
            animatedTexts={headlineVariations}
            className="text-5xl md:text-7xl font-light mb-8 text-gray-900 tracking-tight"
          />
          
          <p className="text-xl md:text-2xl text-gray-700 mb-6 max-w-4xl mx-auto leading-relaxed font-light">
            The backlink platform that SEO professionals rely on for consistent, measurable results.
          </p>
          
          <p className="text-lg text-gray-600 mb-12 font-medium max-w-3xl mx-auto">
            High-authority links • Competitive intelligence • Guaranteed results or full refund
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <Button 
              size="lg" 
              className="text-base px-8 py-6 font-medium" 
              onClick={() => handleGetStarted('starter_200')}
            >
              Start Campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base px-8 py-6 font-medium"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Pricing
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight">Why Professionals Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              We provide the infrastructure and intelligence that SEO teams need to deliver consistent results at scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 text-center border-0 bg-background shadow-sm hover:shadow-md transition-all">
                <feature.icon className="h-12 w-12 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Sections */}
      <section className="py-20 px-6">
        <div className="container mx-auto space-y-32">
          
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 bg-blue-50 text-blue-600 border-blue-200 font-mono text-xs">
                DASHBOARD OVERVIEW
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Command Center</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Comprehensive campaign management with real-time performance metrics and competitive intelligence.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Real-time campaign tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Competitive analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">ROI calculations</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/login")} className="font-medium">
                Explore Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-500/5 to-primary/5 p-12 rounded-2xl">
              <BarChart3 className="h-32 w-32 text-primary mx-auto" />
            </div>
          </div>

          {/* Campaign Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-green-500/5 to-primary/5 p-12 rounded-2xl order-2 lg:order-1">
              <TrendingUp className="h-32 w-32 text-primary mx-auto" />
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-6 bg-green-50 text-green-600 border-green-200 font-mono text-xs">
                CAMPAIGN MANAGEMENT
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Automated Excellence</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Create and deploy sophisticated backlink campaigns in minutes with intelligent optimization.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">AI-powered optimization</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Automatic competitor analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Smart budget allocation</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/login")} className="font-medium">
                Launch Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Keyword Research */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 bg-purple-50 text-purple-600 border-purple-200 font-mono text-xs">
                KEYWORD RESEARCH
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Intelligence Engine</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Advanced keyword research powered by direct Google API integration for the most accurate data.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Direct Google API access</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Competitor keyword analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Search intent classification</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/login")} className="font-medium">
                Research Keywords
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-purple-500/5 to-primary/5 p-12 rounded-2xl">
              <Search className="h-32 w-32 text-primary mx-auto" />
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-orange-500/5 to-primary/5 p-12 rounded-2xl order-2 lg:order-1">
              <BarChart3 className="h-32 w-32 text-primary mx-auto" />
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-6 bg-orange-50 text-orange-600 border-orange-200 font-mono text-xs">
                RANKING TRACKER
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Performance Monitor</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Track keyword rankings across Google and Bing with precision monitoring and instant alerts.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Real-time rank tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">SERP feature monitoring</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Competitor surveillance</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/login")} className="font-medium">
                Track Rankings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Community */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 bg-pink-50 text-pink-600 border-pink-200 font-mono text-xs">
                GLOBAL NETWORK
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Professional Community</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Join thousands of SEO professionals who trust our platform for their most important campaigns.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Real-time campaign insights</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Industry benchmarks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Best practice sharing</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/login")} className="font-medium">
                Join Community
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-pink-500/5 to-primary/5 p-12 rounded-2xl">
              <Users className="h-32 w-32 text-primary mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className="relative py-24 px-6 bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight text-gray-900">Starter Packages</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
              Begin your journey with our proven backlink platform. All starter packages include full access to our professional tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all relative bg-white`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-100 text-primary font-mono text-xs">
                    MOST POPULAR
                  </Badge>
                )}
                
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-semibold mb-2 text-gray-900">{plan.name}</CardTitle>
                  <div className="text-4xl font-light mb-2 text-gray-900">
                    <span className="text-2xl font-mono">$</span>{plan.price}
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    ${plan.pricePerLink} per link
                  </div>
                  <p className="text-gray-600 font-light">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="text-3xl font-semibold text-gray-900 mb-4">
                    {plan.credits} Credits
                  </div>
                  
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-light text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full font-medium ${plan.popular ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleGetStarted(plan.id)}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 font-light">
              Need more credits? <Button variant="link" className="pperiodic-texture p-0 text-gray-900 font-medium hover:text-gray-700"><a href="mailto:support@backlinkoo.com">Contact us</a></Button> for custom enterprise packages.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section 
        className="relative py-24 px-6 bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight text-gray-900">
            Ready to Dominate Search Results?
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Join the professionals who trust Backlink ∞ for their most important SEO campaigns. 
            Start with our risk-free guarantee today.
          </p>
          <div className="flex flex-colrı sm:flex-row items-center justify-center gap-6">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 font-medium" 
              onClick={() => handleGetStarted('starter_200')}
            >
              Start Your Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="text-sm text-gray-500 font-light">
              Money-back guarantee • No setup fees • Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        initialCredits={pricingPlans.find(p => p.id === selectedPlan)?.credits}
      />
    </div>
  );
};

export default Index;