import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { blogService } from '@/services/blogService';
import { BlogClaimService } from '@/services/blogClaimService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PricingModal } from '@/components/PricingModal';
import { LoginModal } from '@/components/LoginModal';
import { Clock, Eye, Calendar, Plus, Search, Crown, Loader2, CheckCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function BlogListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Claiming states
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedPosts, setClaimedPosts] = useState<Set<string>>(new Set());
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [canClaimMore, setCanClaimMore] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    checkUserClaimStatus();
    loadClaimedPosts();
  }, [user]);

  const checkUserClaimStatus = async () => {
    if (user) {
      try {
        const canClaim = await BlogClaimService.canUserClaimMore(user);
        setCanClaimMore(canClaim);
      } catch (error) {
        console.warn('Failed to check claim status:', error);
      }
    }
  };

  const loadClaimedPosts = () => {
    try {
      const claimed = BlogClaimService.getUserClaimedPosts(user?.id);
      setClaimedPosts(new Set(claimed.map(p => p.id)));
    } catch (error) {
      console.warn('Failed to load claimed posts:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const blogPosts = await blogService.getRecentBlogPosts(50);
      setPosts(blogPosts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (query: string) => {
    if (!query.trim()) {
      loadPosts();
      return;
    }

    try {
      setLoading(true);
      const results = await blogService.searchBlogPosts(query);
      setPosts(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPosts(searchQuery);
  };

  const filteredPosts = posts.filter(post => {
    if (selectedCategory && post.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const categories = Array.from(new Set(posts.map(post => post.category).filter(Boolean)));

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

  const isExpiringSoon = (post: BlogPost) => {
    if (!post.is_trial_post || !post.expires_at) return false;
    const hoursLeft = (new Date(post.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 2;
  };

  const isClaimable = (post: BlogPost) => {
    return post.is_trial_post && !claimedPosts.has(post.id) && !isPostExpired(post);
  };

  const isPostExpired = (post: BlogPost) => {
    if (!post.is_trial_post || !post.expires_at) return false;
    return new Date() > new Date(post.expires_at);
  };

  const handleClaimPost = async (e: React.MouseEvent, post: BlogPost) => {
    e.stopPropagation(); // Prevent card navigation

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!canClaimMore) {
      setShowPricingModal(true);
      return;
    }

    if (!isClaimable(post)) {
      toast({
        title: "Cannot claim post",
        description: "This post is not available for claiming.",
        variant: "destructive"
      });
      return;
    }

    setClaiming(post.id);

    try {
      const result = await BlogClaimService.claimPost(post.id, user);

      if (result.success) {
        setClaimedPosts(prev => new Set([...prev, post.id]));

        toast({
          title: "Post claimed successfully! 🎉",
          description: `"${post.title}" is now permanently yours.`
        });

        // Refresh claim status
        checkUserClaimStatus();

        // Optionally navigate to the claimed post
        setTimeout(() => {
          navigate(`/blog/${post.slug}`);
        }, 1500);

      } else {
        throw new Error(result.error || 'Failed to claim post');
      }
    } catch (error: any) {
      console.error('Claim error:', error);

      // Handle specific error cases
      if (error.message?.includes('limit')) {
        setShowPricingModal(true);
        toast({
          title: "Claim limit reached",
          description: "Upgrade to claim unlimited posts.",
          variant: "destructive"
        });
      } else if (error.message?.includes('expired')) {
        toast({
          title: "Post expired",
          description: "This post is no longer available for claiming.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Claim failed",
          description: error.message || "Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Posts</h1>
            <p className="text-xl text-gray-600 mb-8">
              Boost your search rankings with high-quality backlinks and SEO-optimized content
            </p>
            
            <Button 
              onClick={() => navigate('/blog/create')}
              size="lg"
              className="mb-8"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Post
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
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

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
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
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery ? 'Try a different search term.' : 'Be the first to create a blog post!'}
                  </p>
                  <Button onClick={() => navigate('/blog/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map(post => (
                    <Card 
                      key={post.id} 
                      className={`cursor-pointer hover:shadow-lg transition-shadow ${
                        isExpiringSoon(post) ? 'border-red-200' : ''
                      }`}
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2 flex-1">
                            {post.title}
                          </CardTitle>
                          {post.is_trial_post && (
                            <Badge 
                              variant="outline" 
                              className={`ml-2 ${isExpiringSoon(post) ? 'border-red-500 text-red-600' : ''}`}
                            >
                              Trial
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.created_at)}
                          </div>
                          {post.reading_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.reading_time}m
                            </div>
                          )}
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

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
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
                          
                          <span className="text-xs text-gray-500">
                            {post.word_count} words
                          </span>
                        </div>

                        {isExpiringSoon(post) && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            ⚠️ Expires soon - claim to keep permanently
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Load More Button */}
          {!loading && filteredPosts.length > 0 && filteredPosts.length >= 20 && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={loadPosts}>
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
