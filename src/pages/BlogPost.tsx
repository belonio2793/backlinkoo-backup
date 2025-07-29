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
import { openAIContentGenerator } from '@/services/openAIContentGenerator';
import { freeBacklinkService } from '@/services/freeBacklinkService';
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
  RefreshCw,
  Zap,
  Gift,
  Home
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

        // Debug: Show all localStorage keys that start with 'blog_post_'
        let allKeys: string[] = [];

        // If not found in database, try localStorage
        if (!post) {
          try {
            const blogStorageKey = `blog_post_${slug}`;
            console.log('🔍 Looking for blog post with key:', blogStorageKey);

            allKeys = Object.keys(localStorage).filter(key => key.startsWith('blog_post_'));
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

      // Generate new content using the OpenAI-only service
      const result = await openAIContentGenerator.generateContent({
        targetUrl: blogPost.target_url,
        primaryKeyword: primaryKeyword,
        anchorText: anchorText,
        wordCount: 1500,
        tone: 'professional',
        contentType: 'how-to'
      });

      // Store the new content for 24-hour management if it's a trial post
      if (blogPost.is_trial_post) {
        freeBacklinkService.storeFreeBacklink(result);
      }
      const updatedBlogPost = {
        ...blogPost,
        content: result.content,
        title: result.title,
        word_count: result.wordCount,
        reading_time: result.readingTime,
        seo_score: result.seoScore,
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
            content: newBlogPost.content,
            title: newBlogPost.title,
            word_count: newBlogPost.word_count,
            reading_time: newBlogPost.reading_time,
            seo_score: newBlogPost.seo_score,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-purple-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Home</span>
            </Button>

            <div className="flex items-center gap-3">
              {blogPost.is_trial_post && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Free Generated Content
                </Badge>
              )}

              {!currentUser ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                  >
                    Register
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Article Content */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Article Header */}
        <header className="mb-12">
          <div className="space-y-8">
            {/* Category and Tags */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {blogPost.category && (
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md px-4 py-2">
                  {blogPost.category}
                </Badge>
              )}
              {(blogPost.tags || blogPost.keywords || []).slice(0, 4).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors px-3 py-1"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Enhanced Title */}
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                {formatBlogTitle(blogPost.title)}
              </h1>

              {/* SEO Score Badge */}
              {blogPost.seo_score && (
                <div className="flex justify-center">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg px-6 py-2 text-base">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    SEO Score: {blogPost.seo_score}/100
                  </Badge>
                </div>
              )}
            </div>

            {/* Enhanced Meta Description */}
            {blogPost.meta_description && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 shadow-sm">
                <p className="text-2xl text-gray-700 leading-relaxed text-center font-medium">
                  {blogPost.meta_description}
                </p>
              </div>
            )}

            {/* Enhanced Article Meta */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-blue-100 rounded-full mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Author</span>
                  <span className="text-sm font-semibold text-gray-900">{blogPost.author_name || 'Backlink ∞'}</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-green-100 rounded-full mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Published</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(blogPost.published_at || blogPost.created_at)}</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-full mb-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Read Time</span>
                  <span className="text-sm font-semibold text-gray-900">{blogPost.reading_time || 5} min</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-orange-100 rounded-full mb-2">
                    <Eye className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Views</span>
                  <span className="text-sm font-semibold text-gray-900">{blogPost.view_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 px-6 py-3"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Post
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 px-6 py-3"
              >
                <a href={blogPost.target_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
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

        {/* Enhanced Article Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12 mb-12">
          <div className="prose prose-xl prose-purple max-w-none
            prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
            prose-h1:text-5xl prose-h1:mb-8 prose-h1:leading-tight prose-h1:text-center
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-purple-800 prose-h2:border-b prose-h2:border-purple-100 prose-h2:pb-4
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-purple-700
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
            prose-a:text-purple-600 prose-a:font-semibold prose-a:no-underline prose-a:bg-purple-50 prose-a:px-3 prose-a:py-2 prose-a:rounded-lg prose-a:transition-all prose-a:shadow-sm hover:prose-a:bg-purple-100 hover:prose-a:text-purple-700 hover:prose-a:shadow-md
            prose-strong:text-purple-800 prose-strong:font-bold
            prose-em:text-purple-600 prose-em:font-medium
            prose-ul:space-y-4 prose-ol:space-y-4
            prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-lg prose-li:pl-2
            prose-blockquote:border-l-4 prose-blockquote:border-purple-200 prose-blockquote:bg-purple-50 prose-blockquote:pl-8 prose-blockquote:py-6 prose-blockquote:italic prose-blockquote:rounded-r-lg
            prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-purple-600 prose-code:font-mono
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-6 prose-pre:shadow-lg
            prose-table:border-collapse prose-table:border prose-table:border-gray-200 prose-table:rounded-lg prose-table:overflow-hidden
            prose-th:bg-purple-50 prose-th:border prose-th:border-gray-200 prose-th:p-4 prose-th:font-semibold prose-th:text-purple-800
            prose-td:border prose-td:border-gray-200 prose-td:p-4
            prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-gray-200"
          >
            <div
              dangerouslySetInnerHTML={{ __html: formatBlogContent(blogPost.content) }}
              className="blog-content"
            />
          </div>
        </div>

        {/* Enhanced Call-to-Action Section */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-2xl p-8 lg:p-12 text-white shadow-2xl mb-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-white/10 rounded-full">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Love This Content Quality?
              </h2>
              <p className="text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
                This professional blog post was generated using our AI-powered content creation tool.
                Create your own high-quality content in minutes!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="p-3 bg-white/10 rounded-full w-fit mx-auto mb-3">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-purple-100">Advanced algorithms create engaging content</p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-white/10 rounded-full w-fit mx-auto mb-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">SEO Optimized</h3>
                <p className="text-sm text-purple-100">Built for search engine visibility</p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-white/10 rounded-full w-fit mx-auto mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Instant Results</h3>
                <p className="text-sm text-purple-100">Get professional content in minutes</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button
                onClick={() => navigate('/free-backlink')}
                size="lg"
                className="bg-white text-purple-700 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold"
              >
                <Gift className="mr-2 h-5 w-5" />
                Generate Free Content
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
              >
                <Home className="mr-2 h-5 w-5" />
                Explore More
              </Button>
            </div>
          </div>
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
