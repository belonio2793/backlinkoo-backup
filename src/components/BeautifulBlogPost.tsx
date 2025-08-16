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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Icons
import {
  ArrowLeft, Share2, Copy, Calendar, Clock, Eye, Bookmark, Heart,
  Crown, Trash2, CheckCircle2, Timer, User, AlertTriangle,
  ExternalLink, Sparkles, Target, TrendingUp, Zap, Globe,
  ShieldCheck, XCircle, MessageCircle
} from 'lucide-react';

// Other Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ClaimLoginModal } from '@/components/ClaimLoginModal';
import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import { SEOScoreDisplay } from '@/components/SEOScoreDisplay';
import BlogErrorBoundary from '@/components/BlogErrorBoundary';

// Services
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { usePremiumSEOScore } from '@/hooks/usePremiumSEOScore';
import { EnhancedBlogCleaner } from '@/utils/enhancedBlogCleaner';
import { maskEmail } from '@/utils/emailMasker';

// Styles
import '../styles/beautiful-blog.css';

type BlogPost = Tables<'blog_posts'>;

interface ContentProcessorProps {
  content: string;
  title: string;
  targetKeyword?: string;
  anchorText?: string;
  targetUrl?: string;
}

// Modern Content Processor with proper link handling
const ContentProcessor = ({ 
  content, 
  title, 
  targetKeyword, 
  anchorText, 
  targetUrl 
}: ContentProcessorProps) => {

  // Function to improve sentence structure and break up run-on sentences
  const improveSentenceStructure = useCallback((text: string): string[] => {
    if (!text || text.trim().length === 0) return [];

    // Clean up the text first
    let cleanText = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split on major sentence delimiters while preserving them
    const sentences = cleanText.split(/([.!?]+\s+)/).filter(Boolean);

    // Reconstruct sentences and group them intelligently
    const reconstructedSentences: string[] = [];
    let currentSentence = '';

    for (let i = 0; i < sentences.length; i += 2) {
      const sentenceText = sentences[i] || '';
      const delimiter = sentences[i + 1] || '';

      const fullSentence = sentenceText + delimiter;

      // If current sentence is getting too long (>200 chars), start a new paragraph
      if (currentSentence.length > 0 && (currentSentence.length + fullSentence.length) > 200) {
        reconstructedSentences.push(currentSentence.trim());
        currentSentence = fullSentence;
      } else {
        currentSentence += fullSentence;
      }

      // If we've accumulated 2-3 sentences or reached a natural break, end the paragraph
      const sentenceCount = (currentSentence.match(/[.!?]/g) || []).length;
      if (sentenceCount >= 3 ||
          (sentenceCount >= 2 && currentSentence.length > 150) ||
          fullSentence.includes(':') || // Break after colons (often introduce new concepts)
          /\b(However|Moreover|Furthermore|In addition|Therefore|Consequently|For example|For instance)\b/i.test(fullSentence)) {

        if (currentSentence.trim().length > 0) {
          reconstructedSentences.push(currentSentence.trim());
          currentSentence = '';
        }
      }
    }

    // Add any remaining content
    if (currentSentence.trim().length > 0) {
      reconstructedSentences.push(currentSentence.trim());
    }

    // Post-process to handle special cases
    return reconstructedSentences
      .map(paragraph => {
        // Break up extremely long paragraphs (>400 chars) at logical points
        if (paragraph.length > 400) {
          // Try to split at transitional phrases or after examples
          const breakPoints = [
            /(\. )(However|Moreover|Furthermore|In addition|Additionally|Meanwhile|Therefore|Consequently)/g,
            /(\. )(For example|For instance|In fact|Indeed|Specifically)/g,
            /(\. )(This|These|Such|That approach|This method|This technique)/g
          ];

          for (const breakPoint of breakPoints) {
            if (breakPoint.test(paragraph)) {
              return paragraph.split(breakPoint).filter(Boolean);
            }
          }

          // If no logical break point, split roughly in the middle at a sentence boundary
          const midPoint = Math.floor(paragraph.length / 2);
          const nearestSentenceEnd = paragraph.indexOf('. ', midPoint);
          if (nearestSentenceEnd > midPoint && nearestSentenceEnd < paragraph.length - 50) {
            return [
              paragraph.substring(0, nearestSentenceEnd + 1).trim(),
              paragraph.substring(nearestSentenceEnd + 2).trim()
            ];
          }
        }

        return paragraph;
      })
      .flat()
      .filter(p => p.trim().length > 0);
  }, []);

  const processContent = useCallback((rawContent: string) => {
    if (!rawContent) return [];

    // Clean and normalize content
    let cleanContent = rawContent
      .replace(/Natural Link Integration:\s*/gi, '')
      .replace(/Link Placement:\s*/gi, '')
      .replace(/Anchor Text:\s*/gi, '')
      .replace(/URL Integration:\s*/gi, '')
      .replace(/Link Strategy:\s*/gi, '')
      .replace(/Backlink Placement:\s*/gi, '')
      .replace(/^\s*\*+\s*$|^\s*#+\s*$/gm, '') // Remove markdown artifacts
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Enhanced title removal - remove duplicate titles anywhere in content
    if (title) {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Remove title at the beginning of content
      const titleAtStartPattern = new RegExp(`^\\s*${escapedTitle}\\s*`, 'i');
      cleanContent = cleanContent.replace(titleAtStartPattern, '');

      // Remove title as a standalone line anywhere in content
      const titleStandalonePattern = new RegExp(`^\\s*${escapedTitle}\\s*$`, 'gim');
      cleanContent = cleanContent.replace(titleStandalonePattern, '');

      // Remove title wrapped in bold markdown (**title**)
      const titleBoldPattern = new RegExp(`\\*\\*\\s*${escapedTitle}\\s*\\*\\*`, 'gi');
      cleanContent = cleanContent.replace(titleBoldPattern, '');

      // Remove title as a heading (# title)
      const titleHeadingPattern = new RegExp(`^#+\\s*${escapedTitle}\\s*$`, 'gim');
      cleanContent = cleanContent.replace(titleHeadingPattern, '');

      // Remove title if it appears as the first strong element in a paragraph
      const titleFirstStrongPattern = new RegExp(`^\\s*${escapedTitle}\\s*`, 'i');
      cleanContent = cleanContent.replace(titleFirstStrongPattern, '');
    }

    // Clean up any remaining empty lines or whitespace
    cleanContent = cleanContent
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim();

    // Split into lines first to better detect lists
    const lines = cleanContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Detect numbered lists (1. 2. 3. etc.)
      if (/^\d+\.\s/.test(line)) {
        const listItems: string[] = [];
        let j = i;

        // Collect all consecutive numbered list items
        while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
          listItems.push(lines[j].replace(/^\d+\.\s/, '').trim());
          j++;
        }

        elements.push(
          <ol key={`numbered-list-${i}`} className="mb-10 ml-8 space-y-4 list-decimal list-outside">
            {listItems.map((item, idx) => {
              const processedContent = processTextContent(item, idx + i);
              // Only render list item if content is not null
              return processedContent !== null ? (
                <li key={idx} className="text-lg leading-7 text-gray-700 pl-4 font-normal" style={{ textAlign: 'justify', letterSpacing: '0.005em' }}>
                  {processedContent}
                </li>
              ) : null;
            }).filter(Boolean)}
          </ol>
        );

        i = j;
        continue;
      }

      // Detect bullet point lists (- • * etc.)
      if (/^[-•*]\s/.test(line)) {
        const listItems: string[] = [];
        let j = i;

        // Collect all consecutive bullet point items
        while (j < lines.length && /^[-•*]\s/.test(lines[j])) {
          listItems.push(lines[j].replace(/^[-•*]\s/, '').trim());
          j++;
        }

        elements.push(
          <ul key={`bullet-list-${i}`} className="mb-10 ml-8 space-y-4 list-disc list-outside">
            {listItems.map((item, idx) => {
              const processedContent = processTextContent(item, idx + i);
              // Only render list item if content is not null
              return processedContent !== null ? (
                <li key={idx} className="text-lg leading-7 text-gray-700 pl-4 font-normal" style={{ textAlign: 'justify', letterSpacing: '0.005em' }}>
                  {processedContent}
                </li>
              ) : null;
            }).filter(Boolean)}
          </ul>
        );

        i = j;
        continue;
      }

      // Detect multi-line content blocks (collect until empty line or list)
      const paragraphLines: string[] = [];
      let j = i;

      while (j < lines.length &&
             !/^\d+\.\s/.test(lines[j]) &&
             !/^[-•*]\s/.test(lines[j]) &&
             lines[j].trim() !== '') {
        paragraphLines.push(lines[j]);
        j++;

        // If we hit an empty line, break (but include it as paragraph end)
        if (j < lines.length && lines[j].trim() === '') {
          j++; // Skip the empty line
          break;
        }
      }

      if (paragraphLines.length > 0) {
        const paragraphContent = paragraphLines.join(' ');
        const improvedParagraphs = improveSentenceStructure(paragraphContent);

        improvedParagraphs.forEach((paragraph, idx) => {
          const processedContent = processTextContent(paragraph, i + idx);
          // Only render if content is not null (not filtered out)
          if (processedContent !== null) {
            elements.push(
              <div
                key={`paragraph-${i}-${idx}`}
                className="beautiful-prose-paragraph max-w-none break-words"
              >
                {processedContent}
              </div>
            );
          }
        });
      }

      i = j;
    }

    return elements;
  }, [title, targetKeyword, anchorText, targetUrl]);

  // Helper function to process text content (links, bold, italic, etc.)
  const processTextContent = useCallback((text: string, index: number) => {
    // Filter out duplicate title if it appears in text content
    if (title) {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const titlePattern = new RegExp(`^\\s*${escapedTitle}\\s*$`, 'i');
      if (titlePattern.test(text.trim())) {
        return null; // Return null to filter out this text entirely
      }
    }

    // Process markdown links first
    let processedText = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, linkText, url) => {
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        const cleanText = linkText.trim();

        return `<a href="${cleanUrl}" class="text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-4 transition-all duration-200 hover:decoration-3 hover:text-blue-700 bg-blue-50/30 hover:bg-blue-50/50 px-1 py-0.5 rounded" target="_blank" rel="noopener noreferrer">${cleanText}</a>`;
      }
    );

    // Handle special anchor text insertion for target keyword (only for middle content)
    if (targetKeyword && anchorText && targetUrl && index % 5 === 2) { // Every 5th element around middle
      const keywordRegex = new RegExp(`\\b${targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (keywordRegex.test(processedText) && !processedText.includes(targetUrl)) {
        processedText = processedText.replace(
          keywordRegex,
          `<a href="${targetUrl}" class="text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2 transition-colors duration-200" target="_blank" rel="noopener noreferrer">${anchorText}</a>`
        );
      }
    }

    // Handle bold text
    processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 bg-gray-50/50 px-1 py-0.5 rounded">$1</strong>');

    // Handle italic text
    processedText = processedText.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-800 font-medium">$1</em>');

    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  }, [targetKeyword, anchorText, targetUrl]);

  return (
    <div className="prose prose-xl prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:font-light prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 prose-strong:text-gray-900 prose-li:text-gray-700 prose-li:font-light">
      {processContent(content)}
    </div>
  );
};

// Reading Progress Component
const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setProgress(Math.min(scrolled, 100));
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-50 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  );
};

// Floating Action Bar Component
const FloatingActionBar = ({ 
  onBookmark, 
  onLike, 
  onShare, 
  isBookmarked = false, 
  isLiked = false 
}: {
  onBookmark: () => void;
  onLike: () => void;
  onShare: () => void;
  isBookmarked?: boolean;
  isLiked?: boolean;
}) => (
  <div className="hidden lg:flex fixed right-6 top-1/2 transform -translate-y-1/2 z-40 flex-col space-y-4">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBookmark}
          className="w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-600'}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Bookmark</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLike}
          className="w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Like</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShare}
          className="w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        >
          <Share2 className="h-5 w-5 text-gray-600" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Share</TooltipContent>
    </Tooltip>
  </div>
);

// Status Badge Component
const StatusBadge = ({ 
  blogPost, 
  user, 
  authorEmail, 
  onClaim, 
  onUnclaim, 
  onDelete,
  claiming = false 
}: {
  blogPost: BlogPost;
  user: any;
  authorEmail?: string | null;
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
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="text-center">
            <span className="font-semibold text-green-700">
              {isOwnPost ? 'You own this post' : 'Claimed Post'}
            </span>
            {!isOwnPost && authorEmail && (
              <div className="text-xs text-green-600 mt-1">
                by {maskEmail(authorEmail)}
              </div>
            )}
          </div>
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
                className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
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
        {canClaim && (
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
        )}
        {canDelete && (
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Keywords Section Component
const KeywordsSection = ({ keywords }: { keywords?: string[] }) => {
  if (!keywords?.length) return null;

  return (
    <Card className="mt-16 max-w-4xl mx-auto border-0 shadow-lg bg-gradient-to-r from-purple-50/50 via-white to-blue-50/50">
      <CardContent className="p-10">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Keywords & Topics
        </h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {keywords.map((keyword, index) => (
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
  );
};

// Premium CTA Component
const PremiumCTA = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <Card className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
    <CardContent className="p-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <Crown className="h-8 w-8 text-purple-600 mr-3" />
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Unlock Premium Features
        </h3>
      </div>
      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
        Get unlimited access to premium blog content, advanced SEO tools, and exclusive features.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
          <Sparkles className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 mb-1">Unlimited Content</h4>
          <p className="text-sm text-gray-600">Access all premium blog posts</p>
        </div>
        <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
          <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h4>
          <p className="text-sm text-gray-600">Detailed performance insights</p>
        </div>
        <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
          <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 mb-1">Priority Support</h4>
          <p className="text-sm text-gray-600">24/7 expert assistance</p>
        </div>
      </div>
      <Button
        onClick={onUpgrade}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full px-8 py-4 text-lg transition-all duration-300 hover:scale-105"
        size="lg"
      >
        <Crown className="h-5 w-5 mr-2" />
        Upgrade to Premium
      </Button>
    </CardContent>
  </Card>
);

// Main Component
export function BeautifulBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Computed values
  const { effectiveScore, isPremiumScore } = usePremiumSEOScore(blogPost);
  
  const cleanTitle = useMemo(() => {
    return blogPost ? EnhancedBlogCleaner.cleanTitle(blogPost.title) : '';
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

      // Fetch author email if claimed
      if (post.claimed && post.user_id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', post.user_id)
            .single();
          
          if (profile?.email) {
            setAuthorEmail(profile.email);
          }
        } catch (error) {
          console.warn('Could not fetch author email:', error);
        }
      }
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

  // Handlers
  const handleClaim = async () => {
    if (!user) {
      setShowClaimModal(true);
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
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post",
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
      <>
        <Header />
        <BlogErrorBoundary
          error={error || new Error('Blog post not found')}
          slug={slug}
          onRetry={() => slug && loadBlogPost(slug)}
        />
        <Footer />
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="beautiful-blog-wrapper min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        
        {/* Reading Progress */}
        <ReadingProgress />
        
        <Header />

        {/* Floating Action Bar */}
        <FloatingActionBar
          onBookmark={() => setIsBookmarked(!isBookmarked)}
          onLike={() => setIsLiked(!isLiked)}
          onShare={handleShare}
          isBookmarked={isBookmarked}
          isLiked={isLiked}
        />

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
            authorEmail={authorEmail}
            onClaim={handleClaim}
            onUnclaim={() => setShowUnclaimDialog(true)}
            onDelete={() => setShowDeleteDialog(true)}
            claiming={claiming}
          />

          {/* Article Header */}
          <header className="text-center mb-16">
            {/* Main Title - Prominently displayed on its own line */}
            <div className="mb-12">
              <h1 className="beautiful-main-title beautiful-blog-title mb-6">
                {cleanTitle}
              </h1>

              {/* Subtitle/Meta Description */}
              {blogPost.meta_description && (
                <div className="max-w-3xl mx-auto">
                  <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
                    {blogPost.meta_description}
                  </p>
                </div>
              )}
            </div>

            {/* Meta Information Bar */}
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
            </div>
          </header>

          {/* Article Content */}
          <main className="mb-16">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="relative">
                {/* Content Wrapper */}
                <div className="px-8 md:px-12 lg:px-16 py-12 md:py-16 beautiful-blog-content">
                  <div className="max-w-none prose prose-lg prose-slate beautiful-prose prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 prose-strong:text-gray-900 prose-li:text-gray-700">
                    <ContentProcessor
                      content={blogPost.content || ''}
                      title={cleanTitle}
                      targetKeyword={blogPost.keywords?.[0]}
                      anchorText={blogPost.anchor_text}
                      targetUrl={blogPost.target_url}
                    />
                  </div>
                </div>

                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-50/10 pointer-events-none" />
              </div>
            </Card>
          </main>

          {/* Keywords Section */}
          <KeywordsSection keywords={blogPost.keywords} />

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
                    className="rounded-full px-8 py-3 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Share2 className="mr-3 h-5 w-5" />
                    Share Article
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 py-3 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Copy className="mr-3 h-5 w-5" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium CTA */}
          <PremiumCTA onUpgrade={() => setShowPaymentModal(true)} />

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

        {/* Unclaim Dialog */}
        <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-600" />
                Unclaim Blog Post
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unclaim "{blogPost.title}"? This post will return to the claimable pool.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Claimed</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnclaim} className="bg-orange-600 hover:bg-orange-700">
                Unclaim Post
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Claim Modal */}
        <ClaimLoginModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onAuthSuccess={() => {
            setShowClaimModal(false);
            handleClaim();
          }}
          postTitle={cleanTitle}
          postSlug={slug || ''}
        />

        {/* Payment Modal */}
        <EnhancedUnifiedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          defaultTab="premium"
          onSuccess={() => {
            setShowPaymentModal(false);
            toast({
              title: "Welcome to Premium! 🎉",
              description: "Your premium subscription has been activated.",
            });
          }}
        />

        <Footer />
      </div>
    </TooltipProvider>
  );
}

export default BeautifulBlogPost;
