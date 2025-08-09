import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PremiumPlanTab } from "@/components/PremiumPlanTab";
import { SEOAcademyTab } from "@/components/SEOAcademyTab";
import { StreamlinedPremiumProvider } from "@/components/StreamlinedPremiumProvider";
import { Footer } from "@/components/Footer";

import { PremiumService } from "@/services/premiumService";
import { PremiumCheckoutModal } from "@/components/PremiumCheckoutModal";
import { PricingModal } from "@/components/PricingModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileSettings } from "@/components/ProfileSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  CreditCard,
  Link,
  TrendingUp,
  Users,
  Infinity,
  Plus,
  Activity,
  LogOut,
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
  RefreshCw,
  Home,
  Crown,
  BookOpen,
  Star
} from "lucide-react";
import { CampaignForm } from "@/components/CampaignForm";
import { KeywordResearchTool } from "@/components/KeywordResearchTool";
import { RankingTracker } from "@/components/RankingTracker";
import NoHandsSEODashboard from "@/components/NoHandsSEODashboard";
import AdminVerificationQueue from "@/components/AdminVerificationQueue";
import SEOToolsSection from "@/components/SEOToolsSection";

import { ApiConfigStatus } from "@/components/ApiConfigStatus";
import { TrialBlogShowcase } from "@/components/TrialBlogShowcase";
import { TrialBlogPostsDisplay as NewTrialBlogPostsDisplay } from "@/components/TrialBlogPostsDisplay";
import { EnhancedTrialBlogPosts } from "@/components/EnhancedTrialBlogPosts";
import { DashboardTrialPosts } from "@/components/DashboardTrialPosts";

import { ApiUsageDashboard } from "@/components/ApiUsageDashboard";
import { GlobalBlogGenerator } from "@/components/GlobalBlogGenerator";

import { AIPostsManager } from "@/components/admin/AIPostsManager";
import { RotatingText } from "@/components/ui/rotating-text";
import { PremiumUserAdmin } from "@/components/admin/PremiumUserAdmin";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User } from '@supabase/supabase-js';



// TrialBlogPostsDisplay component for the trial tab
const TrialBlogPostsDisplay = ({ user }: { user: User | null }) => {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Ready');
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
        setError(null);
      }
      // setLoadingStatus('Connecting to database...');

      // Load from database using the simplified claim service
      const { SimplifiedClaimService } = await import('@/services/simplifiedClaimService');

      // setLoadingStatus('Fetching published blog posts...');
      const dbPosts = await SimplifiedClaimService.getClaimablePosts(20);

      // setLoadingStatus('Checking local storage...');
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

      // setLoadingStatus('Combining and deduplicating posts...');
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
      const { SimplifiedClaimService } = await import('@/services/simplifiedClaimService');

      // Use simplified claim service with slug
      const result = await SimplifiedClaimService.claimBlogPost(post.slug, user);

      if (result.success) {
        toast({
          title: "Post Saved Successfully",
          description: result.message,
        });
        await loadUserSavedPosts(); // Refresh saved posts list
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

  const handleRemoveSavedPost = async (postId: string) => {
    if (!user) return;

    try {
      setClaimingPostId(postId);
      const { SimplifiedClaimService } = await import('@/services/simplifiedClaimService');

      const result = await SimplifiedClaimService.removeSavedPost(user.id, postId);

      if (result.success) {
        toast({
          title: "Post Removed",
          description: result.message,
        });
        await loadUserSavedPosts(); // Refresh saved posts list
      } else {
        toast({
          title: "Remove Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing saved post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while removing the post.",
        variant: "destructive",
      });
    } finally {
      setClaimingPostId(null);
    }
  };



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

  // All posts are now available for saving to dashboard
  const availablePosts = allPosts;

  // Load user's saved posts separately
  const [userSavedPosts, setUserSavedPosts] = useState<any[]>([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [otherClaimedPosts, setOtherClaimedPosts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadUserSavedPosts();
    }
  }, [user]);

  const loadUserSavedPosts = async () => {
    if (!user) return;

    try {
      // setLoadingSavedPosts(true);
      const { SimplifiedClaimService } = await import('@/services/simplifiedClaimService');
      const savedPosts = await SimplifiedClaimService.getUserSavedPosts(user.id);
      setUserSavedPosts(savedPosts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      // setLoadingSavedPosts(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
              Debug
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
              <div>• Database Posts: {debugInfo.dbPosts}</div>
              <div>• Local Storage: {debugInfo.localPosts}</div>
              <div>• Combined Total: {debugInfo.combinedPosts}</div>
              <div>• Displayed: {debugInfo.displayedPosts}</div>
              <div>📊 Displayed: {debugInfo.displayedPosts}</div>
        
              <div>• Has Errors: {debugInfo.hasError ? '⚠️' : '✅'}</div>
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
          <div className="text-2xl font-bold text-emerald-700">{userSavedPosts.length}</div>
          <div className="text-sm text-emerald-600">Saved Posts</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{availablePosts.length}</div>
          <div className="text-sm text-blue-600">Available</div>
        </div>
      </div>

      {/* Saved Posts Section */}
      {userSavedPosts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Your Saved Posts ({userSavedPosts.length})
          </h3>
          {loadingSavedPosts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading your saved posts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSavedPosts.map((post, index) => (
                <Card key={post.id || index} className="group hover:shadow-lg transition-all duration-300 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-800 line-clamp-2 text-sm">{post.title}</h4>
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs">Saved</Badge>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/blog/${post.slug}`)}>
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveSavedPost(post.id)}
                        disabled={claimingPostId === post.id}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Save to Dashboard
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');

    // Handle hash-based navigation for specific sections
    if (hash === 'keyword-research') return 'keyword-research';
    if (hash === 'rank-tracker') return 'rank-tracker';
    if (hash === 'automation') return 'seo-tools';

    return urlParams.get('tab') || "overview";
  });
  const [activeSection, setActiveSection] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');

    // Handle hash-based navigation for specific sections
    if (hash === 'keyword-research' || hash === 'rank-tracker') return 'dashboard';
    if (hash === 'automation') return 'seo-tools';

    return urlParams.get('section') || "dashboard";
  });
  const [isPremiumSubscriber, setIsPremiumSubscriber] = useState(false);
  const [userProgress, setUserProgress] = useState<{ [key: string]: boolean }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === 'keyword-research') {
        setActiveSection('dashboard');
        setActiveTab('keyword-research');
      } else if (hash === 'rank-tracker') {
        setActiveSection('dashboard');
        setActiveTab('rank-tracker');
      } else if (hash === 'automation') {
        setActiveSection('seo-tools');
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Handle initial hash if present
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeDashboard = async () => {
      console.log('🏠 Dashboard: Starting initialization...');

      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error && !session) {
          console.log('🏠 Dashboard - Auth error, continuing in demo mode:', error);
          return;
        }

        if (!session?.user) {
          console.log('🏠 Dashboard - No valid session, continuing in demo mode');
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
          }),
          // Check premium status
          PremiumService.checkPremiumStatus(session.user.id).then(isPremium => {
            setIsPremiumSubscriber(isPremium);
            return isPremium;
          }).catch(err => {
            console.warn('🏠 Dashboard - premium status check failed:', err);
            return false;
          }),
          // Fetch user progress if premium
          PremiumService.getUserProgress(session.user.id).then(progress => {
            setUserProgress(progress);
            return progress;
          }).catch(err => {
            console.warn('🏠 Dashboard - progress fetch failed:', err);
            return {};
          })
        ];

        await Promise.all(dataPromises);

      } catch (error) {
        console.error('🏠 Dashboard - Initialization error:', error);
      } finally {
        if (isMounted) {
          console.log('🏠 Dashboard - Initialization complete');
        }
      }
    };

    initializeDashboard();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      console.log('🔄 Dashboard - Auth state change:', { event, hasUser: !!session?.user });

      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 Dashboard - User signed out, redirecting to home...');
        navigate('/');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('🏠 Dashboard - User signed in, updating user state');
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Handle hash navigation for direct section access
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.substring(1); // Remove the # symbol

      // Map hash values to tab values
      const hashToTabMap: { [key: string]: string } = {
        'keyword-research': 'keyword-research',
        'rank-tracker': 'rank-tracker',
        'automation-link-building': 'automation-link-building',
        'campaigns': 'campaigns',
        'overview': 'overview',
        'seo-tools-automation': 'seo-tools'
      };

      const targetTab = hashToTabMap[hash];
      if (targetTab && user) {
        // Handle special case for SEO Tools automation
        if (hash === 'seo-tools-automation') {
          setActiveSection('seo-tools');
          // Wait for section to render, then set the automation tab
          setTimeout(() => {
            // Dispatch custom event to set the SEO Tools tab to automation
            window.dispatchEvent(new CustomEvent('seoToolsTabChange', {
              detail: { tab: 'automation-link-building' }
            }));
          }, 200);
        } else {
          setActiveTab(targetTab);
        }

        // Scroll to the tab content after a brief delay to ensure render
        setTimeout(() => {
          const element = document.querySelector(`[data-section="${targetTab}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    const handleCustomTabChange = (event: CustomEvent) => {
      const { tab, hash } = event.detail;
      if (tab && user) {
        // Handle special case for SEO Tools automation
        if (hash === 'seo-tools-automation') {
          setActiveSection('seo-tools');
          // Wait for section to render, then set the automation tab
          setTimeout(() => {
            // Dispatch custom event to set the SEO Tools tab to automation
            window.dispatchEvent(new CustomEvent('seoToolsTabChange', {
              detail: { tab: 'automation-link-building' }
            }));
          }, 200);
        } else {
          setActiveTab(tab);
        }

        // Scroll to the tab content after a brief delay to ensure render
        setTimeout(() => {
          const element = document.querySelector(`[data-section="${tab}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Handle initial hash on page load
    handleHashNavigation();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);

    // Listen for custom tab change events
    window.addEventListener('dashboardTabChange', handleCustomTabChange as EventListener);

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
      window.removeEventListener('dashboardTabChange', handleCustomTabChange as EventListener);
    };
  }, [user]);



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
        console.warn('⚠️ Profile fetch failed, using defaults:', profileError);
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
    try {
      console.log('🚪 Dashboard: Sign out button clicked!');
      console.log('🚪 Current user:', user?.email);

      // Clear any local state immediately for instant UX
      setUser(null);
      setUserType('user');
      setCredits(0);
      setCampaigns([]);

      // Navigate immediately
      navigate('/');

      // Do actual sign out in background
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });

        if (error) {
          console.error('🚪 Sign out error (background):', error);
          // Don't show error to user since they're already signed out from UI perspective
        } else {
          console.log('🚪 Background sign out successful');
        }
      } catch (backgroundError) {
        console.error('🚪 Background sign out error:', backgroundError);
        // Don't show error to user since they're already signed out from UI perspective
      }

    } catch (error) {
      console.error('🚪 Dashboard sign out error:', error);

      // Force navigation even if sign out fails
      setUser(null);
      navigate('/');
    }
  };



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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-1 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              {(activeSection === "dashboard" || activeSection === "seo-tools" || activeSection === "trial") && (
                <>
                  {/* Credit system - visible to all users (separate from premium subscription) */}
                  <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
                    <CreditCard className="h-3 w-3" />
                    <span className="hidden xs:inline">{credits}</span>
                    <span className="xs:hidden">{credits}</span>
                    <span className="hidden sm:inline">Credits</span>
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsPaymentModalOpen(true);
                  }} className="px-2 sm:px-4">
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Buy Credits</span>
                  </Button>

                  {/* Premium subscription status - separate from credits */}
                  {isPremiumSubscriber && (
                    <Badge variant="default" className="gap-1 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-blue-600">
                      <Crown className="h-3 w-3" />
                      <span className="hidden sm:inline">Premium Active</span>
                      <span className="sm:hidden">Premium</span>
                    </Badge>
                  )}
                </>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 sm:px-3 text-muted-foreground hover:text-foreground"
                    title="Clear cache and refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Clear Cache</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Cache & Refresh</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all stored data (including login sessions, preferences, and cached content) and refresh the page. You may need to sign in again.
                      <br /><br />
                      Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        // Clear localStorage
                        localStorage.clear();
                        // Clear sessionStorage
                        sessionStorage.clear();
                        // Reload page to refresh state
                        window.location.reload();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear Cache
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 sm:px-4 gap-1"
                  >
                    <User className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🚪 Sign out dropdown item clicked');
                      handleSignOut();
                    }}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
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
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </Button>
              <Button
                variant={activeSection === "premium-plan" ? "secondary" : "ghost"}
                onClick={() => setActiveSection("premium-plan")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 relative flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isPremiumSubscriber ? "Premium Dashboard" : "Premium Plan"}
                </span>
                <span className="sm:hidden">
                  {isPremiumSubscriber ? "Premium" : "Upgrade"}
                </span>
                {!isPremiumSubscriber && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                )}
                {isPremiumSubscriber && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                )}
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
                Campaigns
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

            <TabsContent value="overview" className="space-y-6" data-section="overview">
              {isFirstTimeUser && credits === 0 && !isPremiumSubscriber && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Welcome to Backlink ∞!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-blue-700 mb-4">
                      <RotatingText
                        texts={[
                          "Get started by purchasing credits to create your first backlink campaign.",
                          "Our high-quality backlinks will help improve your website's search engine rankings.",
                          "You'll gain access to a diverse network of high-authority domains including established blogs, news sites, niche industry platforms, and content-rich web properties.",
                          "Each backlink is contextually placed to maximize SEO impact and help elevate your website's search engine rankings across targeted keywords.",
                          "Get backlinks from domains with 50+ DA, real traffic, and proven SEO authority.",
                          "Our links come from premium sites with high Domain Authority (DA), Trust Flow, and organic visibility.",
                          "We source backlinks exclusively from websites indexed, ranked, and respected by Google.",
                          "Every backlink is placed on a clean, authoritative domain with real-world relevance and SEO power.",
                          "Boost your rankings with backlinks from aged domains, active blogs, and trusted publisher networks."
                        ]}
                        duration={5}
                        className="min-h-[3rem]"
                      />
                    </div>
                    <Button onClick={() => {
                      setIsPaymentModalOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Buy Your First Credits
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isPremiumSubscriber && (
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-purple-800 flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Welcome back, Premium Member!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-700 mb-4">
                      <strong>Premium Benefits:</strong> Unlimited backlinks, complete SEO Academy, and priority support.<br/>
                      <strong>Credits:</strong> Use for premium services and additional features. Credits work alongside your premium subscription.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => setActiveSection("premium-plan")} variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        SEO Academy
                      </Button>
                      <Button onClick={() => setActiveTab('campaigns')}>
                        <Infinity className="h-4 w-4 mr-2" />
                        Unlimited Campaigns
                      </Button>
                    </div>
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
                    <p className="text-xs text-muted-foreground">
                      {isPremiumSubscriber ? (
                        <>$1.40 per credit • Premium subscriber</>
                      ) : (
                        <>$1.40 per credit</>
                      )}
                    </p>
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
                
{isPremiumSubscriber ? (
                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-800">Premium Benefits</CardTitle>
                      <Crown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">Unlimited</div>
                      <p className="text-xs text-purple-600">Backlinks & SEO Academy</p>
                    </CardContent>
                  </Card>
                ) : (
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
                )}
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
                                  ${((campaign.credits_used || campaign.links_requested) * 1.40).toFixed(2)} value
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

              {campaigns.length === 0 && credits > 0 && !isPremiumSubscriber && (
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

              {campaigns.length === 0 && isPremiumSubscriber && (
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-purple-800 flex items-center gap-2">
                      <Infinity className="h-5 w-5" />
                      Ready to Create Your First Campaign?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-700 mb-4">
                      <strong>Premium Benefits:</strong> Access unlimited campaign features and premium tools.<br/>
                      <strong>Credits Available:</strong> {credits} credits for premium services and enhanced features.
                    </p>
                    <Button onClick={() => {
                      console.log('Navigating to campaigns tab...');
                      setActiveTab('campaigns');
                      setShowCampaignForm(true);
                    }} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Premium Campaign
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6" data-section="campaigns">
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

            <TabsContent value="keyword-research" data-section="keyword-research">
              <KeywordResearchTool />
            </TabsContent>

            <TabsContent value="automation-link-building" data-section="automation-link-building">
              <NoHandsSEODashboard />
            </TabsContent>

            <TabsContent value="rank-tracker" data-section="rank-tracker">
              <RankingTracker />
            </TabsContent>
              </Tabs>
            ) : activeSection === "seo-tools" ? (
              <div className="space-y-6">
                <SEOToolsSection user={user} />
              </div>
            ) : activeSection === "trial" ? (
              <div className="space-y-6">
                <DashboardTrialPosts user={user} />
              </div>
            ) : activeSection === "premium-plan" ? (
              <div className="space-y-6">
                <StreamlinedPremiumProvider>
                  <PremiumPlanTab
                    isSubscribed={isPremiumSubscriber}
                    onUpgrade={() => {
                      // Refresh premium status after successful upgrade
                      PremiumService.checkPremiumStatus(user?.id || '').then(setIsPremiumSubscriber);
                    }}
                  />
                </StreamlinedPremiumProvider>
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

            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="verification">Verification Queue</TabsTrigger>
              <TabsTrigger value="ai-posts">AI Posts</TabsTrigger>
              <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
              <TabsTrigger value="premium-users">Premium Users</TabsTrigger>
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

            <TabsContent value="premium-users" className="space-y-6">
              <PremiumUserAdmin />
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
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onAuthSuccess={(user) => {
          setIsPaymentModalOpen(false);
          toast({
            title: "Payment Successful!",
            description: "Your purchase has been completed successfully.",
          });
          // Refresh user data to get new credits
          fetchUserData();
        }}
      />



      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <ProfileSettings onClose={() => setIsProfileOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;
