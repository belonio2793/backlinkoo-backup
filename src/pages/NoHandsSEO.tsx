import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Link2, 
  Target, 
  ArrowRight, 
  CheckCircle, 
  Infinity,
  Globe,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import RegistrationModal from "@/components/RegistrationModal";

const NoHandsSEO = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

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
      const campaignName = `NO Hands SEO - ${domain} - ${keyword}`;

      // Create the campaign in Supabase
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          user_id: user.id,
          name: campaignName,
          target_url: targetUrl,
          keywords: [keyword],
          links_requested: 10, // Default to 10 links for NO Hands SEO
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Check and deduct credits (10 credits for 10 links)
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single();

      if (creditsError || !creditsData) {
        await supabase.from('campaigns').delete().eq('id', data.id);
        throw new Error('Unable to verify credit balance. Please try again.');
      }

      if (creditsData.amount < 10) {
        await supabase.from('campaigns').delete().eq('id', data.id);
        throw new Error('Insufficient credits. You need 10 credits to create this campaign. Please purchase more credits.');
      }

      // Deduct credits
      const { error: updateCreditsError } = await supabase
        .from('credits')
        .update({
          amount: creditsData.amount - 10,
          total_used: creditsData.amount - 10
        })
        .eq('user_id', user.id);

      if (updateCreditsError) {
        await supabase.from('campaigns').delete().eq('id', data.id);
        throw updateCreditsError;
      }

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -10,
          type: 'campaign_creation',
          campaign_id: data.id,
          description: `NO Hands SEO Campaign: ${campaignName}`
        });

      toast({
        title: "Campaign Created Successfully!",
        description: `Your NO Hands SEO campaign for "${keyword}" has been created and will be processed within 24 hours.`,
      });

      // Redirect to dashboard after successful creation
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Infinity className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Button onClick={() => navigate("/dashboard")} className="font-medium">
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate("/login")} className="font-medium">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-6 bg-blue-50 text-blue-600 border-blue-200 font-mono text-xs px-4 py-2">
            <Zap className="h-3 w-3 mr-2" />
            NO HANDS SEO TOOL
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-light mb-8 text-gray-900 tracking-tight">
            Automated <span className="text-primary">Link Building</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-6 max-w-4xl mx-auto leading-relaxed font-light">
            Enter your URL and keyword. We'll automatically create and execute a premium backlink campaign for you.
          </p>
          
          <p className="text-lg text-gray-600 mb-12 font-medium max-w-3xl mx-auto">
            10 high-quality backlinks • DA 50+ domains • Delivered in 7-14 days
          </p>
        </div>

        {/* Main Tool Section */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Form Section */}
            <Card className="p-8 shadow-xl border-0 bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold mb-2 text-gray-900 flex items-center gap-3">
                  <Link2 className="h-6 w-6 text-primary" />
                  Create Your Campaign
                </CardTitle>
                <p className="text-gray-600 font-light">
                  Automatic campaign creation with premium backlink placement
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {showVerificationSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <Send className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Campaign Submitted Successfully!</strong>
                      <br />
                      Your NO Hands SEO campaign has been submitted for verification. Our team will review your requirements and begin processing within 24-48 hours. You'll receive an email notification once verification is complete.
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
                    className="h-12 text-lg"
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
                    className="h-12 text-lg"
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
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Campaign Details</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Backlinks:</span>
                      <span className="font-medium">10 Premium Links</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domain Authority:</span>
                      <span className="font-medium">DA 50+ Average</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Time:</span>
                      <span className="font-medium">7-14 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-medium">10 Credits ($7.00)</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleCreateCampaign}
                  disabled={isCreating || !targetUrl.trim() || !keyword.trim() || showVerificationSuccess}
                  className="w-full h-12 text-lg font-medium"
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
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Why Choose NO Hands SEO?</h3>
                
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
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

              {/* Process Steps */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  How It Works
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">1</div>
                    <span>Enter your target URL and keyword</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">2</div>
                    <span>We automatically find relevant, high-authority domains</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">3</div>
                    <span>Premium backlinks are created and published</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">4</div>
                    <span>Watch your rankings improve over 2-4 weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
          <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Automate Your Link Building?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of SEO professionals who trust our automated link building platform for consistent, measurable results.
          </p>
          <Button 
            onClick={() => !user ? navigate('/login') : document.getElementById('targetUrl')?.focus()}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Get Started Today
            <ArrowRight className="h-5 w-5 ml-2" />
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
