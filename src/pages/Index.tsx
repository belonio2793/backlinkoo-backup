import { useState, useEffect, startTransition } from "react";
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
  Zap,
  Sparkles,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PricingModal } from "@/components/PricingModal";

import { AnimatedHeadline } from "@/components/AnimatedHeadline";
import { HomepageBlogGenerator } from "@/components/HomepageBlogGenerator";
import { ProductionBlogGenerator } from "@/components/ProductionBlogGenerator";
import { GlobalBlogGenerator } from "@/components/GlobalBlogGenerator";
import { OpenAIGenerator } from "@/components/OpenAIGenerator";
import { BlogForm } from "@/components/blog/BlogForm";
import { RotatingTagline } from "@/components/RotatingTagline";
import { RotatingStats } from "@/components/RotatingStats";
import { RotatingTrustIndicators } from "@/components/RotatingTrustIndicators";

import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";

import { InlineAuthForm } from "@/components/InlineAuthForm";
import { TrialConversionBanner } from "@/components/TrialConversionBanner";
import { QuickTrialUpgrade } from "@/components/QuickTrialUpgrade";
import { TrialConversionService } from "@/services/trialConversionService";
import { useAuthModal, usePremiumModal, useWaitlistModal, useModal } from "@/contexts/ModalContext";
import { WaitlistModal } from "@/components/WaitlistModal";



const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter_100' | 'starter_200' | 'starter_300'>('starter_200');
  const [customCredits, setCustomCredits] = useState<number>(0);
  const [isCustomPackage, setIsCustomPackage] = useState(false);
  // Unified modal management
  const { openLoginModal, openSignupModal } = useAuthModal();
  const { openPremiumModal } = usePremiumModal();
  const { openWaitlistModal, closeWaitlistModal, isWaitlistOpen } = useWaitlistModal();
  const { currentModal } = useModal();

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');

  const [useProductionGenerator, setUseProductionGenerator] = useState(false);
  const [showTrialUpgrade, setShowTrialUpgrade] = useState(false);
  const [showInlineAuth, setShowInlineAuth] = useState(false);

  // Check URL parameters for trial upgrade and track page view
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgrade') === 'trial') {
      setShowTrialUpgrade(true);
      setShowInlineAuth(true);
    }
  }, []);

  // Check for authenticated user on component mount
  useEffect(() => {
    // Get initial session with faster timeout
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    getInitialSession();

    // Fallback timeout to prevent indefinite loading state
    const fallbackTimeout = setTimeout(() => {
      if (!authChecked) {
        console.log('Index page - Auth check timeout, forcing authChecked = true');
        setAuthChecked(true);
      }
    }, 3000); // 3 second timeout

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Index page - Auth state changed:', { event, hasUser: !!session?.user, userId: session?.user?.id });
      setUser(session?.user ?? null);
      if (!authChecked) {
        setAuthChecked(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, [authChecked]);

  const handleSignOut = async () => {
    try {
      console.log('🚪 Home page: Signing out user...');

      // Clear user state immediately for better UX
      setUser(null);

      // Do actual sign out using direct Supabase call for reliability
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('🚪 Sign out error:', error);
      } else {
        console.log('🚪 Sign out successful');
      }

      // Force page refresh after sign out completes
      window.location.reload();

    } catch (error) {
      console.error('Home page sign out error:', error);

      // Still clear user state and refresh even if sign out fails
      setUser(null);
      window.location.reload();
    }
  };

  const headlineVariations = [
    "Enterprise Backlinks",
    "Authority Links",
    "Full User & Client Controls",
    "Industry Leading Tools",
    "Competitive Intelligence",
    "Real Time Tracking",
    "Advanced Keyword Research Tools",
    "Low Outbound Links (OBL)",
    "Unique C-Class IP Addresses",
    "High Indexing Rate",
    "SERP Monitoring",
    "High-DA Networks",
    "Permanent Links",
    "Strategic Placements",
    "Editorial Links",
    "Private Blog Networks",
    "Contextual Authority"
  ];

  const pricingPlans = [
    {
      id: 'starter_100' as const,
      name: 'Starter 100',
      credits: 100,
      price: 140,
      pricePerLink: 1.40,
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
      price: 280,
      pricePerLink: 1.40,
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
      price: 420,
      pricePerLink: 1.40,
      description: 'Maximum starter value',
      features: [
        'High DA backlinks',
        'Full feature access',
        'Dedicated support',
        'Custom reporting'
      ]
    }
  ];

  const handleGetStarted = (planId: 'starter_100' | 'starter_200' | 'starter_300' | 'custom') => {


    if (planId === 'custom') {
      setIsCustomPackage(true);
    } else {
      setIsCustomPackage(false);
      setSelectedPlan(planId as 'starter_100' | 'starter_200' | 'starter_300');
    }

    setPricingModalOpen(true);
  };


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
      {/* Rotating Notification Banner */}
      <RotatingNotificationBanner className="sticky top-0 left-0 right-0 z-[60]" />

      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <Infinity className="h-4 w-4 text-primary" />
              <h1 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-foreground">Backlink</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">

              {!authChecked ? (
                <div className="w-24 h-9 bg-gray-200 animate-pulse rounded"></div>
              ) : user ? (
                <>
                  <Button
                    onClick={() => startTransition(() => navigate("/dashboard"))}
                    className="bg-transparent hover:bg-blue-50/50 border border-blue-200/60 text-blue-700 hover:text-blue-800 hover:border-blue-300/80 transition-all duration-200 font-medium px-4 py-1 text-sm backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🚪 Sign out button clicked on home page');
                      handleSignOut();
                    }}
                    className="bg-transparent hover:bg-red-50/50 border border-red-200/60 text-red-600 hover:text-red-700 hover:border-red-300/80 transition-all duration-200 font-medium px-4 py-1 text-sm backdrop-blur-sm shadow-sm hover:shadow-md"
                    type="button"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  {/* Show trial upgrade button if user has trial posts */}
                  {TrialConversionService.hasConvertibleTrialPosts() ? (
                    <>
                      <QuickTrialUpgrade
                        onSuccess={(user) => {
                          setUser(user);
                          startTransition(() => {
                            navigate('/dashboard');
                          });
                        }}
                        variant="default"
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      />
                      <Button variant="ghost" onClick={() => {
                        openLoginModal();
                      }} className="font-medium text-sm px-3 py-1">
                        Sign In
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => {
                        console.log('Sign In button clicked');
                        openLoginModal();
                      }} className="font-medium text-sm px-3 py-1">
                        Sign In
                      </Button>

                      <Button onClick={() => {
                        console.log('Get Started button clicked');
                        openSignupModal();
                      }} className="font-medium text-sm px-3 py-1">
                        Create Account
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Free Blog Generator - Top Feature */}
      <section id="blog-generator" className="py-12 sm:py-16 md:py-24 px-4 md:px-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="w-full px-4 md:px-0">
          {/* Optional: Advanced Generator Toggle (Hidden by default) */}




          {/* Generator */}
          <div className="w-full px-2 md:px-6">
            <BlogForm
              onContentGenerated={(blogPost) => {
                setUser(user); // Refresh state
                toast({
                  title: "Success! 🎉",
                  description: `Your blog post "${blogPost.title}" is now live at ${blogPost.blogUrl}`,
                });
                // Navigate to the specific blog post after a short delay
                setTimeout(() => {
                  if (blogPost.blogUrl) {
                    try {
                      // Check if it's already a relative path
                      if (blogPost.blogUrl.startsWith('/')) {
                        navigate(blogPost.blogUrl);
                      } else {
                        // Try to extract the path from absolute URL
                        const blogPath = new URL(blogPost.blogUrl).pathname;
                        navigate(blogPath);
                      }
                    } catch (error) {
                      console.warn('Invalid blogUrl format:', blogPost.blogUrl, error);
                      // Fallback to slug if URL parsing fails
                      if (blogPost.metadata?.slug) {
                        navigate(`/blog/${blogPost.metadata.slug}`);
                      } else {
                        navigate('/blog');
                      }
                    }
                  } else if (blogPost.metadata?.slug) {
                    // Fallback to slug-based navigation
                    navigate(`/blog/${blogPost.metadata.slug}`);
                  } else {
                    // Final fallback to general blog page
                    navigate('/blog');
                  }
                }, 2000);
              }}
            />
          </div>
        </div>
      </section>

      {/* Backlink ∞ Automation - Coming Soon Section */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Infinity className="h-8 w-8 text-blue-600" />
                <Zap className="h-4 w-4 text-orange-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                  Backlink ∞ Automation
                </h2>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse">
                  Coming Soon
                </Badge>
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The world's most advanced AI-powered link building automation platform.
              Discover and create thousands of contextual backlinks across the entire web with zero manual effort.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left side - Features */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Internet-Scale Discovery</h3>
                    <p className="text-gray-600">AI crawls the entire web to find relevant link opportunities on blogs, forums, and Web 2.0 platforms</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI Content Generation</h3>
                    <p className="text-gray-600">Contextual comments, profiles, and posts generated automatically for natural link placement</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Autonomous Campaigns</h3>
                    <p className="text-gray-600">Set it and forget it - campaigns run indefinitely with intelligent drip-feeding and rotation</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Safe & Natural</h3>
                    <p className="text-gray-600">Advanced algorithms ensure natural patterns and Google guideline compliance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Preview Dashboard */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="flex-1 bg-gray-100 rounded text-center text-xs py-1 text-gray-500">
                    backlink-automation.app
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-sm">Campaign: Brand Authority</div>
                      <div className="text-xs text-gray-500">Target: yoursite.com</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div className="text-xs text-gray-500">Links Built</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Blog Comments</span>
                      <span className="text-green-600">342 posted</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Forum Profiles</span>
                      <span className="text-green-600">156 created</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full w-1/2"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Web 2.0 Posts</span>
                      <span className="text-green-600">89 published</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-1/3"></div>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <div className="text-xs text-gray-500 mb-2">Next batch in 2h 34m</div>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Active Campaign</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border shadow-lg max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Be the First to Experience Link Building Revolution</h3>
              <p className="text-gray-600 mb-6">
                Join our exclusive waitlist and get early access to the most powerful automated link building system ever created.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
                <input
                  type="email"
                  placeholder="Enter your email for early access"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      openWaitlistModal({ initialEmail: waitlistEmail.trim() });
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <Button
                  onClick={() => {
                    openWaitlistModal({ initialEmail: waitlistEmail.trim() });
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3"
                >
                  Join Waitlist
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  2,847 in queue
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Coming Soon
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  50% Early Bird Discount
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trial Conversion Section */}
      {showTrialUpgrade && (
        <section className="py-12 px-6 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="w-full px-6">
            <TrialConversionBanner
              onUpgrade={() => {
                setShowInlineAuth(true);
                document.getElementById('inline-auth')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mb-8"
            />
          </div>
        </section>
      )}

      {/* Inline Authentication Section - Show for guests or trial upgrades */}
      {(!user && authChecked) || showInlineAuth ? (
        <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-50" id="inline-auth">
          <div className="w-full px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
              {/* Left side - Value proposition */}
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 tracking-tight">
                  {showTrialUpgrade ? "Upgrade Your Trial" : "Start Building Authority Today"}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                  {showTrialUpgrade
                    ? "Convert your trial backlinks to permanent ones and unlock the full power of our platform."
                    : "Join thousands of professionals who trust our platform for their most important SEO campaigns."
                  }
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-light">
                      {showTrialUpgrade ? "Permanent backlinks (no expiration)" : "High-authority backlinks"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-light">
                      {showTrialUpgrade ? "Advanced analytics & reporting" : "Real-time campaign tracking"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-light">
                      {showTrialUpgrade ? "Priority support & consultation" : "Competitive analysis tools"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-light">
                      {showTrialUpgrade ? "Campaign management tools" : "Quality assurance"}
                    </span>
                  </div>
                </div>

                {/* Rotating Trust indicators */}
                <RotatingTrustIndicators />
              </div>

              {/* Right side - Inline auth form */}
              <div>
                <InlineAuthForm
                  onAuthSuccess={(user) => {
                    setUser(user);
                    setShowInlineAuth(false);
                    navigate('/dashboard');
                  }}
                  onTrialConversion={() => {
                    // Handle trial conversion logic
                    navigate('/login?upgrade=trial');
                  }}
                  showTrialUpgrade={showTrialUpgrade}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Hero Section */}
      <section
        className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="w-full text-center relative z-10 px-6">
          <RotatingTagline />
          
          <AnimatedHeadline
            baseText="Professional SEO with"
            animatedTexts={headlineVariations}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light mb-8 text-gray-900 tracking-tight"
          />
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 max-w-6xl mx-auto leading-relaxed font-light">
            The backlink platform that SEO professionals rely on for consistent, measurable results.
          </p>
          
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12 font-medium max-w-3xl mx-auto">
            High-authority links • Competitive intelligence
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
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



          {/* Rotating Stats Grid */}
          <RotatingStats />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 md:py-24 px-4 md:px-6 bg-muted/30">
        <div className="w-full px-4 md:px-0">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-6 tracking-tight">Why Professionals Choose Us</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-6xl mx-auto leading-relaxed font-light">
              We provide the infrastructure and intelligence that SEO teams need to deliver consistent results at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
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
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="w-full space-y-16 sm:space-y-24 md:space-y-32">
          
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 bg-blue-50 text-blue-600 border-blue-200 font-mono text-xs">
                DASHBOARD OVERVIEW
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 tracking-tight">Command Center</h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light">
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
              <Button onClick={() => {
                openLoginModal();
              }} className="font-medium">
                Explore Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-500/5 to-primary/5 p-12 rounded-2xl overflow-hidden">
              <div className="h-32 w-32 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center">
                <BarChart3 className="h-16 w-16 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Campaign Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="bg-gradient-to-br from-green-500/5 to-primary/5 p-12 rounded-2xl order-2 lg:order-1 overflow-hidden">
              <div className="h-32 w-32 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Activity className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-6 bg-green-50 text-green-600 border-green-200 font-mono text-xs">
                CAMPAIGN MANAGEMENT
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 tracking-tight">Automated Excellence</h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Create and deploy sophisticated backlink campaigns in minutes with intelligent optimization.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Advanced optimization</span>
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
              <Button onClick={() => {
                setLoginModalTab("login");
                setShowLoginModal(true);
              }} className="font-medium">
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
                Advanced keyword research powered by multiple professional data sources for comprehensive insights.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Multi-source data integration</span>
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
              <Button onClick={() => {
                openLoginModal();
              }} className="font-medium">
                Research Keywords
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-purple-500/5 to-primary/5 p-12 rounded-2xl overflow-hidden">
              <div className="h-32 w-32 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-orange-500/5 to-primary/5 p-12 rounded-2xl order-2 lg:order-1 overflow-hidden">
              <div className="h-32 w-32 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center">
                <TrendingUp className="h-16 w-16 text-orange-600" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-6 bg-orange-50 text-orange-600 border-orange-200 font-mono text-xs">
                RANKING TRACKER
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Performance Monitor</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Track keyword rankings on Google with precision monitoring and instant alerts.
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
              <Button onClick={() => {
                openLoginModal();
              }} className="font-medium">
                Track Rankings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Backlink Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 bg-green-50 text-green-600 border-green-200 font-mono text-xs">
                VERIFICATION TOOL
              </Badge>
              <h2 className="text-4xl font-light mb-6 tracking-tight">Link Verification Reports</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                Generate professional backlink verification reports for clients with domain authority metrics and anchor text analysis.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Anchor text verification</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Domain & page authority metrics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Public shareable reports</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">Client-ready presentation</span>
                </li>
              </ul>
              <Button onClick={() => navigate("/backlink-report")} className="font-medium">
                Create Report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-green-500/5 to-primary/5 p-12 rounded-2xl overflow-hidden">
              <div className="h-32 w-32 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
          </div>

          {/* Community */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-pink-500/5 to-primary/5 p-12 rounded-2xl order-2 lg:order-1">
              <Users className="h-32 w-32 text-primary mx-auto" />
            </div>
            <div className="order-1 lg:order-2">
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
              <Button onClick={() => {
                openLoginModal();
              }} className="font-medium">
                Join Community
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="relative py-24 px-0 md:px-6 bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="w-full relative z-10 px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-6 tracking-tight text-gray-900">Starter Packages</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-6xl mx-auto leading-relaxed font-light">
              Begin your journey with our proven backlink platform. All starter packages include full access to our professional tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mx-auto max-w-6xl">
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

          {/* Custom Credit Purchase */}
          <div className="mt-16 max-w-md mx-auto">
            <Card className="p-8 text-center border-2 border-primary shadow-xl bg-gradient-to-br from-primary/5 to-blue-50">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold mb-2 text-gray-900">Custom Package</CardTitle>
                <p className="text-gray-600 font-light">Choose your exact credit amount</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={customCredits || ''}
                    placeholder="Enter credits (min: 1)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-center text-lg font-semibold"
                    onChange={(e) => {
                      const credits = parseInt(e.target.value) || 0;
                      setCustomCredits(credits);
                    }}
                  />
                </div>

                <div className="text-center">
                  <div className="text-3xl font-semibold text-gray-900 mb-2">
                    <span className="text-xl font-mono">Total: </span>
                    <span>${customCredits > 0 ? (customCredits * 1.40).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    $1.40 per credit
                  </div>
                </div>

                <Button
                  className="w-full font-medium bg-primary text-white hover:bg-primary/90"
                  disabled={customCredits < 1}
                  onClick={() => {
                    if (customCredits >= 1) {
                      handleGetStarted('custom');
                    } else {
                      toast({
                        title: 'Invalid Credit Amount',
                        description: 'Please enter at least 1 credit to proceed.',
                        variant: 'destructive'
                      });
                    }
                  }}
                >
                  Purchase Custom Package
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 font-light">
              Need enterprise pricing? <Button variant="link" className="p-0 text-gray-900 font-medium hover:text-gray-700"><a href="mailto:support@backlinkoo.com">Contact us</a></Button> for volume discounts.
            </p>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section
        className="relative py-24 px-0 md:px-6 bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="w-full text-center relative z-10 px-4 md:px-6">
          <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight text-gray-900">
            Ready to Dominate Search Results?
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-6xl mx-auto leading-relaxed font-light">
            Join the professionals who trust Backlink ∞ for their most important SEO campaigns. 
            Start with our risk-free guarantee today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-lg px-10 py-6 font-medium"
              onClick={() => handleGetStarted('starter_200')}
            >
              Start Your Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="text-sm text-gray-500 font-light text-center">
              Money-back guarantee • No setup fees • Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => {
          setPricingModalOpen(false);
          setIsCustomPackage(false);
        }}
        initialCredits={isCustomPackage ? customCredits : pricingPlans.find(p => p.id === selectedPlan)?.credits}
        onAuthSuccess={(user) => {
          setUser(user);
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in.",
          });
        }}
      />



      {/* Footer */}
      <Footer />

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={closeWaitlistModal}
        initialEmail={waitlistEmail}
        modalProps={currentModal.type === 'waitlist' ? currentModal.props : undefined}
        onSuccess={() => setWaitlistEmail('')}
      />

      {/* Modals are now managed by UnifiedModalManager */}
    </div>
  );
};

export default Index;
