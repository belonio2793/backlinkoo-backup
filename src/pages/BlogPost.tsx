import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BlogClaimService } from '@/services/blogClaimService';
import { 
  Calendar, 
  Clock, 
  Eye, 
  User, 
  ArrowLeft, 
  ExternalLink, 
  Tag,
  TrendingUp,
  Star,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Timer,
  Crown
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  keywords: string[];
  tags: string[];
  category: string;
  target_url: string;
  anchor_text?: string;
  status: string;
  is_trial_post: boolean;
  expires_at?: string;
  view_count: number;
  seo_score: number;
  reading_time: number;
  word_count: number;
  author_name: string;
  created_at: string;
  published_at?: string;
  user_id?: string;
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
      if (user) {
        loadUserStats();
      }
    }
  }, [slug, user]);

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      const stats = await BlogClaimService.getUserClaimStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadBlogPost = async (slug: string) => {
    try {
      // Try database first
      let foundPost: BlogPost | null = null;
      
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          throw error;
        }

        foundPost = data;
        
        // Increment view count
        await supabase
          .from('blog_posts')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('slug', slug);

      } catch (dbError) {
        console.warn('Database error, trying localStorage:', dbError);
        
        // Fallback to localStorage
        const blogData = localStorage.getItem(`blog_post_${slug}`);
        if (blogData) {
          foundPost = JSON.parse(blogData);
          // Increment view count in localStorage
          if (foundPost) {
            foundPost.view_count = (foundPost.view_count || 0) + 1;
            localStorage.setItem(`blog_post_${slug}`, JSON.stringify(foundPost));
          }
        }
      }

      if (foundPost) {
        setPost(foundPost);
      } else {
        toast({
          title: "Blog Post Not Found",
          description: "The requested blog post could not be found.",
          variant: "destructive"
        });
        navigate('/blog');
      }

    } catch (error) {
      console.error('Failed to load blog post:', error);
      toast({
        title: "Error Loading Post",
        description: "Failed to load the blog post. Please try again.",
        variant: "destructive"
      });
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPost = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to claim this blog post.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!post || !post.is_trial_post || post.user_id) {
      return;
    }

    setClaiming(true);

    try {
      const result = await BlogClaimService.claimBlogPost(post.slug, user.id);
      
      if (result.success) {
        toast({
          title: "Post Claimed!",
          description: result.message,
        });
        
        // Reload the post to show updated status
        await loadBlogPost(post.slug);
        await loadUserStats();
        
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
      setClaiming(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Post Not Found</h2>
          <p className="text-gray-600">The requested blog post could not be found.</p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = post.expires_at && new Date() > new Date(post.expires_at);
  const canClaim = post.is_trial_post && !post.user_id && !isExpired;
  const isOwnedByUser = post.user_id === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a 
                  href={post.target_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Target
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Post Header */}
        <Card className="mb-8">
          <CardHeader className="space-y-6">
            {/* Status and Category */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  {post.category}
                </Badge>
                {post.is_trial_post ? (
                  isOwnedByUser ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <Crown className="mr-1 h-3 w-3" />
                      Owned by You
                    </Badge>
                  ) : post.user_id ? (
                    <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Claimed
                    </Badge>
                  ) : isExpired ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Expired
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      <Timer className="mr-1 h-3 w-3" />
                      Available to Claim
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Permanent
                  </Badge>
                )}
              </div>

              {/* Expiry Timer */}
              {post.is_trial_post && !post.user_id && post.expires_at && !isExpired && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <Timer className="mr-1 h-3 w-3" />
                  {getTimeUntilExpiry(post.expires_at)}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.reading_time} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{post.view_count} views</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{post.seo_score}/100 SEO</span>
              </div>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2">
              {(post.tags || post.keywords || []).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-2 w-2" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Claim Button */}
            {canClaim && user && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Claim This Post</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Make this post permanently yours. You have {userStats?.maxClaims - userStats?.claimedCount || 0} claims remaining.
                    </p>
                  </div>
                  <Button
                    onClick={handleClaimPost}
                    disabled={claiming || !userStats?.canClaim}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Claim Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Sign in prompt for non-users */}
            {canClaim && !user && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-amber-900">Want to Claim This Post?</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Sign in to claim this post and make it permanently yours.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Post Content */}
        <Card>
          <CardContent className="prose prose-lg max-w-none p-8">
            <div 
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="text-gray-800 leading-relaxed"
            />
          </CardContent>
        </Card>

        {/* Post Footer */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Published on {formatDate(post.published_at || post.created_at)}</p>
                <p>{post.word_count} words • {post.reading_time} minute read</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={post.target_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Target Site
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/blog')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
