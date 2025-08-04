import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/beautiful-blog.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Clock,
  Crown,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Timer,
  User,
  ShieldCheck,
  XCircle,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageCircle,
  Globe,
  Zap,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { blogService } from '@/services/blogService';
import { ContentFormatter } from '@/utils/contentFormatter';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

type BlogPost = Tables<'blog_posts'>;

export function BeautifulBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [unclaiming, setUnclaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (user) {
      processClaimIntent();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const processClaimIntent = async () => {
    const result = await EnhancedBlogClaimService.processPendingClaimIntent(user!);
    if (result) {
      if (result.success) {
        toast({
          title: "Post Claimed! 🎉",
          description: result.message,
        });
        if (slug) loadBlogPost(slug);
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    }
  };

  const loadBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      const post = await blogService.getBlogPostBySlug(slug);
      setBlogPost(post);
    } catch (error: any) {
      console.error('Failed to load blog post:', error);
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPost = async () => {
    if (!user) {
      EnhancedBlogClaimService.handleClaimIntent(slug!, cleanTitle(blogPost?.title || ''));
      toast({
        title: "Login Required",
        description: "Please log in to claim this post. We'll bring you back to complete the claim.",
      });
      navigate('/login');
      return;
    }

    setClaiming(true);
    try {
      const result = await EnhancedBlogClaimService.claimPost(slug!, user);
      
      if (result.success) {
        setBlogPost(result.post!);
        toast({
          title: "Success! 🎉",
          description: result.message,
        });
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaimPost = async () => {
    setUnclaiming(true);
    try {
      const result = await EnhancedBlogClaimService.unclaimPost(slug!, user);

      if (result.success) {
        setBlogPost(result.post!);
        toast({
          title: "Post Unclaimed",
          description: result.message,
        });
      } else {
        toast({
          title: "Unclaim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while unclaiming the post",
        variant: "destructive"
      });
    } finally {
      setUnclaiming(false);
      setShowUnclaimDialog(false);
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      console.log('🗑️ Attempting to delete post:', {
        slug,
        userId: user?.id,
        blogPostUserId: blogPost?.user_id,
        isClaimed: blogPost?.claimed,
        isOwnPost: blogPost?.user_id === user?.id
      });

      // Try direct deletion via Supabase
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('slug', slug!);

      if (error) {
        console.error('❌ Direct delete failed:', error);

        // If RLS blocks the delete, try using a serverless function as fallback
        try {
          const response = await fetch('/.netlify/functions/delete-post', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.access_token || ''}`
            },
            body: JSON.stringify({ slug })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          const result = await response.json();
          if (result.success) {
            toast({
              title: "Post Deleted",
              description: "The blog post has been successfully deleted.",
            });
            navigate('/blog');
          } else {
            throw new Error(result.message || 'Delete failed');
          }
        } catch (apiError: any) {
          console.error('❌ API delete also failed:', apiError);
          toast({
            title: "Delete Failed",
            description: `Failed to delete post. ${error.message}. You may need admin permissions or the post may be protected.`,
            variant: "destructive"
          });
        }
      } else {
        console.log('✅ Direct delete succeeded');
        toast({
          title: "Post Deleted",
          description: "The blog post has been successfully deleted.",
        });
        navigate('/blog');
      }
    } catch (error: any) {
      console.error('❌ Unexpected delete error:', error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "URL Copied!",
        description: "Blog post URL copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogPost?.title,
          text: blogPost?.meta_description || blogPost?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const cleanTitle = (title: string) => {
    if (!title) return '';
    // Remove all markdown artifacts from title including ** wrappers
    return title
      .replace(/^\*\*H1\*\*:\s*/i, '')
      .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
      .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
      .replace(/\*\*/g, '') // Remove any remaining ** symbols
      .replace(/\*/g, '') // Remove any remaining * symbols
      .replace(/^#{1,6}\s+/, '')
      .trim();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const canClaimPost = blogPost ? EnhancedBlogClaimService.canClaimPost(blogPost) : false;
  const unclaimPermissions = blogPost ? EnhancedBlogClaimService.canUnclaimPost(blogPost, user) : { canUnclaim: false };
  const deletePermissions = blogPost ? EnhancedBlogClaimService.canDeletePost(blogPost, user) : { canDelete: false };

  // Determine if user can delete this post
  const isOwnPost = blogPost?.user_id === user?.id;
  const isUnclaimedPost = blogPost && (!blogPost.claimed || blogPost.user_id === null);
  const canDelete = isOwnPost || isUnclaimedPost || deletePermissions.canDelete;
  const isExpiringSoon = blogPost?.expires_at && new Date(blogPost.expires_at).getTime() - Date.now() < 2 * 60 * 60 * 1000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading beautiful content...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Blog Post Not Found
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                The requested blog post could not be found or may have expired.
              </p>
              <Button 
                onClick={() => navigate('/blog')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Blog
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="beautiful-blog-wrapper min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Reading Progress Bar */}
      <div
        className="reading-progress-bar fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-50 transition-all duration-300 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
      
      <Header />

      {/* Floating Action Bar */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full bg-transparent border-0 shadow-none hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-gray-400 hover:text-blue-600 hover:scale-110 group backdrop-blur-none"
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-5 w-5 text-blue-600 drop-shadow-sm" />
          ) : (
            <Bookmark className="h-5 w-5 drop-shadow-sm" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full bg-transparent border-0 shadow-none hover:bg-white/10 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 text-gray-400 hover:text-red-600 hover:scale-110 group backdrop-blur-none"
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={`h-5 w-5 drop-shadow-sm ${isLiked ? 'text-red-500 fill-current' : ''}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full bg-transparent border-0 shadow-none hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-gray-400 hover:text-purple-600 hover:scale-110 group backdrop-blur-none"
          onClick={sharePost}
        >
          <Share2 className="h-5 w-5 drop-shadow-sm" />
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="beautiful-nav sticky top-16 z-30 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 hover:bg-transparent hover:text-blue-600 px-4 py-2 rounded-full transition-all duration-300 border border-transparent hover:border-blue-200/50 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={sharePost} className="rounded-full bg-transparent border-gray-200 hover:bg-transparent hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="rounded-full bg-transparent border-gray-200 hover:bg-transparent hover:border-purple-300 hover:text-purple-600 hover:shadow-md transition-all duration-300">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="beautiful-blog-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="container mx-auto px-6 py-16">
          <article className="max-w-4xl mx-auto">
            
            {/* Article Header */}
            <header className="text-center mb-16 relative">
              
              {/* Status Badges */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {blogPost.claimed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-green-700 shadow-sm cursor-help">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">
                          {isOwnPost ? 'You own this post' : 'This post has been claimed'}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isOwnPost
                        ? 'You have claimed this post. You can edit, delete, or unclaim it at any time.'
                        : 'This post has been claimed by another user and is now protected from automatic deletion.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 cursor-help">
                        <Timer className="mr-2 h-4 w-4" />
                        Available to Claim
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This post is unclaimed and available for anyone to claim. Claimed posts are protected from deletion and can be managed by their owner.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {blogPost.claimed && isOwnPost && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 rounded-full">
                    <User className="mr-2 h-4 w-4" />
                    Your Post
                  </Badge>
                )}
                
                {!blogPost.claimed && blogPost.expires_at && isExpiringSoon && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse rounded-full shadow-lg">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Expiring Soon
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="beautiful-blog-title text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
                {cleanTitle(blogPost.title)}
              </h1>

              {/* Meta Description */}
              {blogPost.meta_description && (
                <p className="beautiful-blog-subtitle text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
                  {blogPost.meta_description}
                </p>
              )}

              {/* Article Meta */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 mb-8">
                <div className="beautiful-meta flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {format(new Date(blogPost.created_at), 'MMMM dd, yyyy')}
                  </span>
                </div>
                <div className="beautiful-meta flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{blogPost.reading_time} min read</span>
                </div>
                <div className="beautiful-meta flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{blogPost.view_count} views</span>
                </div>
                <div className="beautiful-meta flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">SEO Score: {blogPost.seo_score}/100</span>
                </div>
              </div>


            </header>



            {/* Article Content - Moved higher */}
            <div className="prose prose-lg max-w-none -mt-8">
              <div className="beautiful-card pt-4 px-8 pb-8 md:pt-6 md:px-12 md:pb-12">
                <div
                  className="beautiful-blog-content beautiful-prose prose prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic"
                  dangerouslySetInnerHTML={{
                    __html: ContentFormatter.addSectionSpacing(
                      ContentFormatter.sanitizeContent(
                        ContentFormatter.formatBlogContent(blogPost.content || '', blogPost.title)
                      )
                    )
                  }}
                />
              </div>
            </div>

            {/* Keywords Section */}
            {blogPost.keywords && blogPost.keywords.length > 0 && (
              <div className="mt-12 p-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Keywords & Topics
                </h3>
                <div className="flex flex-wrap gap-3">
                  {blogPost.keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="px-4 py-2 bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-300 rounded-full"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Section */}
            <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Enjoyed this article?
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Share it with your network and help others discover great content!
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={sharePost} variant="outline" className="bg-transparent border-blue-200 text-blue-600 hover:bg-transparent hover:border-blue-400 hover:text-blue-700 hover:shadow-lg hover:scale-105 rounded-full px-6 transition-all duration-300">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Article
                  </Button>
                  <Button variant="outline" onClick={copyToClipboard} className="bg-transparent border-gray-200 hover:bg-transparent hover:border-purple-300 hover:text-purple-600 hover:shadow-lg hover:scale-105 rounded-full px-6 transition-all duration-300">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>

            {/* Post Information Section */}
            <div className="mt-12 space-y-6">
              {/* Expiration Warning */}
              {!blogPost.claimed && blogPost.expires_at && (
                <div className="beautiful-warning max-w-2xl mx-auto p-6 shadow-sm">
                  <div className="flex items-center justify-center gap-3 text-amber-800 mb-2">
                    <Timer className="h-5 w-5" />
                    <span className="text-lg font-semibold">
                      ⏰ {getTimeRemaining(blogPost.expires_at)}
                    </span>
                  </div>
                  <p className="text-amber-700 text-center">
                    This post will be automatically deleted when the timer expires. Claim it to save permanently!
                  </p>
                </div>
              )}

              {/* Target URL */}
              <div className="beautiful-info max-w-2xl mx-auto flex items-center gap-4 p-6 shadow-sm">
                <div className="flex items-center gap-2 flex-1">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-700 font-semibold">Target URL:</span>
                </div>
                <a
                  href={blogPost.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 group"
                >
                  <Globe className="h-4 w-4" />
                  <span className="truncate max-w-xs">{blogPost.target_url}</span>
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </div>

              {/* Action Buttons - Moved here below Target URL */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-2xl mx-auto">
                {canClaimPost && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleClaimPost}
                        disabled={claiming}
                        size="lg"
                        variant="outline"
                        className="beautiful-button bg-transparent border-blue-300 text-blue-600 hover:bg-transparent hover:border-blue-500 hover:text-blue-700 hover:shadow-2xl hover:scale-105 px-8 py-4 text-lg rounded-full shadow-lg transition-all duration-300"
                      >
                        {claiming ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Crown className="mr-3 h-5 w-5" />
                            {user ? 'Claim This Post' : 'Login to Claim'}
                            <Zap className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Claim this post to become its owner. Once claimed, you can edit, manage, and prevent others from deleting it.</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {unclaimPermissions.canUnclaim && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowUnclaimDialog(true)}
                        variant="outline"
                        size="lg"
                        className="bg-transparent border-orange-300 text-orange-700 hover:bg-transparent hover:border-orange-500 hover:text-orange-800 hover:shadow-2xl hover:scale-105 px-8 py-4 text-lg rounded-full transition-all duration-300"
                      >
                        <XCircle className="mr-3 h-5 w-5" />
                        Unclaim Post
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Release ownership of this post. It will become available for others to claim for 24 hours before being automatically deleted.</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {canDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        size="lg"
                        className="bg-transparent border-red-300 text-red-600 hover:bg-transparent hover:border-red-500 hover:text-red-700 hover:shadow-2xl hover:scale-105 px-8 py-4 text-lg rounded-full transition-all duration-300"
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Delete Post
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Permanently delete this post. {isOwnPost ? 'As the owner, you can delete this post at any time.' : 'Unclaimed posts can be deleted by anyone.'} This action cannot be undone.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-6 w-6 text-red-600" />
              Delete Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-lg">Are you sure you want to delete "{blogPost.title}"? This action cannot be undone.</p>
                {blogPost.claimed && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="font-semibold">Important Notice</span>
                    </div>
                    <p className="text-sm">This is a claimed post. Deletion should be carefully considered.</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unclaim Confirmation Dialog */}
      <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="h-6 w-6 text-orange-600" />
              Unclaim Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-lg">Are you sure you want to unclaim "{blogPost.title}"?</p>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Important:</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• This post will return to the claimable pool for 24 hours</li>
                    <li>• Other users will be able to claim it during this time</li>
                    <li>• If not reclaimed, it will be automatically deleted</li>
                    <li>• You can reclaim it yourself if it's still available</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-full">Keep Claimed</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnclaimPost}
              disabled={unclaiming}
              className="bg-orange-600 hover:bg-orange-700 rounded-full"
            >
              {unclaiming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Unclaiming...
                </>
              ) : (
                'Unclaim Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      </div>
    </TooltipProvider>
  );
}
