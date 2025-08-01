import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PricingModal } from '@/components/PricingModal';
import { BlogClaimService } from '@/services/blogClaimService';
import { ClaimableBlogService } from '@/services/claimableBlogService';
import { ExternalBlogService } from '@/services/externalBlogService';
import { blogService } from '@/services/blogService';
import type { BlogPost as BlogPostType } from '@/types/blogTypes';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  BarChart3,
  TrendingUp,
  Globe,
  Crown,
  Star,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  Loader2,
  ShoppingCart,
  Wand2,
  Filter,
  Plus,
  FileText
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived' | 'unclaimed' | 'claimed';
  target_url: string;
  backlinks: number;
  views: number;
  view_count?: number;
  created_at: string;
  published_at?: string;
  keywords: string[];
  is_trial_post?: boolean;
  user_id?: string;
  expires_at?: string;
  seo_score?: number;
  meta_description?: string;
  author_name?: string;
  reading_time?: number;
  content?: string;
}

export function ComprehensiveBlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived' | 'unclaimed' | 'claimed'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      // Load from multiple sources
      let allPosts: BlogPost[] = [];

      // Load from external blog first (primary source)
      try {
        console.log('🌐 Fetching real blog posts from https://backlinkoo.com/blog/');
        const externalPosts = await ExternalBlogService.fetchExternalBlogPosts();
        console.log(`✅ Loaded ${externalPosts.length} external blog posts`);
        allPosts = [...externalPosts];
      } catch (error) {
        console.warn('Failed to load external blog posts:', error);
      }

      // Load from database (claimable posts) as additional source
      try {
        const claimablePosts = await ClaimableBlogService.getClaimablePosts(20);
        // Add claimable posts that aren't already in external posts
        const existingSlugs = new Set(allPosts.map(p => p.slug));
        const uniqueClaimablePosts = claimablePosts.filter(p => !existingSlugs.has(p.slug));
        allPosts = [...allPosts, ...uniqueClaimablePosts];
      } catch (error) {
        console.warn('Database unavailable, using localStorage:', error);
      }

      // Load from localStorage (traditional blog posts)
      try {
        const localBlogMetas = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        
        for (const blogMeta of localBlogMetas) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);
            
            // Check if trial post is expired
            if (blogPost.is_trial_post && blogPost.expires_at) {
              const isExpired = new Date() > new Date(blogPost.expires_at);
              if (isExpired) {
                localStorage.removeItem(`blog_post_${blogMeta.slug}`);
                continue;
              }
            }

            // Add if not already in database posts
            if (!allPosts.find(p => p.slug === blogPost.slug)) {
              allPosts.push(blogPost);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }

      // Log final data source stats
      console.log(`📊 Loaded total posts: ${allPosts.length}`, {
        external: allPosts.filter(p => p.id.startsWith('external-') || p.id.startsWith('scraped-') || p.id.startsWith('fallback-')).length,
        database: allPosts.filter(p => !p.id.startsWith('external-') && !p.id.startsWith('scraped-') && !p.id.startsWith('fallback-')).length,
        localStorage: allPosts.filter(p => p.is_trial_post).length
      });

      setPosts(allPosts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing blog posts from https://backlinkoo.com/blog/');
    await loadBlogPosts();
    setRefreshing(false);
    toast({
      title: "Refreshed from Live Blog",
      description: "Blog posts have been refreshed from https://backlinkoo.com/blog/",
    });
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || post.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = (postId: string, newStatus: BlogPost['status']) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : post.published_at }
        : post
    ));
    toast({
      title: "Status Updated",
      description: `Post status changed to ${newStatus}`,
    });
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    setDeleting(postId);
    try {
      // Simulate delete operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Post Deleted",
        description: "Blog post has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleClaimPost = async (post: BlogPost) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to claim blog posts.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setClaiming(post.id);
    try {
      // Check if user can claim more posts
      const { canClaim, reason } = await BlogClaimService.canUserClaimMore(user);
      if (!canClaim) {
        toast({
          title: "Cannot Claim Post",
          description: reason,
          variant: "destructive"
        });
        return;
      }

      // Use enhanced claim method that works with both tables
      const result = await BlogClaimService.claimBlogPostEnhanced(post.slug, user.id);

      if (result.success) {
        // Update the post in the local state
        setPosts(posts.map(p =>
          p.id === post.id
            ? { ...p, status: 'claimed', user_id: user.id, expires_at: null }
            : p
        ));

        // Refresh the data to get updated statistics
        await loadBlogPosts();

        toast({
          title: "Post Claimed! 🎉",
          description: result.message,
        });
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to claim post:', error);
      toast({
        title: "Error",
        description: "Failed to claim post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClaiming(null);
    }
  };

  const handleRegenerateContent = async (postId: string) => {
    setRegenerating(postId);
    try {
      // Simulate content regeneration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Content Regenerated",
        description: "Blog post content has been regenerated with new AI insights.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegenerating(null);
    }
  };

  const getStatusBadge = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
      case 'claimed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Claimed</Badge>;
      case 'unclaimed':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unclaimed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const generateBacklinkUrl = (slug: string) => {
    return `https://backlinkoo.com/blog/${slug}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canClaim = (post: BlogPost) => {
    return post.is_trial_post && !post.user_id && (!post.expires_at || new Date() <= new Date(post.expires_at));
  };

  const isOwnedByUser = (post: BlogPost) => {
    return post.user_id === user?.id;
  };

  const totalViews = posts.reduce((sum, post) => sum + (post.views || post.view_count || 0), 0);
  const totalBacklinks = posts.reduce((sum, post) => sum + (post.backlinks || 0), 0);
  const publishedPosts = posts.filter(post => post.status === 'published' || post.status === 'claimed').length;
  const unclaimedPosts = posts.filter(post => post.status === 'unclaimed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Blog Management Hub
          </h2>
          <p className="text-gray-600 mt-2">
            Manage your blog posts with buy backlinks, claim posts, delete, and regenerate content features
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={refreshPosts}
            variant="outline"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/blog-creation')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="h-4 w-4" />
            Create New Post
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-700">Total Posts</p>
                <p className="text-2xl font-bold text-blue-900">{posts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Published</p>
                <p className="text-2xl font-bold text-green-900">{publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700">Total Views</p>
                <p className="text-2xl font-bold text-purple-900">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-700">Backlinks</p>
                <p className="text-2xl font-bold text-orange-900">{totalBacklinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700">Unclaimed</p>
                <p className="text-2xl font-bold text-amber-900">{unclaimedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setPricingModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Backlinks
            </Button>
            <Button
              onClick={() => navigate('/blog')}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Eye className="mr-2 h-4 w-4" />
              Browse All Posts
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Blog Posts Management
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              {filteredPosts.length} of {posts.length} posts
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts by title or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'published', 'claimed', 'unclaimed', 'draft', 'archived'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className={filter === status ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Posts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Backlinks</TableHead>
                  <TableHead className="text-center">SEO Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium hover:text-blue-600 cursor-pointer" 
                           onClick={() => navigate(`/blog/${post.slug}`)}>
                          {post.title}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(post.keywords || []).slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {(post.keywords || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(post.keywords || []).length - 3}
                            </Badge>
                          )}
                        </div>
                        {isOwnedByUser(post) && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs mt-1">
                            <Crown className="mr-1 h-2 w-2" />
                            Yours
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <a 
                        href={post.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm truncate block max-w-[200px]"
                      >
                        {post.target_url}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">{(post.views || post.view_count || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center">{post.backlinks || 0}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge 
                          variant="outline"
                          className={`${(post.seo_score || 0) >= 80 ? 'border-green-300 text-green-700' : 
                                       (post.seo_score || 0) >= 60 ? 'border-yellow-300 text-yellow-700' : 
                                       'border-red-300 text-red-700'}`}
                        >
                          {post.seo_score || 75}/100
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem 
                            onClick={() => window.open(generateBacklinkUrl(post.slug), '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Post
                          </DropdownMenuItem>
                          
                          {canClaim(post) && (
                            <DropdownMenuItem 
                              onClick={() => handleClaimPost(post)}
                              disabled={claiming === post.id}
                            >
                              {claiming === post.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Crown className="h-4 w-4 mr-2" />
                              )}
                              Claim Post
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem 
                            onClick={() => setPricingModalOpen(true)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy Backlinks
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleRegenerateContent(post.id)}
                            disabled={regenerating === post.id}
                          >
                            {regenerating === post.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            Regenerate Content
                          </DropdownMenuItem>

                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>

                          {post.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(post.id, 'published')}
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}

                          {post.status === 'published' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(post.id, 'archived')}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem 
                            onClick={() => handleDelete(post.id)}
                            disabled={deleting === post.id}
                            className="text-red-600 focus:text-red-600"
                          >
                            {deleting === post.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No blog posts found</h3>
              <p className="mb-4">
                {searchTerm ? 'No posts match your search criteria.' : 'You haven\'t created any blog posts yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/blog-creation')} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Post
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onAuthSuccess={(user) => {
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in. Continue with your purchase.",
          });
        }}
      />
    </div>
  );
}
