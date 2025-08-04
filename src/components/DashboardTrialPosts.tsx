import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePremium';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { blogService } from '@/services/blogService';
import { 
  Clock, 
  Eye, 
  Calendar, 
  Plus, 
  Search,
  Crown,
  CheckCircle,
  Timer,
  AlertTriangle,
  Trash2,
  User,
  Filter,
  TrendingUp,
  BookOpen,
  Infinity,
  RefreshCw,
  ExternalLink,
  Target,
  Sparkles,
  CheckCircle2,
  Grid3X3,
  LayoutList
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { User } from '@supabase/supabase-js';

type BlogPost = Tables<'blog_posts'>;

interface DashboardTrialPostsProps {
  user: User | null;
}

export function DashboardTrialPosts({ user }: DashboardTrialPostsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canClaimUnlimited, maxClaimedPosts, isPremium } = usePermissions();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('unclaimed');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadPosts();
  }, []);

  // Process any pending claim intent after user login
  useEffect(() => {
    const processPendingClaim = async () => {
      if (!user) return;

      const pendingClaimSlug = localStorage.getItem('pendingClaimSlug');
      if (pendingClaimSlug) {
        console.log('Processing pending claim for:', pendingClaimSlug);
        localStorage.removeItem('pendingClaimSlug');

        try {
          const claimResult = await EnhancedBlogClaimService.claimPost(pendingClaimSlug, user);
          if (claimResult.success) {
            toast({
              title: "Post Claimed Successfully!",
              description: claimResult.message,
            });
            await loadPosts(); // Refresh the list
          } else {
            toast({
              title: "Claim Failed",
              description: claimResult.message,
              variant: "destructive"
            });
          }
        } catch (error: any) {
          console.error('Error processing pending claim:', error);
          toast({
            title: "Claim Error",
            description: "Failed to process your claim request",
            variant: "destructive"
          });
        }
      }
    };

    processPendingClaim();
  }, [user, toast]);

  const loadPosts = async () => {
    try {
      const allPosts = await blogService.getAllBlogPosts();
      setPosts(allPosts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    }
  };

  const handleClaimPost = async (slug: string) => {
    if (!user) {
      // Store claim intent and redirect to login
      localStorage.setItem('pendingClaimSlug', slug);
      navigate('/login');
      toast({
        title: "Login Required",
        description: "Please sign in to claim this post",
      });
      return;
    }

    // Check if user has reached their claim limit
    const userClaimedCount = posts.filter(post => post.claimed && post.user_id === user.id).length;

    // Premium users have unlimited claims
    if (!canClaimUnlimited && userClaimedCount >= maxClaimedPosts) {
      toast({
        title: "Claim Limit Reached",
        description: isPremium
          ? "You have reached your claim limit."
          : `You can only claim a maximum of ${maxClaimedPosts} posts. Upgrade to Premium for unlimited claims.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setClaiming(slug);
      const result = await EnhancedBlogClaimService.claimPost(slug, user);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        });
        await loadPosts();
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
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setClaiming(null);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setDeleting(id);
      const success = await blogService.deleteBlogPost(id);
      
      if (success) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        await loadPosts();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete post",
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
    if (!title) return '';
    return title
      .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1') // Remove **Title:** wrapper and extract content
      .replace(/^\s*Title:\s*/gi, '') // Remove Title: prefix
      .replace(/^\*\*H1\*\*:\s*/i, '')
      .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
      .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
      .replace(/\*\*/g, '') // Remove any remaining ** symbols
      .replace(/\*/g, '') // Remove any remaining * symbols
      .replace(/^#{1,6}\s+/, '') // Remove markdown headers
      .trim();
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    // Remove HTML tags first
    let plainText = content.replace(/<[^>]*>/g, '');

    // Remove **Title:** patterns at the beginning
    plainText = plainText.replace(/^\s*\*\*Title:\s*[^*]*\*\*\s*/i, '');

    // Remove any remaining Title: patterns
    plainText = plainText.replace(/^\s*Title:\s*[^\n]*/gi, '');

    // Remove excessive whitespace
    plainText = plainText.replace(/\s+/g, ' ').trim();

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

  // Get all unclaimed posts for Available tab
  const unclaimedPosts = posts.filter(post => !post.claimed || post.user_id === null);

  // Get user's claimed posts (limited to 3) for Claimed tab
  const claimedPosts = posts
    .filter(post => post.claimed && post.user_id === user?.id)
    .slice(0, 3); // Maximum of 3 claimed posts

  // Apply filtering based on active tab and search query
  const getFilteredPosts = () => {
    let postsToFilter = activeTab === 'claimed' ? claimedPosts : unclaimedPosts;

    // Apply search filter
    if (searchQuery) {
      postsToFilter = postsToFilter.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.target_url && post.target_url.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return postsToFilter;
  };

  const filteredPosts = getFilteredPosts();

  const renderPostCard = (post: BlogPost) => {
    const isUserPost = post.user_id === user?.id && post.claimed;
    const canDelete = !post.claimed || (post.user_id === user?.id);
    const isExpiring = isExpiringSoon(post);
    const userClaimedCount = user ? posts.filter(p => p.claimed && p.user_id === user.id).length : 0;
    const canClaim = canClaimUnlimited || userClaimedCount < maxClaimedPosts;

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
              
              {post.is_trial_post && (
                <Badge variant="secondary" className="bg-purple-50 border-purple-200 text-purple-700 text-xs">
                  Trial
                </Badge>
              )}
            </div>
            
            {isExpiring && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expiring Soon
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-lg leading-tight hover:text-blue-600 transition-colors cursor-pointer">
            {cleanTitle(post.title)}
          </CardTitle>
          
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
            {getExcerpt(post.content || '')}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">{post.seo_score || 0}</div>
              <div className="text-blue-600">SEO</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 rounded">
              <div className="font-semibold text-emerald-700">{post.reading_time || Math.ceil((post.word_count || 0) / 200)}m</div>
              <div className="text-emerald-600">Read</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="font-semibold text-purple-700">{Math.floor((post.word_count || 0) / 100)}k</div>
              <div className="text-purple-600">Words</div>
            </div>
          </div>

          {/* Target URL and Anchor Text */}
          <div className="space-y-2 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="font-medium">Anchor:</span>
              <span className="text-blue-600">{post.anchor_text || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3 text-gray-400" />
              <span className="font-medium">Links to:</span>
              <span className="text-gray-600 truncate">{post.target_url}</span>
            </div>
          </div>

          {/* Expiry Warning */}
          {post.expires_at && !post.claimed && (
            <div className={`p-2 border rounded text-xs mb-3 ${
              isExpiring 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <Timer className="h-3 w-3 inline mr-1" />
              {getTimeRemaining(post.expires_at)}
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
            
            {!isUserPost && !post.claimed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => handleClaimPost(post.slug)}
                      disabled={claiming === post.slug || !canClaim}
                      className={`${
                        canClaim
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {claiming === post.slug ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          {canClaim ? 'Claim' : 'Limit Reached'}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {!canClaim && (
                    <TooltipContent>
                      <p>Upgrade to Premium Plan to claim unlimited blog posts</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeletePost(post.id)}
                disabled={deleting === post.id}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {deleting === post.id ? (
                  <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trial Blog Posts</h2>
          <p className="text-gray-600">Manage your claimed posts (max 3) and discover new opportunities</p>
        </div>

      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{claimedPosts.length}</div>
            <div className="text-sm text-gray-600">Claimed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{unclaimedPosts.length}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{posts.filter(p => p.is_trial_post).length}</div>
            <div className="text-sm text-gray-600">Trial Posts</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Controls */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="unclaimed" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Available ({unclaimedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="claimed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Claimed ({claimedPosts.length}/3)
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="unclaimed" className="mt-0">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">No available posts found</h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Generate new blog posts to get started.'}
                    </p>
                  </div>
                  <Button onClick={() => navigate('/?focus=generator')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate New Post
                  </Button>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                }>
                  {filteredPosts.map(renderPostCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="claimed" className="mt-0">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">No claimed posts found</h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Claim some posts from the available tab to see them here (maximum 3 posts).'}
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab('unclaimed')} variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Available Posts
                  </Button>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                }>
                  {filteredPosts.map(renderPostCard)}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
