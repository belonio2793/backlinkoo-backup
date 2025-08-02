import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { blogService } from '@/services/blogService';
import { SimplifiedClaimService } from '@/services/simplifiedClaimService';
import { ClaimErrorHandler } from '@/utils/claimErrorHandler';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Clock,
  Eye,
  User,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Share2,
  BookmarkPlus,
  Star,
  Crown,
  Timer,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

type BlogPost = Tables<'blog_posts'>;

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔄 BlogPost component rendered with slug:', slug);

  useEffect(() => {
    if (!slug) {
      navigate('/blog');
      return;
    }

    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      console.log('🔄 Loading blog post:', slug);
      setError(null);

      // First try to get from database using simplified service
      const blogPost = await SimplifiedClaimService.getBlogPostBySlug(slug!);
      if (blogPost) {
        console.log('✅ Found blog post in database:', blogPost.title);
        setPost(blogPost);
        setLoading(false);
        return;
      } else {
        console.log('⚠️ Blog post not found in database, trying localStorage...');
      }

      // Fallback to localStorage for legacy posts
      const localPost = localStorage.getItem(`blog_post_${slug}`);
      if (localPost) {
        try {
          const parsedPost = JSON.parse(localPost);
          // Check if it's expired
          if (parsedPost.is_trial_post && parsedPost.expires_at &&
              new Date() > new Date(parsedPost.expires_at)) {
            // Remove expired post from localStorage
            localStorage.removeItem(`blog_post_${slug}`);
            throw new Error('Post has expired');
          }
          setPost(parsedPost);
          setLoading(false);
          return;
        } catch (parseError) {
          console.warn('Failed to parse localStorage post:', parseError);
          localStorage.removeItem(`blog_post_${slug}`);
        }
      }

      // No post found
      toast({
        title: "Post Not Found",
        description: "The requested blog post could not be found or has expired.",
        variant: "destructive"
      });
      navigate('/blog');
      return;

    } catch (error: any) {
      console.error('❌ Failed to load blog post:', error);
      setError(error.message || 'Unknown error occurred');
      toast({
        title: "Error Loading Post",
        description: `Failed to load blog post: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });

      // Don't navigate away immediately, let user see the error
      setTimeout(() => {
        navigate('/blog');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRedirect = () => {
    if (!post) return;

    // Store claim intent for after login
    const claimIntent = {
      postSlug: post.slug,
      postTitle: post.title,
      postId: post.id,
      timestamp: Date.now()
    };

    localStorage.setItem('claim_intent', JSON.stringify(claimIntent));

    toast({
      title: "Redirecting to sign in...",
      description: "We'll bring you back here to complete your claim.",
    });

    // Navigate to login page
    navigate('/login');
  };

  const claimPost = async () => {
    if (!user || !post) {
      handleClaimRedirect();
      return;
    }

    setClaiming(true);
    try {
      console.log('🎯 Attempting to claim post:', post.slug);

      const result = await SimplifiedClaimService.claimBlogPost(post.slug, user);

      if (result.success) {
        toast({
          title: "Post Claimed Successfully! 🎉",
          description: result.message,
        });

        // Update the current post state with the claimed post
        if (result.post) {
          setPost(result.post);
        } else {
          // Reload the post to get the updated state
          await loadPost();
        }

        // Clear any localStorage version to prevent conflicts
        localStorage.removeItem(`blog_post_${post.slug}`);

      } else {
        toast({
          title: result.needsUpgrade ? "Upgrade Required" : "Claim Failed",
          description: result.message,
          variant: "destructive"
        });

        // If user needs to upgrade, you could redirect to pricing page
        if (result.needsUpgrade) {
          // Optional: navigate('/pricing') or show upgrade modal
        }
      }
    } catch (error) {
      const claimError = ClaimErrorHandler.analyzeError(error);
      console.error('Failed to claim post:', ClaimErrorHandler.formatForLogging(claimError, {
        postSlug: post.slug,
        postId: post.id,
        userId: user.id
      }));

      const toastConfig = ClaimErrorHandler.createToastConfig(claimError);
      toast(toastConfig);
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 2;
  };

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.meta_description || post?.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Blog post URL has been copied to your clipboard.",
      });
    }
  };

  // Clean and format content for better SEO structure
  const formatContent = (content: string) => {
    if (!content) return '';
    
    // Remove any existing HTML entities and fix common issues
    let cleanContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Ensure proper heading structure for SEO
    cleanContent = cleanContent
      .replace(/<h1[^>]*>/gi, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4 leading-tight">')
      .replace(/<h2[^>]*>/gi, '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3 leading-tight">')
      .replace(/<h3[^>]*>/gi, '<h4 class="text-lg font-medium text-gray-800 mt-5 mb-2 leading-tight">')
      .replace(/<p[^>]*>/gi, '<p class="text-gray-700 leading-relaxed mb-4 text-base">')
      .replace(/<ul[^>]*>/gi, '<ul class="list-disc list-inside mb-4 space-y-2 text-gray-700 ml-4">')
      .replace(/<ol[^>]*>/gi, '<ol class="list-decimal list-inside mb-4 space-y-2 text-gray-700 ml-4">')
      .replace(/<li[^>]*>/gi, '<li class="leading-relaxed">')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">')
      .replace(/<strong[^>]*>/gi, '<strong class="font-semibold text-gray-900">')
      .replace(/<em[^>]*>/gi, '<em class="italic text-gray-800">')
      .replace(/<blockquote[^>]*>/gi, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-6 bg-blue-50 py-2">');
    
    return cleanContent;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Post</h1>
              <p className="text-gray-600 mb-8 text-lg">
                {error}
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 mr-4"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/blog')}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
              </div>
              {slug && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    For debugging, visit:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/diagnostic/blog-post/${slug}`)}
                  >
                    Diagnostic Tool
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
              <p className="text-gray-600 mb-8 text-lg">
                The blog post with slug "<code className="bg-gray-100 px-2 py-1 rounded">{slug}</code>" doesn't exist or may have been removed.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/blog')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mr-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
                {slug && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/diagnostic/blog-post/${slug}`)}
                  >
                    Run Diagnostic
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/blog')}
              className="text-gray-600 hover:text-gray-900 p-0 h-auto font-normal"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </nav>

          {/* Article Header */}
          <article className="bg-white/95 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-gray-100">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/30 p-8 sm:p-12 border-b border-gray-100">
              <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"}></div>

              <div className="relative z-10">
                {/* Category Badge */}
                {post.category && (
                  <div className="mb-6">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2 text-sm font-medium tracking-wide">
                      {post.category}
                    </Badge>
                  </div>
                )}

                {/* Title - SEO H1 */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                  {post.title?.replace(/<\/?h1[^>]*>/g, '') || 'Untitled Post'}
                </h1>

                {/* Meta Description */}
                {post.meta_description && (
                  <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed mb-8 font-light max-w-4xl">
                    {post.meta_description}
                  </p>
                )}

                {/* Author and Date */}
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium">{post.author_name || 'Backlink ∞'}</span>
                  </div>
                  <div className="text-gray-400">•</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-8 sm:p-12">

              {/* Trial Post Status */}
              {post.is_trial_post && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${isExpiringSoon(post.expires_at) ? 'bg-red-100 text-red-700 border-red-300' : 'bg-amber-100 text-amber-700 border-amber-300'} border px-3 py-1`}
                      >
                        {isExpiringSoon(post.expires_at) ? (
                          <>
                            <Timer className="mr-1 h-3 w-3" />
                            Expiring Soon
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Unclaimed Post
                          </>
                        )}
                      </Badge>
                      {post.expires_at && (
                        <span className="text-sm text-amber-700">
                          Expires on {formatDate(post.expires_at)}
                        </span>
                      )}
                    </div>
                    {!post.user_id && (
                      user ? (
                        <Button
                          size="sm"
                          onClick={claimPost}
                          disabled={claiming}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          {claiming ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-3 w-3" />
                              Save to Dashboard
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate('/login')}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          <User className="mr-2 h-3 w-3" />
                          Sign in to Save
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {post.user_id === user?.id && (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <Crown className="mr-1 h-3 w-3" />
                      Your Post
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={sharePost}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  {post.target_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={post.target_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Link
                      </a>
                    </Button>
                  )}
                </div>
              </div>





              {/* Article Content - SEO Optimized */}
              <div className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-gray-800">
                <div
                  className="blog-content leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                />
              </div>

              {/* Tags Section */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Related Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="hover:bg-gray-100 transition-colors cursor-pointer">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    {post.word_count && (
                      <span><strong>Word Count:</strong> {post.word_count} words</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={sharePost}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Article
                    </Button>
                    <Button variant="outline" size="sm">
                      <BookmarkPlus className="h-4 w-4 mr-2" />
                      Bookmark
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Related Posts / Call to Action */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Discover More Quality Content</h3>
                <p className="text-blue-100 mb-6 text-lg">
                  Explore our collection of expert-written blog posts with high-quality backlinks
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => navigate('/blog')}
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Browse All Posts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating Claim Button - Always visible for unclaimed posts */}
      {post.is_trial_post && !post.user_id && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Claim This Post</p>
                <p className="text-xs text-gray-600 truncate">Make it permanently yours!</p>
              </div>
              {user ? (
                <Button
                  onClick={claimPost}
                  disabled={claiming}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg flex-shrink-0"
                >
                  {claiming ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    "Claim"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleClaimRedirect}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg flex-shrink-0"
                >
                  Sign In
                </Button>
              )}
            </div>
            {post.expires_at && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ⏰ Expires: {formatDate(post.expires_at)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
