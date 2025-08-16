import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Sparkles, RefreshCw, Wand2, XCircle
} from 'lucide-react';

// Other Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Styles
import '../styles/beautiful-blog.css';

type BlogPost = Tables<'blog_posts'>;

// Content Processor Component
const ContentProcessor = ({ content, title }: { content: string; title: string }) => {
  const processContent = useCallback((rawContent: string) => {
    if (!rawContent || rawContent.trim().length === 0) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Not Available</h3>
          <p className="text-gray-600 mb-6">This blog post appears to have empty content.</p>
        </div>
      );
    }

    // Clean and normalize content
    let cleanContent = rawContent
      .replace(/Natural Link Integration:\s*/gi, '')
      .replace(/Link Placement:\s*/gi, '')
      .replace(/Anchor Text:\s*/gi, '')
      .replace(/^\s*\*+\s*$|^\s*#+\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Enhanced title removal - prevent title duplication
    if (title) {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const titlePatterns = [
        new RegExp(`^\\s*${escapedTitle}\\s*`, 'i'),
        new RegExp(`^\\s*${escapedTitle}\\s*$`, 'gim'),
        new RegExp(`\\*\\*\\s*${escapedTitle}\\s*\\*\\*`, 'gi'),
        new RegExp(`^#+\\s*${escapedTitle}\\s*$`, 'gim'),
        new RegExp(`<h[1-6][^>]*>\\s*${escapedTitle}\\s*<\\/h[1-6]>`, 'gi'),
      ];

      titlePatterns.forEach(pattern => {
        cleanContent = cleanContent.replace(pattern, '');
      });
    }

    // Final cleanup
    cleanContent = cleanContent
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();

    // Split into paragraphs and process
    const paragraphs = cleanContent.split('\n\n').filter(para => para.trim().length > 0);
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const listItems = trimmed.split('\n').filter(item => item.trim());
        return (
          <ol key={`list-${index}`} className="ml-6 space-y-3 list-decimal list-outside mb-6">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-lg leading-7 text-gray-700 pl-3 font-normal">
                {item.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        );
      }

      // Handle bullet lists
      if (/^[-•*]\s/.test(trimmed)) {
        const listItems = trimmed.split('\n').filter(item => item.trim());
        return (
          <ul key={`list-${index}`} className="ml-6 space-y-3 list-disc list-outside mb-6">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-lg leading-7 text-gray-700 pl-3 font-normal">
                {item.replace(/^[-•*]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Handle headings
      if (/^#{1,6}\s/.test(trimmed)) {
        const level = (trimmed.match(/^#+/) || [''])[0].length;
        const text = trimmed.replace(/^#+\s*/, '');
        const HeadingTag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
        
        return (
          <HeadingTag
            key={`heading-${index}`}
            className={`font-bold text-gray-900 tracking-tight mb-4 ${
              level <= 2 ? 'text-2xl' : 
              level <= 3 ? 'text-xl' : 
              level <= 4 ? 'text-lg' : 'text-base'
            }`}
          >
            {text}
          </HeadingTag>
        );
      }

      // Regular paragraphs
      return (
        <div
          key={`paragraph-${index}`}
          className="text-lg leading-8 text-gray-700 font-normal mb-6"
          style={{ textAlign: 'justify', lineHeight: '1.75' }}
        >
          {trimmed}
        </div>
      );
    });
  }, [title]);

  return (
    <div className="prose prose-xl prose-slate max-w-none">
      <div className="space-y-6">
        {processContent(content)}
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ 
  blogPost, 
  user, 
  onClaim, 
  onDelete,
  claiming = false 
}: {
  blogPost: BlogPost;
  user: any;
  onClaim: () => void;
  onDelete: () => void;
  claiming?: boolean;
}) => {
  const isOwnPost = blogPost.user_id === user?.id;

  if (blogPost.claimed) {
    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="text-center">
            <span className="font-semibold text-green-700">
              {isOwnPost ? 'You own this post' : 'Claimed Post'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <Badge className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300">
        <Timer className="mr-2 h-4 w-4" />
        Unclaimed
      </Badge>
      
      <div className="flex gap-2">
        <Button
          onClick={onClaim}
          disabled={claiming}
          size="sm"
          className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {claiming ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Claiming...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              {user ? 'Claim' : 'Login to Claim'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Main Component
const BeautifulBlogPostFixed = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Computed values
  const cleanTitle = useMemo(() => {
    if (!blogPost?.title) return '';
    
    return blogPost.title
      .replace(/^h\d+[-\s]*/, '')
      .replace(/[-\s]*[a-z0-9]{8}$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, [blogPost?.title]);

  const readingTime = useMemo(() => {
    return blogPost?.reading_time || Math.ceil((blogPost?.content?.length || 0) / 1000);
  }, [blogPost?.content, blogPost?.reading_time]);

  const formattedDate = useMemo(() => {
    if (!blogPost?.created_at) return 'Date unknown';
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
        setError(new Error(`Blog post not found: ${slug}`));
        return;
      }

      setBlogPost(post);
    } catch (error: any) {
      console.error('Failed to load blog post:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug, loadBlogPost]);

  // Handle claim
  const handleClaim = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to claim this post",
        variant: "destructive"
      });
      return;
    }

    setClaiming(true);
    try {
      // Simplified claim logic - you can expand this
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          claimed: true, 
          user_id: user.id 
        })
        .eq('slug', slug!);

      if (error) throw error;

      setBlogPost(prev => prev ? { ...prev, claimed: true, user_id: user.id } : null);
      toast({
        title: "Success! 🎉",
        description: "Post claimed successfully!",
      });
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: "An error occurred while claiming the post",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
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
        title: "Post Deleted",
        description: "The blog post has been successfully deleted.",
      });
      navigate('/blog');
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: `Unable to delete post: ${error.message}`,
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
          title: blogPost?.title,
          text: blogPost?.meta_description || blogPost?.excerpt,
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
        title: "Link Copied!",
        description: "Blog post URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-lg font-medium text-gray-600">Loading blog post...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Blog Post Not Found</h2>
            <p className="text-gray-600">The requested blog post could not be found.</p>
            <Button onClick={() => navigate('/blog')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="beautiful-blog-wrapper min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />

      {/* Navigation Bar */}
      <div className="sticky top-16 z-30 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
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
      </div>

      {/* Article Container */}
      <article className="max-w-5xl mx-auto px-6 py-16 lg:px-8">
        
        {/* Status Badge */}
        <StatusBadge
          blogPost={blogPost}
          user={user}
          onClaim={handleClaim}
          onDelete={() => setShowDeleteDialog(true)}
          claiming={claiming}
        />

        {/* Article Header */}
        <header className="text-center mb-16">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
              {cleanTitle}
            </h1>

            {blogPost.meta_description && (
              <div className="max-w-3xl mx-auto">
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
                  {blogPost.meta_description}
                </p>
              </div>
            )}
          </div>

          {/* Meta Information */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 py-4 border-t border-b border-gray-200/50">
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
            </div>
          </div>
        </header>

        {/* Article Content */}
        <main className="mb-16">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="relative">
              <div className="px-8 md:px-12 lg:px-16 py-12 md:py-16">
                <ContentProcessor
                  content={blogPost.content || ''}
                  title={cleanTitle}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-50/10 pointer-events-none" />
            </div>
          </Card>
        </main>

        {/* Keywords Section */}
        {blogPost.keywords?.length && (
          <Card className="mt-16 max-w-4xl mx-auto border-0 shadow-lg bg-gradient-to-r from-purple-50/50 via-white to-blue-50/50">
            <CardContent className="p-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center gap-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Keywords & Topics
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {blogPost.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-6 py-3 bg-white/80 border-purple-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 rounded-full text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engagement Section */}
        <Card className="mt-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                Enjoyed this article?
              </h3>
              <p className="text-gray-600 mb-10 text-xl leading-relaxed font-light">
                Share it with your network and help others discover great content!
              </p>
              <div className="flex justify-center gap-6">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-3 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Share2 className="mr-3 h-5 w-5" />
                  Share Article
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-3 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
                >
                  <Copy className="mr-3 h-5 w-5" />
                  Copy Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </article>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blogPost.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export { BeautifulBlogPostFixed };
export default BeautifulBlogPostFixed;
