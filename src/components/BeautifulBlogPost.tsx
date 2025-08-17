import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

// Icons
import {
  ArrowLeft, Share2, Copy, Calendar, Clock, Eye, 
  Crown, Trash2, CheckCircle2, Timer, AlertTriangle,
  ExternalLink, Sparkles, Target, XCircle, Hash,
  BookOpen, User, RefreshCw
} from 'lucide-react';

// Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOScoreDisplay } from '@/components/SEOScoreDisplay';

// Services
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { usePremiumSEOScore } from '@/hooks/usePremiumSEOScore';

type BlogPost = Tables<'blog_posts'>;

// Advanced Content Processor for perfect readability and SEO
const ContentProcessor = ({ content, title }: { content: string; title: string }) => {
  const processedContent = useMemo(() => {
    if (!content?.trim()) return '<p class="text-gray-500 text-center py-8">No content available.</p>';

    let cleanContent = content
      // Remove title duplication
      .replace(new RegExp(`^\\s*(?:#{1,6}\\s*)?${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\n|$)`, 'gim'), '')
      // Clean up formatting
      .replace(/\*\*\s*\n\s*/g, '**')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();

    // Convert markdown to HTML with proper structure
    return cleanContent
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4 tracking-tight">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-3xl font-bold text-gray-900 mt-10 mb-6 tracking-tight">$1</h2>')
      .replace(/^# (.*$)/gm, '<h2 class="text-3xl font-bold text-gray-900 mt-10 mb-6 tracking-tight">$1</h2>')
      
      // Bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/__([^_]+)__/g, '<strong class="font-bold text-gray-900">$1</strong>')
      
      // Italic text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(/_([^_]+)_/g, '<em class="italic text-gray-700">$1</em>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Ordered lists
      .replace(/^\d+\.\s+(.+)$/gm, '<li class="mb-2 text-gray-700">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>)/s, '<ol class="list-decimal list-inside space-y-2 my-6 ml-6">$1</ol>')
      
      // Unordered lists
      .replace(/^[-*+]\s+(.+)$/gm, '<li class="mb-2 text-gray-700">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-2 my-6 ml-6">$1</ul>')
      
      // Paragraphs
      .split('\n\n')
      .map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<ol') || paragraph.startsWith('<li')) {
          return paragraph;
        }
        return `<p class="text-lg leading-8 text-gray-700 mb-6 text-justify">${paragraph}</p>`;
      })
      .join('\n');
  }, [content, title]);

  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

// Reading Progress Indicator
const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setProgress(Math.min(Math.max(scrolled, 0), 100));
    };

    const throttledUpdate = () => {
      requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', throttledUpdate, { passive: true });
    return () => window.removeEventListener('scroll', throttledUpdate);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-50 transition-all duration-150"
      style={{ width: `${progress}%` }}
    />
  );
};

// Status Badge Component
const StatusBadge = ({ 
  blogPost, 
  user, 
  onClaim, 
  onUnclaim, 
  onDelete,
  claiming = false 
}: {
  blogPost: BlogPost;
  user: any;
  onClaim: () => void;
  onUnclaim: () => void;
  onDelete: () => void;
  claiming?: boolean;
}) => {
  const isOwnPost = blogPost.user_id === user?.id;
  const canClaim = EnhancedBlogClaimService.canClaimPost(blogPost);
  const { canUnclaim } = EnhancedBlogClaimService.canUnclaimPost(blogPost, user);
  const { canDelete } = EnhancedBlogClaimService.canDeletePost(blogPost, user);

  if (blogPost.claimed) {
    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-700">
            {isOwnPost ? 'Your Article' : 'Claimed Article'}
          </span>
        </div>
        
        {isOwnPost && (
          <div className="flex gap-2">
            {canUnclaim && (
              <Button
                onClick={onUnclaim}
                variant="outline"
                size="sm"
                className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Unclaim
              </Button>
            )}
            {canDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="rounded-full border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <Badge className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-300">
        <Timer className="mr-2 h-4 w-4" />
        Available to Claim
      </Badge>
      
      {canClaim && (
        <Button
          onClick={onClaim}
          disabled={claiming}
          size="sm"
          className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {claiming ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              {user ? 'Claim Article' : 'Login to Claim'}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

// Main Component
const BeautifulBlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);

  // Computed values
  const { effectiveScore, isPremiumScore } = usePremiumSEOScore(blogPost);
  
  const cleanTitle = useMemo(() => {
    if (!blogPost?.title) return '';
    return blogPost.title
      .replace(/^h\d+[-\s]*/, '')
      .replace(/[-\s]*[a-z0-9]{8}$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, [blogPost?.title]);

  const readingTime = useMemo(() => {
    if (blogPost?.reading_time) return blogPost.reading_time;
    const wordCount = blogPost?.content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(wordCount / 250));
  }, [blogPost?.content, blogPost?.reading_time]);

  const formattedDate = useMemo(() => {
    if (!blogPost?.created_at) return 'Date unavailable';
    try {
      return format(new Date(blogPost.created_at), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  }, [blogPost?.created_at]);

  // Load blog post
  const loadBlogPost = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      const post = await blogService.getBlogPostBySlug(slug);
      
      if (!post) {
        setError(`Article not found: ${slug}`);
        return;
      }

      setBlogPost(post);
    } catch (error: any) {
      console.error('Failed to load blog post:', error);
      setError(error.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug, loadBlogPost]);

  // Handlers
  const handleClaim = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to claim this article.",
        variant: "destructive"
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
          title: "Article Claimed! 🎉",
          description: result.message,
        });
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the article.",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaim = async () => {
    try {
      const result = await EnhancedBlogClaimService.unclaimPost(slug!, user);
      
      if (result.success) {
        setBlogPost(result.post!);
        toast({
          title: "Article Unclaimed",
          description: result.message,
        });
      } else {
        toast({
          title: "Unclaim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setShowUnclaimDialog(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('slug', slug!);

      if (error) throw error;

      toast({
        title: "Article Deleted",
        description: "The article has been permanently removed.",
      });
      navigate('/blog');
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: `Unable to delete article: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cleanTitle,
          text: blogPost?.meta_description || `Read "${cleanTitle}" - an insightful article.`,
          url: window.location.href,
        });
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied! 📋",
        description: "Article URL has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL. Please try selecting and copying manually.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="flex items-center justify-center py-24">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Loading Article</h1>
              <p className="text-gray-600">Please wait while we prepare your content...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-24">
          <Card className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'The requested article could not be found or may have been removed.'}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/blog')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
              <Button onClick={() => slug && loadBlogPost(slug)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      
      {/* Reading Progress */}
      <ReadingProgress />
      
      <Header />

      {/* Navigation */}
      <nav className="sticky top-16 z-30 border-b border-gray-200/50 bg-white/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                className="rounded-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyLink}
                className="rounded-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Status Badge */}
        <StatusBadge
          blogPost={blogPost}
          user={user}
          onClaim={handleClaim}
          onUnclaim={() => setShowUnclaimDialog(true)}
          onDelete={() => setShowDeleteDialog(true)}
          claiming={claiming}
        />

        {/* Article Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
            {cleanTitle}
          </h1>

          {blogPost.meta_description && (
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light max-w-3xl mx-auto mb-8">
              {blogPost.meta_description}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 py-4 border-t border-b border-gray-200/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-blue-600" />
              <time dateTime={blogPost.created_at} className="text-gray-700">
                {formattedDate}
              </time>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">{readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-gray-700">SEO Optimized</span>
            </div>
            <SEOScoreDisplay
              score={effectiveScore}
              title={blogPost.title}
              content={blogPost.content}
              metaDescription={blogPost.meta_description || undefined}
              targetKeyword={blogPost.keywords?.[0]}
              showDetails={true}
              isPremiumScore={isPremiumScore}
            />
          </div>
        </header>

        {/* Target URL Display */}
        {blogPost.target_url && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium">Target URL:</span>
              <a
                href={blogPost.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                {blogPost.target_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Article Content */}
        <Card className="mb-12 shadow-xl bg-white/95">
          <CardContent className="p-8 md:p-12 lg:p-16">
            <ContentProcessor content={blogPost.content || ''} title={cleanTitle} />
          </CardContent>
        </Card>

        {/* Keywords */}
        {blogPost.keywords?.length && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Article Keywords
              </h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {blogPost.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-4 py-2 bg-white/80 border-purple-200 text-gray-700 hover:bg-purple-50 rounded-full"
                  >
                    <Hash className="h-3 w-3 mr-1 text-purple-500" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engagement Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Enjoyed this article?</h2>
            <p className="text-gray-600 mb-8 text-xl">
              Share it with your network and help others discover great content!
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Article
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="lg"
                className="rounded-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Copy className="mr-2 h-5 w-5" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

      </main>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Article
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{cleanTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unclaim Dialog */}
      <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Unclaim Article
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unclaim "{cleanTitle}"? This article will return to the available pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Claimed</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnclaim} className="bg-orange-600 hover:bg-orange-700">
              Unclaim Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export { BeautifulBlogPost };
export default BeautifulBlogPost;
