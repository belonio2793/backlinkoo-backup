import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { blogService } from '@/services/blogService';
import { BlogDataDebugger } from '@/components/BlogDataDebugger';
import { 
  Clock, 
  Eye, 
  Calendar, 
  Plus, 
  Search, 
  Crown, 
  Loader2, 
  CheckCircle, 
  Timer,
  AlertTriangle,
  Trash2,
  User,
  Filter,
  TrendingUp,
  BookOpen,
  Infinity,
  ChevronDown,
  Star,
  Zap,
  Sparkles,
  ArrowRight,
  Target,
  Globe,
  Users,
  Activity,
  Award,
  Rocket,
  Heart,
  Share,
  ExternalLink
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ExcerptCleaner } from '@/utils/excerptCleaner';
import { EnhancedBlogPreview } from '@/components/EnhancedBlogPreview';

type BlogPost = Tables<'blog_posts'>;

export function SuperEnhancedBlogListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'claimable' | 'claimed' | 'my-posts'>('all');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Helper function to randomize keywords on each render
  const getRandomizedKeywords = () => {
    const keywords = ['finance', 'technology', 'marketing', 'lifestyle', 'business', 'health', 'travel', 'education', 'food', 'sports'];
    return keywords.sort(() => Math.random() - 0.5).slice(0, 4);
  };

  useEffect(() => {
    loadPosts();
  }, [filterType]);

  // Process any pending claim intent after user login
  useEffect(() => {
    if (user) {
      processClaimIntent();
    }
  }, [user]);

  const processClaimIntent = async () => {
    // Only process claim intents for authenticated users
    if (!user || !user.id) {
      // Clear any claim intents if user is not authenticated
      localStorage.removeItem('claim_intent');
      return;
    }

    const result = await EnhancedBlogClaimService.processPendingClaimIntent(user);
    if (result) {
      if (result.success) {
        toast({
          title: "Post Claimed! 🎉",
          description: result.message,
        });
        loadPosts(); // Reload to show updated status
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Loading posts with filterType: ${filterType}`);
      let blogPosts: BlogPost[] = [];

      switch (filterType) {
        case 'claimable':
          console.log('🔍 Fetching claimable posts...');
          blogPosts = await EnhancedBlogClaimService.getClaimablePosts(50);
          console.log(`✅ Found ${blogPosts.length} claimable posts`);
          break;
        case 'claimed':
          console.log('🔍 Fetching claimed posts...');
          const allPosts = await blogService.getRecentBlogPosts(50);
          blogPosts = allPosts.filter(post => post.claimed);
          console.log(`✅ Found ${blogPosts.length} claimed posts out of ${allPosts.length} total`);
          break;
        case 'my-posts':
          if (user) {
            console.log(`🔍 Fetching posts for user: ${user.id}`);
            blogPosts = await EnhancedBlogClaimService.getUserClaimedPosts(user.id);
            console.log(`✅ Found ${blogPosts.length} user posts`);
          }
          break;
        default:
          console.log('🔍 Fetching recent blog posts...');
          blogPosts = await blogService.getRecentBlogPosts(50);
          console.log(`✅ Found ${blogPosts.length} recent posts`);
      }

      console.log('📝 Setting posts state...');
      setPosts(blogPosts);
      console.log('✅ Posts loaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to load posts:', error);
      toast({
        title: "Error Loading Posts",
        description: `Failed to load blog posts: ${error.message}`,
        variant: "destructive"
      });
      // Set empty array to stop loading state
      setPosts([]);
    } finally {
      setLoading(false);
      console.log('🏁 Loading state set to false');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchPosts(searchQuery.trim());
    } else {
      loadPosts();
    }
  };

  const searchPosts = async (query: string) => {
    try {
      setLoading(true);
      const results = await blogService.searchBlogPosts(query);
      
      // Apply current filter to search results
      let filteredResults = results;
      switch (filterType) {
        case 'claimable':
          filteredResults = results.filter(post => !post.claimed);
          break;
        case 'claimed':
          filteredResults = results.filter(post => post.claimed);
          break;
        case 'my-posts':
          filteredResults = results.filter(post => post.claimed && post.user_id === user?.id);
          break;
      }
      
      setPosts(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPost = async (post: BlogPost) => {
    if (!user) {
      EnhancedBlogClaimService.handleClaimIntent(post.slug, post.title);
      toast({
        title: "Login Required",
        description: "Please log in to claim this post. We'll bring you back to complete the claim.",
      });
      navigate('/login');
      return;
    }

    setClaiming(post.id);
    try {
      const result = await EnhancedBlogClaimService.claimPost(post.slug, user);
      
      if (result.success) {
        toast({
          title: "Success! 🎉",
          description: result.message,
        });
        loadPosts(); // Reload to show updated status
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post",
        variant: "destructive"
      });
    } finally {
      setClaiming(null);
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    setDeleting(post.id);
    try {
      const result = await EnhancedBlogClaimService.deletePost(post.slug, user);
      
      if (result.success) {
        toast({
          title: "Post Deleted",
          description: result.message,
        });
        loadPosts(); // Reload to remove deleted post
      } else {
        toast({
          title: "Delete Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the post",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cleanTitle = (title: string) => {
    return ExcerptCleaner.cleanTitle(title);
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    return ExcerptCleaner.getCleanExcerpt(content, undefined, maxLength);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isExpiringSoon = (post: BlogPost) => {
    if (!post.expires_at || post.claimed) return false;
    const hoursLeft = (new Date(post.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 2;
  };

  const handlePreviewPost = (post: BlogPost) => {
    setPreviewPost(post);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setPreviewPost(null);
    setShowPreviewModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-cyan-400/5 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header with glass effect */}
      <Header />

      <div className="relative container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="relative inline-block">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Premium Blog Posts
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover and claim high-quality blog posts with contextual backlinks. 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold"> Boost your domain authority instantly.</span>
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold">{posts.length}+ Posts Available</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold">1000+ Active Users</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold">99% Success Rate</span>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="mb-12 space-y-6">
            {/* Modern Search Design */}
            <form onSubmit={handleSearch} className="relative max-w-5xl mx-auto">
              <div className="relative">
                {/* Redesigned search container with glass morphism */}
                <div className="relative group">
                  {/* Background with gradient and glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-2xl border border-blue-100/50 backdrop-blur-xl transition-all duration-500 group-focus-within:from-blue-100 group-focus-within:to-blue-50"></div>

                  {/* Animated border glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-0 group-focus-within:opacity-20 rounded-2xl blur-xl transition-all duration-500"></div>

                  {/* Main content container */}
                  <div className="relative flex items-center p-3 gap-4">
                    {/* Search icon with animation */}
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-focus-within:scale-110 transition-transform duration-300">
                      <Search className="h-6 w-6 text-white" />
                    </div>

                    {/* Input field */}
                    <div className="flex-1">
                      <Input
                        placeholder="Search for trending posts, topics, or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-lg py-4 px-0 border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-gray-500 text-gray-800 font-medium"
                      />
                    </div>

                    {/* Search button with enhanced design */}
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                    >
                      <span className="hidden sm:inline">Search</span>
                      <div className="relative">
                        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </Button>
                  </div>

                  {/* Floating search suggestions indicator */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-focus-within:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-100 text-sm text-gray-600">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>Press Enter to search or browse topics below</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Popular searches section */}
              <div className="mt-8 mb-6">
                <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 backdrop-blur-sm">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12 blur-xl"></div>

                  <div className="relative flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white bg-clip-text text-transparent">
                        Trending Topics
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                      Discover what's popular right now or explore these trending categories
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                      {getRandomizedKeywords().map((term, index) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            searchPosts(term);
                          }}
                          className="group relative px-6 py-3 text-sm font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/70 dark:border-slate-700/70 rounded-xl transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                          style={{
                            animation: `fade-in 0.6s ease-out forwards ${index * 100}ms`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-300"></div>
                          <div className="relative flex items-center gap-2">
                            <span className="capitalize text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                              {term}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100" />
                          </div>

                          {/* Subtle glow effect */}
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl transition-opacity duration-300 -z-10"></div>
                        </button>
                      ))}
                    </div>

                    {/* Stats or additional info */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>Live trending</span>
                      </div>
                      <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Most searched</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Enhanced Filter Buttons - Distinct Gradient Colors */}
            <div className="flex flex-wrap justify-center gap-4 p-2">
              {[
                { key: 'all', label: 'All Posts', icon: BookOpen, color: 'from-blue-500 to-cyan-600', hoverColor: 'from-blue-600 to-cyan-700', accent: 'blue', activeIndicator: 'from-blue-400 to-cyan-500' },
                { key: 'claimable', label: 'Claimable', icon: Crown, color: 'from-purple-500 to-pink-600', hoverColor: 'from-purple-600 to-pink-700', accent: 'purple', activeIndicator: 'from-purple-400 to-pink-500' },
                { key: 'claimed', label: 'Claimed', icon: CheckCircle, color: 'from-emerald-500 to-teal-600', hoverColor: 'from-emerald-600 to-teal-700', accent: 'emerald', activeIndicator: 'from-emerald-400 to-teal-500' },
                ...(user ? [{ key: 'my-posts', label: 'My Posts', icon: User, color: 'from-orange-500 to-red-600', hoverColor: 'from-orange-600 to-red-700', accent: 'orange', activeIndicator: 'from-orange-400 to-red-500' }] : [])
              ].map(({ key, label, icon: Icon, color, hoverColor, accent, activeIndicator }, index) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key as any)}
                  className={`
                    group relative px-8 py-4 rounded-2xl font-semibold text-sm tracking-wide
                    transition-all duration-500 ease-out transform
                    hover:scale-105 hover:-translate-y-1 active:scale-95
                    ${filterType === key
                      ? `bg-gradient-to-br ${color} text-white shadow-xl border-0
                         before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:${hoverColor}
                         before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`
                      : `bg-white/90 backdrop-blur-sm border-2 border-gray-200/50 text-gray-700
                         hover:bg-white hover:border-opacity-70 hover:text-gray-800
                         hover:shadow-lg hover:shadow-gray-200/50`
                    }
                    before:content-[''] before:absolute before:inset-0 before:rounded-2xl
                    ${filterType !== key ? `before:bg-gradient-to-br before:${color} before:opacity-0 hover:before:opacity-5 before:transition-all before:duration-300` : ''}
                  `}
                  style={{
                    animation: `fade-in 0.5s ease-out forwards ${index * 100}ms`
                  }}
                >
                  {/* Glow effect for active button */}
                  {filterType === key && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} blur-xl opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-300`}></div>
                  )}

                  {/* Content */}
                  <div className="relative flex items-center gap-3 z-10">
                    <div className={`
                      p-1.5 rounded-lg transition-all duration-300
                      ${filterType === key
                        ? 'bg-white/20 group-hover:bg-white/30'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                      }
                    `}>
                      <Icon className={`h-4 w-4 transition-colors duration-300 ${
                        filterType === key
                          ? 'text-white'
                          : 'text-gray-600 group-hover:text-gray-700'
                      }`} />
                    </div>
                    <span className="relative">
                      {label}
                      {/* Subtle shimmer effect on active */}
                      {filterType === key && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      )}
                    </span>
                  </div>

                  {/* Active indicator dot with gradient */}
                  {filterType === key && (
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br ${activeIndicator} rounded-full shadow-lg border-2 border-white/30`}
                      style={{ animation: 'gradientPulse 2s ease-in-out infinite' }}
                    >
                      <div className="absolute inset-0.5 bg-gradient-to-br from-white/40 to-white/10 rounded-full"></div>
                    </div>
                  )}

                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 rounded-2xl transition-transform duration-200"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loading State with beautiful skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                  <CardHeader className="space-y-4">
                    <div className="h-6 bg-gray-300 rounded-lg w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                    <div className="h-10 bg-gray-300 rounded-lg animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {!loading && (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative p-6 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-white/50 shadow-xl">
                      <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">No posts found</h3>
                  <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try a different search term or filter.' 
                      : filterType === 'my-posts' 
                        ? "You haven't claimed any posts yet."
                        : 'Be the first to create a blog post!'
                    }
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post, index) => (
                    <SuperPostCard
                      key={post.id}
                      post={post}
                      user={user}
                      navigate={navigate}
                      formatDate={formatDate}
                      getExcerpt={getExcerpt}
                      getTimeRemaining={getTimeRemaining}
                      cleanTitle={cleanTitle}
                      isExpiringSoon={isExpiringSoon}
                      onClaim={() => handleClaimPost(post)}
                      onDelete={() => handleDeletePost(post)}
                      onPreview={() => handlePreviewPost(post)}
                      claiming={claiming === post.id}
                      deleting={deleting === post.id}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </>
          )}


        </div>
      </div>

      {/* Enhanced Blog Preview Modal */}
      {previewPost && (
        <EnhancedBlogPreview
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          content={{
            title: previewPost.title,
            content: previewPost.content || '',
            metaDescription: previewPost.meta_description || '',
            contextualLinks: previewPost.contextual_links || [],
            seoScore: previewPost.seo_score,
            wordCount: Math.ceil((previewPost.content || '').length / 5)
          }}
          keyword={previewPost.keywords?.[0] || ''}
          targetUrl={previewPost.target_url || ''}
          onSave={() => {
            toast({
              title: "Content Saved",
              description: "Blog post content has been saved to your clipboard"
            });
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Enhanced PostCard component with beautiful animations
interface SuperPostCardProps {
  post: BlogPost;
  user: any;
  navigate: (path: string) => void;
  formatDate: (date: string) => string;
  getExcerpt: (content: string, maxLength?: number) => string;
  getTimeRemaining: (expiresAt: string) => string;
  cleanTitle: (title: string) => string;
  isExpiringSoon: (post: BlogPost) => boolean;
  onClaim: () => void;
  onDelete: () => void;
  onPreview: () => void;
  claiming: boolean;
  deleting: boolean;
  index: number;
}

function SuperPostCard({
  post,
  user,
  navigate,
  formatDate,
  getExcerpt,
  getTimeRemaining,
  cleanTitle,
  isExpiringSoon,
  onClaim,
  onDelete,
  onPreview,
  claiming,
  deleting,
  index
}: SuperPostCardProps) {
  const canClaimPost = EnhancedBlogClaimService.canClaimPost(post);
  const deletePermissions = EnhancedBlogClaimService.canDeletePost(post, user);
  const isOwnPost = post.user_id === user?.id;
  const expiringSoon = isExpiringSoon(post);

  return (
    <Card 
      className={`
        group relative overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-sm 
        hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]
        cursor-pointer animate-fade-in
        ${expiringSoon ? 'ring-2 ring-red-400 ring-opacity-50' : ''}
      `}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both'
      }}
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      {/* Illuminated gold border on hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-400 rounded-lg transition-all duration-300"></div>

      {/* Gold glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 rounded-lg"></div>

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={post.claimed ? "default" : "secondary"}
              className={`
                px-3 py-1 font-semibold transition-all duration-300 transform hover:scale-105
                ${post.claimed 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                }
              `}
            >
              {post.claimed ? (
                <>
                  <Crown className="mr-1 h-3 w-3" />
                  Claimed
                </>
              ) : (
                <>
                  <Timer className="mr-1 h-3 w-3" />
                  Available
                </>
              )}
            </Badge>
            
            {post.claimed && isOwnPost && (
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <User className="mr-1 h-3 w-3" />
                Yours
              </Badge>
            )}
            
            {expiringSoon && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Expiring Soon
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/50 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              title="Preview content"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/50"
              onClick={(e) => {
                e.stopPropagation();
                // Share functionality
              }}
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/50"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/blog/${post.slug}`, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardTitle className="text-xl line-clamp-2 leading-tight font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
          {cleanTitle(post.title)}
        </CardTitle>
        
        <div className="flex items-center gap-6 text-sm text-gray-600 mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-blue-500" />
            {formatDate(post.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-purple-500" />
{post.reading_time || 0}m read
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-green-500" />
            {post.view_count} views
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0">
        {/* Excerpt section hidden to prevent duplicate title display */}

        {/* Expiration Timer with beautiful styling */}
        {!post.claimed && post.expires_at && (
          <div className={`
            text-sm mb-4 p-3 rounded-xl border transition-all duration-300
            ${expiringSoon 
              ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200 shadow-lg' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200'
            }
          `}>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span className="font-semibold">{getTimeRemaining(post.expires_at)} remaining</span>
            </div>
          </div>
        )}

        {/* Keywords with beautiful styling */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.category && (
            <Badge variant="secondary" className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200">
              <Target className="mr-1 h-3 w-3" />
              {post.category}
            </Badge>
          )}
          {post.tags?.slice(0, 2).map((tag, tagIndex) => (
            <Badge key={tagIndex} variant="outline" className="border-gray-300 hover:border-blue-400 transition-colors duration-300">
              {cleanTitle(tag)}
            </Badge>
          ))}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-3">
          {canClaimPost && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClaim();
              }}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 text-white font-semibold py-3"
              size="lg"
            >
              {claiming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Claiming...
                  <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  {user ? 'Claim This Post' : 'Login to Claim'}
                  <Zap className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}


        </div>

        {/* SEO Score Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              SEO Score: {post.seo_score || 0}/100
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-blue-500" />
              {post.word_count || 0} words
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
