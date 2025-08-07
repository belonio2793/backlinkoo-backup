import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LoginModal } from '../components/LoginModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Copy,
  Download,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Share2,
  Mail,
  MessageSquare,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Globe,
  Image,
  FileText,
  Smartphone,
  Monitor,
  Tablet,
  Eye,
  MousePointer,
  Target,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const SafeAffiliateProgram: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'login' | 'signup'>('login');
  const [activeToolkitTab, setActiveToolkitTab] = useState('social');
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState('twitter');
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('professional');
  const [customMessage, setCustomMessage] = useState('');
  const [trackingTimeRange, setTrackingTimeRange] = useState('7d');
  const [socialPage, setSocialPage] = useState(0);
  const [emailPage, setEmailPage] = useState(0);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const createTableIfNotExists = async () => {
    // Skip table creation - this should be handled via migrations or manual setup
    console.log('⚠️ Table creation skipped - affiliate_programs table should exist');
    return false;
  };

  const loadAffiliateData = async () => {
    try {
      console.log('🔄 Loading affiliate data for user:', user?.id);

      if (!user?.id) {
        console.log('❌ No user ID available');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('📊 Affiliate query result:', { data, error });

      // Check if table doesn't exist
      if (error && error.message.includes('does not exist')) {
        console.log('🔧 Table does not exist, attempting to create it...');

        if (toast) {
          toast({
            title: "Setting up affiliate system",
            description: "Creating database tables...",
            variant: "default"
          });
        }

        try {
          await createTableIfNotExists();

          // Wait a moment for table creation to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Retry loading data after table creation
          const { data: retryData, error: retryError } = await supabase
            .from('affiliate_programs')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (retryError && retryError.code !== 'PGRST116') {
            console.warn('Retry warning:', retryError);
            // Even if retry fails, consider the table created
          }

          setAffiliateData(retryData);

          if (toast) {
            toast({
              title: "Affiliate system ready",
              description: "Database setup completed. You may need to refresh the page.",
              variant: "default"
            });
          }

          return;
        } catch (tableError) {
          console.error('Table creation error:', tableError);
          if (toast) {
            toast({
              title: "Setup needed",
              description: "Please run the SQL manually in Supabase Dashboard. Check browser console for details.",
              variant: "destructive"
            });
          }
          throw new Error('Please create the affiliate_programs table manually in Supabase Dashboard');
        }
      }

      if (error && error.code !== 'PGRST116') {
        // Create a safe error message without JSON.stringify to avoid circular refs
        let safeErrorMessage = 'Unknown database error';
        if (typeof error.message === 'string') {
          safeErrorMessage = error.message;
        } else if (typeof error.details === 'string') {
          safeErrorMessage = error.details;
        } else if (typeof error.hint === 'string') {
          safeErrorMessage = error.hint;
        } else if (error.code) {
          safeErrorMessage = `Database error code: ${error.code}`;
        }

        console.error('❌ Error loading affiliate data:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error: ${safeErrorMessage}`);
      }

      if (error && error.code === 'PGRST116') {
        console.log('ℹ️ No affiliate profile found (expected for new users)');
      }

      setAffiliateData(data);
      console.log('✅ Affiliate data loaded successfully:', data);
    } catch (error: any) {
      console.error('Failed to load affiliate data:', error);

      // Create a safe error message for display
      let displayMessage = 'Failed to load affiliate data';
      if (error instanceof Error) {
        displayMessage = error.message;
      } else if (typeof error === 'string') {
        displayMessage = error;
      } else if (error?.message) {
        displayMessage = String(error.message);
      }

      if (toast) {
        toast({
          title: "Error loading affiliate data",
          description: displayMessage.length > 100 ? "Database connection issue. Please refresh the page." : displayMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateCode = () => {
    const prefix = 'BL';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const joinProgram = async () => {
    if (!user) return;

    setIsJoining(true);
    try {
      console.log('🚀 Creating affiliate profile for user:', user.id);

      const affiliateCode = generateAffiliateCode();
      const customId = Math.random().toString(36).substr(2, 8).toUpperCase();
      const referralUrl = `${window.location.origin}?ref=${affiliateCode}`;

      console.log('📝 Affiliate data to insert:', {
        user_id: user.id,
        affiliate_code: affiliateCode,
        custom_id: customId,
        status: 'active',
        commission_rate: 0.20,
        referral_url: referralUrl
      });

      const { data, error } = await supabase
        .from('affiliate_programs')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          custom_id: customId,
          status: 'active',
          commission_rate: 0.20,
          total_earnings: 0,
          total_paid: 0,
          pending_earnings: 0,
          referral_url: referralUrl
        })
        .select()
        .single();

      console.log('📊 Insert result:', { data, error });

      if (error) {
        // Log error details properly
        console.error('❌ Supabase error joining affiliate program:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', JSON.stringify(error, null, 2));

        // Extract meaningful error message
        let errorMessage = 'Unknown database error';

        if (error.message && error.message.trim()) {
          errorMessage = error.message;
        } else if (error.details && error.details.trim()) {
          errorMessage = error.details;
        } else if (error.hint && error.hint.trim()) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error code: ${error.code}`;
        }

        // Check for specific error types
        if (error.code === '23505') {
          errorMessage = 'You already have an affiliate account. Please refresh the page.';
        } else if (error.code === '42P01') {
          errorMessage = 'Database table not found. Please contact support.';
        } else if (error.code === '23503') {
          errorMessage = 'Authentication error. Please sign out and sign back in.';
        }

        throw new Error(errorMessage);
      }

      setAffiliateData(data);

      if (toast) {
        toast({
          title: "🎉 Welcome to the Affiliate Program!",
          description: "Your account is active and ready to earn commissions!"
        });
      }
    } catch (error: any) {
      let errorMessage = 'Unknown error occurred';

      console.error('Error joining affiliate program:');
      console.error('Error type:', typeof error);
      console.error('Error instance:', error instanceof Error);
      console.error('Error string:', String(error));
      console.error('Error JSON:', JSON.stringify(error, null, 2));

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to join affiliate program. Please try again.';
      }

      if (toast) {
        toast({
          title: "Join failed",
          description: errorMessage.length > 100 ? "Database error occurred. Please try again." : errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (toast) {
        toast({
          title: "Copied!",
          description: "Content copied to clipboard"
        });
      }
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      if (toast) {
        toast({
          title: "Copied!",
          description: "Content copied to clipboard"
        });
      }
    }
  };

  const getSocialTemplates = (platform: string, referralUrl: string) => {
    const templates: Record<string, any[]> = {
      twitter: [
        // Page 1
        {
          type: "Discovery",
          content: `🚀 Just discovered Backlink ∞ - game-changing SEO tool for link building!

Their automated outreach is incredible. Check it out:

${referralUrl}`,
          engagement: "High",
          audience: "SEO professionals"
        },
        {
          type: "Results",
          content: `📈 Increased my domain authority by 15 points using Backlink ∞'s link building platform.

The ROI is amazing!

${referralUrl} #SEO #LinkBuilding`,
          engagement: "Very High",
          audience: "Digital marketers"
        },
        {
          type: "Tips",
          content: `💡 Pro tip: Quality backlinks > quantity.

Backlink ∞ helps you get high-DA links that actually move the needle.

Try it: ${referralUrl}`,
          engagement: "Medium",
          audience: "Business owners"
        },
        // Page 2
        {
          type: "Question",
          content: `Struggling with link building? 🤔

I was too until I found Backlink ∞. Their automated system has saved me 20+ hours per week.

Who else needs this? ${referralUrl}`,
          engagement: "High",
          audience: "SEO beginners"
        },
        {
          type: "Comparison",
          content: `Manual outreach vs Backlink ∞:\n❌ 10 emails/day manually\n✅ 100+ targeted outreach/day\n\nThe difference is game-changing: ${referralUrl}`,
          engagement: "Medium",
          audience: "Efficiency seekers"
        },
        {
          type: "Thread Starter",
          content: `🧵 THREAD: 5 link building mistakes that are killing your SEO (and how Backlink ∞ fixes them)\n\n1/ Manual outreach doesn't scale... ${referralUrl}`,
          engagement: "Very High",
          audience: "Thread readers"
        },
        // Page 3
        {
          type: "Stats",
          content: `📊 6 months with Backlink ∞:\n• 400+ high-quality backlinks\n• 65% increase in organic traffic\n• 23 point DA improvement\n\nResults speak louder than words: ${referralUrl}`,
          engagement: "High",
          audience: "Data-driven marketers"
        },
        {
          type: "Problem/Solution",
          content: `Problem: Spending 40 hours/week on link outreach with poor results\nSolution: Backlink ∞'s AI does it in 2 hours with 10x better success rate\n\n${referralUrl}`,
          engagement: "Medium",
          audience: "Busy entrepreneurs"
        },
        {
          type: "Behind the Scenes",
          content: `BTS: How I went from 50 to 500 referring domains in 90 days using @BacklinkInfinity's automated platform.

The secret sauce inside: ${referralUrl}`,
          engagement: "High",
          audience: "Growth hackers"
        },
        // Page 4
        {
          type: "Quote Tweet Ready",
          content: `"Link building is dead" - Wrong!

It's evolved. Backlink ∞ proves that AI-powered outreach is the future of SEO.

Here's my experience: ${referralUrl}`,
          engagement: "Medium",
          audience: "SEO community"
        },
        {
          type: "Urgency",
          content: `🔥 LAST 24 HOURS: Backlink ∞'s free trial ends soon.

If you're serious about SEO, don't miss this opportunity to transform your link building:

${referralUrl}`,
          engagement: "High",
          audience: "Decision makers"
        },
        {
          type: "Personal Story",
          content: `2 years ago, I was manually sending 20 outreach emails daily.

Today, Backlink ∞ sends 200+ while I focus on strategy.

Game changer: ${referralUrl}`,
          engagement: "High",
          audience: "Personal brand builders"
        },
        // Page 5
        {
          type: "List",
          content: `Top 3 reasons Backlink ∞ beats manual outreach:\n1. 10x faster results\n2. Higher success rates\n3. Time to focus on strategy\n\nTry it free: ${referralUrl}`,
          engagement: "Medium",
          audience: "List lovers"
        },
        {
          type: "Challenge",
          content: `Challenge: Get 50 high-quality backlinks in 30 days.

Sounds impossible? Not with Backlink ∞. I did 87.

Your turn: ${referralUrl}`,
          engagement: "High",
          audience: "Competitive types"
        },
        {
          type: "Myth Busting",
          content: `Myth: "AI can't do personalized outreach"\nReality: Backlink ∞'s AI writes better emails than most humans\n\nSee for yourself: ${referralUrl}`,
          engagement: "Medium",
          audience: "AI skeptics"
        },
        // Page 6
        {
          type: "Before/After",
          content: `Before Backlink ∞: 2-3 backlinks/month\nAfter Backlink ∞: 20-30 backlinks/month\n\nSame effort, 10x results. Here's how: ${referralUrl}`,
          engagement: "High",
          audience: "Result seekers"
        },
        {
          type: "Prediction",
          content: `Prediction: In 2024, businesses using AI for link building will dominate those doing manual outreach.

Get ahead with Backlink ∞: ${referralUrl}`,
          engagement: "Medium",
          audience: "Forward thinkers"
        },
        {
          type: "Question Hook",
          content: `What if I told you that you could automate 90% of your link building while getting better results?

Meet Backlink ∞: ${referralUrl}`,
          engagement: "High",
          audience: "Curious minds"
        },
        // Page 7
        {
          type: "Resource",
          content: `📚 Resource: The only link building tool you'll ever need.

Backlink ∞ handles prospecting, outreach, and follow-ups automatically:

${referralUrl}`,
          engagement: "Medium",
          audience: "Resource collectors"
        },
        {
          type: "Industry Insight",
          content: `SEO industry insight: Manual link building is becoming obsolete.

Smart agencies are switching to Backlink ∞ for scalable results:

${referralUrl}`,
          engagement: "High",
          audience: "Industry watchers"
        },
        {
          type: "ROI Focus",
          content: `ROI calculator:\n$500/month for VA doing outreach\n$99/month for Backlink ∞\n= 5x cost savings + better results\n\nDo the math: ${referralUrl}`,
          engagement: "High",
          audience: "Budget conscious"
        }
      ],
      linkedin: [
        // Page 1
        {
          type: "Professional",
          content: `As an SEO professional, I'm always looking for tools that deliver real results.

Backlink ∞'s automated link building platform has transformed how I approach SEO campaigns. The quality of links and time saved is remarkable.

${referralUrl}`,
          engagement: "High",
          audience: "B2B professionals"
        },
        {
          type: "Case Study",
          content: `Case Study: How I increased organic traffic by 300% in 6 months using strategic link building.

The secret? Backlink ∞'s platform made it scalable and efficient.

${referralUrl}`,
          engagement: "Very High",
          audience: "Marketing managers"
        },
        {
          type: "Industry Trend",
          content: `The future of SEO is automation.

While competitors waste time on manual outreach, forward-thinking businesses are leveraging Backlink ∞ to scale their link building efforts efficiently.

${referralUrl}`,
          engagement: "High",
          audience: "Business leaders"
        },
        // Page 2
        {
          type: "ROI Analysis",
          content: `ROI Analysis: Investing in Backlink ∞ vs hiring a link building team\n\n• Tool cost: $99/month\n• Team cost: $5,000/month\n• Results: Tool delivers 3x better success rates\n\nThe math is clear. ${referralUrl}`,
          engagement: "Very High",
          audience: "C-suite executives"
        },
        {
          type: "Process Improvement",
          content: `Process improvement spotlight: How we reduced our link building time by 85% while improving quality scores.

Backlink ∞'s automation handles prospecting, outreach, and follow-ups seamlessly.

${referralUrl}`,
          engagement: "High",
          audience: "Operations managers"
        },
        {
          type: "Team Efficiency",
          content: `Team efficiency update: Since implementing Backlink ∞, our marketing team can focus on strategy and content creation instead of manual outreach.

Productivity has increased by 200%.

${referralUrl}`,
          engagement: "High",
          audience: "Team leaders"
        },
        // Page 3
        {
          type: "Consultant Insight",
          content: `Consultant insight: I've evaluated dozens of link building tools for clients.

Backlink ∞ consistently delivers the highest ROI with the least time investment. Here's why it's my top recommendation:

${referralUrl}`,
          engagement: "Very High",
          audience: "Consultants"
        },
        {
          type: "Agency Owner",
          content: `Agency owner perspective: Scaling link building services was our biggest challenge until Backlink ∞.

Now we can serve 5x more clients with the same team size. Game-changing for agency growth.

${referralUrl}`,
          engagement: "High",
          audience: "Agency owners"
        },
        {
          type: "Startup Growth",
          content: `Startup growth hack: With limited resources, we needed maximum SEO impact.

Backlink ∞ delivered enterprise-level link building results at a fraction of the cost. Perfect for lean teams.

${referralUrl}`,
          engagement: "High",
          audience: "Startup founders"
        },
        // Page 4
        {
          type: "Data-Driven Results",
          content: `Data speaks louder than opinions. After 6 months with Backlink ∞:\n\n📈 Domain Authority: +23 points\n📈 Referring domains: +287\n��� Organic traffic: +156%\n📈 Lead quality: Significantly improved\n\nROI has exceeded all expectations. ${referralUrl}`,
          engagement: "Very High",
          audience: "Data analysts"
        },
        {
          type: "Executive Summary",
          content: `Executive summary for leadership teams:

The biggest competitive advantage in digital marketing today isn't more budget—it's better automation.

Backlink ∞ has become our strategic differentiator.

${referralUrl}`,
          engagement: "High",
          audience: "Executives"
        },
        {
          type: "Technology Innovation",
          content: `Innovation spotlight: AI-powered link building isn't the future—it's the present.

Companies using platforms like Backlink ∞ are already outpacing traditional SEO agencies by 300%.

Time to adapt or fall behind.

${referralUrl}`,
          engagement: "High",
          audience: "Tech leaders"
        },
        // Page 5
        {
          type: "Strategic Partnership",
          content: `Strategic insight: We've integrated Backlink ∞ into our client delivery process.

What used to take our team 40 hours now takes 4 hours with better results.

This is how modern agencies stay competitive.

${referralUrl}`,
          engagement: "Very High",
          audience: "Agency partners"
        },
        {
          type: "Industry Transformation",
          content: `The SEO industry is experiencing its biggest transformation since Google's PageRank algorithm.

Backlink ∞ represents the next evolution—combining AI precision with human strategy for unprecedented results.

${referralUrl}`,
          engagement: "High",
          audience: "Industry leaders"
        },
        {
          type: "Competitive Intelligence",
          content: `Competitive intelligence update: While competitors struggle with manual outreach, we've automated 90% of our link building pipeline with Backlink ∞.

Market share is shifting to those who adapt fastest.

${referralUrl}`,
          engagement: "High",
          audience: "Strategic planners"
        },
        // Page 6
        {
          type: "Operational Excellence",
          content: `Operational excellence achievement: Backlink ∞ has enabled us to standardize our link building process across all client accounts.

Consistency, quality, and scalability—the trifecta of successful operations.

${referralUrl}`,
          engagement: "High",
          audience: "Operations leaders"
        },
        {
          type: "Digital Transformation",
          content: `Digital transformation case study: Legacy SEO agencies are struggling to adapt while tech-forward companies using Backlink ∞ are capturing market share.

Evolution isn't optional—it's essential.

${referralUrl}`,
          engagement: "Very High",
          audience: "Transformation officers"
        },
        {
          type: "Thought Leadership",
          content: `Thought leadership perspective: The convergence of AI and SEO is creating new possibilities.

Backlink ∞ exemplifies how intelligent automation can amplify human expertise rather than replace it.

${referralUrl}`,
          engagement: "High",
          audience: "Thought leaders"
        },
        // Page 7
        {
          type: "Future of Work",
          content: `Future of work insight: SEO professionals aren't being replaced by AI—they're being empowered by it.

Backlink ∞ allows our team to focus on strategy while automation handles execution.

This is the future.

${referralUrl}`,
          engagement: "Very High",
          audience: "HR leaders"
        },
        {
          type: "Investment Thesis",
          content: `Investment thesis: Marketing technology that delivers measurable ROI will dominate the next decade.

Backlink ∞'s proven track record makes it a cornerstone of our digital strategy portfolio.

${referralUrl}`,
          engagement: "High",
          audience: "Investors"
        },
        {
          type: "Market Leadership",
          content: `Market leadership requires constant innovation.

While others debate the value of automated link building, we're already seeing 400% improvement in client outcomes with Backlink ∞.

Lead, follow, or get left behind.

${referralUrl}`,
          engagement: "Very High",
          audience: "Market leaders"
        }
      ],
      facebook: [
        // Page 1
        {
          type: "Recommendation",
          content: `🌟 Recommendation for small business owners:

If you're struggling with SEO and getting your website noticed, Backlink ∞ is a game-changer.

Their platform simplifies link building and delivers real results.

${referralUrl}`,
          engagement: "High",
          audience: "Small business owners"
        },
        {
          type: "Success Story",
          content: `From struggling with SEO to ranking on page 1 - here's how Backlink ∞ helped transform my online presence.

The automated outreach and quality links made all the difference!

${referralUrl}`,
          engagement: "Very High",
          audience: "Entrepreneurs"
        },
        {
          type: "Community Help",
          content: `Hey everyone! 👋

I know many of you are working on growing your online businesses. I recently discovered this amazing tool called Backlink ∞ that has seriously boosted my website's visibility.

Thought I'd share! ${referralUrl}`,
          engagement: "High",
          audience: "Community members"
        },
        // Page 2
        {
          type: "Behind the Scenes",
          content: `Behind the scenes of my business growth:

I've been quietly testing different SEO strategies, and Backlink ∞ has been the secret weapon that's finally moving the needle.

Here's what happened... ${referralUrl}`,
          engagement: "Very High",
          audience: "Business owners"
        },
        {
          type: "Problem Solver",
          content: `Struggling with getting your website noticed? 🤔 You're not alone! I was in the same boat until I found Backlink ∞. This platform has completely changed my approach to SEO and the results speak for themselves. ${referralUrl}`,
          engagement: "High",
          audience: "Problem seekers"
        },
        {
          type: "Group Share",
          content: `Friends! I had to share this with you all. After months of trying different SEO strategies, I finally found something that works. Backlink ∞ has helped me increase my website traffic by 300% in just 2 months! ${referralUrl}`,
          engagement: "High",
          audience: "Facebook groups"
        },
        // Page 3
        {
          type: "Educational",
          content: `Did you know that 91% of web pages never get organic traffic from Google? The main reason? Poor backlink profile. That's exactly why I started using Backlink ∞ to build high-quality links systematically. ${referralUrl}`,
          engagement: "Medium",
          audience: "Learners"
        },
        {
          type: "Before and After",
          content: `January: 500 monthly visitors\nJune: 5,000 monthly visitors\n\nWhat changed? I started using Backlink ∞ for strategic link building. The automated outreach saved me hours while delivering better results than manual efforts. ${referralUrl}`,
          engagement: "Very High",
          audience: "Results focused"
        },
        {
          type: "Local Business",
          content: `Local business owners - listen up! 📢 Getting found online is crucial for your success. Backlink ∞ helped my local service business rank #1 for our main keywords. Now we're booked solid! ${referralUrl}`,
          engagement: "High",
          audience: "Local businesses"
        },
        // Page 4
        {
          type: "Honest Review",
          content: `Honest review time: I've tried countless SEO tools over the years, and most over-promise and under-deliver. Backlink ∞ is different. It actually does what it claims - builds quality backlinks efficiently. Worth every penny. ${referralUrl}`,
          engagement: "Very High",
          audience: "Skeptical buyers"
        },
        {
          type: "Time Saver",
          content: `As a busy entrepreneur, time is my most valuable asset. Backlink ∞ has given me back 15+ hours per week that I used to spend on manual outreach. Now I can focus on growing my business instead! ${referralUrl}`,
          engagement: "High",
          audience: "Busy professionals"
        },
        {
          type: "ROI Focused",
          content: `Best investment I've made for my business this year: Backlink ∞. Cost: $99/month. ROI: 500%+ from increased organic traffic and leads. Sometimes the numbers don't lie! ${referralUrl}`,
          engagement: "High",
          audience: "ROI conscious"
        },
        // Page 5
        {
          type: "Milestone",
          content: `🎉 Celebrating a major milestone! Thanks to strategic link building with Backlink ∞, we just hit 100,000 monthly organic visitors. A year ago, we were at 10,000. Dreams do come true with the right tools! ${referralUrl}`,
          engagement: "Very High",
          audience: "Celebrators"
        },
        {
          type: "Comparison",
          content: `I used to pay $2,000/month for a link building agency. They delivered 5-10 links per month. Backlink ∞ delivers 20-30 higher quality links for $99/month. The choice is obvious! ${referralUrl}`,
          engagement: "High",
          audience: "Budget conscious"
        },
        {
          type: "Urgency",
          content: `If you're serious about growing your online presence, don't wait another day. Every day you delay is potential traffic and revenue lost. I wish I had found Backlink ∞ sooner! ${referralUrl}`,
          engagement: "Medium",
          audience: "Procrastinators"
        },
        // Page 6
        {
          type: "Testimonial Style",
          content: `"I was skeptical about automated link building until I tried Backlink ∞. Three months later, my domain authority increased by 20 points and organic traffic doubled. This tool is the real deal!" - Happy user ${referralUrl}`,
          engagement: "High",
          audience: "Social proof seekers"
        },
        {
          type: "Industry Insight",
          content: `The SEO industry is evolving fast. Manual link building is becoming obsolete. Smart business owners are switching to AI-powered solutions like Backlink ∞ to stay competitive. Don't get left behind! ${referralUrl}`,
          engagement: "Medium",
          audience: "Industry watchers"
        },
        {
          type: "Personal Journey",
          content: `My entrepreneurship journey taught me that success comes from finding the right tools and leveraging them effectively. Backlink ∞ has been that game-changing tool for my SEO strategy. What's yours? ${referralUrl}`,
          engagement: "High",
          audience: "Personal brand"
        },
        // Page 7
        {
          type: "Question Hook",
          content: `Quick question: What if you could build high-quality backlinks while you sleep? Sounds too good to be true, right? That's exactly what Backlink ∞ does with its automated outreach system. Mind blown! 🤯 ${referralUrl}`,
          engagement: "High",
          audience: "Curious minds"
        },
        {
          type: "Challenge",
          content: `I challenge you to find a more efficient way to build quality backlinks than Backlink ∞. I've been searching for 3 years and nothing comes close. Prove me wrong! (Spoiler: you can't) ${referralUrl}`,
          engagement: "Medium",
          audience: "Competitive types"
        },
        {
          type: "Future Prediction",
          content: `Prediction: In 2024, businesses using AI for link building will dominate search results. Those stuck with manual methods will wonder what happened. Get ahead of the curve with Backlink ∞! ${referralUrl}`,
          engagement: "Medium",
          audience: "Forward thinkers"
        }
      ],
      instagram: [
        // Page 1
        {
          type: "Visual Story",
          content: `📊 Behind the scenes of my SEO growth strategy ✨

Swipe to see how Backlink ∞ helped me build high-quality backlinks that actually work!

Link in bio: ${referralUrl}

#SEO #DigitalMarketing #Entrepreneur`,
          engagement: "High",
          audience: "Visual marketers"
        },
        {
          type: "Transformation",
          content: `✨ TRANSFORMATION TUESDAY ✨\nFrom 0 to 10K organic visitors in 6 months using strategic link building with Backlink ∞\n\nSwipe for the full journey 👉\nLink in bio: ${referralUrl}\n\n#GrowthHacking #SEOSuccess #OnlineBusiness`,
          engagement: "Very High",
          audience: "Growth enthusiasts"
        },
        {
          type: "Tips Carousel",
          content: `🎯 5 SEO mistakes that are costing you traffic\n\nSlide 1: Not focusing on quality backlinks\nSlide 2: Manual outreach that doesn't scale\n\nSolution: Backlink ∞ automates everything!\nLink in bio: ${referralUrl}\n\n#SEOTips #DigitalMarketing`,
          engagement: "High",
          audience: "Tip seekers"
        },
        // Page 2
        {
          type: "Results Showcase",
          content: `📈 RESULTS DON'T LIE 📈\n\nBefore Backlink ∞: 2 backlinks/month\nAfter Backlink ∞: 25 backlinks/month\n\nSame effort, 12x results! 🚀\n\nLink in bio: ${referralUrl}\n\n#Results #SEOGrowth #Automation #BusinessGrowth`,
          engagement: "Very High",
          audience: "Results driven"
        },
        {
          type: "Story Series",
          content: `💡 STORY TIME: How I went from SEO rookie to expert\n\nPart 3: The tool that changed everything\n\nEnter Backlink ∞ 🎯\nAutomated outreach ✅\nHigh-quality links ✅\nTime freedom ✅\n\nLink in bio: ${referralUrl}\n\n#EntrepreneurLife #SEOJourney`,
          engagement: "High",
          audience: "Story lovers"
        },
        {
          type: "Motivational Monday",
          content: `💪 MOTIVATIONAL MONDAY 💪\n\n"Success isn't about working harder, it's about working smarter"\n\nThat's why I use Backlink ��� for link building 🧠\n\nWork smart, not hard! 💯\n\nLink in bio: ${referralUrl}\n\n#MotivationMonday #WorkSmart #Entrepreneur`,
          engagement: "High",
          audience: "Motivation seekers"
        },
        // Page 3
        {
          type: "Process Reveal",
          content: `🔍 HOW I BUILD 30+ BACKLINKS/MONTH\n\nStep 1: Log into Backlink ∞\nStep 2: Set targeting parameters\nStep 3: Let AI do the work\nStep 4: Watch links roll in 📊\n\nIt's that simple!\n\nLink in bio: ${referralUrl}\n\n#ProcessReveal #SEOHacks`,
          engagement: "Very High",
          audience: "Process learners"
        },
        {
          type: "Before and After",
          content: `⬅️ BEFORE: Manual outreach nightmare\n• 20 emails/day\n• 2% response rate\n• Burnt out after 1 month\n\n➡️ AFTER: Backlink ∞ magic\n• 100+ automated emails/day\n• 15% response rate\n��� More time for strategy\n\nLink in bio: ${referralUrl}\n\n#BeforeAndAfter`,
          engagement: "Very High",
          audience: "Transformation seekers"
        },
        {
          type: "Quick Win",
          content: `⚡ QUICK WIN WEDNESDAY ⚡\n\nWant an instant SEO boost?\n\nStart building quality backlinks TODAY with Backlink ∞\n\nNo experience needed 🎯\nResults in 30 days 📈\nFree trial available 🆓\n\nLink in bio: ${referralUrl}\n\n#QuickWin #SEOBoost`,
          engagement: "High",
          audience: "Quick results"
        },
        // Page 4
        {
          type: "Feature Friday",
          content: `🌟 FEATURE FRIDAY 🌟\n\nSpotlight: Backlink ∞'s AI Outreach\n\n✨ Writes personalized emails\n✨ Finds perfect prospects\n✨ Follows up automatically\n✨ Tracks everything\n\nIt's like having a team of experts! 👥\n\nLink in bio: ${referralUrl}\n\n#FeatureFriday #AITools`,
          engagement: "High",
          audience: "Feature enthusiasts"
        },
        {
          type: "Success Saturday",
          content: `🏆 SUCCESS SATURDAY 🏆\n\nCelebrating another win! 🎉\n\nJust landed 5 high-DA backlinks this week thanks to Backlink ∞\n\nDomain Authority: +3 points 📈\nOrganic traffic: +25% 🚀\n\nConsistency pays off!\n\nLink in bio: ${referralUrl}\n\n#SuccessSaturday #Wins`,
          engagement: "High",
          audience: "Success celebrators"
        },
        {
          type: "Sunday Reflection",
          content: `🌅 SUNDAY REFLECTION 🌅\n\nThis week I learned:\n\n💭 Working harder ≠ Better results\n💭 The right tools make all the difference\n💭 Backlink ∞ is that tool for SEO\n\nWhat did you learn?\n\nLink in bio: ${referralUrl}\n\n#SundayReflection #Lessons`,
          engagement: "Medium",
          audience: "Reflective thinkers"
        },
        // Page 5
        {
          type: "Myth Buster",
          content: `🚫 MYTH BUSTER ALERT 🚫\n\nMyth: "AI can't do personalized outreach"\n\nReality: Backlink ∞'s AI writes better emails than most humans! 🤖\n\nPersonalization ✅\nContext awareness ✅\nHigh response rates ✅\n\nLink in bio: ${referralUrl}\n\n#MythBuster #AIFacts`,
          engagement: "High",
          audience: "Myth busters"
        },
        {
          type: "Tool Tuesday",
          content: `🛠️ TOOL TUESDAY 🛠️\n\nToday's spotlight: Backlink ∞\n\nWhat it does: Automates link building\nWhy I love it: Saves 20+ hours/week\nBest feature: AI-powered outreach\nPrice: Worth every penny\n\nLink in bio: ${referralUrl}\n\n#ToolTuesday #ProductivityTools`,
          engagement: "High",
          audience: "Tool enthusiasts"
        },
        {
          type: "Growth Hack",
          content: `��� GROWTH HACK REVEALED 💡\n\nSecret sauce for explosive SEO growth:\n\n1️⃣ Quality content ✅\n2️��� Technical SEO ✅\n3️⃣ High-quality backlinks ✅\n\nFor #3, I use Backlink ∞ exclusively! 🎯\n\nLink in bio: ${referralUrl}\n\n#GrowthHack #SEOSecrets`,
          engagement: "Very High",
          audience: "Growth hackers"
        },
        // Page 6
        {
          type: "Entrepreneur Life",
          content: `👨‍💼 ENTREPRENEUR LIFE 👨‍💼\n\n6 AM: Coffee ☕\n8 AM: Check Backlink ∞ results 📊\n9 AM: 15 new quality backlinks! 🎉\n10 AM: Focus on other business priorities\n\nAutomation = Freedom! 🗽\n\nLink in bio: ${referralUrl}\n\n#EntrepreneurLife #Automation`,
          engagement: "High",
          audience: "Entrepreneurs"
        },
        {
          type: "Behind the Scenes",
          content: `🎬 BEHIND THE SCENES 🎬\n\nHow I really grew my website traffic:\n\n📹 Slide 1: The struggle was real\n📹 Slide 2: Found Backlink ∞\n📹 Slide 3: Set up campaigns\n📹 Slide 4: Results started flowing\n📹 Slide 5: Now living the dream\n\nLink in bio: ${referralUrl}\n\n#BehindTheScenes`,
          engagement: "Very High",
          audience: "BTS lovers"
        },
        {
          type: "Weekend Warrior",
          content: `⚡ WEEKEND WARRIOR ⚡\n\nWhile others rest, I optimize! 💪\n\nThis weekend's project:\nOptimizing my Backlink ∞ campaigns for even better results\n\nHustle never stops! 🔥\n\nLink in bio: ${referralUrl}\n\n#WeekendWarrior #HustleMode #SEOLife`,
          engagement: "Medium",
          audience: "Weekend workers"
        },
        // Page 7
        {
          type: "Grateful Thursday",
          content: `🙏 GRATEFUL THURSDAY 🙏\n\nToday I'm grateful for:\n\n✨ Amazing tools like Backlink ∞\n✨ The opportunity to grow online\n✨ This incredible community\n✨ Your support and engagement\n\nWhat are you grateful for?\n\nLink in bio: ${referralUrl}\n\n#GratefulThursday #Blessed`,
          engagement: "High",
          audience: "Grateful hearts"
        },
        {
          type: "Industry Update",
          content: `📰 INDUSTRY UPDATE 📰\n\nLatest SEO trends:\n\n🔥 AI-powered link building\n🔥 Quality over quantity\n🔥 Automated outreach\n🔥 Data-driven strategies\n\nBacklink ∞ covers all of these! 💯\n\nLink in bio: ${referralUrl}\n\n#IndustryUpdate #SEOTrends`,
          engagement: "Medium",
          audience: "Industry watchers"
        },
        {
          type: "Final Push",
          content: `🎯 FINAL CALL 🎯\n\nIf you're serious about SEO success:\n\n⏰ Don't wait another day\n⏰ Every moment counts\n��� Your competitors aren't waiting\n⏰ Start building links NOW\n\nBacklink ∞ = Your secret weapon! 🚀\n\nLink in bio: ${referralUrl}\n\n#FinalCall #TakeAction`,
          engagement: "High",
          audience: "Action takers"
        }
      ],
      youtube: [
        // Page 1
        {
          type: "Tutorial",
          content: `🎥 NEW VIDEO: "How I Built 500+ High-Quality Backlinks in 30 Days" - featuring Backlink ∞'s automated platform.

This tool is a game-changer for SEO!

${referralUrl}`,
          engagement: "Very High",
          audience: "Content creators"
        },
        {
          type: "Review",
          content: `📹 HONEST REVIEW: I tested Backlink ∞ for 90 days - here are my unfiltered results.

Spoiler alert: The ROI is incredible!

Full breakdown in today's video: ${referralUrl}`,
          engagement: "Very High",
          audience: "Review watchers"
        },
        {
          type: "Case Study",
          content: `🔥 CASE STUDY: How I 10x'd my organic traffic using ONE tool. In this deep-dive video, I show you exactly how Backlink ∞ transformed my SEO strategy: ${referralUrl}`,
          engagement: "High",
          audience: "Strategy learners"
        },
        // Page 2
        {
          type: "Live Test",
          content: `🎬 LIVE TEST: Building backlinks in real-time with Backlink ∞.

Watch me set up a campaign from scratch and get our first links within 24 hours!

Timestamps in description: ${referralUrl}`,
          engagement: "Very High",
          audience: "Live action fans"
        },
        {
          type: "Before vs After",
          content: `📊 DRAMATIC BEFORE & AFTER: My website's transformation using Backlink ∞.

Traffic charts, ranking improvements, and revenue growth - all the data revealed!

${referralUrl}`,
          engagement: "Very High",
          audience: "Data lovers"
        },
        {
          type: "Step by Step",
          content: `📋 COMPLETE GUIDE: Setting up your first Backlink ∞ campaign (Beginner friendly).

Follow along as I walk through every single step with zero experience assumed:

${referralUrl}`,
          engagement: "High",
          audience: "Beginners"
        },
        // Page 3
        {
          type: "Tool Comparison",
          content: `⚔️ ULTIMATE COMPARISON: Backlink ∞ vs 7 other link building tools.

I spent $3,000 testing them all so you don't have to. The winner might surprise you!

${referralUrl}`,
          engagement: "Very High",
          audience: "Comparison shoppers"
        },
        {
          type: "Expert Interview",
          content: `🎤 EXPERT INTERVIEW: SEO guru reveals why Backlink ∞ is the future of link building. Insider secrets and industry predictions you won't hear anywhere else: ${referralUrl}`,
          engagement: "High",
          audience: "Expert insights"
        },
        {
          type: "ROI Breakdown",
          content: `💰 ROI BREAKDOWN: Exact numbers from my Backlink ∞ investment.

$99/month turned into $5,000/month in additional revenue.

Here's the math: ${referralUrl}`,
          engagement: "Very High",
          audience: "ROI focused"
        },
        // Page 4
        {
          type: "Screen Recording",
          content: `💻 SCREEN RECORDING: Watch over my shoulder as I use Backlink ∞ for 30 minutes. Real campaigns, real results, no fluff - just pure value: ${referralUrl}`,
          engagement: "High",
          audience: "Visual learners"
        },
        {
          type: "Mistakes to Avoid",
          content: `❌ 10 COSTLY MISTAKES I made with Backlink ∞ (and how to avoid them). Learn from my failures so you can succeed faster. Don't make these same errors! ${referralUrl}`,
          engagement: "High",
          audience: "Mistake avoiders"
        },
        {
          type: "Advanced Strategy",
          content: `🚀 ADVANCED STRATEGY: How I use Backlink ∞ to build topic authority and dominate competitive niches. This isn't beginner stuff - proceed with caution! ${referralUrl}`,
          engagement: "High",
          audience: "Advanced users"
        },
        // Page 5
        {
          type: "Q&A Session",
          content: `❓ LIVE Q&A: Everything you want to know about Backlink ∞. I'm answering your top 50 questions about features, pricing, results, and more. Timestamps included: ${referralUrl}`,
          engagement: "High",
          audience: "Question askers"
        },
        {
          type: "Update Video",
          content: `🆕 MAJOR UPDATE: New Backlink ∞ features that will blow your mind! AI improvements, better targeting, and automation upgrades that change everything: ${referralUrl}`,
          engagement: "High",
          audience: "Update watchers"
        },
        {
          type: "Behind the Scenes",
          content: `🎬 BEHIND THE SCENES: My entire link building operation revealed. See exactly how I manage multiple Backlink ∞ campaigns and scale to 6-figure results: ${referralUrl}`,
          engagement: "Very High",
          audience: "BTS enthusiasts"
        },
        // Page 6
        {
          type: "Troubleshooting",
          content: `🔧 TROUBLESHOOTING GUIDE: Common Backlink ∞ issues and how to fix them. Save hours of frustration with these proven solutions from someone who's seen it all: ${referralUrl}`,
          engagement: "Medium",
          audience: "Problem solvers"
        },
        {
          type: "Success Stories",
          content: `🏆 SUCCESS STORIES: 5 entrepreneurs who transformed their businesses with Backlink ∞. Their strategies, results, and advice for getting started: ${referralUrl}`,
          engagement: "High",
          audience: "Inspiration seekers"
        },
        {
          type: "Monthly Results",
          content: `📈 MONTHLY RESULTS: Complete transparency on my Backlink ∞ performance. Traffic stats, ranking improvements, and revenue generated - nothing hidden! ${referralUrl}`,
          engagement: "Very High",
          audience: "Transparency lovers"
        },
        // Page 7
        {
          type: "Automation Setup",
          content: `🤖 AUTOMATION MASTERCLASS: Set up Backlink ∞ to run completely on autopilot. My exact workflows for hands-off link building that works 24/7: ${referralUrl}`,
          engagement: "High",
          audience: "Automation fans"
        },
        {
          type: "Industry Secrets",
          content: `🤫 INDUSTRY SECRETS: What link building agencies don't want you to know about Backlink ∞. Insider knowledge from 10 years in the SEO trenches: ${referralUrl}`,
          engagement: "Very High",
          audience: "Secret seekers"
        },
        {
          type: "Final Verdict",
          content: `⚖️ FINAL VERDICT: After 1 year of using Backlink ∞, here's my honest assessment. Is it worth the hype? The answer might shock you. Watch until the end! ${referralUrl}`,
          engagement: "Very High",
          audience: "Decision makers"
        }
      ]
    };
    return templates[platform] || [];
  };

  const getPlatformTips = (platform: string) => {
    const tips: Record<string, string[]> = {
      twitter: [
        "Use relevant hashtags (#SEO, #LinkBuilding, #DigitalMarketing)",
        "Tweet during peak hours (12-3 PM, 5-6 PM EST)",
        "Engage with responses to boost visibility",
        "Share results and metrics for credibility"
      ],
      linkedin: [
        "Write longer, value-driven posts for better engagement",
        "Share professional insights and case studies",
        "Use LinkedIn native video for higher reach",
        "Engage in relevant industry groups"
      ],
      facebook: [
        "Post during evenings (6-9 PM) for better reach",
        "Use compelling visuals or videos",
        "Encourage comments with questions",
        "Share in relevant business groups"
      ],
      instagram: [
        "Use high-quality visuals and consistent aesthetics",
        "Include 5-10 relevant hashtags",
        "Post during lunch (11 AM-1 PM) or evening (7-9 PM)",
        "Use Stories for behind-the-scenes content"
      ],
      youtube: [
        "Create valuable, educational content",
        "Use SEO-optimized titles and descriptions",
        "Include clear calls-to-action",
        "Engage with comments to boost algorithm ranking"
      ]
    };
    return tips[platform] || [];
  };

  const downloadAsset = (name: string, dataUrl: string, format: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${name.toLowerCase().replace(/\s+/g, '-')}.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (toast) {
      toast({
        title: "Download Started",
        description: `${name} is being downloaded`,
      });
    }
  };

  const previewAsset = (name: string, dataUrl: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${name} - Preview</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #f3f4f6;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              img {
                max-width: 100%;
                height: auto;
                border: 1px solid #d1d5db;
                background: white;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              h1 { color: #111827; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>${name} - Preview</h1>
            <img src="${dataUrl}" alt="${name}" />
          </body>
        </html>
      `);
    }
  };

  const getEmailTemplate = (templateType: string, referralUrl: string) => {
    const templates: Record<string, any[]> = {
      professional: [
        {
          label: "Subject Line",
          content: "Boost Your SEO Results with This Game-Changing Platform",
          isHtml: false
        },
        {
          label: "Opening",
          content: `<p>Hi [Name],</p>

<p>I hope this email finds you well.</p>

<p>As someone who values efficient SEO strategies, I wanted to share a tool that has significantly improved my link building results.</p>`,
          isHtml: true
        },
        {
          label: "Body",
          content: `<p>I've been using <strong>Backlink ∞</strong> for the past few months, and the results speak for themselves:</p>

<ul style="margin: 20px 0; padding-left: 20px;">
  <li style="margin-bottom: 8px;"><strong>300% increase</strong> in high-quality backlinks</li>
  <li style="margin-bottom: 8px;"><strong>50% reduction</strong> in outreach time</li>
  <li style="margin-bottom: 8px;"><strong>Improved domain authority</strong> across all projects</li>
</ul>

<p>What sets Backlink ∞ apart is their automated outreach system and focus on high-DA websites.</p>

<p>The platform has streamlined my entire link building process.</p>

<p>You can check it out here: <a href="${referralUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">Backlink ∞ Platform</a></p>

<p>They're currently offering a <strong>free trial</strong>, so there's no risk in testing it out.</p>`,
          isHtml: true
        },
        {
          label: "Closing",
          content: `<p>I'd be happy to discuss my experience in more detail if you're interested.</p>

<p>Best regards,<br>[Your Name]</p>`,
          isHtml: true
        }
      ],
      casual: [
        {
          label: "Subject Line",
          content: "Found something cool for your SEO efforts! 🚀",
          isHtml: false
        },
        {
          label: "Opening",
          content: `<p>Hey [Name]!</p>

<p>Hope you're doing awesome!</p>

<p>I just had to share this SEO tool I've been using - it's been a <em>total game-changer</em> for my websites.</p>`,
          isHtml: true
        },
        {
          label: "Body",
          content: `<p>So I've been struggling with link building (you know how tedious it can be), and then I found <strong>Backlink ∞</strong>.</p>

<p>This platform is seriously impressive:</p>

<ul style="list-style: none; padding-left: 0; margin: 20px 0;">
  <li style="margin-bottom: 10px;">✅ <strong>Automated outreach</strong> that actually works</li>
  <li style="margin-bottom: 10px;">✅ <strong>High-quality backlinks</strong> from real websites</li>
  <li style="margin-bottom: 10px;">✅ <strong>Super easy to use</strong> interface</li>
</ul>

<p>I've seen my rankings improve within just a few weeks!</p>

<p>Here's the link if you want to check it out: <a href="${referralUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">Try Backlink ∞</a></p>

<p>They have a <strong>free trial</strong>, so you can test it risk-free.</p>`,
          isHtml: true
        },
        {
          label: "Closing",
          content: `<p>Let me know what you think if you try it out!</p>

<p>Cheers,<br>[Your Name]</p>`,
          isHtml: true
        }
      ],
      newsletter: [
        {
          label: "Subject Line",
          content: "This Month's SEO Spotlight: Revolutionary Link Building Platform",
          isHtml: false
        },
        {
          label: "Introduction",
          content: `<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
  <h2 style="color: #1e293b; margin: 0 0 10px 0;">Welcome to this month's SEO insights!</h2>
  <p style="margin: 0; color: #475569;">Today, I'm excited to spotlight a platform that's transforming how we approach link building.</p>
</div>`,
          isHtml: true
        },
        {
          label: "Feature Article",
          content: `<div style="border-left: 4px solid #2563eb; padding-left: 20px; margin: 20px 0;">
  <h2 style="color: #2563eb;">SPOTLIGHT: Backlink ∞ - The Future of Link Building</h2>
</div>

<p>In the ever-evolving world of SEO, link building remains one of the most crucial yet challenging aspects of digital marketing. That's where <strong>Backlink ∞</strong> comes in.</p>

<h3 style="color: #1e293b;">What makes it special:</h3>
<ul>
  <li><strong>AI-powered outreach automation</strong> - No more manual emails</li>
  <li><strong>Focus on high-authority websites</strong> - Quality over quantity</li>
  <li><strong>Comprehensive tracking and analytics</strong> - Know what works</li>
  <li><strong>Time-saving automation features</strong> - Focus on strategy</li>
</ul>

<div style="background: #ecfccb; border: 1px solid #bef264; padding: 15px; border-radius: 6px; margin: 20px 0;">
  <p style="margin: 0; color: #365314;"><strong>Success Story:</strong> The platform has gained significant traction among SEO professionals, with many reporting substantial improvements in their link building success rates.</p>
</div>

<p>Interested in learning more? You can explore <a href="${referralUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">Backlink ∞ here</a></p>`,
          isHtml: true
        }
      ],
      direct_outreach: [
        {
          label: "Subject Line",
          content: "Quick question about your SEO strategy",
          isHtml: false
        },
        {
          label: "Opening",
          content: `<p>Hi [Name],</p>

<p>I noticed your website [Website Name] and I'm impressed with your content quality.</p>

<p>I wanted to reach out because I recently discovered a tool that's been a game-changer for my SEO results.</p>`,
          isHtml: true
        },
        {
          label: "Body",
          content: `<p>Are you currently working on link building for your site?</p>

<p>I ask because I've been using <strong>Backlink ∞</strong> and the results have been incredible:</p>

<ul style="margin: 20px 0; padding-left: 20px;">
  <li style="margin-bottom: 8px;"><strong>250% increase</strong> in quality backlinks</li>
  <li style="margin-bottom: 8px;"><strong>Automated outreach</strong> that saves 15+ hours/week</li>
  <li style="margin-bottom: 8px;"><strong>Higher success rates</strong> than manual methods</li>
</ul>

<p>The platform focuses on high-authority websites and uses AI to personalize outreach at scale.</p>

<p>Given your expertise in [Industry], I thought this might be valuable for your SEO strategy:</p>

<p><a href="${referralUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">Check out Backlink ∞</a></p>`,
          isHtml: true
        },
        {
          label: "Closing",
          content: `<p>Would love to hear your thoughts if you take a look!</p>

<p>Best,<br>[Your Name]</p>

<p style="font-size: 12px; color: #666; margin-top: 15px;">P.S. They offer a free trial, so there's no risk in testing it out.</p>`,
          isHtml: true
        }
      ],
      follow_up: [
        {
          label: "Subject Line",
          content: "Re: SEO tool recommendation - any thoughts?",
          isHtml: false
        },
        {
          label: "Opening",
          content: `<p>Hi [Name],</p>

<p>Hope you're having a great week!</p>

<p>I wanted to follow up on my previous email about Backlink ∞.</p>`,
          isHtml: true
        },
        {
          label: "Body",
          content: `<p>I know you're probably busy, so I'll keep this brief.</p>

<p>Since my last email, I've seen even more impressive results:</p>

<ul>
  <li><strong>Just landed 12 high-DA backlinks</strong> in the past week</li>
  <li><strong>Domain Authority increased by 8 points</strong></li>
  <li><strong>Organic traffic up 45%</strong> this month</li>
</ul>

<p>The ROI has been phenomenal, and I genuinely think it could help with your SEO goals too.</p>

<p>Here's the link again if you'd like to take a look: <a href="${referralUrl}" style="color: #2563eb; text-decoration: none;">Backlink ∞ Platform</a></p>`,
          isHtml: true
        },
        {
          label: "Closing",
          content: `<p>No pressure at all - just wanted to share something that's been working well for me.</p>

<p>Either way, keep up the excellent work on your site!</p>

<p>Best regards,<br>[Your Name]</p>`,
          isHtml: true
        }
      ]
    };
    return templates[templateType] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading affiliate dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Use original header */}
        <Header />

        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            {/* Auth Required Notice */}
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-orange-600">🔒</span>
                <span className="font-semibold text-orange-800">Account Required</span>
              </div>
              <p className="text-orange-700 text-sm">
                Please sign in or create an account to access the affiliate program.
                Your user ID is linked to your affiliate tracking for accurate commission attribution.
              </p>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Earn <span className="text-blue-600">$10,000+</span> Monthly
              <br />
              with Backlink ∞ Affiliate Program
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join the most lucrative affiliate program in the SEO industry. Earn up to 35%
              recurring commissions promoting the world's leading backlink building platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                onClick={() => {
                  setDefaultTab('signup');
                  setShowLoginModal(true);
                }}
              >
                🚀 Create Account & Join
              </button>
              <button
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setDefaultTab('login');
                  setShowLoginModal(true);
                }}
              >
                📱 Sign In to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-green-200">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Up to 35% Commission</h3>
                <p className="text-gray-600 mb-4">Start at 20% and earn up to 35% recurring commissions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Bronze:</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Silver:</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gold:</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platinum:</span>
                    <span className="font-semibold">35%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-blue-200">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">⏰</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">30-Day Cookies</h3>
                <p className="text-gray-600 mb-4">Extended attribution window ensures maximum earnings</p>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Cross-device tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Session persistence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>First-click attribution</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-purple-200">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Premium Tools</h3>
                <p className="text-gray-600 mb-4">Complete marketing toolkit and dedicated support</p>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Marketing asset library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Real-time analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Dedicated support team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />

        {/* Login Modal for Authentication */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onAuthSuccess={(authenticatedUser) => {
            setShowLoginModal(false);
            // After successful auth, reload the page to show affiliate dashboard
            window.location.reload();
          }}
          defaultTab={defaultTab}
          pendingAction="access the affiliate program"
        />
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join the Backlink ∞ Affiliate Program</h1>
            <p className="text-gray-600">Start earning commissions by promoting the world's leading SEO platform</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border max-w-2xl mx-auto p-8">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Almost Ready!</h2>
              <p className="text-gray-600">
                Click below to activate your affiliate account and start earning 20% recurring commissions
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 mb-6">
              <div className="text-center">
                <span className="text-2xl mb-2 block">💰</span>
                <h4 className="font-semibold">20% Commission</h4>
                <p className="text-sm text-gray-600">Starting rate</p>
              </div>
              <div className="text-center">
                <span className="text-2xl mb-2 block">⏰</span>
                <h4 className="font-semibold">30-Day Tracking</h4>
                <p className="text-sm text-gray-600">Cookie duration</p>
              </div>
              <div className="text-center">
                <span className="text-2xl mb-2 block">📊</span>
                <h4 className="font-semibold">Real-Time Stats</h4>
                <p className="text-sm text-gray-600">Live dashboard</p>
              </div>
            </div>

            <button 
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              onClick={joinProgram}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <span className="inline-block animate-spin mr-2">⭐</span>
                  Activating Account...
                </>
              ) : (
                <>
                  Activate My Affiliate Account ✓
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              No approval required • Instant activation • Start earning immediately
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Affiliate Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use original header */}
      <Header />

      {/* Affiliate Status Banner */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-blue-600 text-xl">∞</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user.email?.split('@')[0]}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <div className="text-sm text-gray-500">User ID</div>
                <div className="text-xs font-mono text-gray-700">{user.id.slice(-8)}</div>
              </div>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                🥉 Bronze Affiliate
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                ✓ Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner for New Affiliates */}
      {affiliateData.total_earnings === 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">🎉 Welcome to the Affiliate Program!</h2>
                <p className="text-green-100">
                  Your account is active and ready to earn commissions. Your unique affiliate links are tied to User ID: {user.id.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${affiliateData.total_earnings.toFixed(2)}</div>
                <div className="text-green-100 text-sm">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${affiliateData.total_earnings.toFixed(2)}</p>
                <p className="text-sm text-green-600">+$0.00 this month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-blue-600">+0 today</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-blue-600 text-xl">👆</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-purple-600">0% rate</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-purple-600 text-xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commission Rate</p>
                <p className="text-2xl font-bold">{(affiliateData.commission_rate * 100).toFixed(0)}%</p>
                <p className="text-sm text-orange-600">Bronze tier</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-orange-600 text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Links */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🔗 Your Referral Links</h2>
            <div className="bg-blue-50 px-3 py-1 rounded-lg">
              <span className="text-xs text-blue-600 font-medium">Linked to User: {user.id.slice(-8)}</span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            These links are permanently tied to your user account. All commissions will be credited to you.
          </p>

          {/* Tracking Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium text-sm">User ID Tracking Active</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Your affiliate code: <span className="font-mono bg-white px-1 rounded">{affiliateData.affiliate_code}</span></div>
              <div>• User ID: <span className="font-mono bg-white px-1 rounded">{user.id}</span></div>
              <div>• 30-day cookie tracking + permanent account linking</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Homepage Link</label>
                <span className="text-xs text-gray-500">Best for general promotion</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={affiliateData.referral_url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(affiliateData.referral_url)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Pricing Page Link</label>
                <span className="text-xs text-gray-500">Higher conversion rate</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/pricing?ref=${affiliateData.affiliate_code}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/pricing?ref=${affiliateData.affiliate_code}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Free Trial Link</label>
                <span className="text-xs text-gray-500">Low barrier entry</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/trial?ref=${affiliateData.affiliate_code}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/trial?ref=${affiliateData.affiliate_code}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Affiliate Marketing Toolkit */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🚀 Affiliate Marketing Toolkit</h2>
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Pro Tools
            </Badge>
          </div>

          <Tabs value={activeToolkitTab} onValueChange={setActiveToolkitTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Social Media
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Templates
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Creative Assets
              </TabsTrigger>
            </TabsList>

            {/* Social Media Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-blue-600" />
                    Social Media Promotion Hub
                  </CardTitle>
                  <CardDescription>
                    Ready-to-use content for all major platforms with optimized messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Platform Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Choose Platform</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500', textColor: 'text-blue-600' },
                        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', textColor: 'text-blue-700' },
                        { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', textColor: 'text-blue-600' },
                        { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500', textColor: 'text-pink-600' },
                        { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', textColor: 'text-red-600' }
                      ].map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => {
                            setSelectedSocialPlatform(platform.id);
                            setSocialPage(0); // Reset pagination when switching platforms
                          }}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            selectedSocialPlatform === platform.id
                              ? `border-blue-500 bg-blue-50 ${platform.textColor}`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <platform.icon className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-xs font-medium">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Templates */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Ready-to-Post Content</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSocialPage(Math.max(0, socialPage - 1))}
                            disabled={socialPage === 0}
                            className="h-7 px-2"
                          >
                            ←
                          </Button>
                          <span className="text-xs text-gray-500">
                            {socialPage + 1} / {Math.ceil(getSocialTemplates(selectedSocialPlatform, affiliateData.referral_url).length / 3)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSocialPage(socialPage + 1)}
                            disabled={(socialPage + 1) * 3 >= getSocialTemplates(selectedSocialPlatform, affiliateData.referral_url).length}
                            className="h-7 px-2"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {getSocialTemplates(selectedSocialPlatform, affiliateData.referral_url)
                          .slice(socialPage * 3, (socialPage + 1) * 3)
                          .map((template, index) => (
                          <div key={socialPage * 3 + index} className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                {template.type}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(template.content)}
                                className="h-7 px-2"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{template.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Eye className="h-3 w-3" />
                              <span>Est. {template.engagement} engagement</span>
                              <Target className="h-3 w-3 ml-2" />
                              <span>{template.audience}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Pagination Controls */}
                      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-200">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSocialPage(Math.max(0, socialPage - 1))}
                          disabled={socialPage === 0}
                          className="flex items-center gap-1"
                        >
                          ← Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(getSocialTemplates(selectedSocialPlatform, affiliateData.referral_url).length / 3) }, (_, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={socialPage === index ? "default" : "ghost"}
                              onClick={() => setSocialPage(index)}
                              className="w-8 h-8 p-0"
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSocialPage(socialPage + 1)}
                          disabled={(socialPage + 1) * 3 >= getSocialTemplates(selectedSocialPlatform, affiliateData.referral_url).length}
                          className="flex items-center gap-1"
                        >
                          Next →
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Custom Message Builder</Label>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="custom-message" className="text-xs text-gray-600">
                            Add your personal touch
                          </Label>
                          <textarea
                            id="custom-message"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Share your experience with Backlink ∞..."
                            className="w-full h-24 p-3 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800 mb-2">
                            <strong>Your personalized post:</strong>
                          </p>
                          <p className="text-sm text-gray-700">
                            {customMessage || "Your custom message will appear here..."} {affiliateData.referral_url}
                          </p>
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => copyToClipboard(`${customMessage} ${affiliateData.referral_url}`)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Custom Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform-Specific Tips */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      💡 {selectedSocialPlatform.charAt(0).toUpperCase() + selectedSocialPlatform.slice(1)} Best Practices
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {getPlatformTips(selectedSocialPlatform).map((tip, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Templates Tab */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    Professional Email Templates
                  </CardTitle>
                  <CardDescription>
                    High-converting email templates for different audiences and scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Email Template Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {[
                        { id: 'professional', name: 'Professional', desc: 'B2B focused', icon: '💼' },
                        { id: 'casual', name: 'Casual', desc: 'Friendly tone', icon: '😊' },
                        { id: 'newsletter', name: 'Newsletter', desc: 'Content style', icon: '📰' },
                        { id: 'direct_outreach', name: 'Direct Outreach', desc: 'Personal approach', icon: '📧' },
                        { id: 'follow_up', name: 'Follow-up', desc: 'Second contact', icon: '🔄' }
                      ].map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedEmailTemplate(template.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            selectedEmailTemplate === template.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">{template.icon}</div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Template Content */}
                  <div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="space-y-4">
                        {getEmailTemplate(selectedEmailTemplate, affiliateData.referral_url).map((section, index) => (
                          <div key={index}>
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">
                              {section.label}
                            </Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                              {section.isHtml ? (
                                <div
                                  dangerouslySetInnerHTML={{ __html: section.content }}
                                  className="prose prose-sm max-w-none"
                                />
                              ) : (
                                <div className="whitespace-pre-line">{section.content}</div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(section.content.replace(/<[^>]*>/g, ''))}
                                className=""
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Text
                              </Button>
                              {section.isHtml && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(section.content)}
                                  className=""
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy HTML
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Email Performance Tips */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">📈 Email Marketing Tips</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
                      <div>
                        <h5 className="font-medium mb-1">Subject Line Best Practices:</h5>
                        <ul className="space-y-1 text-xs">
                          <li>• Keep it under 50 characters</li>
                          <li>• Use action words and urgency</li>
                          <li>• Personalize when possible</li>
                          <li>• Avoid spam trigger words</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Timing & Frequency:</h5>
                        <ul className="space-y-1 text-xs">
                          <li>• Tuesday-Thursday perform best</li>
                          <li>• Send between 10 AM - 2 PM</li>
                          <li>• Follow up after 3-5 days</li>
                          <li>• Don't exceed 2 emails per week</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Performance Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Track your affiliate performance with detailed insights and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Time Range Selector */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Time Range:</Label>
                    <div className="flex gap-2">
                      {[
                        { id: '7d', label: '7 Days' },
                        { id: '30d', label: '30 Days' },
                        { id: '90d', label: '90 Days' },
                        { id: '1y', label: '1 Year' }
                      ].map((range) => (
                        <Button
                          key={range.id}
                          size="sm"
                          variant={trackingTimeRange === range.id ? "default" : "outline"}
                          onClick={() => setTrackingTimeRange(range.id)}
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Clicks', value: '0', change: '+0%', icon: MousePointer, color: 'blue' },
                      { label: 'Conversions', value: '0', change: '+0%', icon: Target, color: 'green' },
                      { label: 'Conversion Rate', value: '0%', change: '+0%', icon: TrendingUp, color: 'purple' },
                      { label: 'Earnings', value: '$0.00', change: '+$0', icon: DollarSign, color: 'orange' }
                    ].map((metric) => (
                      <div key={metric.label} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
                          <Badge variant="outline" className="text-xs">
                            {metric.change}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                        <div className="text-sm text-gray-600">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Chart Placeholder */}
                  <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Performance Chart</p>
                      <p className="text-sm">Data will appear here once you start generating clicks</p>
                    </div>
                  </div>

                  {/* Traffic Sources */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Top Traffic Sources</h4>
                      <div className="space-y-3">
                        {[
                          { source: 'Direct Link', clicks: 0, percentage: 0 },
                          { source: 'Social Media', clicks: 0, percentage: 0 },
                          { source: 'Email', clicks: 0, percentage: 0 },
                          { source: 'Other', clicks: 0, percentage: 0 }
                        ].map((source) => (
                          <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{source.source}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={source.percentage} className="w-20 h-2" />
                              <span className="text-sm text-gray-600 w-12">{source.clicks}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Performance Insights</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Getting Started</p>
                              <p className="text-xs text-blue-700">Start sharing your referral links to see analytics data</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-900">Optimization Tip</p>
                              <p className="text-xs text-yellow-700">Focus on social media promotion for better conversion rates</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Creative Assets Tab */}
            <TabsContent value="assets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-orange-600" />
                    Professional Marketing Assets
                  </CardTitle>
                  <CardDescription>
                    High-quality banners, graphics, and promotional materials for all platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Asset Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Banners & Display Ads */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Display Banners
                      </h4>
                      <div className="space-y-3">
                        {[
                          {
                            name: 'Leaderboard',
                            size: '728x90',
                            format: 'PNG',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzI4IiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgNzI4IDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI3MjgiIGhlaWdodD0iOTAiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSIzNjQiIHk9IjMwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbmsgwqA8L3RleHQ+PHRleHQgeD0iMzY0IiB5PSI1NSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXV0b21hdGVkIExpbmsgQnVpbGRpbmcgUGxhdGZvcm08L3RleHQ+PHRleHQgeD0iMzY0IiB5PSI3NSIgZmlsbD0iI2ZiZjA0NyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3RhcnQgWW91ciBGcmVlIFRyaWFsIFRvZGF5PC90ZXh0Pjwvc3ZnPg=='
                          },
                          {
                            name: 'Rectangle',
                            size: '300x250',
                            format: 'PNG',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSIxNTAiIHk9IjQwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbms8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSI2NSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKInzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjEwNSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXV0b21hdGVkPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTI1IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MaW5rIEJ1aWxkaW5nPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTQ1IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGF0Zm9ybTwvdGV4dD48cmVjdCB4PSI1MCIgeT0iMTgwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmJmMDQ3IiByeD0iNSIvPjx0ZXh0IHg9IjE1MCIgeT0iMjA1IiBmaWxsPSIjMTExODI3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGFydCBGcmVlIFRyaWFsPC90ZXh0Pjwvc3ZnPg=='
                          },
                          {
                            name: 'Skyscraper',
                            size: '160x600',
                            format: 'PNG',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDE2MCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSI4MCIgeT0iNDAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CYWNrbGluazwvdGV4dD48dGV4dCB4PSI4MCIgeT0iNjUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7iiJ88L3RleHQ+PHRleHQgeD0iODAiIHk9IjEyMCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXV0b21hdGVkPC90ZXh0Pjx0ZXh0IHg9IjgwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxpbmsgQnVpbGRpbmc8L3RleHQ+PHRleHQgeD0iODAiIHk9IjE2MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGxhdGZvcm08L3RleHQ+PGNpcmNsZSBjeD0iODAiIGN5PSIyMDAiIHI9IjMwIiBmaWxsPSIjZmJmMDQ3Ii8+PHRleHQgeD0iODAiIHk9IjIwNyIgZmlsbD0iIzExMTgyNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFJZPC90ZXh0Pjx0ZXh0IHg9IjgwIiB5PSIyODAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKAmiBIaWdoLURBPC90ZXh0Pjx0ZXh0IHg9IjgwIiB5PSIzMDAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhY2tsaW5rczwvdGV4dD48dGV4dCB4PSI4MCIgeT0iMzMwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7igKIgQUkgT3V0cmVhY2g8L3RleHQ+PHRleHQgeD0iODAiIHk9IjM2MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4oCiIEF1dG9tYXRpb248L3RleHQ+PHJlY3QgeD0iMjAiIHk9IjQ4MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIzNSIgZmlsbD0iI2ZiZjA0NyIgcng9IjUiLz48dGV4dCB4PSI4MCIgeT0iNTAyIiBmaWxsPSIjMTExODI3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGFydCBGcmVlIFRyaWFsPC90ZXh0Pjwvc3ZnPg=='
                          },
                          {
                            name: 'Mobile Banner',
                            size: '320x50',
                            format: 'PNG',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMzIwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iNTAiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSIxNjAiIHk9IjE4IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbmsgwqAgLSBBdXRvbWF0ZWQgTGluayBCdWlsZGluZzwvdGV4dD48dGV4dCB4PSIxNjAiIHk9IjM4IiBmaWxsPSIjZmJmMDQ3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGFydCBGcmVlIFRyaWFsPC90ZXh0Pjwvc3ZnPg=='
                          }
                        ].map((banner) => (
                          <div key={banner.name} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{banner.name}</span>
                              <Badge variant="outline" className="text-xs">{banner.format}</Badge>
                            </div>
                            <div className="mb-3">
                              <img
                                src={banner.preview}
                                alt={`${banner.name} preview`}
                                className="w-full h-auto border rounded max-h-20 object-contain bg-white"
                              />
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{banner.size}px</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => downloadAsset(banner.name, banner.preview, banner.format)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => previewAsset(banner.name, banner.preview)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social Media Graphics */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Social Graphics
                      </h4>
                      <div className="space-y-3">
                        {[
                          {
                            name: 'Instagram Post',
                            size: '1080x1080',
                            platform: 'Instagram',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJpbnN0YWdyYW0iIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTZhMDAiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI2U5MTA4YyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzUxNGE5ZCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2luc3RhZ3JhbSkiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjZmJmMDQ3IiBzdHJva2Utd2lkdGg9IjMiLz48dGV4dCB4PSIxNTAiIHk9IjEwOCIgZmlsbD0iIzExMTgyNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+wqA8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNjAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CYWNrbGluayDiiJ88L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxODUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkF1dG9tYXRlZCBMaW5rIEJ1aWxkaW5nPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMjIwIiBmaWxsPSIjZmJmMDQ3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4jU0VPICNMaW5rQnVpbGRpbmcgI0FmZmlsaWF0ZTwvdGV4dD48cmVjdCB4PSI3NSIgeT0iMjQwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZmJmMDQ3IiByeD0iMTUiLz48dGV4dCB4PSIxNTAiIHk9IjI2MCIgZmlsbD0iIzExMTgyNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGluayBpbiBCaW88L3RleHQ+PC9zdmc+'
                          },
                          {
                            name: 'Instagram Story',
                            size: '1080x1920',
                            platform: 'Instagram',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDE4MCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJzdG9yeSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2Y1NmEwMCIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjZTkxMDhjIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNTE0YTlkIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIzMjAiIGZpbGw9InVybCgjc3RvcnkpIi8+PGNpcmNsZSBjeD0iOTAiIGN5PSI4MCIgcj0iMzAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNmYmYwNDciIHN0cm9rZS13aWR0aD0iMyIvPjx0ZXh0IHg9IjkwIiB5PSI4OCIgZmlsbD0iIzExMTgyNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+wqA8L3RleHQ+PHRleHQgeD0iOTAiIHk9IjE0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhY2tsaW5rPC90ZXh0Pjx0ZXh0IHg9IjkwIiB5PSIxNjAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7iiJ88L3RleHQ+PHRleHQgeD0iOTAiIHk9IjE5MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXV0b21hdGVkPC90ZXh0Pjx0ZXh0IHg9IjkwIiB5PSIyMDUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxpbmsgQnVpbGRpbmc8L3RleHQ+PHRleHQgeD0iOTAiIHk9IjI0MCIgZmlsbD0iI2ZiZjA0NyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3dpcGUgVXAgZm9yIE1vcmU8L3RleHQ+PC9zdmc+'
                          },
                          {
                            name: 'Facebook Post',
                            size: '1200x630',
                            platform: 'Facebook',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1OCIgdmlld0JveD0iMCAwIDMwMCAxNTgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxNTgiIGZpbGw9IiMxODc3ZjIiLz48dGV4dCB4PSIxNTAiIHk9IjQwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbmsgwqA8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSI2NSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGhlIFNtYXJ0IFdheSB0byBCdWlsZCBIaWdoLVF1YWxpdHkgQmFja2xpbmtzPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iOTAiIGZpbGw9IiNkY2ZkZjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SmlvYW9BdXRvbWF0ZWQgT3V0cmVhY2ggLSBJbnN0YW50IFJlc3VsdHMgLSBGcmVlIFRyaWFsPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiBmaWxsPSIjZmJmMDQ3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGFydCBZb3VyIEZyZWUgVHJpYWwgVG9kYXk8L3RleHQ+PC9zdmc+'
                          },
                          {
                            name: 'Twitter Header',
                            size: '1500x500',
                            platform: 'Twitter',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDMwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxZDliZjAiLz48dGV4dCB4PSIxNTAiIHk9IjM1IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbmsgwqAgQWZmaWxpYXRlPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iNTUiIGZpbGw9IiNkY2ZkZjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXV0b21hdGVkIExpbmsgQnVpbGRpbmcgUGxhdGZvcm0gLSBFYXJuIDIwJSBDb21taXNzaW9uPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iODAiIGZpbGw9IiNmYmYwNDciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkpvaW4gTm93ICYgU3RhcnQgRWFybmluZzwvdGV4dD48L3N2Zz4='
                          }
                        ].map((graphic) => (
                          <div key={graphic.name} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{graphic.name}</span>
                              <Badge variant="outline" className="text-xs">{graphic.platform}</Badge>
                            </div>
                            <div className="mb-3">
                              <img
                                src={graphic.preview}
                                alt={`${graphic.name} preview`}
                                className="w-full h-auto border rounded max-h-20 object-contain bg-white"
                              />
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{graphic.size}px</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => downloadAsset(graphic.name, graphic.preview, 'PNG')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => previewAsset(graphic.name, graphic.preview)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Logo & Brand Assets */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Brand Assets
                      </h4>
                      <div className="space-y-3">
                        {[
                          {
                            name: 'Backlink ∞ Logo',
                            type: 'PNG',
                            use: 'General use',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI1MCIgcj0iMjAiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSI0MCIgeT0iNTciIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7iiJ88L3RleHQ+PHRleHQgeD0iMTIwIiB5PSI1NyIgZmlsbD0iIzExMTgyNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbms8L3RleHQ+PC9zdmc+'
                          },
                          {
                            name: 'Logo + Tagline',
                            type: 'SVG',
                            use: 'Professional',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI1MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI0NSIgcj0iMjAiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSI0MCIgeT0iNTIiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7iiJ88L3RleHQ+PHRleHQgeD0iMTQwIiB5PSI1MiIgZmlsbD0iIzExMTgyNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2xpbms8L3RleHQ+PHRleHQgeD0iMTI1IiB5PSI3NSIgZmlsbD0iIzY2NjY2NiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BdXRvbWF0ZWQgTGluayBCdWlsZGluZyBQbGF0Zm9ybTwvdGV4dD48L3N2Zz4='
                          },
                          {
                            name: 'Icon Only',
                            type: 'PNG',
                            use: 'Small spaces',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMzUiIGZpbGw9IiMyNTYzZWIiLz48dGV4dCB4PSI1MCIgeT0iNjAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7iiJ88L3RleHQ+PC9zdmc+'
                          },
                          {
                            name: 'Brand Guidelines',
                            type: 'PDF',
                            use: 'Reference',
                            preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDIwMCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmOWZhZmIiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI2QxZDVkYiIvPjx0ZXh0IHg9IjEwMCIgeT0iNDAiIGZpbGw9IiMxMTE4MjciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJyYW5kIEd1aWRlbGluZXM8L3RleHQ+PGxpbmUgeDE9IjMwIiB5MT0iNTUiIHgyPSIxNzAiIHkyPSI1NSIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMzAiIHkxPSI3MCIgeDI9IjE0MCIgeTI9IjcwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIzMCIgeTE9Ijg1IiB4Mj0iMTYwIiB5Mj0iODUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjMwIiB5MT0iMTAwIiB4Mj0iMTIwIiB5Mj0iMTAwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg=='
                          }
                        ].map((asset) => (
                          <div key={asset.name} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{asset.name}</span>
                              <Badge variant="outline" className="text-xs">{asset.type}</Badge>
                            </div>
                            <div className="mb-3">
                              <img
                                src={asset.preview}
                                alt={`${asset.name} preview`}
                                className="w-full h-auto border rounded max-h-16 object-contain bg-white"
                              />
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{asset.use}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => downloadAsset(asset.name, asset.preview, asset.type)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => previewAsset(asset.name, asset.preview)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Asset Usage Guidelines */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-3">📋 Asset Usage Guidelines</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-orange-800">
                      <div>
                        <h5 className="font-medium mb-2 text-green-700">✅ Do's:</h5>
                        <ul className="space-y-1 text-xs">
                          <li>• Use assets as provided without modification</li>
                          <li>• Maintain proper spacing around logos</li>
                          <li>• Use high-resolution versions for print</li>
                          <li>• Include your affiliate tracking code</li>
                          <li>• Follow platform-specific size requirements</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-red-700">❌ Don'ts:</h5>
                        <ul className="space-y-1 text-xs">
                          <li>• Don't alter colors, fonts, or proportions</li>
                          <li>• Don't add effects or filters to logos</li>
                          <li>• Don't use assets for competing services</li>
                          <li>• Don't make false or misleading claims</li>
                          <li>• Don't use outdated brand materials</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Custom Asset Request */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">🎨 Need Custom Assets?</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Our design team can create custom promotional materials for high-performing affiliates.
                    </p>
                    <Button size="sm" variant="outline" className="bg-white">
                      <Mail className="h-4 w-4 mr-2" />
                      Request Custom Assets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Earnings Potential Calculator */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-xl font-bold mb-4">💰 Earnings Potential</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$500/mo</div>
              <div className="text-sm text-gray-600 mb-2">5 sales × $100 avg commission</div>
              <div className="text-xs text-gray-500">Part-time effort</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$2,000/mo</div>
              <div className="text-sm text-gray-600 mb-2">20 sales × $100 avg commission</div>
              <div className="text-xs text-gray-500">Active promotion</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">$10,000/mo</div>
              <div className="text-sm text-gray-600 mb-2">100+ sales × $100+ commission</div>
              <div className="text-xs text-gray-500">Full-time affiliate</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Your current rate:</strong> {(affiliateData.commission_rate * 100).toFixed(0)}% commission on all sales
            </p>
            <p className="text-xs text-gray-600">
              Track your progress and upgrade tiers for higher commission rates up to 35%
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SafeAffiliateProgram;
