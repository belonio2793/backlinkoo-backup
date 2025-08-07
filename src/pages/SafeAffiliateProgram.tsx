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
      console.log('�� Affiliate data loaded successfully:', data);
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
        {
          type: "Discovery",
          content: `🚀 Just discovered Backlink ∞ - game-changing SEO tool for link building! Their automated outreach is incredible. Check it out: ${referralUrl}`,
          engagement: "High",
          audience: "SEO professionals"
        },
        {
          type: "Results",
          content: `📈 Increased my domain authority by 15 points using Backlink ∞'s link building platform. The ROI is amazing! ${referralUrl} #SEO #LinkBuilding`,
          engagement: "Very High",
          audience: "Digital marketers"
        },
        {
          type: "Tips",
          content: `💡 Pro tip: Quality backlinks > quantity. Backlink ∞ helps you get high-DA links that actually move the needle. Try it: ${referralUrl}`,
          engagement: "Medium",
          audience: "Business owners"
        }
      ],
      linkedin: [
        {
          type: "Professional",
          content: `As an SEO professional, I'm always looking for tools that deliver real results. Backlink ∞'s automated link building platform has transformed how I approach SEO campaigns. The quality of links and time saved is remarkable. ${referralUrl}`,
          engagement: "High",
          audience: "B2B professionals"
        },
        {
          type: "Case Study",
          content: `Case Study: How I increased organic traffic by 300% in 6 months using strategic link building. The secret? Backlink ∞'s platform made it scalable and efficient. ${referralUrl}`,
          engagement: "Very High",
          audience: "Marketing managers"
        }
      ],
      facebook: [
        {
          type: "Recommendation",
          content: `🌟 Recommendation for small business owners: If you're struggling with SEO and getting your website noticed, Backlink ∞ is a game-changer. Their platform simplifies link building and delivers real results. ${referralUrl}`,
          engagement: "High",
          audience: "Small business owners"
        },
        {
          type: "Success Story",
          content: `From struggling with SEO to ranking on page 1 - here's how Backlink ∞ helped transform my online presence. The automated outreach and quality links made all the difference! ${referralUrl}`,
          engagement: "Very High",
          audience: "Entrepreneurs"
        }
      ],
      instagram: [
        {
          type: "Visual Story",
          content: `📊 Behind the scenes of my SEO growth strategy ✨ Swipe to see how Backlink ∞ helped me build high-quality backlinks that actually work! Link in bio: ${referralUrl} #SEO #DigitalMarketing #Entrepreneur`,
          engagement: "High",
          audience: "Visual marketers"
        }
      ],
      youtube: [
        {
          type: "Tutorial",
          content: `🎥 NEW VIDEO: "How I Built 500+ High-Quality Backlinks in 30 Days" - featuring Backlink ∞'s automated platform. This tool is a game-changer for SEO! ${referralUrl}`,
          engagement: "Very High",
          audience: "Content creators"
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

  const getEmailTemplate = (templateType: string, referralUrl: string) => {
    const templates: Record<string, any[]> = {
      professional: [
        {
          label: "Subject Line",
          content: "Boost Your SEO Results with This Game-Changing Platform"
        },
        {
          label: "Opening",
          content: "Hi [Name],\n\nI hope this email finds you well. As someone who values efficient SEO strategies, I wanted to share a tool that has significantly improved my link building results."
        },
        {
          label: "Body",
          content: `I've been using Backlink ∞ for the past few months, and the results speak for themselves:\n\n• 300% increase in high-quality backlinks\n• 50% reduction in outreach time\n• Improved domain authority across all projects\n\nWhat sets Backlink ∞ apart is their automated outreach system and focus on high-DA websites. The platform has streamlined my entire link building process.\n\nYou can check it out here: ${referralUrl}\n\nThey're currently offering a free trial, so there's no risk in testing it out.`
        },
        {
          label: "Closing",
          content: "I'd be happy to discuss my experience in more detail if you're interested.\n\nBest regards,\n[Your Name]"
        }
      ],
      casual: [
        {
          label: "Subject Line",
          content: "Found something cool for your SEO efforts! 🚀"
        },
        {
          label: "Opening",
          content: "Hey [Name]!\n\nHope you're doing awesome! I just had to share this SEO tool I've been using - it's been a total game-changer for my websites."
        },
        {
          label: "Body",
          content: `So I've been struggling with link building (you know how tedious it can be), and then I found Backlink ∞. This platform is seriously impressive:\n\n✅ Automated outreach that actually works\n✅ High-quality backlinks from real websites\n✅ Super easy to use interface\n\nI've seen my rankings improve within just a few weeks! Here's the link if you want to check it out: ${referralUrl}\n\nThey have a free trial, so you can test it risk-free.`
        },
        {
          label: "Closing",
          content: "Let me know what you think if you try it out!\n\nCheers,\n[Your Name]"
        }
      ],
      newsletter: [
        {
          label: "Subject Line",
          content: "This Month's SEO Spotlight: Revolutionary Link Building Platform"
        },
        {
          label: "Introduction",
          content: "Welcome to this month's SEO insights! Today, I'm excited to spotlight a platform that's transforming how we approach link building."
        },
        {
          label: "Feature Article",
          content: `SPOTLIGHT: Backlink ∞ - The Future of Link Building\n\nIn the ever-evolving world of SEO, link building remains one of the most crucial yet challenging aspects of digital marketing. That's where Backlink ∞ comes in.\n\nWhat makes it special:\n• AI-powered outreach automation\n• Focus on high-authority websites\n• Comprehensive tracking and analytics\n• Time-saving automation features\n\nThe platform has gained significant traction among SEO professionals, with many reporting substantial improvements in their link building success rates.\n\nInterested in learning more? You can explore Backlink ∞ here: ${referralUrl}`
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
                          onClick={() => setSelectedSocialPlatform(platform.id)}
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
                      <Label className="text-sm font-medium mb-3 block">Ready-to-Post Content</Label>
                      <div className="space-y-3">
                        {getSocialTemplates(selectedSocialPlatform, affiliateData.referral_url).map((template, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border">
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
                            <p className="text-sm text-gray-700 mb-3">{template.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Eye className="h-3 w-3" />
                              <span>Est. {template.engagement} engagement</span>
                              <Target className="h-3 w-3 ml-2" />
                              <span>{template.audience}</span>
                            </div>
                          </div>
                        ))}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'professional', name: 'Professional', desc: 'B2B focused', icon: '💼' },
                        { id: 'casual', name: 'Casual', desc: 'Friendly tone', icon: '😊' },
                        { id: 'newsletter', name: 'Newsletter', desc: 'Content style', icon: '📰' }
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
                              {section.content}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(section.content)}
                              className="mt-2"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy {section.label}
                            </Button>
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
                          <li>��� Keep it under 50 characters</li>
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
                          { name: 'Leaderboard', size: '728x90', format: 'PNG/JPG' },
                          { name: 'Rectangle', size: '300x250', format: 'PNG/JPG' },
                          { name: 'Skyscraper', size: '160x600', format: 'PNG/JPG' },
                          { name: 'Mobile Banner', size: '320x50', format: 'PNG/JPG' }
                        ].map((banner) => (
                          <div key={banner.name} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{banner.name}</span>
                              <Badge variant="outline" className="text-xs">{banner.format}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{banner.size}px</p>
                            <Button size="sm" variant="outline" className="w-full">
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </Button>
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
                          { name: 'Instagram Post', size: '1080x1080', platform: 'Instagram' },
                          { name: 'Instagram Story', size: '1080x1920', platform: 'Instagram' },
                          { name: 'Facebook Post', size: '1200x630', platform: 'Facebook' },
                          { name: 'Twitter Header', size: '1500x500', platform: 'Twitter' }
                        ].map((graphic) => (
                          <div key={graphic.name} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{graphic.name}</span>
                              <Badge variant="outline" className="text-xs">{graphic.platform}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{graphic.size}px</p>
                            <Button size="sm" variant="outline" className="w-full">
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </Button>
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
                          { name: 'Backlink ∞ Logo', type: 'High-res PNG', use: 'General use' },
                          { name: 'Logo + Tagline', type: 'Vector SVG', use: 'Professional' },
                          { name: 'Icon Only', type: 'PNG/SVG', use: 'Small spaces' },
                          { name: 'Brand Guidelines', type: 'PDF', use: 'Reference' }
                        ].map((asset) => (
                          <div key={asset.name} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{asset.name}</span>
                              <Badge variant="outline" className="text-xs">{asset.type}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{asset.use}</p>
                            <Button size="sm" variant="outline" className="w-full">
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </Button>
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
