
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Target, TrendingUp, Shield, Zap, Users, Star, CheckCircle, Infinity } from "lucide-react";
import { AnimatedHeadline } from "@/components/AnimatedHeadline";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Infinity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Backlink</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <AnimatedHeadline 
              baseText="Build High-Quality Backlinks with"
              animatedTexts={["AI-Powered Automation", "Expert Outreach", "Data-Driven Insights"]}
              className="text-5xl font-bold text-foreground mb-6"
            />
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build high-quality backlinks that boost your search rankings and drive organic traffic to your website.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => navigate('/login')}
              >
                Start Building Links
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-secondary/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Targeted Link Building
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Identify and acquire backlinks from authoritative websites in your niche.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor your backlink performance and track your website's ranking improvements.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Secure Backlink Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Protect your website from harmful backlinks with our advanced security features.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Automated Link Outreach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automate your link outreach process and save time with our built-in tools.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Collaborate with your team and manage your backlink campaigns efficiently.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Expert Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get expert support from our team of SEO professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <CardTitle>John Doe</CardTitle>
                    <CardDescription className="text-muted-foreground">CEO of Example Company</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  "Backlink has helped us significantly improve our search rankings and drive more organic traffic to our website. Highly recommended!"
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <CardTitle>Jane Smith</CardTitle>
                    <CardDescription className="text-muted-foreground">Marketing Manager at ABC Corp</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  "The platform is easy to use and the support team is always available to help. We've seen a noticeable increase in our website's visibility since using Backlink."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
