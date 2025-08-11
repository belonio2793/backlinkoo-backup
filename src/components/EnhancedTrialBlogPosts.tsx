import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  AlertCircle,
  Sparkles,
  TrendingUp,
  FileText,
  Save,
  ArrowRight,
  Timer,
  Crown,
  RefreshCw,
  Plus,
  Eye,
  User,
  CheckCircle2,
  Search,
  Filter,
  Grid3X3,
  LayoutList,
  Calendar,
  Star,
  Target,
  BarChart3,
  BookOpen,
  Globe
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface TrialPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  expires_at?: string;
  word_count: number;
  seo_score: number;
  target_url: string;
  anchor_text: string;
  keyword: string;
  is_trial_post: boolean;
  user_id?: string;
  view_count: number;
  reading_time: number;
  excerpt?: string;
  category?: string;
  tags?: string[];
  ai_provider?: string;
}

interface EnhancedTrialBlogPostsProps {
  user: User | null;
}

// Helper function to load initial posts from localStorage
const getInitialPosts = (): TrialPost[] => {
  try {
    const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    const posts: TrialPost[] = [];

    for (const blogMeta of allBlogs) {
      const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
      if (blogData) {
        const blogPost = JSON.parse(blogData);
        // Check if not expired
        if (!blogPost.expires_at || new Date() <= new Date(blogPost.expires_at)) {
          posts.push(blogPost);
        }
      }
    }

    return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.warn('Error loading initial posts from localStorage:', error);
    return [];
  }
};

export function EnhancedTrialBlogPosts({ user }: EnhancedTrialBlogPostsProps) {
  // Pre-load data from localStorage immediately - no loading state needed
  const [allPosts, setAllPosts] = useState<TrialPost[]>(getInitialPosts());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'claimed' | 'available'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'claimed' | 'expiring'>('claimed');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [claimingPostId, setClaimingPostId] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load fresh data in background without showing loading state
    loadAllPosts(true);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadAllPosts(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAllPosts = async (silentRefresh = true) => {
    try {
      if (!silentRefresh) setIsRefreshing(true);

      // Load from database using the blog claim service
      const { BlogClaimService } = await import('@/services/blogClaimService');
      const dbPosts = await BlogClaimService.getClaimablePosts(50);

      // Get fresh localStorage data
      const localPosts = getInitialPosts();

      // Combine and deduplicate posts
      const combinedPosts = [...dbPosts];
      localPosts.forEach(localPost => {
        if (!combinedPosts.find(dbPost => dbPost.slug === localPost.slug)) {
          combinedPosts.push(localPost);
        }
      });

      // Sort by date
      combinedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAllPosts(combinedPosts);
      setLastRefresh(new Date());

      if (!silentRefresh && combinedPosts.length > 0) {
        toast({
          title: "Posts Refreshed",
          description: `Found ${combinedPosts.length} trial posts`,
        });
      }

    } catch (error: any) {
      console.error('Error loading posts:', error);
      if (!silentRefresh) {
        toast({
          title: "Error Loading Posts",
          description: "Unable to fetch trial posts. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (!silentRefresh) setIsRefreshing(false);
    }
  };

  const handleClaimPost = async (post: TrialPost) => {
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
        await loadAllPosts();
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

  const handleUnclaimPost = async (post: TrialPost) => {
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
        await loadAllPosts();
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

  // Filtering and sorting logic
  const filteredAndSortedPosts = () => {
    let filtered = allPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.anchor_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by claim status
    if (selectedFilter === 'claimed') {
      filtered = filtered.filter(post => post.user_id === user?.id && !post.is_trial_post);
    } else if (selectedFilter === 'available') {
      filtered = filtered.filter(post => !post.user_id || post.is_trial_post);
    }

    // Sort posts
    switch (sortBy) {
      case 'claimed':
        // Claimed posts first, then most recent
        return filtered.sort((a, b) => {
          const aIsClaimed = a.user_id === user?.id && !a.is_trial_post;
          const bIsClaimed = b.user_id === user?.id && !b.is_trial_post;
          
          if (aIsClaimed && !bIsClaimed) return -1;
          if (!aIsClaimed && bIsClaimed) return 1;
          
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case 'expiring':
        return filtered.sort((a, b) => {
          if (!a.expires_at) return 1;
          if (!b.expires_at) return -1;
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        });
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  const posts = filteredAndSortedPosts();
  const claimedPosts = posts.filter(post => post.user_id === user?.id && !post.is_trial_post);
  const availablePosts = posts.filter(post => !post.user_id || post.is_trial_post);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return Math.max(0, hours);
  };

  const renderPostCard = (post: TrialPost) => {
    const isUserPost = post.user_id === user?.id && !post.is_trial_post;
    const timeRemaining = post.expires_at ? getTimeRemaining(post.expires_at) : null;
    const isExpiringSoon = timeRemaining !== null && timeRemaining < 6;

    return (
      <Card 
        key={post.id} 
        className={`group hover:shadow-lg transition-all duration-300 ${
          isUserPost ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : 
          'border-gray-200 hover:border-blue-300'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              {isUserPost ? (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Claimed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              )}
              {post.ai_provider && (
                <Badge variant="secondary" className="text-xs">
                  {post.ai_provider}
                </Badge>
              )}
            </div>
          </div>
          
          <CardTitle className="text-lg leading-tight hover:text-blue-600 transition-colors cursor-pointer">
            {post.title}
          </CardTitle>
          
          {post.excerpt && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">{post.seo_score || 0}</div>
              <div className="text-blue-600">SEO</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 rounded">
              <div className="font-semibold text-emerald-700">{`${post.reading_time || Math.ceil(post.word_count / 200)}m`}</div>
              <div className="text-emerald-600">Read</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="font-semibold text-purple-700">{`${Math.floor((post.word_count || 0) / 100)}k`}</div>
              <div className="text-purple-600">Words</div>
            </div>
          </div>

          {/* Keywords and URL */}
          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="font-medium">Keyword:</span>
              <span className="text-blue-600">{post.keyword}</span>
            </div>
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3 text-gray-400" />
              <span className="font-medium">Links to:</span>
              <span className="text-gray-600 truncate">{post.target_url}</span>
            </div>
          </div>

          {/* Expiry Warning */}
          {isExpiringSoon && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 mb-3">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              {`Expires in ${timeRemaining}h`}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1" 
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            
            {isUserPost ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnclaimPost(post)}
                disabled={claimingPostId === post.id}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {claimingPostId === post.id ? (
                  <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Unclaim'
                )}
              </Button>
            ) : (
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
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count || 0} views
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // No loading screen - content loads immediately from localStorage

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Claimed Posts</h2>
          <p className="text-gray-600">Our free blog posts are offered for educational purposes, showcasing how keyword-relevant content, targeted anchor texts, and strategic backlinks from high-authority websites can boost search engine rankings—all powered by a private network and multiple domains built on top-tier SEO standards and security.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadAllPosts(false)} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate('/?focus=generator')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Generate New
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{allPosts.length}</div>
          <div className="text-sm text-purple-600">Total Posts</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">{claimedPosts.length}</div>
          <div className="text-sm text-emerald-600">Your Posts</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{availablePosts.length}</div>
          <div className="text-sm text-blue-600">Available</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Posts</option>
              <option value="claimed">My Claimed Posts</option>
              <option value="available">Available Posts</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="claimed">Claimed First</option>
              <option value="newest">Newest First</option>
              <option value="expiring">Expiring Soon</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none px-3"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || selectedFilter !== 'all') && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {posts.length} posts</span>
            {searchTerm && (
              <Badge variant="outline">Search: "{searchTerm}"</Badge>
            )}
            {selectedFilter !== 'all' && (
              <Badge variant="outline">Filter: {selectedFilter}</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 space-y-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {searchTerm || selectedFilter !== 'all' ? 'No matching posts found' : 'No trial posts yet'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Generate your first blog post to get started with the trial experience.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }>
          {posts.map(renderPostCard)}
        </div>
      )}

      {/* Last Refresh Info */}
      {lastRefresh && (
        <div className="text-center text-xs text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
