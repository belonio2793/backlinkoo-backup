import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { blogService, type BlogPost as BlogPostType } from '@/services/blogService';
import { ClaimTrialPostDialog } from '@/components/ClaimTrialPostDialog';
import { LoginModal } from '@/components/LoginModal';
import { BlogClaimExplanationModal } from '@/components/BlogClaimExplanationModal';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatBlogTitle, formatBlogContent, getTrendingLabel, calculateWordCount, cleanHTMLContent } from '@/utils/textFormatting';
import { EnhancedBlogContent } from '@/components/EnhancedBlogContent';
import { PricingModal } from '@/components/PricingModal';
import { getDisplayEmailForPost } from '@/utils/emailMasking';
import { runImmediateContentCleanup } from '@/utils/immediateContentCleanup';
import { openAIOnlyContentGenerator } from '@/services/openAIOnlyContentGenerator';

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
  Home,
  CheckCircle2,
  BookOpen,
  Globe,
  Heart,
  Bookmark,
  MessageCircle,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Star
} from 'lucide-react';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blogPost, setBlogPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showClaimExplanation, setShowClaimExplanation] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const loadBlogPost = async () => {
      if (!slug) {
        setError('No blog post specified');
        setLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Blog post loading timed out');
        setError('Blog post could not be loaded');
        setLoading(false);
      }, 5000);

      try {
        // Check user authentication
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Try database first
        let post: BlogPostType | null = null;
        try {
          post = await blogService.getBlogPostBySlug(slug);
        } catch (dbError) {
          console.warn('Database unavailable, trying localStorage:', dbError);
        }

        // If not found in database, try localStorage
        if (!post) {
          try {
            const blogStorageKey = `blog_post_${slug}`;
            console.log('�� Looking for blog post with key:', blogStorageKey);

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
          // Enhanced debugging for missing blog posts
          const allKeys = Object.keys(localStorage).filter(key => key.startsWith('blog_post_'));
          console.error('❌ Blog post not found:', {
            searchedSlug: slug,
            searchedKey: `blog_post_${slug}`,
            availableKeys: allKeys,
            allBlogPostsMeta: JSON.parse(localStorage.getItem('all_blog_posts') || '[]')
          });

          // Show debug information if in development
          if (allKeys.length > 0) {
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
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [slug]);

  const handleShare = async (platform?: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    if (!blogPost) return;

    const url = window.location.href;
    const title = blogPost.title;
    const text = blogPost.meta_description || blogPost.excerpt || '';

    try {
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'copy':
        default:
          await navigator.clipboard.writeText(url);
          toast({
            title: 'Link Copied!',
            description: 'Blog post URL copied to clipboard'
          });
          break;
      }
    } catch (err) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied!',
        description: 'Blog post URL copied to clipboard'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleClaimPost = async () => {
    if (!blogPost || isClaiming) return;

    setIsClaiming(true);

    // Track claim operation for dashboard router
    localStorage.setItem('recent_claim_operation', Date.now().toString());

    try {
      // Get user authentication
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setShowLoginModal(true);
        return;
      }

      // Check if user can claim (using same logic as ClaimTrialPostDialog)
      const { data: userPosts } = await supabase
        .from('published_blog_posts')
        .select('id, is_trial_post, user_id')
        .eq('user_id', user.id)
        .eq('is_trial_post', false);

      const hasExistingClaim = (userPosts?.length || 0) > 0;
      const localClaims = localStorage.getItem(`user_claimed_posts_${user.id}`);
      const hasLocalClaims = localClaims ? JSON.parse(localClaims).length > 0 : false;

      if (hasExistingClaim || hasLocalClaims) {
        toast({
          title: "Claim Limit Reached",
          description: "You already have a free blog post saved. Each account can only claim one free trial post.",
          variant: "destructive"
        });
        return;
      }

      // Create request body once
      const requestBody = {
        slug: blogPost.slug,
        userId: user.id,
        userEmail: user.email
      };

      // Use BlogClaimService directly since Netlify functions are not available
      const { BlogClaimService } = await import('@/services/blogClaimService');
      const claimResult = await BlogClaimService.claimPost(blogPost.id, user);

      if (!claimResult.success) {
        throw new Error(claimResult.message || claimResult.error || 'Failed to claim blog post');
      }

      // Update localStorage to mark as claimed
      const blogStorageKey = `blog_post_${blogPost.slug}`;
      const storedBlogData = localStorage.getItem(blogStorageKey);
      if (storedBlogData) {
        const updatedPost = JSON.parse(storedBlogData);
        updatedPost.is_trial_post = false;
        updatedPost.claimed_by_user_id = user.id;
        updatedPost.claimed_by_email = user.email;
        updatedPost.claimed_at = new Date().toISOString();
        localStorage.setItem(blogStorageKey, JSON.stringify(updatedPost));
        setBlogPost(updatedPost);
      }

      // Track claimed post
      const userClaimedPosts = localStorage.getItem(`user_claimed_posts_${user.id}`);
      const claimedPosts = userClaimedPosts ? JSON.parse(userClaimedPosts) : [];
      claimedPosts.push({
        slug: blogPost.slug,
        title: blogPost.title,
        claimedAt: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email
      });
      localStorage.setItem(`user_claimed_posts_${user.id}`, JSON.stringify(claimedPosts));

      toast({
        title: "🎉 Post Claimed Successfully!",
        description: "Your backlink is now permanent and saved to your dashboard!",
      });

      setShowClaimExplanation(false);

    } catch (error) {
      console.error('Failed to claim post:', error);
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim the post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClaiming(false);
      // Clean up claim operation tracking after 5 seconds
      setTimeout(() => {
        localStorage.removeItem('recent_claim_operation');
      }, 5000);
    }
  };

  const handleShowClaimExplanation = () => {
    setShowClaimExplanation(true);
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
      const result = await openAIOnlyContentGenerator.generateContent({
        targetUrl: blogPost.target_url,
        primaryKeyword: primaryKeyword,
        anchorText: anchorText,
        wordCount: 1500,
        tone: 'professional',
        contentType: 'how-to'
      });

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

      // Update the component state
      setBlogPost(updatedBlogPost);

      toast({
        title: "Content regenerated!",
        description: "The blog post has been updated with fresh AI-generated content.",
      });

    } catch (error) {
      console.error('Failed to regenerate content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      let title = "Regeneration failed";
      let description = "An error occurred while generating new content. Please try again.";

      if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
        title = "OpenAI API Key Required";
        description = "A valid OpenAI API key is required to regenerate content. Please configure your API key in the environment settings.";
      } else if (errorMessage.includes('OpenAI API key is not configured')) {
        title = "OpenAI API Key Missing";
        description = "OpenAI API key is not configured. Please set the VITE_OPENAI_API_KEY environment variable.";
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        title = "Rate Limit Exceeded";
        description = "OpenAI rate limit reached. Please wait a few minutes before trying again.";
      } else if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        title = "OpenAI Quota Exceeded";
        description = "Your OpenAI account has exceeded its usage quota. Please check your billing settings.";
      }

      toast({
        title,
        description,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? 'Removed from favorites' : 'Added to favorites',
      description: isLiked ? 'This post has been removed from your favorites' : 'This post has been added to your favorites'
    });
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? 'Bookmark removed' : 'Bookmark saved',
      description: isBookmarked ? 'This post has been removed from your reading list' : 'This post has been saved to your reading list'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mx-auto"></div>
            <BookOpen className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-medium text-gray-900">Loading Article</p>
            <p className="text-gray-600">Preparing your AI-generated content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-red-400" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">404</h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">{error || 'Blog post not found'}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/blog')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Blog
              </Button>
              <Button onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to Blog</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="font-medium">Home</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {/* Post Status Badge */}
              {(() => {
                const isClaimedPost = !blogPost.is_trial_post ||
                                    (blogPost as any).user_id ||
                                    (blogPost as any).claimed_by_user_id;

                const isTrialPost = blogPost.is_trial_post && !isClaimedPost;

                if (isClaimedPost) {
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md cursor-help">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Claimed & Permanent
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            This post has been claimed by a user and is now permanent! It will never auto-delete and provides a lasting backlink.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                } else if (isTrialPost) {
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md cursor-help animate-pulse">
                            <Clock className="mr-1 h-3 w-3" />
                            Trial Post
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            This trial post will auto-delete in 24 hours. Claim it to make it permanent!
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                return null;
              })()}

              {/* SEO Score Badge */}
              {blogPost.seo_score && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  SEO {blogPost.seo_score}/100
                </Badge>
              )}

              {/* User Actions */}
              {!currentUser ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                  >
                    Register
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-12 space-y-8">
          {/* Category and Tags */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {blogPost.category && (
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg px-6 py-2 text-base">
                <Globe className="mr-2 h-4 w-4" />
                {blogPost.category}
              </Badge>
            )}
            {(blogPost.tags || blogPost.keywords || []).slice(0, 4).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors px-4 py-2"
              >
                <Tag className="mr-1 h-3 w-3" />
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight">
              {formatBlogTitle(blogPost.title)}
            </h1>

            {/* Meta Description */}
            {blogPost.meta_description && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed text-center font-medium">
                  {blogPost.meta_description}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Article Meta */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 rounded-full mb-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Author</span>
                <span className="text-sm font-bold text-gray-900">{blogPost.author_name || 'Backlink ∞'}</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-green-100 rounded-full mb-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Published</span>
                <span className="text-sm font-bold text-gray-900">{formatDate(blogPost.published_at || blogPost.created_at)}</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-purple-100 rounded-full mb-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Read Time</span>
                <span className="text-sm font-bold text-gray-900">{blogPost.reading_time || 5} min</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-orange-100 rounded-full mb-3">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Views</span>
                <span className="text-sm font-bold text-gray-900">{blogPost.view_count || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-gray-100">
              <Button
                onClick={() => handleShare('copy')}
                variant="outline"
                size="lg"
                className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 px-6 py-3"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Post
              </Button>
              
              <Button
                onClick={toggleLike}
                variant="outline"
                size="lg"
                className={`border-2 transition-all duration-200 px-6 py-3 ${
                  isLiked 
                    ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className={`mr-2 h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>

              <Button
                onClick={toggleBookmark}
                variant="outline"
                size="lg"
                className={`border-2 transition-all duration-200 px-6 py-3 ${
                  isBookmarked 
                    ? 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={`mr-2 h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 px-6 py-3"
              >
                <a href={blogPost.target_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Visit Site
                </a>
              </Button>
            </div>
          </div>

          {/* Social Share Options */}
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleShare('copy')}
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Enhanced Article Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12 mb-12">
          <EnhancedBlogContent
            content={blogPost.content}
            keyword={blogPost.keyword}
            anchorText={blogPost.anchor_text}
            targetUrl={blogPost.target_url}
          />
        </div>

        {/* Claimed Post Information */}
        {(blogPost.claimed_by_user_id || (!blogPost.is_trial_post && (blogPost as any).user_id)) && (
          <Card className="mt-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      ✅ Claimed & Permanent Blog Post
                    </h3>
                    <p className="text-green-700 leading-relaxed">
                      This high-quality AI-generated content has been permanently claimed and will never expire.
                      <strong className="block mt-2">This provides a lasting, valuable backlink!</strong>
                      {blogPost.claimed_at && (
                        <span className="block mt-1 text-sm">
                          Claimed on {formatDate(blogPost.claimed_at)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 shadow-lg"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Get More Backlinks
                    </Button>

                    {currentUser && (
                      <Button
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        View Dashboard
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Post Management */}
        {blogPost.is_trial_post && blogPost.expires_at && !blogPost.claimed_by_user_id && (
          <Card className="mt-8 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Sparkles className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-amber-800 mb-2">
                      🎯 Trial Blog Post - Claim Now!
                    </h3>
                    <p className="text-amber-700 leading-relaxed">
                      This AI-generated content will automatically delete on {formatDate(blogPost.expires_at)} unless claimed.
                      <strong className="block mt-2">Make this backlink permanent by claiming it now!</strong>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleShowClaimExplanation}
                      disabled={isClaiming}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold px-6 py-3 animate-pulse shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      {isClaiming ? 'Processing...' : 'Claim This Post Forever'}
                    </Button>

                    {currentUser && (
                      <Button
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        View in Dashboard
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Buy Backlinks
                    </Button>
                    
                    <Button
                      onClick={handleRegenerateContent}
                      disabled={isRegenerating}
                      variant="outline"
                      className="border-blue-400 text-blue-600 hover:bg-blue-50 px-6 py-3"
                    >
                      <RefreshCw className={`mr-2 h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Regenerating...' : 'Regenerate Content'}
                    </Button>
                    
                    <Button
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      variant="outline"
                      className="border-red-400 text-red-600 hover:bg-red-50 px-6 py-3"
                    >
                      <Trash2 className="mr-2 h-5 w-5" />
                      {isDeleting ? 'Deleting...' : 'Delete Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced SEO Information */}
        {(blogPost.keywords || blogPost.tags) && (
          <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                SEO Analytics & Performance
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Target Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {(blogPost.keywords || blogPost.tags || []).map((keyword, index) => (
                      <Badge key={index} className="bg-purple-100 text-purple-800 border-purple-200">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Word Count:</span>
                    <span className="text-sm text-gray-900 font-bold">{calculateWordCount(blogPost.content)} words</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Reading Time:</span>
                    <span className="text-sm text-gray-900 font-bold">{blogPost.reading_time || 5} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">SEO Score:</span>
                    <Badge className={`${
                      (blogPost.seo_score || 75) >= 90 ? 'bg-green-500' :
                      (blogPost.seo_score || 75) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white`}>
                      {blogPost.seo_score || 75}/100
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Readability:</span>
                    <Badge className={`${
                      (blogPost.readability_score || 80) >= 80 ? 'bg-green-500' :
                      (blogPost.readability_score || 80) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white`}>
                      {blogPost.readability_score || 80}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Generated:</span>
                    <span className="text-sm text-gray-900 font-bold">Enhanced AI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Optimized:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      ✓ SEO Ready
                    </Badge>
                  </div>
                </div>
              </div>

              {/* SEO Features */}
              <div className="mt-6 pt-4 border-t border-purple-200">
                <p className="text-sm font-medium text-gray-700 mb-3">SEO Features Applied:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Structured Headlines</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Keyword Optimization</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Meta Description</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Content Spacing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Natural Backlinks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Featured Snippets</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Readability Score</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Structured Data</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Target URL:</p>
                <a
                  href={blogPost.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all font-medium"
                >
                  {blogPost.target_url}
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </article>

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

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onAuthSuccess={(user) => {
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in. Continue with your purchase.",
          });
        }}
      />

      {/* Blog Claim Explanation Modal */}
      <BlogClaimExplanationModal
        isOpen={showClaimExplanation}
        onClose={() => setShowClaimExplanation(false)}
        onClaim={handleClaimPost}
        onLogin={() => {
          setShowClaimExplanation(false);
          setShowLoginModal(true);
        }}
        isAuthenticated={!!currentUser}
        isClaiming={isClaiming}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setShowLoginModal(false);
          toast({
            title: "Welcome!",
            description: "You're now signed in. You can claim this post!",
          });
          // Automatically show claim explanation after login
          setTimeout(() => setShowClaimExplanation(true), 500);
        }}
        defaultTab="signup"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
