import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Target, 
  Activity, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
  Calendar,
  BarChart3,
  Shield,
  Globe,
  Link,
  RefreshCw,
  Eye,
  Filter,
  Settings,
  CreditCard,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import NoHandsSEODashboard from "@/components/NoHandsSEODashboard";

interface SEOToolsSectionProps {
  user: User | null;
}

interface NoHandsSEOProject {
  id: string;
  name: string;
  target_url: string;
  keywords: string[];
  status: 'active' | 'paused' | 'completed';
  blogs_found: number;
  successful_posts: number;
  created_at: string;
  last_run: string;
}

interface BlogPost {
  id: string;
  project_id: string;
  blog_url: string;
  post_url: string;
  keyword: string;
  status: 'pending' | 'posted' | 'failed';
  posted_at: string;
  name_used: string;
  website_field: string;
}

const SEOToolsSection = ({ user }: SEOToolsSectionProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [projects, setProjects] = useState<NoHandsSEOProject[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("no-hands-seo");
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      fetchProjects();
      fetchRecentPosts();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      // For development, set to false to show subscription UI
      // When tables are created, uncomment below:
      // const { data, error } = await supabase
      //   .from('seo_subscriptions')
      //   .select('*')
      //   .eq('user_id', user?.id)
      //   .eq('status', 'active')
      //   .single();
      //
      // if (!error && data) {
      //   setIsSubscribed(true);
      // }

      setIsSubscribed(true);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  };

  const fetchProjects = async () => {
    try {
      // For now, set empty projects since the table doesn't exist yet
      setProjects([]);

      // Uncomment when the table is created:
      // const { data, error } = await supabase
      //   .from('no_hands_seo_projects')
      //   .select('*')
      //   .eq('user_id', user?.id)
      //   .order('created_at', { ascending: false });
      //
      // if (!error && data) {
      //   setProjects(data);
      // }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      // For now, set empty posts since the table doesn't exist yet
      setRecentPosts([]);

      // Uncomment when the table is created:
      // const { data, error } = await supabase
      //   .from('blog_posts')
      //   .select('*')
      //   .eq('user_id', user?.id)
      //   .order('posted_at', { ascending: false })
      //   .limit(10);
      //
      // if (!error && data) {
      //   setRecentPosts(data);
      // }
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      setRecentPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      // Create Stripe checkout session for $29/month subscription
      const { data, error } = await supabase.functions.invoke('create-seo-subscription', {
        body: { user_id: user?.id, plan: 'no_hands_seo' }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isSubscribed) {
    return (
      <div className="space-y-6">
        {/* Subscription CTA */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">NO Hands SEO Tools</CardTitle>
            <p className="text-muted-foreground">
              Automate your link building with our advanced blog scraping and posting system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Unlimited Campaigns</div>
                  <div className="text-sm text-muted-foreground">Create as many projects as you need</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Unlimited Keywords</div>
                  <div className="text-sm text-muted-foreground">Target any number of keywords</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Blog Scraping</div>
                  <div className="text-sm text-muted-foreground">Find relevant blogs automatically</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Auto Posting</div>
                  <div className="text-sm text-muted-foreground">Post backlinks automatically</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Real-time Reporting</div>
                  <div className="text-sm text-muted-foreground">Track successful posts live</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">24/7 Automation</div>
                  <div className="text-sm text-muted-foreground">Works around the clock</div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white p-6 rounded-lg border-2 border-primary/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold">Premium Plan</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">$29</div>
              <div className="text-sm text-muted-foreground mb-4">per month</div>
              <Button onClick={handleSubscribe} size="lg" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Start Subscription
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Cancel anytime • No setup fees • 30-day money back guarantee
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Premium Active
          </Badge>
          <span className="text-sm text-muted-foreground">$29/month</span>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Manage Subscription
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="no-hands-seo">NO Hands SEO</TabsTrigger>
          <TabsTrigger value="keyword-research">Keyword Research</TabsTrigger>
          <TabsTrigger value="rank-tracker">Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="no-hands-seo" className="space-y-6">
          <NoHandsSEODashboard />
        </TabsContent>

        <TabsContent value="keyword-research" className="space-y-6">
          <KeywordResearchTool />
        </TabsContent>

        <TabsContent value="rank-tracker" className="space-y-6">
          <RankingTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEOToolsSection;
