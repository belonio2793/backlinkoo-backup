import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  Link2,
  Target,
  ArrowRight,
  CheckCircle,
  Globe,
  TrendingUp,
  Shield,
  Clock,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import RegistrationModal from "@/components/RegistrationModal";
import ToolsHeader from "@/components/shared/ToolsHeader";

const NoHandsSEO = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [campaignNotes, setCampaignNotes] = useState("");
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

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

  const validateInputs = () => {
    if (!targetUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a target URL for your campaign.",
        variant: "destructive",
      });
      return false;
    }

    if (!keyword.trim()) {
      toast({
        title: "Keyword Required",
        description: "Please enter a target keyword for your campaign.",
        variant: "destructive",
      });
      return false;
    }

    // Basic URL validation
    try {
      new URL(targetUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com).",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCreateCampaign = async () => {
    if (!validateInputs()) return;

    if (!user) {
      setShowRegistrationModal(true);
      return;
    }

    setIsCreating(true);

    try {
      // Extract domain from URL for campaign naming
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      const campaignName = `Backlink ∞ Automation Link Building (beta) - ${domain} - ${keyword}`;

      // Create the campaign in Supabase with verification workflow
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          user_id: user.id,
          name: campaignName,
          target_url: targetUrl,
          keywords: [keyword],
          links_requested: 10, // Default to 10 links for Backlink ∞ Automation Link Building (beta)
          status: 'pending',
          verification_status: 'pending',
          verification_notes: campaignNotes || null,
          campaign_type: 'no_hands_seo'
        }])
        .select()
        .single();

      if (error) throw error;

      // Check if user has active SEO Tools subscription
      const { data: subscription, error: subError } = await supabase
        .from('seo_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError || !subscription) {
        await supabase.from('campaigns').delete().eq('id', data.id);
        throw new Error('Active SEO Tools subscription required. Please subscribe to continue.');
      }

      setShowVerificationSuccess(true);
      
      toast({
        title: "Campaign Submitted for Verification!",
        description: `Your Backlink ∞ Automation Link Building (beta) campaign for "${keyword}" has been submitted and will be reviewed within 24-48 hours.`,
      });

      // Reset form and redirect to dashboard
      setTargetUrl("");
      setKeyword("");
      setCampaignNotes("");
      
      setTimeout(() => {
        navigate('/dashboard?section=seo-tools');
      }, 3000);

    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Automated Processing",
      description: "Set it and forget it - your campaign runs automatically"
    },
    {
      icon: Target,
      title: "Precision Targeting",
      description: "High-quality backlinks from relevant, authoritative domains"
    },
    {
      icon: TrendingUp,
      title: "Ranking Boost",
      description: "See measurable improvements in search engine rankings"
    },
    {
      icon: Shield,
      title: "Safe & Compliant",
      description: "White-hat techniques that comply with search engine guidelines"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ToolsHeader user={user} currentTool="automation-link-building" />

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-mono text-xs px-4 py-2">
              <Zap className="h-3 w-3 mr-2" />
              BACKLINK ∞ AUTOMATION LINK BUILDING (BETA)
            </Badge>
            <Badge variant="secondary" className="text-xs">v2.0</Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-6 sm:mb-8 text-gray-900 tracking-tight">
            Automated <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Link Building</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed font-light">
            Submit your URL and keyword. Our expert team verifies and executes premium backlink campaigns automatically.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base text-gray-600 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Unlimited Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Unlimited Keywords</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>$29/month</span>
            </div>
          </div>
        </div>

        {/* Main Tool Section */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* Form Section */}
            <Card className="p-6 sm:p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold mb-2 text-gray-900 flex items-center gap-3">
                  <Link2 className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
                  Create Your Campaign
                </CardTitle>
                <p className="text-gray-600 font-light">
                  Submit for verification and automated premium backlink placement
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {showVerificationSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <Send className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Campaign Submitted Successfully!</strong>
                      <br />
                      Your Backlink ∞ Automation Link Building (beta) campaign has been submitted for verification. Our team will review your requirements and begin processing within 24-48 hours. You'll receive an email notification once verification is complete.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="targetUrl" className="text-base font-medium text-gray-700 mb-3 block">
                    Target URL *
                  </Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/target-page"
                    className="h-12 text-base sm:text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    The specific page you want to rank higher in search results
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="keyword" className="text-base font-medium text-gray-700 mb-3 block">
                    Target Keyword *
                  </Label>
                  <Input
                    id="keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="your target keyword"
                    className="h-12 text-base sm:text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    The keyword you want to rank for (use your primary target keyword)
                  </p>
                </div>

                <div>
                  <Label htmlFor="campaignNotes" className="text-base font-medium text-gray-700 mb-3 block">
                    Campaign Notes (Optional)
                  </Label>
                  <Textarea
                    id="campaignNotes"
                    value={campaignNotes}
                    onChange={(e) => setCampaignNotes(e.target.value)}
                    placeholder="Any specific requirements, target audience, or content preferences for your backlinks..."
                    className="min-h-[80px] text-sm"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Help our team create more targeted backlinks by sharing context about your business, target audience, or content preferences.
                  </p>
                </div>

                {/* Campaign Details */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">SEO Tools Project</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Blog Scraping:</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keywords:</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auto Posting:</span>
                      <span className="font-medium">24/7 Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Real-time Reports:</span>
                      <span className="font-medium">Live Updates</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Fee:</span>
                      <span className="font-medium">$29/month</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Subscription required for unlimited access
                  </p>
                </div>

                {/* Verification Process Info */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900 mb-1">Quality Verification Process</h4>
                      <p className="text-sm text-amber-800">
                        All campaigns undergo verification to ensure compliance with quality standards and search engine guidelines. This helps guarantee the best results for your investment.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={isCreating || !targetUrl.trim() || !keyword.trim() || showVerificationSuccess}
                  className="w-full h-12 text-base sm:text-lg font-medium"
                >
                  {isCreating ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Submitting for Verification...
                    </>
                  ) : showVerificationSuccess ? (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Campaign Submitted!
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Campaign for Verification
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-center text-sm text-gray-600 mt-4">
                    <span className="font-medium">New user?</span> You'll be prompted to create an account after clicking above.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Features Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Why Choose Backlink ∞ Automation Link Building (beta)?</h3>
                
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Process Steps */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Enhanced Workflow
                </h4>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <div className="font-medium text-gray-800">Submit Campaign</div>
                      <div>Enter your target URL, keyword, and campaign preferences</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <div className="font-medium text-gray-800">Quality Verification</div>
                      <div>Our experts review and approve your campaign (24-48 hours)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <div className="font-medium text-gray-800">Automated Execution</div>
                      <div>We find relevant, high-authority domains automatically</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <div className="font-medium text-gray-800">Backlink Creation</div>
                      <div>Premium backlinks are created and published</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">5</div>
                    <div>
                      <div className="font-medium text-gray-800">Monitor & Report</div>
                      <div>Track progress and watch your rankings improve</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
          <Globe className="h-10 sm:h-12 w-10 sm:w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
            Ready to Automate Your Link Building?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of SEO professionals who trust our automated link building platform for consistent, measurable results.
          </p>
          <Button 
            onClick={() => !user ? navigate('/login') : document.getElementById('targetUrl')?.focus()}
            size="lg"
            className="text-base sm:text-lg px-6 sm:px-8 py-3"
          >
            Get Started Today
            <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        serviceType="linkbuilding"
      />
    </div>
  );
};

export default NoHandsSEO;
