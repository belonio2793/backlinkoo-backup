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
    "Authority Links", 
    "Competitive Intelligence",
    "High-DA Networks",
    "Strategic Placements",
    "Editorial Links",
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
        className="relative py-32 px-6 bg-gradient-to-b from-background/90 to-muted/20 overflow-hidden"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6))`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="outline" className="mb-8 bg-white/10 border-white/30 text-white font-mono text-xs px-4 py-2 backdrop-blur-sm">
            ENTERPRISE BACKLINK PLATFORM
          </Badge>
          <AnimatedHeadline
            baseText="Professional SEO with"
            animatedTexts={headlineVariations}
            className="text-5xl md:text-7xl font-light mb-8 text-white tracking-tight drop-shadow-lg"
          />
          <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-4xl mx-auto leading-relaxed font-light drop-shadow-md">
            The backlink platform that SEO professionals rely on for consistent, measurable results.
          </p>
          <p className="text-lg text-white/80 mb-12 font-medium max-w-3xl mx-auto drop-shadow-md">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-semibold text-white mb-2 drop-shadow-lg">{stat.value}</div>
                <div className="text-sm font-medium text-white/90 mb-1 drop-shadow-md">{stat.label}</div>
                <div className="text-xs text-white/70 drop-shadow-sm">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {/* ... NO CHANGE ... */}

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className="relative py-24 px-6 overflow-hidden"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8))`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* ... same content ... */}
      </section>

      {/* Final CTA Section */}
      <section 
        className="relative py-24 px-6 overflow-hidden"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8))`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* ... same content ... */}
      </section>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        initialCredits={pricingPlans.find(p => p.id === selectedPlan)?.credits}
      />
    </div>
  );
};

export default Index;
