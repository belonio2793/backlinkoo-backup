import { useState } from "react";
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

const Index = () => {
  const navigate = useNavigate();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

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
              <Button variant="outline" onClick={() => navigate("/login")}>
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
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-6">
            Powerful SEO & Backlink Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Boost Your Rankings with
            <span className="text-primary block">Premium Backlinks</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Powerful SEO platform offering high-quality backlinks, advanced keyword research, 
            and comprehensive ranking analysis tools.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login")}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need for SEO Success</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive SEO tools and premium backlink services in one platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Pay as you go with our credit-based system</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <Card className="border-primary shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Credit-Based System</CardTitle>
                <div className="text-4xl font-bold text-primary mt-4">
                  $0.70
                  <span className="text-lg text-muted-foreground font-normal">/credit</span>
                </div>
                <p className="text-muted-foreground">1 credit = 1 premium backlink</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">High-quality backlinks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Advanced SEO tools included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Real-time campaign tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Mobile app included</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => navigate("/login")}>
                    Get Started Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setPaymentModalOpen(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy Credits Now
                  </Button>
                </div>
              </CardContent>
            </Card>
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
