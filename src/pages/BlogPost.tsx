import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { publishedBlogService, type PublishedBlogPost } from '@/services/publishedBlogService';
import { ClaimTrialPostDialog } from '@/components/ClaimTrialPostDialog';
import { LoginModal } from '@/components/LoginModal';
import { supabase } from '@/integrations/supabase/client';
import { formatBlogTitle, formatBlogContent, getTrendingLabel, calculateWordCount, cleanHTMLContent } from '@/utils/textFormatting';
import { runImmediateContentCleanup } from '@/utils/immediateContentCleanup';
import { globalBlogGenerator } from '@/services/globalBlogGenerator';
import { Footer } from '@/components/Footer';
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
  Sparkles,
  Trash2,
  RefreshCw
} from 'lucide-react';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blogPost, setBlogPost] = useState<PublishedBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

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

        // Try database first
        let post: PublishedBlogPost | null = null;
        try {
          post = await publishedBlogService.getBlogPostBySlug(slug);
        } catch (dbError) {
          console.warn('Database unavailable, trying localStorage:', dbError);
        }

        // If not found in database, try localStorage
        if (!post) {
          try {
            const blogStorageKey = `blog_post_${slug}`;
            console.log('🔍 Looking for blog post with key:', blogStorageKey);

            // Debug: Show all localStorage keys that start with 'blog_post_'
            const allKeys = Object.keys(localStorage).filter(key => key.startsWith('blog_post_'));
            console.log('📋 Available blog post keys:', allKeys);

            const storedBlogData = localStorage.getItem(blogStorageKey);
            console.log('📄 Found stored data:', !!storedBlogData);

            if (storedBlogData) {
              const blogData = JSON.parse(storedBlogData);

              // Check if trial post is expired
              if (blogData.is_trial_post && blogData.expires_at) {
                const isExpired = new Date() > new Date(blogData.expires_at);
                if (isExpired) {
                  // Remove expired trial post
                  localStorage.removeItem(blogStorageKey);
                  setError('This trial blog post has expired');
                  setLoading(false);
                  return;
                }
              }

              // Increment view count
              blogData.view_count = (blogData.view_count || 0) + 1;
              localStorage.setItem(blogStorageKey, JSON.stringify(blogData));

              post = blogData;
            }
          } catch (storageError) {
            console.warn('Failed to load from localStorage:', storageError);
          }
        }

        if (post) {
          // Ensure content is properly cleaned before displaying
          const cleanedPost = {
            ...post,
            content: cleanHTMLContent(post.content || '')
          };
          setBlogPost(cleanedPost);
        } else {
          // Show debug information if in development
          if (allKeys.length > 0) {
            console.error('❌ Blog post not found:', {
              searchedSlug: slug,
              searchedKey: blogStorageKey,
              availableKeys: allKeys
            });

            // Try to find a similar slug
            const similarKey = allKeys.find(key => key.includes(slug.split('-')[0]));
            if (similarKey) {
              console.log('🔍 Found similar key, trying to load:', similarKey);
              const similarData = localStorage.getItem(similarKey);
              if (similarData) {
                try {
                  const similarPost = JSON.parse(similarData);
                  console.log('📄 Similar post found:', similarPost.title);
                  setBlogPost(similarPost);
                  return;
                } catch (e) {
                  console.warn('Failed to parse similar post');
                }
              }
            }

            setError(`Blog post "${slug}" not found. Available posts: ${allKeys.map(k => k.replace('blog_post_', '')).join(', ')}`);
          } else {
            setError('Blog post not found or has expired. No blog posts found in storage.');
          }
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

  const handleDeletePost = async () => {
    if (!blogPost || !blogPost.is_trial_post) {
      toast({
        title: "Cannot delete",
        description: "Only trial posts can be deleted.",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${blogPost.title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      // Remove from localStorage
      const blogStorageKey = `blog_post_${blogPost.slug}`;
      localStorage.removeItem(blogStorageKey);

      // Remove from all posts list
      const allPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const updatedPosts = allPosts.filter((post: any) => post.slug !== blogPost.slug);
      localStorage.setItem('all_blog_posts', JSON.stringify(updatedPosts));

      // Try to remove from database if it exists
      try {
        const { error } = await supabase
          .from('published_blog_posts')
          .delete()
          .eq('slug', blogPost.slug);

        if (error) {
          console.warn('Could not delete from database:', error);
        }
      } catch (dbError) {
        console.warn('Database deletion failed:', dbError);
      }

      toast({
        title: "Post deleted",
        description: "The trial blog post has been successfully deleted.",
      });

      // Navigate back to homepage
      navigate('/');

    } catch (error) {
      console.error('Failed to delete post:', error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerateContent = async () => {
    if (!blogPost || !blogPost.is_trial_post) {
      toast({
        title: "Cannot regenerate",
        description: "Only trial posts can be regenerated.",
        variant: "destructive",
      });
      return;
    }

    const confirmRegenerate = window.confirm(
      `Are you sure you want to regenerate the content for "${blogPost.title}"? This will replace the current content with fresh AI-generated content.`
    );

    if (!confirmRegenerate) return;

    setIsRegenerating(true);

    try {
      // Extract the original keywords/anchor text from the blog post
      const primaryKeyword = blogPost.keywords?.[0] || blogPost.title.split(':')[0].trim();
      const anchorText = blogPost.anchor_text || primaryKeyword;

      toast({
        title: "Regenerating content...",
        description: "Please wait while we generate fresh content with AI.",
      });

      // Generate new content using the global blog generator
      const sessionId = crypto.randomUUID();
      const result = await globalBlogGenerator.generateGlobalBlogPost({
        targetUrl: blogPost.target_url,
        primaryKeyword: primaryKeyword,
        anchorText: anchorText,
        sessionId,
        additionalContext: {
          contentLength: 'medium',
          contentTone: 'professional',
          seoFocus: 'high'
        }
      });

      if (!result.success || !result.data?.blogPost) {
        throw new Error(result.error || "We're currently experiencing a large volume of requests. Please register or sign in to try one of our alternatives.");
      }

      // Update the blog post with new content
      const newBlogPost = result.data.blogPost;
      const updatedBlogPost = {
        ...blogPost,
        content: newBlogPost.content,
        title: newBlogPost.title,
        word_count: newBlogPost.word_count,
        reading_time: newBlogPost.reading_time,
        seo_score: newBlogPost.seo_score,
        updated_at: new Date().toISOString()
      };

      // Update in localStorage
      const blogStorageKey = `blog_post_${blogPost.slug}`;
      localStorage.setItem(blogStorageKey, JSON.stringify(updatedBlogPost));

      // Update in all posts list
      const allPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const updatedPosts = allPosts.map((post: any) =>
        post.slug === blogPost.slug ? updatedBlogPost : post
      );
      localStorage.setItem('all_blog_posts', JSON.stringify(updatedPosts));

      // Try to update in database if it exists
      try {
        const { error } = await supabase
          .from('published_blog_posts')
          .update({
            content: result.finalContent,
            word_count: result.metadata.wordCount,
            reading_time: result.metadata.readingTime,
            seo_score: result.metadata.seoScore,
            updated_at: new Date().toISOString()
          })
          .eq('slug', blogPost.slug);

        if (error) {
          console.warn('Could not update database:', error);
        }
      } catch (dbError) {
        console.warn('Database update failed:', dbError);
      }

      // Update the component state
      setBlogPost(updatedBlogPost);

      toast({
        title: "Content regenerated!",
        description: "The blog post has been updated with fresh AI-generated content.",
      });

    } catch (error) {
      console.error('Failed to regenerate content:', error);
      toast({
        title: "Regeneration failed",
        description: "An error occurred while generating new content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
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

            <div className="flex items-center gap-3">
              {blogPost.is_trial_post && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Trial Post
                </Badge>
              )}

              {!currentUser ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Register
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
              )}
            </div>
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
              {blogPost.category && (
                <Badge variant="secondary">{blogPost.category}</Badge>
              )}
              {(blogPost.tags || blogPost.keywords || []).slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {formatBlogTitle(blogPost.title)}
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
                <span>{blogPost.author_name || 'Backlink ∞'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blogPost.published_at || blogPost.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{blogPost.reading_time || 5} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{blogPost.view_count || 0} views</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{getTrendingLabel()}</span>
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
                  Learn More
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
            dangerouslySetInnerHTML={{ __html: formatBlogContent(blogPost.content) }}
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
                  <div className="flex flex-wrap gap-3">
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
                      Create More
                    </Button>
                    <Button
                      onClick={handleRegenerateContent}
                      disabled={isRegenerating}
                      variant="outline"
                      className="border-blue-400 text-blue-600 hover:bg-blue-50"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Regenerating...' : 'Regenerate Content'}
                    </Button>
                    <Button
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      variant="outline"
                      className="border-red-400 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Info for Context */}
        {(blogPost.contextual_links && blogPost.contextual_links.length > 0) || blogPost.keywords || blogPost.tags ? (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                SEO Information
              </h3>
              <div className="space-y-2">
                {(blogPost.keywords || blogPost.tags) && (
                  <p className="text-sm text-gray-600">
                    <strong>Target Keywords:</strong> {(blogPost.keywords || blogPost.tags || []).join(', ')}
                  </p>
                )}
                {blogPost.content && (
                  <p className="text-sm text-gray-600">
                    <strong>Word Count:</strong> {calculateWordCount(blogPost.content)} words
                  </p>
                )}
                {blogPost.contextual_links && blogPost.contextual_links.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <strong>Contextual Links:</strong> {blogPost.contextual_links.length}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <strong>Target URL:</strong>
                  <a href={blogPost.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    {blogPost.target_url}
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
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

        /* Handle hyphenated bullet points */
        .blog-content p:has-text("- ") {
          margin-left: 1rem;
          text-indent: -1rem;
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={(user) => {
          setShowLoginModal(false);
          setCurrentUser(user);
          toast({
            title: "Welcome! 🎉",
            description: "You're now logged in and can claim backlinks.",
          });
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
