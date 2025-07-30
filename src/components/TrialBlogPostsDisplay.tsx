import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  User
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface TrialPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  expires_at: string;
  word_count: number;
  seo_score: number;
  target_url: string;
  anchor_text: string;
  keyword: string;
  is_trial_post: boolean;
  user_id?: string;
  view_count?: number;
  excerpt?: string;
}

interface TrialBlogPostsDisplayProps {
  user: User | null;
}

export function TrialBlogPostsDisplay({ user }: TrialBlogPostsDisplayProps) {
  const [trialPosts, setTrialPosts] = useState<TrialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingPostId, setClaimingPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTrialPosts();
    
    // Refresh every 30 seconds to check for expiring posts
    const interval = setInterval(loadTrialPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTrialPosts = async () => {
    try {
      setLoading(true);
      const posts: TrialPost[] = [];

      // First load from database (all published posts - claimed and unclaimed)
      try {
        const { BlogClaimService } = await import('@/services/blogClaimService');
        const dbPosts = await BlogClaimService.getClaimablePosts(50);

        // Add all database posts (claimed and unclaimed)
        dbPosts.forEach(dbPost => {
          posts.push({
            id: dbPost.id,
            title: dbPost.title,
            slug: dbPost.slug,
            created_at: dbPost.created_at,
            expires_at: dbPost.expires_at,
            word_count: dbPost.word_count || 0,
            seo_score: dbPost.seo_score || 0,
            target_url: dbPost.target_url,
            anchor_text: dbPost.tags?.[0] || 'keyword',
            keyword: dbPost.tags?.[0] || 'keyword',
            is_trial_post: dbPost.is_trial_post,
            user_id: dbPost.user_id,
            view_count: dbPost.view_count || 0,
            excerpt: dbPost.excerpt
          });
        });
        console.log(`✅ Loaded ${dbPosts.length} posts from database`);
      } catch (error) {
        console.warn('Error loading posts from database:', error);
      }

      // Also load from localStorage (all posts - not just trial)
      try {
        const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');

        for (const blogMeta of allBlogs) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);

            // Check if trial post is expired
            if (blogPost.is_trial_post && blogPost.expires_at) {
              const isExpired = new Date() > new Date(blogPost.expires_at);
              if (isExpired) {
                // Remove expired post
                localStorage.removeItem(`blog_post_${blogPost.slug}`);
                continue;
              }
            }

            // Only add if not already in database posts
            if (!posts.find(dbPost => dbPost.slug === blogPost.slug)) {
              posts.push({
                id: blogPost.id,
                title: blogPost.title,
                slug: blogPost.slug,
                created_at: blogPost.created_at,
                expires_at: blogPost.expires_at,
                word_count: blogPost.word_count || 0,
                seo_score: blogPost.seo_score || 0,
                target_url: blogPost.target_url,
                anchor_text: blogPost.anchor_text,
                keyword: blogPost.keywords?.[0] || 'keyword',
                is_trial_post: blogPost.is_trial_post,
                user_id: blogPost.user_id,
                view_count: blogPost.view_count || 0,
                excerpt: blogPost.excerpt || blogPost.meta_description
              });
            }
          }
        }

        // Update the all_blog_posts list to remove expired ones
        const validBlogMetas = allBlogs.filter((meta: any) => {
          return posts.some(post => post.slug === meta.slug) ||
                 !JSON.parse(localStorage.getItem(`blog_post_${meta.slug}`) || '{}').expires_at;
        });
        localStorage.setItem('all_blog_posts', JSON.stringify(validBlogMetas));

      } catch (error) {
        console.warn('Error loading posts from localStorage:', error);
      }

      // Sort by creation date (newest first)
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTrialPosts(posts);
      
      if (posts.length > 0) {
        console.log(`✅ Loaded ${posts.length} trial posts`);
      }

    } catch (error) {
      console.error('Error loading trial posts:', error);
      toast({
        title: "Error Loading Trial Posts",
        description: "Unable to load trial posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPost = async (post: TrialPost) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim trial posts.",
        variant: "destructive",
      });
      return;
    }

    try {
      setClaimingPostId(post.id);
      
      // Use the BlogClaimService to handle the claiming
      const { BlogClaimService } = await import('@/services/blogClaimService');
      const result = await BlogClaimService.claimLocalStoragePost(post, user);

      if (result.success) {
        toast({
          title: "🎉 Post Claimed Successfully!",
          description: "Your trial post is now permanent and saved to your account.",
        });
        
        // Remove from trial posts and refresh
        await loadTrialPosts();
      } else {
        toast({
          title: "Claim Failed",
          description: result.message || "Unable to claim the post. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error claiming trial post:', error);
      toast({
        title: "Claim Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setClaimingPostId(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Timer className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Blog Posts...</h3>
        <p className="text-gray-600 text-sm">Fetching all available blog posts from database and local storage</p>
      </div>
    );
  }

  if (trialPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Blog Posts</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          No blog posts found in the system. Visit the blog page or generate new content to get started.
        </p>
        <Button
          onClick={() => navigate('/?focus=generator')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate New Post
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Blog Posts</h2>
          <p className="text-gray-600 mt-1">
            {trialPosts.length} blog post{trialPosts.length !== 1 ? 's' : ''} • Claimed and unclaimed posts from /blog
          </p>
        </div>
        <Button
          onClick={loadTrialPosts}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Trial Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trialPosts.map((post) => {
        const timeRemaining = getTimeRemaining(post.expires_at);
        const isExpiringSoon = timeRemaining && timeRemaining.hours < 2;
        const isClaimed = post.user_id && !post.is_trial_post;
        const isUnclaimedTrial = post.is_trial_post && !post.user_id;

        return (
          <Card key={post.id} className={`group hover:shadow-lg transition-all duration-200 ${
            isClaimed
              ? 'border-green-200 bg-green-50'
              : isExpiringSoon
                ? 'border-red-200 bg-red-50'
                : 'border-amber-200 bg-amber-50'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                {isClaimed ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Claimed
                  </Badge>
                ) : (
                  <Badge variant="outline" className={`${
                    isExpiringSoon ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    <Timer className="mr-1 h-3 w-3" />
                    Unclaimed
                  </Badge>
                )}
                {timeRemaining && isUnclaimedTrial && (
                  <div className={`text-xs font-medium ${
                    isExpiringSoon ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {timeRemaining.hours}h {timeRemaining.minutes}m left
                  </div>
                )}
              </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </CardTitle>
                {post.excerpt && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{post.word_count} words</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{post.seo_score}/100 SEO</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.view_count} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleClaimPost(post)}
                    disabled={claimingPostId === post.id}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {claimingPostId === post.id ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Claim
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
