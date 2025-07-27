import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { publishedBlogService, type PublishedBlogPost } from '@/services/publishedBlogService';
import { ClaimTrialPostDialog } from '@/components/ClaimTrialPostDialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ArrowLeft, 
  ExternalLink, 
  Share2,
  Tag,
  User,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blogPost, setBlogPost] = useState<PublishedBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadBlogPost = async () => {
      if (!slug) {
        setError('No blog post specified');
        setLoading(false);
        return;
      }

      try {
        // Check user authentication
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const post = await publishedBlogService.getBlogPostBySlug(slug);
        if (post) {
          setBlogPost(post);
        } else {
          setError('Blog post not found or has expired');
        }
      } catch (err) {
        console.error('Failed to load blog post:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [slug]);

  const handleShare = async () => {
    if (blogPost) {
      try {
        await navigator.share({
          title: blogPost.title,
          text: blogPost.meta_description || blogPost.excerpt,
          url: window.location.href
        });
      } catch (err) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied!',
          description: 'Blog post URL copied to clipboard'
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-xl text-gray-600">{error || 'Blog post not found'}</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            
            {blogPost.is_trial_post && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <Sparkles className="mr-1 h-3 w-3" />
                Trial Post
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="mb-8">
          <div className="space-y-4">
            {/* Category and Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{blogPost.category}</Badge>
              {blogPost.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {blogPost.title}
            </h1>

            {/* Meta Description */}
            {blogPost.meta_description && (
              <p className="text-xl text-gray-600 leading-relaxed">
                {blogPost.meta_description}
              </p>
            )}

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{blogPost.author_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blogPost.published_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{blogPost.reading_time} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{blogPost.view_count} views</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>SEO Score: {blogPost.seo_score}/100</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="sm"
              >
                <a href={blogPost.target_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Target Site
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {blogPost.featured_image && (
          <div className="mb-8">
            <img 
              src={blogPost.featured_image} 
              alt={blogPost.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg prose-gray max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
            className="blog-content"
          />
        </div>

        {/* Trial Post Notice with Claim Option */}
        {blogPost.is_trial_post && blogPost.expires_at && (
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-2">
                    Trial Blog Post - Will Expire Soon!
                  </h3>
                  <p className="text-sm text-amber-700 mb-4">
                    This demo blog post will automatically delete on {formatDate(blogPost.expires_at)} unless claimed.
                    Claim it now to make this backlink permanent!
                  </p>
                  <div className="flex gap-3">
                    {!currentUser ? (
                      <ClaimTrialPostDialog
                        trialPostSlug={blogPost.slug}
                        trialPostTitle={blogPost.title}
                        expiresAt={blogPost.expires_at}
                        targetUrl={blogPost.target_url}
                        onClaimed={() => {
                          // Refresh the page to show updated status
                          window.location.reload();
                        }}
                      >
                        <Button className="bg-red-600 hover:bg-red-700 text-white animate-pulse">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Claim This Post Forever
                        </Button>
                      </ClaimTrialPostDialog>
                    ) : (
                      <Button
                        onClick={() => navigate('/dashboard')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        View in Dashboard
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="border-amber-600 text-amber-700 hover:bg-amber-100"
                    >
                      Create More Backlinks
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Info for Context */}
        {blogPost.contextual_links.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                SEO Information
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Target Keywords:</strong> {blogPost.keywords.join(', ')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Word Count:</strong> {blogPost.word_count} words
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Contextual Links:</strong> {blogPost.contextual_links.length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </article>

      {/* Custom styles for blog content */}
      <style>{`
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .blog-content h1 {
          font-size: 2.25rem;
        }
        
        .blog-content h2 {
          font-size: 1.875rem;
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
        }
        
        .blog-content p {
          margin-bottom: 1.5rem;
          line-height: 1.75;
        }
        
        .blog-content ul,
        .blog-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        
        .blog-content a {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .blog-content a:hover {
          color: #1d4ed8;
        }
        
        .blog-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .blog-content code {
          background-color: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        .blog-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
      `}</style>
    </div>
  );
}
