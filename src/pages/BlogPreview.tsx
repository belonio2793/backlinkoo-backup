import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Eye,
  TrendingUp,
  Target,
  Share2,
  Copy,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { liveBlogPublisher } from '@/services/liveBlogPublisher';
import { BlogClaimButton } from '@/components/BlogClaimButton';
import { format } from 'date-fns';

export function BlogPreview() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blogPost, setBlogPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  const loadBlogPost = async (slug: string) => {
    try {
      console.log(`🔍 Trying to load blog post with slug: "${slug}"`);
      console.log(`📝 Available posts in memory:`, Array.from(liveBlogPublisher.inMemoryPosts.keys()));
      console.log(`📊 Total posts stored:`, liveBlogPublisher.inMemoryPosts.size);

      // Log details of all stored posts for debugging
      liveBlogPublisher.inMemoryPosts.forEach((post, key) => {
        console.log(`🗂️ Post key: "${key}", title: "${post.title}", id: "${post.id}"`);
      });

      const post = await liveBlogPublisher.getBlogPost(slug);
      if (post) {
        console.log(`✅ Blog post found:`, {
          title: post.title,
          slug: post.slug,
          contentLength: post.content?.length,
          wordCount: post.wordCount,
          contextualLinks: post.contextualLinks?.length
        });
        setBlogPost(post);
      } else {
        console.log(`❌ Blog post not found for slug: "${slug}"`);

        // Try alternative lookups
        console.log('🔄 Attempting alternative lookups...');
        const alternativePost = liveBlogPublisher.inMemoryPosts.get(slug);
        if (alternativePost) {
          console.log('✅ Found via direct map lookup:', alternativePost.title);
          setBlogPost(alternativePost);
          return;
        }

        toast({
          title: 'Post Not Found',
          description: 'The requested blog post could not be found. It may have expired or been removed.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to load blog post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog post',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: 'URL Copied!',
      description: 'Blog post URL copied to clipboard',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blogPost?.title,
        text: blogPost?.metaDescription,
        url: window.location.href,
      });
    } else {
      handleCopyUrl();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p>Loading blog post...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The requested blog post could not be found or may have expired.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Blog Navigation */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Demo Preview</span>
            <span>•</span>
            <span>This is a preview of your generated blog post</span>
          </div>
        </div>
      </div>

      {/* Blog Post Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <div className="mb-8 space-y-6">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Published {format(new Date(blogPost.createdAt), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{blogPost.viewCount || 0} views</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>SEO Score: {blogPost.seoScore}/100</span>
              </div>
              {blogPost.isTrialPost && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Trial Post</span>
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Keywords:</span>
              {blogPost.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>

            {/* Target URL */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground">Target URL:</span>
                <a
                  href={blogPost.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {blogPost.targetUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Claim Button Section */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Claim This Blog Post
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Make this post permanently yours and remove the expiration timer.
                  </p>
                </div>
                <BlogClaimButton
                  slug={blogPost.slug || slug || ''}
                  postTitle={blogPost.title}
                  onClaimSuccess={(claimedCount) => {
                    // Optionally update UI to reflect the post is now claimed
                    setBlogPost(prev => prev ? { ...prev, isTrialPost: false, user_id: 'claimed' } : prev);
                  }}
                />
              </div>
            </div>

            {/* Contextual Links Summary */}
            {blogPost.contextualLinks && blogPost.contextualLinks.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  🔗 Contextual Backlinks ({blogPost.contextualLinks.length})
                </h3>
                <div className="space-y-2">
                  {blogPost.contextualLinks.map((link: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-700 dark:text-green-300">
                          "{link.anchorText}"
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(link.relevanceScore * 100)}% relevance
                        </Badge>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Context: {link.context?.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Blog Post Content */}
          <article className="prose prose-lg max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
              className="prose-headings:text-foreground prose-p:text-foreground prose-a:text-blue-600 prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground"
            />
          </article>

          {/* Post Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Want More High-Quality Backlinks?</h3>
                <p className="text-muted-foreground">
                  This is just a preview of what our AI can create for you. Get unlimited backlinks, 
                  custom targeting, and premium features with our paid plans.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/')}>
                    Create Another Free Backlink
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    View Pricing Plans
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Information */}
          <div className="mt-8 p-6 bg-muted/30 rounded-lg">
            <h4 className="font-semibold mb-4">SEO Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Meta Description:</span>
                <p className="mt-1">{blogPost.metaDescription}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Word Count:</span>
                <p className="mt-1">{blogPost.wordCount || 'N/A'} words</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reading Time:</span>
                <p className="mt-1">{Math.ceil((blogPost.wordCount || 1200) / 200)} minutes</p>
              </div>
              <div>
                <span className="text-muted-foreground">SEO Score:</span>
                <p className="mt-1">{blogPost.seoScore}/100</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BlogPreview;
