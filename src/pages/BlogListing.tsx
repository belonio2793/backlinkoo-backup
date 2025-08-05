import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { blogService } from '@/services/blogService';
import { SimplifiedClaimService } from '@/services/simplifiedClaimService';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseSetup } from '@/utils/databaseSetup';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PricingModal } from '@/components/PricingModal';
import { LoginModal } from '@/components/LoginModal';

import { Clock, Eye, Calendar, Plus, Search, Crown, Loader2, CheckCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { ExcerptCleaner } from '@/utils/excerptCleaner';

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
    initializeAndLoadPosts();
  }, []);

  const initializeAndLoadPosts = async () => {
    // Initialize database with sample data if needed
    await DatabaseSetup.initializeDatabase();
    // Then load the posts
    loadPosts();
  };

  useEffect(() => {
    checkUserClaimStatus();
    loadClaimedPosts();
  }, [user]);

  const checkUserClaimStatus = async () => {
    if (user) {
      try {
        const stats = await SimplifiedClaimService.getUserSavedStats(user.id);
        setCanClaimMore(stats.canSave);
      } catch (error) {
        console.warn('Failed to check claim status, defaulting to allow claims:', error);
        setCanClaimMore(true); // Default to allowing claims if check fails
      }
    }
  };

  const loadClaimedPosts = async () => {
    try {
      if (!user) return;
      const claimed = await SimplifiedClaimService.getUserSavedPosts(user.id);
      setClaimedPosts(new Set(claimed.map(p => p.id)));
    } catch (error) {
      console.warn('Failed to load claimed posts, continuing without claimed data:', error);
      setClaimedPosts(new Set()); // Default to empty set if loading fails
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading blog posts from Supabase database...');

      // Try to load posts using the blog service
      let blogPosts: BlogPost[] = [];
      try {
        blogPosts = await blogService.getRecentBlogPosts(50);
        console.log(`✅ Successfully loaded ${blogPosts.length} posts from database`);
      } catch (dbError: any) {
        console.warn('Database loading failed, trying UnifiedClaimService:', dbError.message);
        // Fallback to UnifiedClaimService if primary service fails
        try {
          blogPosts = await UnifiedClaimService.getClaimablePosts(50);
          console.log(`✅ Loaded ${blogPosts.length} posts using fallback service`);
        } catch (fallbackError: any) {
          console.warn('Fallback also failed:', fallbackError.message);
          throw new Error('Unable to load blog posts from any source');
        }
      }

      setPosts(blogPosts);

      if (blogPosts.length === 0) {
        console.log('🔄 No posts in database, creating sample data...');
        // Add sample data if no posts exist
        const samplePosts = [
          {
            id: 'sample-1',
            title: 'Getting Started with SEO Optimization',
            slug: 'getting-started-seo-optimization',
            content: 'Learn the fundamentals of SEO optimization and how to improve your website rankings.',
            excerpt: 'Complete guide to SEO fundamentals',
            target_url: 'https://example.com/seo-guide',
            status: 'published',
            created_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            view_count: 150,
            reading_time: 5,
            category: 'SEO',
            tags: ['seo', 'optimization', 'beginners'],
            meta_description: 'Learn the fundamentals of SEO optimization',
            author_name: 'SEO Expert',
            word_count: 1200,
            seo_score: 85,
            is_trial_post: false,
            user_id: null
          }
        ];
        setPosts(samplePosts as any);
      }

    } catch (error: any) {
      console.error('Failed to load blog posts:', error);

      // Show user-friendly error message
      toast({
        title: "Unable to load blog posts",
        description: error.message || "Please check your internet connection and try again.",
        variant: "destructive"
      });

      // Provide fallback data so the page isn't empty
      const fallbackPosts = [
        {
          id: 'fallback-1',
          title: 'Sample Blog Post - Database Connection Issue',
          slug: 'sample-blog-post-database-issue',
          content: 'This is a sample blog post shown when the database connection is not available.',
          excerpt: 'Sample post displayed when database is unavailable',
          target_url: 'https://backlinkoo.com/blog',
          status: 'published',
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          view_count: 0,
          reading_time: 3,
          category: 'System',
          tags: ['system', 'fallback'],
          meta_description: 'Sample post when database unavailable',
          author_name: 'System',
          word_count: 500,
          seo_score: 70,
          is_trial_post: false,
          user_id: null
        }
      ];
      setPosts(fallbackPosts as any);

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
      // Try SimplifiedClaimService first, then UnifiedClaimService as fallback
      let result;
      try {
        result = await SimplifiedClaimService.claimBlogPost(post.slug, user);
      } catch (primaryError: any) {
        console.warn('Primary claim service failed, trying fallback:', primaryError.message);
        result = await UnifiedClaimService.claimBlogPost(post.slug, user);
      }

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
        throw new Error(result.error || result.message || 'Failed to claim post');
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
            <p className="text-xl text-gray-600 mb-6">
              Boost your search rankings with high-quality backlinks and SEO-optimized content
            </p>

            {/* Claim Status for Authenticated Users */}
            {user && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm">
                  <Crown className="h-4 w-4" />
                  {canClaimMore ? (
                    `You can claim ${3 - claimedPosts.size} more posts`
                  ) : (
                    <>
                      Claim limit reached -
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="underline hover:no-underline ml-1"
                      >
                        upgrade for unlimited
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

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
                          {getExcerpt(post.content, post.title)}
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

                        {/* Claim Button Section */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          {isClaimable(post) ? (
                            <Button
                              onClick={(e) => handleClaimPost(e, post)}
                              disabled={claiming === post.id}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              size="sm"
                            >
                              {claiming === post.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Claiming...
                                </>
                              ) : (
                                <>
                                  <Crown className="h-4 w-4 mr-2" />
                                  Claim Post {!user && '(Login Required)'}
                                </>
                              )}
                            </Button>
                          ) : claimedPosts.has(post.id) ? (
                            <div className="flex items-center justify-center w-full py-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Already Claimed
                            </div>
                          ) : isPostExpired(post) ? (
                            <div className="flex items-center justify-center w-full py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm">
                              Expired
                            </div>
                          ) : !post.is_trial_post ? (
                            <div className="flex items-center justify-center w-full py-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Post
                            </div>
                          ) : null}
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

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onAuthSuccess={(user) => {
          setShowPricingModal(false);
          checkUserClaimStatus();
          toast({
            title: "Welcome! 🎉",
            description: "You can now claim unlimited blog posts.",
          });
        }}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={(user) => {
          setShowLoginModal(false);
          checkUserClaimStatus();
          loadClaimedPosts();
          toast({
            title: "Welcome back!",
            description: "You can now claim blog posts.",
          });
        }}
        defaultTab="login"
      />
    </div>
  );
}
