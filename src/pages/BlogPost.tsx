import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { blogService } from '@/services/blogService';
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
  Timer
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!slug) {
      navigate('/blog');
      return;
    }

    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      // First try to get from localStorage
      const localPost = localStorage.getItem(`blog_post_${slug}`);
      if (localPost) {
        const parsedPost = JSON.parse(localPost);
        setPost(parsedPost);
        setLoading(false);
        return;
      }

      // Fallback to service
      const blogPost = await blogService.getBlogPostBySlug(slug!);
      if (!blogPost) {
        toast({
          title: "Post Not Found",
          description: "The requested blog post could not be found.",
          variant: "destructive"
        });
        navigate('/blog');
        return;
      }
      setPost(blogPost);
    } catch (error) {
      console.error('Failed to load blog post:', error);
      toast({
        title: "Error",
        description: "Failed to load blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const claimPost = async () => {
    if (!user || !post) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim this post.",
        variant: "destructive"
      });
      return;
    }

    setClaiming(true);
    try {
      await blogService.updateBlogPost(post.id, {
        user_id: user.id,
        is_trial_post: false,
        expires_at: null
      });

      toast({
        title: "Post Claimed!",
        description: "This blog post has been claimed and added to your dashboard.",
      });

      await loadPost();
    } catch (error) {
      console.error('Failed to claim post:', error);
      toast({
        title: "Claim Failed",
        description: "Failed to claim this post. You may have reached the limit of 3 claimed posts.",
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
              <p className="text-gray-600 mb-8 text-lg">The blog post you're looking for doesn't exist or may have been removed.</p>
              <Button 
                onClick={() => navigate('/blog')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
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
          <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 sm:p-12">
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                {post.reading_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.reading_time} min read</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count || 0} views</span>
                </div>
              </div>

              {/* Title - SEO H1 */}
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title?.replace(/<\/?h1[^>]*>/g, '') || 'Untitled Post'}
              </h1>

              {/* Meta Description */}
              {post.meta_description && (
                <p className="text-xl text-gray-600 leading-relaxed mb-8 font-light">
                  {post.meta_description}
                </p>
              )}

              {/* Status Badges and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                  {post.category && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                      {post.category}
                    </Badge>
                  )}

                  {post.is_trial_post && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${isExpiringSoon(post.expires_at) ? 'border-red-500 text-red-600 bg-red-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}
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
                        {post.expires_at && ` • Expires ${formatDate(post.expires_at)}`}
                      </Badge>
                      {!post.user_id && user && (
                        <Button
                          size="sm"
                          onClick={claimPost}
                          disabled={claiming}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          {claiming ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Crown className="mr-1 h-3 w-3" />
                              Claim
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

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

              {/* Claiming Section - Enhanced for all users */}
              {post.is_trial_post && !post.user_id && (
                <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Star className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 text-lg mb-1">🎯 Claim This Premium Post</h3>
                          <p className="text-blue-700 mb-2">
                            This is an unclaimed trial post. Claim it to make it permanently yours!
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-600 mb-3">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Remove expiration date
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Add to your dashboard
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Full ownership rights
                            </div>
                          </div>
                          {post.expires_at && (
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                              <Clock className="h-3 w-3" />
                              Expires: {formatDate(post.expires_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      {user ? (
                        <Button
                          onClick={claimPost}
                          disabled={claiming}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 shadow-lg"
                        >
                          {claiming ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Crown className="mr-2 h-4 w-4" />
                              Claim Post Now
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => navigate('/auth')}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 shadow-lg"
                          >
                            <Crown className="mr-2 h-4 w-4" />
                            Sign In to Claim
                          </Button>
                          <p className="text-xs text-blue-600 text-center">Free registration required</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Article Content - SEO Optimized */}
              <div className="prose prose-lg prose-gray max-w-none">
                <div 
                  className="blog-content"
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
    </div>
  );
}
