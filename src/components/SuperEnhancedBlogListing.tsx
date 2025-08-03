import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Header } from '@/components/Header';
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
    const result = await EnhancedBlogClaimService.processPendingClaimIntent(user!);
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
            console.log(`��� Found ${blogPosts.length} user posts`);
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

  const getExcerpt = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-20 animate-pulse"></div>
              <h1 className="relative text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
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
            {/* Search */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative flex bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-2xl overflow-hidden shadow-xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search for the perfect blog post..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 pl-12 pr-4 py-4 text-lg border-0 bg-transparent focus:outline-none focus:ring-0"
                  />
                  <Button 
                    type="submit" 
                    className="m-2 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                  >
                    Search
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>

            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { key: 'all', label: 'All Posts', icon: BookOpen, color: 'from-gray-600 to-gray-700' },
                { key: 'claimable', label: 'Claimable', icon: Crown, color: 'from-yellow-500 to-orange-500' },
                { key: 'claimed', label: 'Claimed', icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
                ...(user ? [{ key: 'my-posts', label: 'My Posts', icon: User, color: 'from-blue-500 to-purple-500' }] : [])
              ].map(({ key, label, icon: Icon, color }) => (
                <Button
                  key={key}
                  variant={filterType === key ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setFilterType(key as any)}
                  className={`
                    px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                    ${filterType === key 
                      ? `bg-gradient-to-r ${color} text-white border-transparent shadow-lg` 
                      : 'bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white/90'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
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
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => navigate('/blog/seo-generator')}
                      size="lg"
                      variant="outline"
                      className="border-2 border-purple-300 hover:border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-purple-700 hover:text-purple-800 px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Target className="h-5 w-5 mr-2" />
                      SEO Generator
                      <Sparkles className="h-5 w-5 ml-2" />
                    </Button>
                    <Button
                      onClick={() => navigate('/blog/create')}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Quick Create
                      <Rocket className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
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
                      isExpiringSoon={isExpiringSoon}
                      onClaim={() => handleClaimPost(post)}
                      onDelete={() => handleDeletePost(post)}
                      claiming={claiming === post.id}
                      deleting={deleting === post.id}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Stats for Nerds - Collapsible Debug Information */}
          {import.meta.env.DEV && (
            <StatsForNerds />
          )}
        </div>
      </div>
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
  isExpiringSoon: (post: BlogPost) => boolean;
  onClaim: () => void;
  onDelete: () => void;
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
  isExpiringSoon,
  onClaim,
  onDelete,
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
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

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
          {post.title}
        </CardTitle>
        
        <div className="flex items-center gap-6 text-sm text-gray-600 mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-blue-500" />
            {formatDate(post.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-purple-500" />
            {post.reading_time}m read
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-green-500" />
            {post.view_count} views
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0">
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
          {getExcerpt(post.content)}
        </p>

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
              {tag}
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
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white font-semibold py-3"
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

          {deletePermissions.canDelete && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={deleting}
              variant="destructive"
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              size="lg"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Post
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
              SEO Score: {post.seo_score}/100
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-blue-500" />
              {post.word_count} words
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Collapsible Stats for Nerds component with enhanced styling
function StatsForNerds() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-16 border-t border-white/20 pt-12">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between text-gray-500 hover:text-gray-700 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:bg-white/70"
          >
            <span className="text-lg font-mono flex items-center gap-2">
              <Activity className="h-5 w-5" />
              📊 Debug Information
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6">
            <BlogDataDebugger />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
