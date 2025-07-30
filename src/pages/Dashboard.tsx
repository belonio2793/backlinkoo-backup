import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BlogClaimDebugPanel } from "@/components/BlogClaimDebugPanel";
import {
  CreditCard,
  Link,
  Search,
  TrendingUp,
  Globe,
  Users,
  Infinity,
  Plus,
  Activity,
  LogOut,
  Bug,
  Calendar,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Zap,
  User,
  Settings,
  ChevronDown,
  Eye,
  Sparkles,
  Crown,
  RefreshCw
} from "lucide-react";
import { PricingModal } from "@/components/PricingModal";
import { CampaignForm } from "@/components/CampaignForm";
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import NoHandsSEODashboard from "@/components/NoHandsSEODashboard";
import AdminVerificationQueue from "@/components/AdminVerificationQueue";
import SEOToolsSection from "@/components/SEOToolsSection";
import { ProfileSettings } from "@/components/ProfileSettings";
import { ApiConfigStatus } from "@/components/ApiConfigStatus";
import { TrialBlogShowcase } from "@/components/TrialBlogShowcase";
import { TrialBlogPostsDisplay as NewTrialBlogPostsDisplay } from "@/components/TrialBlogPostsDisplay";

import { ApiUsageDashboard } from "@/components/ApiUsageDashboard";
import { GlobalBlogGenerator } from "@/components/GlobalBlogGenerator";

import { AIPostsManager } from "@/components/admin/AIPostsManager";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User } from '@supabase/supabase-js';



// TrialBlogPostsDisplay component for the trial tab
const TrialBlogPostsDisplay = ({ user }: { user: User | null }) => {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [claimingPostId, setClaimingPostId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAllPosts();

    // Refresh every 30 seconds to check for new posts
    const interval = setInterval(() => {
      loadAllPosts(true); // Silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllPosts = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setLoading(true);
        setError(null);
      }
      setLoadingStatus('Connecting to database...');

      // Load from database using the blog claim service
      const { BlogClaimService } = await import('@/services/blogClaimService');

      setLoadingStatus('Fetching published blog posts...');
      const dbPosts = await BlogClaimService.getClaimablePosts(20);

      setLoadingStatus('Checking local storage...');
      // Also load from localStorage for backwards compatibility
      const localPosts = [];
      try {
        const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const validLocalPosts = allBlogs.filter((post: any) => {
          if (post.expires_at) {
            const isExpired = new Date() > new Date(post.expires_at);
            return !isExpired;
          }
          return true;
        });
        localPosts.push(...validLocalPosts);
        console.log(`📦 Found ${validLocalPosts.length} valid local posts`);
      } catch (error) {
        console.warn('Error loading local posts:', error);
      }

      setLoadingStatus('Combining and deduplicating posts...');
      // Combine and deduplicate posts (prioritize database posts)
      const combinedPosts = [...dbPosts];
      localPosts.forEach(localPost => {
        if (!combinedPosts.find(dbPost => dbPost.slug === localPost.slug)) {
          combinedPosts.push(localPost);
        }
      });

      const finalPosts = combinedPosts.slice(0, 12);

      // Update debug information
      const debugData = {
        timestamp: new Date().toISOString(),
        dbPosts: dbPosts.length,
        localPosts: localPosts.length,
        combinedPosts: combinedPosts.length,
        displayedPosts: finalPosts.length,
        userAuthenticated: !!user,
        userId: user?.id || null,
        loadingStatus,
        hasError: !!error,
        errorMessage: error || null,
        connectionOnline: navigator.onLine
      };

      setDebugInfo(debugData);

      console.log(`📊 Blog Posts Summary:
        - Database posts: ${dbPosts.length}
        - Local storage posts: ${localPosts.length}
        - Combined unique posts: ${combinedPosts.length}
        - Displaying: ${finalPosts.length}`);

      setAllPosts(finalPosts);
      setLastRefresh(new Date());

      // Show status in console for transparency
      if (finalPosts.length === 0) {
        console.warn('⚠️ No blog posts found in database or local storage');
        if (!silentRefresh) {
          setError('NOT_FOUND');
        }
      } else {
        console.log(`✅ Successfully loaded ${finalPosts.length} blog posts`);
        setError(null);

        // Show success notification on first load
        if (!silentRefresh && !lastRefresh) {
          toast({
            title: "Posts Loaded Successfully",
            description: `Found ${finalPosts.length} blog posts (${dbPosts.length} from database, ${localPosts.length} from local storage)`,
          });
        }
      }

    } catch (error: any) {
      console.error('❌ Error loading posts:', error);
      setError('NOT_FOUND');

      // Don't clear posts on error, keep showing last known state
      if (!silentRefresh) {
        toast({
          title: "Not Found",
          description: "Unable to fetch blog posts from any source.",
          variant: "destructive",
        });
      }
    } finally {
      if (!silentRefresh) {
        setLoading(false);
      }
      setLoadingStatus('Ready');
    }
  };

  const handleClaimPost = async (post: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim blog posts.",
        variant: "destructive",
      });
      return;
    }

    try {
      setClaimingPostId(post.id);
      const { BlogClaimService } = await import('@/services/blogClaimService');

      // Check if user can claim more posts
      const { canClaim, reason } = await BlogClaimService.canUserClaimMore(user);
      if (!canClaim) {
        toast({
          title: "Claim Limit Reached",
          description: reason,
          variant: "destructive",
        });
        return;
      }

      const result = await BlogClaimService.claimPost(post.id, user);

      if (result.success) {
        toast({
          title: "Post Claimed Successfully",
          description: result.message,
        });
        await loadAllPosts(); // Refresh the list
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error claiming post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post.",
        variant: "destructive",
      });
    } finally {
      setClaimingPostId(null);
    }
  };

  const handleUnclaimPost = async (post: any) => {
    if (!user) return;

    try {
      setClaimingPostId(post.id);
      const { BlogClaimService } = await import('@/services/blogClaimService');

      const result = await BlogClaimService.unclaimPost(post.id, user);

      if (result.success) {
        toast({
          title: "Post Unclaimed",
          description: result.message,
        });
        await loadAllPosts(); // Refresh the list
      } else {
        toast({
          title: "Unclaim Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error unclaiming post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while unclaiming the post.",
        variant: "destructive",
      });
    } finally {
      setClaimingPostId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <BarChart3 className="h-10 w-10 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Loading Posts...</h3>
        <p className="text-gray-600 mb-4">{loadingStatus}</p>
        <div className="max-w-sm mx-auto bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <p className="text-xs text-gray-500">
          🔍 Checking database and local storage for blog posts...
        </p>
      </div>
    );
  }

  if (error && allPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-gray-600" />
        </div>
        <h3 className="text-4xl font-bold text-gray-800 mb-3">404</h3>
        <h4 className="text-xl font-semibold text-gray-600 mb-6">Not Found</h4>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          No blog posts could be retrieved from the database or local storage.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <Button
            onClick={() => loadAllPosts()}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => navigate('/?focus=generator')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New Post
          </Button>
        </div>
      </div>
    );
  }

  if (allPosts.length === 0 && !error) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">No Posts Available</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          No blog posts are currently available for claiming. This is expected if no posts have been generated yet.
        </p>
        <Button
          onClick={() => navigate('/?focus=generator')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Post
        </Button>
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-lg mx-auto">
          <h4 className="font-medium text-gray-800 mb-2">System Status ✅</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>🔧 Status: {loadingStatus}</div>
            <div>⏰ Last check: {lastRefresh?.toLocaleTimeString() || 'Never'}</div>
            <div>🔄 Auto-refresh: Every 30 seconds</div>
            <div>📡 Connection: {navigator.onLine ? 'Online' : 'Offline'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Separate posts into categories
  const userClaimedPosts = allPosts.filter(post => post.user_id === user?.id && !post.is_trial_post);
  const availablePosts = allPosts.filter(post => !post.user_id || post.is_trial_post);
  const otherClaimedPosts = allPosts.filter(post => post.user_id && post.user_id !== user?.id && !post.is_trial_post);

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live</span>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Loading...'}
          </div>
          {error && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">Partial load</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDebug(!showDebug)}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            🔧 Debug
          </Button>
          <Button
            onClick={() => loadAllPosts()}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-green-300 font-semibold">🔧 Debug Information</h4>
            <Button
              onClick={() => setShowDebug(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1 h-auto"
            >
              ��
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-yellow-400 mb-2">System Status:</div>
              <div>• Status: {debugInfo.loadingStatus}</div>
              <div>• Online: {debugInfo.connectionOnline ? '✅' : '❌'}</div>
              <div>• Last Update: {debugInfo.timestamp}</div>
              <div>• User Auth: {debugInfo.userAuthenticated ? '✅' : '❌'}</div>
              <div>• User ID: {debugInfo.userId || 'None'}</div>
            </div>
            <div>
              <div className="text-yellow-400 mb-2">Data Sources:</div>
              <div>�� Database Posts: {debugInfo.dbPosts}</div>
              <div>• Local Storage: {debugInfo.localPosts}</div>
              <div>• Combined Total: {debugInfo.combinedPosts}</div>
              <div>• Displayed: {debugInfo.displayedPosts}</div>
              <div>��� Has Errors: {debugInfo.hasError ? '⚠️' : '��'}</div>
            </div>
          </div>
          {debugInfo.errorMessage && (
            <div className="mt-3 p-2 bg-red-900 border border-red-700 rounded text-red-300">
              <div className="text-red-200 font-semibold">Error Details:</div>
              <div className="whitespace-pre-wrap">{debugInfo.errorMessage}</div>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{allPosts.length}</div>
          <div className="text-sm text-purple-600">Total Posts</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">{userClaimedPosts.length}</div>
          <div className="text-sm text-emerald-600">Your Posts</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{availablePosts.length}</div>
          <div className="text-sm text-blue-600">Available</div>
        </div>
      </div>

      {/* Claimed Posts Section */}
      {userClaimedPosts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Your Claimed Posts ({userClaimedPosts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userClaimedPosts.map((post, index) => (
              <Card key={post.id || index} className="group hover:shadow-lg transition-all duration-300 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-800 line-clamp-2 text-sm">{post.title}</h4>
                    <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs">Owned</Badge>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Button size="sm" className="flex-1" onClick={() => navigate(`/blog/${post.slug}`)}>
                      <Eye className="h-3 w-3 mr-1" />View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnclaimPost(post)}
                      disabled={claimingPostId === post.id}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Unclaim
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Posts Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Available Posts ({availablePosts.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePosts.map((post, index) => {
            const timeRemaining = post.expires_at ?
              Math.max(0, Math.floor((new Date(post.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))) : null;

            return (
              <Card key={post.id || index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-800 line-clamp-2 text-sm">{post.title}</h4>
                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
                      {post.is_trial_post ? 'Trial' : 'Available'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-700">{post.seo_score || 0}</div>
                      <div className="text-blue-600">SEO</div>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded">
                      <div className="font-semibold text-emerald-700">{post.reading_time || 0}m</div>
                      <div className="text-emerald-600">Read</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-semibold text-purple-700">{Math.floor((post.word_count || 0) / 100)}k</div>
                      <div className="text-purple-600">Words</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/blog/${post.slug}`)}>
                      <Eye className="h-3 w-3 mr-1" />View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleClaimPost(post)}
                      disabled={claimingPostId === post.id || !user}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {claimingPostId === post.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Claim
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Expiry Warning */}
                  {timeRemaining !== null && timeRemaining < 6 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Expires in {timeRemaining}h
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Other Claimed Posts Section */}
      {otherClaimedPosts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            Claimed by Others ({otherClaimedPosts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherClaimedPosts.map((post, index) => (
              <Card key={post.id || index} className="border-gray-200 bg-gradient-to-br from-gray-50 to-white opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-600 line-clamp-2 text-sm">{post.title}</h4>
                    <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-600 text-xs">Claimed</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">claimed***@user.com</div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/blog/${post.slug}`)}>
                    <Eye className="h-3 w-3 mr-1" />View Only
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center pt-6 border-t border-gray-200">
        <Button
          onClick={() => navigate('/?focus=generator')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate New Post
        </Button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"user" | "admin">("user");
  const [credits, setCredits] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Failsafe: force loading to false after maximum time
  useEffect(() => {
    const maxLoadingTime = setTimeout(() => {
      console.warn('🏠 Dashboard - Maximum loading time reached, forcing loading to false');
      setLoading(false);
    }, 15000); // 15 seconds maximum

    return () => clearTimeout(maxLoadingTime);
  }, []);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || "overview";
  });
  const [activeSection, setActiveSection] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('section') || "dashboard";
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeDashboard = async () => {
      console.log('🏠 Dashboard: Starting initialization...');

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Dashboard initialization timeout')), 8000)
        );

        const sessionPromise = supabase.auth.getSession();

        let session = null;
        let error = null;

        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          session = result.data?.session;
          error = result.error;
        } catch (timeoutError) {
          console.warn('🏠 Dashboard - Auth check timed out, trying fallback...');

          // If auth times out, continue with demo mode
          console.log('🏠 Dashboard - Auth timeout, continuing in demo mode');
          setLoading(false);
          return;
        }

        if (!isMounted) return;

        if (error && !session) {
          console.log('🏠 Dashboard - Auth error, continuing in demo mode:', error);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('🏠 Dashboard - No valid session, continuing in demo mode');
          setLoading(false);
          return;
        }

        console.log('🏠 Dashboard - Valid session found:', session.user.email);
        setUser(session.user);

        // Fetch user data with timeout protection
        const dataPromises = [
          fetchUserData(session.user).catch(err => {
            console.warn('🏠 Dashboard - fetchUserData failed:', err);
            return null;
          }),
          fetchCampaigns(session.user).catch(err => {
            console.warn('🏠 Dashboard - fetchCampaigns failed:', err);
            return null;
          })
        ];

        // Add timeout for data fetching
        const dataTimeout = new Promise((resolve) =>
          setTimeout(() => {
            console.warn('🏠 Dashboard - Data fetching timed out, continuing anyway');
            resolve(null);
          }, 5000)
        );

        await Promise.race([
          Promise.all(dataPromises),
          dataTimeout
        ]);

      } catch (error) {
        console.error('🏠 Dashboard - Initialization error:', error);
      } finally {
        if (isMounted) {
          console.log('🏠 Dashboard - Initialization complete, stopping loading');
          setLoading(false);
        }
      }
    };

    // Delay initialization slightly to let EmailVerificationGuard finish
    const initTimeout = setTimeout(initializeDashboard, 100);

    return () => {
      clearTimeout(initTimeout);
      isMounted = false;
    };

    // Simplified auth state listener since EmailVerificationGuard handles the main auth flow
    let subscription;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        console.log('���� Dashboard - Auth state change:', { event, hasUser: !!session?.user });

        if (event === 'SIGNED_OUT' || !session) {
          console.log('🏠 Dashboard - User signed out, redirecting to login...');
          navigate('/login');
        } else if (event === 'SIGNED_IN' && session) {
          console.log('🏠 Dashboard - User signed in, updating user state');
          setUser(session.user);
          if (loading) {
            setLoading(false);
          }
        }
      });
      subscription = authSubscription;
    } catch (subscriptionError) {
      console.warn('🏠 Dashboard - Could not set up auth listener:', subscriptionError);
    }

    return () => {
      if (subscription?.unsubscribe) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('🏠 Dashboard - Error unsubscribing:', error);
        }
      }
    };
  }, [navigate]);



  const fetchUserData = async (authUser?: User) => {
    try {
      const currentUser = authUser || user;
      if (!currentUser) {
        console.log('🔍 No current user for fetchUserData');
        return;
      }

      console.log('🔍 Fetching user data for:', currentUser.id);



      // Try database calls with very short timeout
      let profile = null;
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();

        const result = await Promise.race([
          profilePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 1000))
        ]) as any;

        profile = result.data;

        if (result.error && !result.error.message.includes('timeout')) {
          console.log('🔍 Profile error (non-critical):', result.error);
        }
      } catch (profileError) {
        console.warn('��� Profile fetch failed, using defaults:', profileError);
      }

      // Set user type based on profile
      if (profile?.role === 'admin') {
        setUserType('admin');
      } else {
        setUserType('user');
      }

      // Try to get credits, but fallback quickly
      let creditsData = null;
      try {
        const creditsPromise = supabase
          .from('credits')
          .select('amount')
          .eq('user_id', currentUser.id)
          .single();

        const result = await Promise.race([
          creditsPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Credits fetch timeout')), 1000))
        ]) as any;

        creditsData = result.data;
      } catch (creditsError) {
        console.warn('🔍 Credits fetch failed');
      }

      if (creditsData?.amount !== undefined) {
        setCredits(creditsData.amount);
      } else {
        setCredits(0);
      }

      // Quick check for campaigns
      try {
        const { data: campaignsData } = await Promise.race([
          supabase.from('campaigns').select('id').eq('user_id', currentUser.id).limit(1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Quick campaign check timeout')), 1000))
        ]) as any;

        setIsFirstTimeUser(!campaignsData || campaignsData.length === 0);
      } catch (error) {
        console.warn('🔍 Quick campaign check failed, defaulting to experienced user');
        setIsFirstTimeUser(false); // Default to experienced user so we show demo campaigns
      }

    } catch (error) {
      console.error('🔍 Error fetching user data (using defaults):', error);

      // Set safe defaults
      setCredits(0);
      setIsFirstTimeUser(true);
      setUserType('user');
    }
  };

  const loadGlobalStats = async () => {
    // Simple function to trigger stats reload - currently just used for callback consistency
    console.log('Loading global stats after blog generation...');
  };

  const fetchCampaigns = async (authUser?: User) => {
    try {
      const currentUser = authUser || user;
      if (!currentUser) {
        console.log('📊 No current user for fetchCampaigns');
        return;
      }

      console.log('📊 Fetching campaigns for:', currentUser.id);



      // Try database call with very short timeout
      let campaignsData = null;
      let error = null;

      try {
        const campaignsPromise = supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        const result = await Promise.race([
          campaignsPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Campaigns fetch timeout')), 1000))
        ]) as any;

        campaignsData = result.data;
        error = result.error;
      } catch (fetchError) {
        console.warn('📊 Campaigns fetch failed, using demo mode');
        error = fetchError;
      }

      if (error || !campaignsData) {
        console.warn('📊 Error fetching campaigns:', error);
        setCampaigns([]);
        return;
      }

      setCampaigns(campaignsData);
    } catch (error: any) {
      console.error('📊 Unexpected error in fetchCampaigns:', error);
      setCampaigns([]);
    }
  };

  const handleCampaignSuccess = () => {
    setShowCampaignForm(false);
    fetchUserData(); // Refresh credits
    fetchCampaigns(); // Refresh campaigns
    setIsFirstTimeUser(false);
  };


  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double-clicks

    try {
      console.log('Dashboard - Starting sign out process...');
      setIsSigningOut(true);

      // Clear user state immediately
      setUser(null);

      // Clean up all auth-related storage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });

        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.warn('Storage cleanup error:', storageError);
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Dashboard - Sign out successful');
      }

      // Multiple redirect mechanisms to ensure user gets redirected
      console.log('Navigating to login page...');

      // Primary navigation using React Router
      navigate('/login');

      // Fallback navigation after a short delay
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          console.log('Fallback redirect to login...');
          window.location.href = '/login';
        }
      }, 100);

    } catch (error) {
      console.error("Dashboard - Sign out error:", error);

      // Clear user state and navigate anyway
      setUser(null);

      // Force redirect even on error
      try {
        navigate('/login');
      } catch (navError) {
        console.error('Navigation error, using window.location:', navError);
        window.location.href = '/login';
      }

      // Additional fallback
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 200);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Infinity className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show dashboard regardless of authentication state

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = 'https://backlinkoo.com/dashboard'}>
              <Infinity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold hidden sm:block">Backlink</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {(activeSection === "dashboard" || activeSection === "seo-tools" || activeSection === "trial") && (
                <>
                  <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
                    <CreditCard className="h-3 w-3" />
                    <span className="hidden xs:inline">{credits}</span>
                    <span className="xs:hidden">{credits}</span>
                    <span className="hidden sm:inline">Credits</span>
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setIsPricingModalOpen(true)} className="px-2 sm:px-4">
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Buy Credits</span>
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 sm:px-4 gap-1"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDebugPanel(true)}>
                    <Bug className="mr-2 h-4 w-4" />
                    Debug Claiming
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className={`mr-2 h-4 w-4 ${isSigningOut ? 'animate-spin' : ''}`} />
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1">
              <Button
                variant={activeSection === "dashboard" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("dashboard")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Target className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant={activeSection === "seo-tools" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("seo-tools")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                <Zap className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">SEO Tools</span>
              </Button>
              <Button
                variant={activeSection === "trial" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("trial")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 relative"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Trial</span>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {userType === "user" ? (
          <>
            {activeSection === "dashboard" ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>

              <TabsTrigger value="campaigns" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Campaigns</span>
                <span className="sm:hidden">Camps</span>
              </TabsTrigger>
              <TabsTrigger value="keyword-research" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Keyword Research</span>
                <span className="sm:hidden">Keywords</span>
              </TabsTrigger>
              <TabsTrigger value="rank-tracker" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Rankings</span>
                <span className="sm:hidden">Ranks</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {isFirstTimeUser && credits === 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Welcome to Backlink ∞!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-700 mb-4">
                      Get started by purchasing credits to create your first backlink campaign. 
                      Our high-quality backlinks will help improve your website's search engine rankings.
                    </p>
                    <Button onClick={() => setIsPricingModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Buy Your First Credits
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{credits}</div>
                    <p className="text-xs text-muted-foreground">$0.70 per credit</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{campaigns.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {campaigns.filter(c => c.status === 'pending' || c.status === 'in_progress').length} active
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                    <Link className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaigns.reduce((sum, c) => sum + (c.links_delivered || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Delivered links</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaigns.length > 0 
                        ? Math.round((campaigns.filter(c => c.status === 'completed').length / campaigns.length) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Campaign completion</p>
                  </CardContent>
                </Card>
              </div>

              {campaigns.length > 0 && (
                <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Recent Campaigns</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Monitor your latest backlink campaigns and their performance
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {campaigns.slice(0, 3).map((campaign, index) => {
                      const progressPercentage = campaign.links_requested > 0 
                        ? Math.round((campaign.links_delivered / campaign.links_requested) * 100)
                        : 0;
                      
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case 'completed':
                            return {
                              icon: CheckCircle2,
                              color: 'text-green-600',
                              bgColor: 'bg-green-50',
                              borderColor: 'border-green-200',
                              badge: 'default'
                            };
                          case 'in_progress':
                            return {
                              icon: Clock,
                              color: 'text-blue-600',
                              bgColor: 'bg-blue-50',
                              borderColor: 'border-blue-200',
                              badge: 'secondary'
                            };
                          case 'pending':
                            return {
                              icon: AlertCircle,
                              color: 'text-yellow-600',
                              bgColor: 'bg-yellow-50',
                              borderColor: 'border-yellow-200',
                              badge: 'outline'
                            };
                          default:
                            return {
                              icon: Activity,
                              color: 'text-gray-600',
                              bgColor: 'bg-gray-50',
                              borderColor: 'border-gray-200',
                              badge: 'secondary'
                            };
                        }
                      };

                      const statusConfig = getStatusConfig(campaign.status);
                      const StatusIcon = statusConfig.icon;
                      const daysAgo = Math.floor((Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <div 
                          key={campaign.id} 
                          className={`relative overflow-hidden rounded-xl border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} p-6 transition-all duration-300 hover:shadow-md animate-fade-in`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Campaign Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base sm:text-lg truncate">
                                    {campaign.name || 'Unnamed Campaign'}
                                  </h3>
                                  <Badge variant={statusConfig.badge as any} className="text-xs font-medium">
                                    {campaign.status.replace('_', ' ').charAt(0).toUpperCase() + campaign.status.replace('_', ' ').slice(1)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="truncate max-w-[120px] sm:max-w-[200px]">{campaign.target_url}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Campaign Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Keywords</span>
                              </div>
                              <div className="pl-6">
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords])
                                    .slice(0, 3).map((keyword: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords]).length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords]).length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Progress</span>
                              </div>
                              <div className="pl-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-primary">
                                    {campaign.links_delivered}/{campaign.links_requested}
                                  </span>
                                  <span className="text-xs text-muted-foreground">backlinks</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                                <span className="text-xs text-muted-foreground mt-1 block">
                                  {progressPercentage}% completed
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Investment</span>
                              </div>
                              <div className="pl-6">
                                <div className="text-lg font-bold">
                                  {campaign.credits_used || campaign.links_requested} credits
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ${((campaign.credits_used || campaign.links_requested) * 0.70).toFixed(2)} value
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delivered Backlinks Preview */}
                          {campaign.completed_backlinks && campaign.completed_backlinks.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Recent Backlinks</span>
                                <Badge variant="secondary" className="text-xs">
                                  {campaign.completed_backlinks.length} delivered
                                </Badge>
                              </div>
                              <div className="pl-6 space-y-1">
                                {campaign.completed_backlinks.slice(0, 2).map((link: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                                    <a 
                                      href={link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:text-primary transition-colors truncate max-w-[300px]"
                                    >
                                      {link}
                                    </a>
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                  </div>
                                ))}
                                {campaign.completed_backlinks.length > 2 && (
                                  <div className="text-xs text-muted-foreground pl-3">
                                    +{campaign.completed_backlinks.length - 2} more backlinks
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Performance Indicator */}
                          <div className="absolute top-6 right-6">
                            {campaign.status === 'completed' && (
                              <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                Complete
                              </div>
                            )}
                            {campaign.status === 'in_progress' && progressPercentage > 50 && (
                              <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                <TrendingUp className="h-3 w-3" />
                                On Track
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* View All Button */}
                    <div className="pt-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('campaigns')}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        View All Campaigns ({campaigns.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaigns.length === 0 && credits > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">Ready to Create Your First Campaign?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700 mb-4">
                      You have {credits} credits available. Create your first backlink campaign to start building authority for your website.
                    </p>
                    <Button onClick={() => {
                      console.log('Navigating to campaigns tab...');
                      setActiveTab('campaigns');
                      setShowCampaignForm(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>



            <TabsContent value="campaigns" className="space-y-6">
              {showCampaignForm ? (
                <CampaignForm 
                  onSuccess={handleCampaignSuccess}
                  onCancel={() => setShowCampaignForm(false)}
                />
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold">Campaign Management</h2>
                    <Button onClick={() => setShowCampaignForm(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">New Campaign</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                  </div>
                  
                  {campaigns.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {campaigns.map((campaign) => (
                            <div key={campaign.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">{campaign.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Target URL</p>
                                  <p className="font-medium">{campaign.target_url}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Keywords</p>
                                  <p className="font-medium">
                                    {Array.isArray(campaign.keywords) 
                                      ? campaign.keywords.join(', ') 
                                      : campaign.keywords}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Progress</p>
                                  <p className="font-medium">
                                    {campaign.links_delivered}/{campaign.links_requested} links
                                  </p>
                                </div>
                              </div>
                              {campaign.completed_backlinks && campaign.completed_backlinks.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-2">Delivered Backlinks:</p>
                                  <div className="space-y-1">
                                    {campaign.completed_backlinks.map((link: string, index: number) => (
                                      <p key={index} className="text-sm text-primary hover:underline cursor-pointer">
                                        {link}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Campaigns Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first campaign to start building high-quality backlinks
                        </p>
                        <Button onClick={() => setShowCampaignForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Campaign
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="keyword-research">
              <KeywordResearchTool />
            </TabsContent>

            <TabsContent value="no-hands-seo">
              <NoHandsSEODashboard />
            </TabsContent>

            <TabsContent value="rank-tracker">
              <RankingTracker />
            </TabsContent>
              </Tabs>
            ) : activeSection === "seo-tools" ? (
              <div className="space-y-6">
                <SEOToolsSection user={user} />
              </div>
            ) : activeSection === "trial" ? (
              <div className="space-y-6">
                <div className="relative overflow-hidden">
                  {/* Hero Section */}
                  <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-purple-100">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full translate-y-24 -translate-x-24"></div>

                    <div className="relative z-10 text-center max-w-4xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 mb-6">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Free Trial Experience</span>
                      </div>

                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                        Explore Premium Features
                      </h1>

                      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Experience the full power of our platform with free trial features. Generate high-quality content, build powerful backlinks, and watch your SEO soar.
                      </p>

                      <div className="flex flex-wrap justify-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-blue-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">No Credit Card Required</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-blue-200">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">24-Hour Access</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-blue-200">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-gray-700">Full Features Unlocked</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Free Generated Blog Posts - Main Feature */}
                    <div className="lg:col-span-2">
                      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <BarChart3 className="h-6 w-6" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold">Free Generated Blog Posts</CardTitle>
                                <p className="text-purple-100 text-sm">Your trial content library</p>
                              </div>
                            </div>
                            <Badge className="bg-white/20 text-white border-white/30">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6">
                          <TrialBlogShowcase limit={6} />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Side Panel - Trial Stats & Actions */}
                    <div className="space-y-6">

                      {/* Trial Progress */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-emerald-800">Trial Progress</CardTitle>
                              <p className="text-sm text-emerald-600">Track your exploration</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Blog Posts Generated</span>
                              <span className="text-lg font-bold text-emerald-600">3/5</span>
                            </div>
                            <Progress value={60} className="h-2" />

                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Features Explored</span>
                              <span className="text-lg font-bold text-emerald-600">7/12</span>
                            </div>
                            <Progress value={58} className="h-2" />
                          </div>

                          <div className="p-3 bg-white/70 rounded-lg border border-emerald-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-700">Trial Time Remaining</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-800">22h 47m</div>
                            <div className="text-xs text-emerald-600">Expires tomorrow at 3:45 PM</div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Quick Actions */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Zap className="h-5 w-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg text-blue-800">Quick Actions</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Blog Post
                          </Button>

                          <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>

                          <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                            <Settings className="h-4 w-4 mr-2" />
                            Customize Settings
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Upgrade Prompt */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Crown className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="font-bold text-amber-800 mb-2">Love what you see?</h3>
                            <p className="text-sm text-amber-700 mb-4">
                              Upgrade to unlock unlimited access to all premium features.
                            </p>
                            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Upgrade Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          // Admin Dashboard
          <Tabs defaultValue="verification" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <p className="text-muted-foreground">Manage campaigns and verification queue</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                Administrator
              </Badge>
            </div>

            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="verification">Verification Queue</TabsTrigger>
              <TabsTrigger value="ai-posts">AI Posts</TabsTrigger>
              <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="verification" className="space-y-6">
              <AdminVerificationQueue />
            </TabsContent>

            <TabsContent value="ai-posts" className="space-y-6">
              <AIPostsManager />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Campaign Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Manage incoming campaign orders and track progress</p>
                  {/* TODO: Implement admin campaign management */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">View system performance and user metrics</p>
                  {/* TODO: Implement analytics dashboard */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onAuthSuccess={(user) => {
          setUser(user);
        }}
      />

      {/* Debug Panel Dialog */}
      <Dialog open={showDebugPanel} onOpenChange={setShowDebugPanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blog Claiming Debug Panel</DialogTitle>
          </DialogHeader>
          <BlogClaimDebugPanel
            isOpen={true}
            onClose={() => setShowDebugPanel(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <ProfileSettings
            user={user}
            onClose={() => setIsProfileOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
