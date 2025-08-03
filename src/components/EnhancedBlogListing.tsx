import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  ChevronDown
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function EnhancedBlogListing() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Infinity className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink ∞</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/blog/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Post
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/login")}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/login")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Posts</h1>
            <p className="text-xl text-gray-600 mb-6">
              Discover and claim high-quality blog posts with contextual backlinks
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search blog posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" />
                All Posts
              </Button>
              <Button
                variant={filterType === 'claimable' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('claimable')}
                className="flex items-center gap-1"
              >
                <Crown className="h-3 w-3" />
                Claimable
              </Button>
              <Button
                variant={filterType === 'claimed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('claimed')}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Claimed
              </Button>
              {user && (
                <Button
                  variant={filterType === 'my-posts' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('my-posts')}
                  className="flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  My Posts
                </Button>
              )}
            </div>
          </div>



          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {!loading && (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? 'Try a different search term or filter.' 
                      : filterType === 'my-posts' 
                        ? "You haven't claimed any posts yet."
                        : 'Be the first to create a blog post!'
                    }
                  </p>
                  <Button onClick={() => navigate('/blog/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map(post => (
                    <PostCard 
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

// Separate PostCard component for better organization
interface PostCardProps {
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
}

function PostCard({ 
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
  deleting
}: PostCardProps) {
  const canClaimPost = EnhancedBlogClaimService.canClaimPost(post);
  const deletePermissions = EnhancedBlogClaimService.canDeletePost(post, user);
  const isOwnPost = post.user_id === user?.id;
  const expiringSoon = isExpiringSoon(post);

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow ${
        expiringSoon ? 'border-red-200 bg-red-50/30' : ''
      }`}
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-wrap gap-1">
            <Badge variant={post.claimed ? "default" : "secondary"}>
              {post.claimed ? (
                <>
                  <Crown className="mr-1 h-3 w-3" />
                  Claimed
                </>
              ) : (
                <>
                  <Timer className="mr-1 h-3 w-3" />
                  Unclaimed
                </>
              )}
            </Badge>
            
            {post.claimed && isOwnPost && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <User className="mr-1 h-3 w-3" />
                Yours
              </Badge>
            )}
            
            {expiringSoon && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Expiring
              </Badge>
            )}
          </div>
        </div>
        
        <CardTitle className="text-lg line-clamp-2 leading-tight">
          {post.title}
        </CardTitle>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(post.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.reading_time}m
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.view_count}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {getExcerpt(post.content)}
        </p>

        {/* Expiration Timer */}
        {!post.claimed && post.expires_at && (
          <div className={`text-xs mb-3 p-2 rounded ${
            expiringSoon 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Timer className="h-3 w-3 inline mr-1" />
            {getTimeRemaining(post.expires_at)} remaining
          </div>
        )}

        {/* Keywords */}
        <div className="flex flex-wrap gap-1 mb-4">
          {post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
          )}
          {post.tags?.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {canClaimPost && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClaim();
              }}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="sm"
            >
              {claiming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  {user ? 'Claim Post' : 'Login to Claim'}
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
              className="w-full"
              size="sm"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
