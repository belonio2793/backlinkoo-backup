import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import React from "react";

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

// --- Enhanced Content Formatter ---
type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "li"; text: string }
  | { type: "link"; text: string; href: string };

// --- Utility: detect sections, lists, urls ---
const isSectionHeading = (line: string) =>
  /^(\s*)(section|chapter|part)\s+\d+[:.)-]*/i.test(line) ||
  (/^[\p{L}\p{N}\s,'&/()-]{3,90}:$/u.test(line.trim()) &&
    !line.includes("http"));

const isListItem = (line: string) =>
  /^(\s*)(-|•|\d+[.)])\s+/.test(line);

const urlOnly = (line: string) => {
  const m = line.trim().match(/^(https?:\/\/\S+)$/i);
  return m ? m[1] : null;
};

// --- Utility: process markdown and boldify text ---
const processTextFormatting = (text: string): React.ReactNode => {
  // First, process markdown formatting
  let processedText = text;

  // Handle markdown links first [text](url)
  processedText = processedText.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-semibold decoration-2 underline-offset-2 transition-colors duration-200">$1</a>'
  );

  // Handle standalone URLs (simple approach to avoid conflicts)
  processedText = processedText.replace(
    /(^|\s)(https?:\/\/[^\s<>"']+)/gi,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-semibold decoration-2 underline-offset-2 transition-colors duration-200">$2</a>'
  );

  // Handle markdown bold with **text**
  processedText = processedText.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-bold text-gray-900">$1</strong>'
  );

  // Handle markdown italic with *text* (avoiding conflicts with bold)
  processedText = processedText.replace(
    /(^|[^*])\*([^*]+)\*([^*]|$)/g,
    '$1<em class="italic text-gray-700">$2</em>$3'
  );

  // If no markdown formatting was found, try the colon-based formatting
  if (processedText === text) {
    const idx = text.indexOf(":");
    if (idx > 0 && idx < 80) {
      const head = text.slice(0, idx).trim();
      const tail = text.slice(idx + 1).trim();
      if (/^[\p{L}\d][\p{L}\d\s'&/()-]*$/u.test(head)) {
        return (
          <>
            <strong className="font-bold text-gray-900">{head}:</strong> {tail}
          </>
        );
      }
    }
  }

  // If we have HTML markup, render it safely
  if (processedText !== text) {
    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  }

  return text;
};

// --- Parse into structured blocks ---
function parseContentToBlocks(raw: string, title?: string): Block[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: Block[] = [];

  // Helper function to check if a line matches the title
  const isTitle = (line: string): boolean => {
    if (!title) return false;

    const cleanLine = line.replace(/^\*\*|\*\*$|^#+\s*|\s*:?\s*$/g, '').trim();
    const cleanTitle = title.replace(/[^\w\s]/g, '').toLowerCase();
    const cleanLineText = cleanLine.replace(/[^\w\s]/g, '').toLowerCase();

    // Check for exact match or very close match (90% similarity)
    if (cleanLineText === cleanTitle) return true;

    // Check if line contains most of the title words
    const titleWords = cleanTitle.split(/\s+/);
    const lineWords = cleanLineText.split(/\s+/);
    const matchingWords = titleWords.filter(word => lineWords.includes(word));

    return matchingWords.length >= Math.ceil(titleWords.length * 0.8);
  };

  for (const line of lines) {
    // Skip lines that match the title
    if (isTitle(line)) {
      continue;
    }

    const url = urlOnly(line);
    if (url) {
      blocks.push({ type: "link", text: line, href: url });
      continue;
    }

    // Check if line is bold-wrapped heading (like **Introduction:**)
    const boldHeadingMatch = line.match(/^\*\*([^*]+)\*\*\s*:?\s*$/);
    if (boldHeadingMatch && !isTitle(boldHeadingMatch[1])) {
      blocks.push({
        type: "h2",
        text: boldHeadingMatch[1].trim(),
      });
      continue;
    }

    if (isSectionHeading(line) && !isTitle(line)) {
      blocks.push({
        type: "h2",
        text: line.replace(/\s*[:.]$/, "").trim(),
      });
      continue;
    }
    if (isListItem(line)) {
      const cleaned = line.replace(/^(\s*)(-|•|\d+[.)])\s+/, "");
      blocks.push({ type: "li", text: cleaned });
      continue;
    }
    blocks.push({ type: "p", text: line });
  }
  return blocks;
}

// --- Render structured blocks ---
const renderBlocks = (blocks: Block[]) => {
  const out: JSX.Element[] = [];
  let i = 0;

  while (i < blocks.length) {
    const b = blocks[i];

    // group list items
    if (b.type === "li") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "li") {
        items.push(blocks[i]);
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} className="list-disc list-inside my-6 pl-6 space-y-2">
          {items.map((it, idx) => (
            <li key={`li-${i}-${idx}`} className="text-lg leading-7 text-gray-700">
              {processTextFormatting(it.text)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // headings
    if (b.type === "h2") {
      out.push(
        <h2 key={`h2-${i}`} className="text-3xl font-bold mt-12 mb-6 text-gray-900 tracking-tight">
          {b.text}
        </h2>
      );
    }
    // links
    else if (b.type === "link") {
      out.push(
        <p key={`a-${i}`} className="my-6">
          <a
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-semibold decoration-2 underline-offset-2 transition-colors duration-200"
          >
            {b.text}
          </a>
        </p>
      );
    }
    // paragraphs
    else {
      out.push(
        <p key={`p-${i}`} className="mb-6 leading-8 text-lg text-gray-700 text-justify">
          {processTextFormatting(b.text)}
        </p>
      );
    }
    i++;
  }
  return out;
};

// --- Legacy fallback rendering ---
const legacyRender = (content: string) =>
  content
    .split(/\n{2,}/) // break on double newlines
    .map((p, idx) => (
      <p key={`legacy-${idx}`} className="mb-6 leading-8 text-lg text-gray-700 text-justify">
        {processTextFormatting(p.trim())}
      </p>
    ));

// Content Processor Component
const ContentProcessor = ({ content, title, enableAutoFormat = true }: {
  content: string;
  title: string;
  enableAutoFormat?: boolean;
}) => {
  const processedContent = useMemo(() => {
    if (!content?.trim()) return null;

    // Decode HTML entities if content contains escaped HTML
    let decodedContent = content;
    if (content.includes('&lt;') || content.includes('&gt;') || content.includes('&amp;')) {
      console.log('🔧 Detected escaped HTML entities, decoding...');
      decodedContent = content
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }

    // Check if content is already HTML (contains HTML tags)
    const isHtmlContent = /<[a-z][\s\S]*>/i.test(decodedContent);

    // If content is already HTML with beautiful classes, render it directly
    if (isHtmlContent && decodedContent.includes('beautiful-prose')) {
      console.log('🎨 Detected beautiful HTML content, rendering directly');

      // Remove title duplicates from HTML content if needed
      let cleanHtmlContent = decodedContent;
      if (title) {
        const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Remove HTML headings that match the title
        const titlePattern = new RegExp(`<h[1-6][^>]*>\\s*${escapedTitle}\\s*<\/h[1-6]>`, 'gi');
        cleanHtmlContent = cleanHtmlContent.replace(titlePattern, '');
      }

      return <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent.trim() }} />;
    }

    // Enhanced title removal - multiple patterns and variations
    let cleanContent = decodedContent;

    if (title) {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create variations of the title to match
      const titleVariations = [
        title,
        title.replace(/\s+/g, '\\s+'), // Match flexible whitespace
        title.replace(/[^\w\s]/g, ''), // Remove punctuation
        title.toLowerCase(),
        title.toUpperCase()
      ];

      // Remove title patterns from start of content
      titleVariations.forEach(variation => {
        const escapedVariation = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Multiple removal patterns
        const patterns = [
          // Markdown headings
          new RegExp(`^\\s*#{1,6}\\s*\\*\\*?\\s*${escapedVariation}\\s*\\*\\*?\\s*:?\\s*\\n?`, 'gim'),
          new RegExp(`^\\s*#{1,6}\\s*${escapedVariation}\\s*:?\\s*\\n?`, 'gim'),
          // Bold wrapped titles
          new RegExp(`^\\s*\\*\\*\\s*${escapedVariation}\\s*\\*\\*\\s*:?\\s*\\n?`, 'gim'),
          // Plain titles at start
          new RegExp(`^\\s*${escapedVariation}\\s*:?\\s*\\n?`, 'gim'),
          // HTML headings
          new RegExp(`^\\s*<h[1-6][^>]*>\\s*${escapedVariation}\\s*<\\/h[1-6]>\\s*\\n?`, 'gim')
        ];

        patterns.forEach(pattern => {
          cleanContent = cleanContent.replace(pattern, '');
        });
      });
    }

    cleanContent = cleanContent.trim();

    // If content contains HTML tags but not beautiful classes, render as HTML
    if (isHtmlContent) {
      console.log('🔧 Detected HTML content, rendering as HTML');
      return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
    }

    // Otherwise, process as markdown/plain text
    if (enableAutoFormat) {
      try {
        const blocks = parseContentToBlocks(cleanContent, title);
        return renderBlocks(blocks);
      } catch (e) {
        console.error("BeautifulBlogPost formatter failed, fallback:", e);
        return legacyRender(cleanContent);
      }
    } else {
      return legacyRender(cleanContent);
    }
  }, [content, title, enableAutoFormat]);

  if (!processedContent) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">No content available.</p>
      </div>
    );
  }

  return <div className="prose prose-lg max-w-none">{processedContent}</div>;
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

  // Check if user is admin (enhanced admin detection)
  const isAdmin = user?.email?.includes('admin') ||
                  user?.user_metadata?.role === 'admin' ||
                  user?.app_metadata?.role === 'admin' ||
                  ['admin@backlink.com', 'admin@backlinkoo.com'].includes(user?.email || '') ||
                  // Check for admin principals from the current user session
                  (typeof window !== 'undefined' && window.location.search.includes('principals=admin'));

  if (blogPost.claimed) {
    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-700">
            {isOwnPost ? 'Your Article' : 'Claimed Article'}
          </span>
        </div>
        
        {(isOwnPost || isAdmin) && (
          <div className="flex gap-2">
            {isOwnPost && canUnclaim && (
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
            {(isAdmin || canDelete) && (
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

      <div className="flex gap-2">
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

        {/* Show delete button for unclaimed posts - admins can always delete */}
        {(isAdmin || (canDelete && user)) && (
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

  // Permission checks
  const { canDelete } = blogPost ? EnhancedBlogClaimService.canDeletePost(blogPost, user) : { canDelete: false };
  const isAdmin = user?.email?.includes('admin') ||
                  user?.user_metadata?.role === 'admin' ||
                  user?.app_metadata?.role === 'admin' ||
                  ['admin@backlink.com', 'admin@backlinkoo.com'].includes(user?.email || '') ||
                  // Check for admin principals from the current user session
                  (typeof window !== 'undefined' && window.location.search.includes('principals=admin'));

  // Admin users can always delete, regular users need permission
  const showDeleteButton = isAdmin || (canDelete && user);
  
  const cleanTitle = useMemo(() => {
    if (!blogPost?.title) return '';

    let title = blogPost.title;

    // Remove common prefixes that appear in raw titles
    title = title
      .replace(/^h\d+[-\s]*/, '') // Remove h1, h2, etc. prefixes
      .replace(/^title:\s*/i, '') // Remove "Title:" prefix
      .replace(/^\*\*.*?\*\*:\s*/i, '') // Remove **H1**: style prefixes
      .replace(/^\*\*(.+?)\*\*$/i, '$1') // Remove **title** wrapping
      .replace(/^#+\s*/, '') // Remove markdown heading markers

      // Remove common suffixes (hash codes, extra formatting)
      .replace(/[-\s]*[a-z0-9]{8}$/i, '') // Remove hash suffixes like -abc12345
      .replace(/\s*-\s*[a-z0-9]+$/i, '') // Remove dash suffixes

      // Handle truncation indicators
      .replace(/\.\.\.$/, '') // Remove ellipsis
      .replace(/\s+\w{1,3}$/, '') // Remove partial words at the end

      // Clean up spacing and punctuation
      .replace(/\s+/g, ' ')
      .replace(/[*]+/g, '') // Remove asterisks
      .trim();

    // If the title seems truncated (ends abruptly), try to make it more complete
    if (title.length < 30 && title.match(/[a-z]$/)) {
      // Title might be truncated, but we'll display what we have
      console.log('🔍 Potentially truncated title detected:', title);
    }

    return title;
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
          title: "Article Claimed! ���",
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
      console.log('🗑️ Attempting to delete blog post:', slug);

      // Try deleting from published_blog_posts first (where new posts are saved)
      let { error: publishedError } = await supabase
        .from('published_blog_posts')
        .delete()
        .eq('slug', slug!);

      // If not found in published_blog_posts, try blog_posts table
      if (publishedError && publishedError.code === 'PGRST116') {
        console.log('📖 Post not found in published_blog_posts, trying blog_posts...');
        const { error: blogError } = await supabase
          .from('blog_posts')
          .delete()
          .eq('slug', slug!);

        if (blogError) {
          throw blogError;
        }
      } else if (publishedError) {
        throw publishedError;
      }

      console.log('✅ Blog post deleted successfully');

      toast({
        title: "Article Deleted",
        description: "The article has been permanently removed.",
      });

      // Navigate back to blog list
      navigate('/blog');

    } catch (error: any) {
      console.error('❌ Failed to delete blog post:', error);

      let errorMessage = 'Unable to delete article';
      if (error.code === 'PGRST116') {
        errorMessage = 'Article not found or already deleted';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Delete Failed",
        description: errorMessage,
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
              {showDeleteButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-full border-red-400 text-red-700 hover:bg-red-50 hover:border-red-500 bg-red-50/50 font-medium"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
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

        {/* Article Content with Enhanced Formatter */}
        <Card className="mb-12 shadow-xl bg-white/95">
          <CardContent className="p-8 md:p-12 lg:p-16">
            <ContentProcessor 
              content={blogPost.content || ''} 
              title={cleanTitle}
              enableAutoFormat={true}
            />
          </CardContent>
        </Card>


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

        {/* Delete/Recycle Section - Only show if user has permission */}
        {showDeleteButton && (
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center justify-center gap-2">
                <Trash2 className="h-5 w-5" />
                Article Management
              </h3>
              <p className="text-red-700 mb-6">
                Remove this article permanently from the platform
              </p>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                size="lg"
                className="rounded-full bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Article
              </Button>
            </CardContent>
          </Card>
        )}

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

      {/* Floating Delete Action Button */}
      {showDeleteButton && (
        <div className="fixed bottom-20 right-6 z-50">
          <Button
            onClick={() => setShowDeleteDialog(true)}
            size="lg"
            className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg border-2 border-white hover:shadow-xl transition-all duration-200"
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Delete Article</span>
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export { BeautifulBlogPost };
export default BeautifulBlogPost;
