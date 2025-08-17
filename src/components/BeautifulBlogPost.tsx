import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { blogService } from '@/services/blogService';
import { enhancedBlogContentGenerator } from '@/services/enhancedBlogContentGenerator';
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
  ShieldCheck, XCircle, MessageCircle, RefreshCw, Wand2
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
import { maskEmail } from '@/utils/emailMasker';
import { EnhancedBlogCleaner } from '@/utils/enhancedBlogCleaner';
import { SupabaseConnectionFixerComponent } from '@/components/SupabaseConnectionFixer';

// Styles
import '../styles/beautiful-blog.css';

type BlogPost = Tables<'blog_posts'>;

interface EnhancedContentProcessorProps {
  content: string;
  title: string;
  targetKeyword?: string;
  anchorText?: string;
  targetUrl?: string;
  onRegenerateContent?: () => void;
}

// Enhanced Content Processor with smart link handling and regeneration capabilities
const EnhancedContentProcessor = ({ 
  content, 
  title, 
  targetKeyword, 
  anchorText, 
  targetUrl,
  onRegenerateContent
}: EnhancedContentProcessorProps) => {

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Enhanced content processing with superior structure and formatting detection
  const processContent = useCallback((rawContent: string) => {
    if (!rawContent || rawContent.trim().length === 0) {
      return [
        <div key="empty-content" className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Not Available</h3>
          <p className="text-gray-600 mb-6">This blog post appears to have empty content.</p>
          {onRegenerateContent && (
            <Button
              onClick={() => handleContentRegeneration()}
              disabled={isRegenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Regenerate Content
                </>
              )}
            </Button>
          )}
        </div>
      ];
    }

    // Use EnhancedBlogCleaner for comprehensive content cleaning
    let cleanContent = EnhancedBlogCleaner.cleanContent(rawContent, title);

    // Additional formatting improvements specific to display
    cleanContent = cleanContent
      // Remove metadata and AI-generated prefixes
      .replace(/Natural Link Integration:\s*/gi, '')
      .replace(/Link Placement:\s*/gi, '')
      .replace(/Anchor Text:\s*/gi, '')
      .replace(/URL Integration:\s*/gi, '')
      .replace(/Link Strategy:\s*/gi, '')
      .replace(/Backlink Placement:\s*/gi, '')
      // Fix common formatting issues
      .replace(/\*\s+/g, '* ') // Fix bullet point spacing
      .replace(/\d+\.\s+/g, (match) => match.replace(/\s+/g, ' ')) // Fix numbered list spacing
      // Normalize line breaks and spacing
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .trim();

    // Enhanced title removal with better pattern matching
    if (title) {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const simplifiedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();

      // Remove various forms of title duplication
      const titlePatterns = [
        new RegExp(`^\\s*${escapedTitle}\\s*\\n`, 'i'),          // At start with newline
        new RegExp(`^\\s*${escapedTitle}\\s*$`, 'gim'),        // As standalone line
        new RegExp(`\\*\\*\\s*${escapedTitle}\\s*\\*\\*`, 'gi'), // Bold markdown
        new RegExp(`^#+\\s*${escapedTitle}\\s*$`, 'gim'),      // As heading
        new RegExp(`<h[1-6][^>]*>\\s*${escapedTitle}\\s*<\\/h[1-6]>`, 'gi'), // HTML headings
        new RegExp(`^\\s*${simplifiedTitle}\\s*$`, 'gim'),     // Simplified version
      ];

      titlePatterns.forEach(pattern => {
        cleanContent = cleanContent.replace(pattern, '');
      });
    }

    // Advanced cleanup for better text structure
    cleanContent = cleanContent
      // Fix paragraph spacing
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove empty lines with only punctuation
      .replace(/^\s*[.!?]+\s*$/gm, '')
      // Fix common text artifacts
      .replace(/\s+([.!?])/g, '$1') // Remove spaces before punctuation
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after punctuation
      // Remove excessive formatting
      .replace(/\*{4,}/g, '**')
      .replace(/_{4,}/g, '__')
      .replace(/^\s+|\s+$/g, '')
      .trim();

    // Smart paragraph detection and structure improvement
    cleanContent = improveTextStructure(cleanContent);

    // Process content into structured elements
    return parseContentIntoElements(cleanContent);
  }, [title, targetKeyword, anchorText, targetUrl, onRegenerateContent, isRegenerating]);

  // Parse content into well-structured React elements with enhanced detection
  const parseContentIntoElements = useCallback((content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    while (currentIndex < lines.length) {
      const line = lines[currentIndex];

      // Skip empty or whitespace-only lines
      if (!line || line.trim().length === 0) {
        currentIndex++;
        continue;
      }

      // Handle numbered lists with improved detection
      if (/^\d+\.\s/.test(line) || /^\d+\)\s/.test(line)) {
        const listItems = extractConsecutiveItems(lines, currentIndex, /^\d+[.)\s]/);
        elements.push(createNumberedList(listItems.items, currentIndex));
        currentIndex = listItems.nextIndex;
        continue;
      }

      // Handle bullet point lists with more pattern support
      if (/^[-•*+]\s/.test(line) || /^●\s/.test(line) || /^○\s/.test(line)) {
        const listItems = extractConsecutiveItems(lines, currentIndex, /^[-•*+●○]\s/);
        elements.push(createBulletList(listItems.items, currentIndex));
        currentIndex = listItems.nextIndex;
        continue;
      }

      // Handle headings with better detection (HTML, Markdown, and plain text)
      if (/^<h[1-6]/.test(line) || /^#{1,6}\s/.test(line) || isHeadingLine(line, lines[currentIndex + 1])) {
        elements.push(createHeading(line, currentIndex));
        currentIndex++;
        // Skip underline if it's a markdown-style heading
        if (currentIndex < lines.length && /^[=-]+$/.test(lines[currentIndex].trim())) {
          currentIndex++;
        }
        continue;
      }

      // Handle blockquotes
      if (/^>\s/.test(line)) {
        const quoteLines = extractConsecutiveItems(lines, currentIndex, /^>\s/);
        elements.push(createBlockquote(quoteLines.items, currentIndex));
        currentIndex = quoteLines.nextIndex;
        continue;
      }

      // Handle regular paragraphs with smart grouping
      const paragraphLines = collectParagraphLines(lines, currentIndex);
      if (paragraphLines.lines.length > 0) {
        elements.push(createParagraph(paragraphLines.lines.join(' '), paragraphLines.nextIndex));
        currentIndex = paragraphLines.nextIndex;
        continue;
      }

      currentIndex++;
    }

    return elements.length > 0 ? elements : [
      <div key="no-content" className="text-center py-8 text-gray-500">
        <p>No content could be processed for display.</p>
      </div>
    ];
  }, []);

  // Extract consecutive list items
  const extractConsecutiveItems = (lines: string[], startIndex: number, pattern: RegExp) => {
    const items: string[] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length && pattern.test(lines[currentIndex])) {
      const cleanItem = lines[currentIndex].replace(pattern, '').trim();
      if (cleanItem.length > 0) {
        items.push(cleanItem);
      }
      currentIndex++;
    }

    return { items, nextIndex: currentIndex };
  };

  // Collect paragraph lines until list or heading
  const collectParagraphLines = (lines: string[], startIndex: number) => {
    const paragraphLines: string[] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length &&
           !/^\d+\.\s/.test(lines[currentIndex]) &&
           !/^[-•*]\s/.test(lines[currentIndex]) &&
           !/^<h[1-6]/.test(lines[currentIndex]) &&
           !/^#{1,6}\s/.test(lines[currentIndex])) {
      
      if (lines[currentIndex].trim().length > 0) {
        paragraphLines.push(lines[currentIndex]);
      }
      currentIndex++;

      // Break on empty line (paragraph boundary)
      if (currentIndex < lines.length && lines[currentIndex].trim() === '') {
        currentIndex++; // Skip the empty line
        break;
      }
    }

    return { lines: paragraphLines, nextIndex: currentIndex };
  };

  // Create numbered list element
  const createNumberedList = (items: string[], index: number) => (
    <ol key={`numbered-list-${index}`} className="ml-6 space-y-3 list-decimal list-outside">
      {items.map((item, idx) => (
        <li key={idx} className="text-lg leading-7 text-gray-700 pl-3 font-normal">
          {processTextContent(item, `${index}-${idx}`)}
        </li>
      ))}
    </ol>
  );

  // Create bullet list element
  const createBulletList = (items: string[], index: number) => (
    <ul key={`bullet-list-${index}`} className="ml-6 space-y-3 list-disc list-outside">
      {items.map((item, idx) => (
        <li key={idx} className="text-lg leading-7 text-gray-700 pl-3 font-normal">
          {processTextContent(item, `${index}-${idx}`)}
        </li>
      ))}
    </ul>
  );

  // Create heading element
  const createHeading = (line: string, index: number) => {
    // Extract heading text and level
    let headingText = line;
    let level = 3; // Default to h3

    if (line.startsWith('<h')) {
      const match = line.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/);
      if (match) {
        level = parseInt(match[1]) + 1; // Shift down one level
        headingText = match[2];
      }
    } else if (line.startsWith('#')) {
      const hashes = line.match(/^#+/)?.[0].length || 1;
      level = Math.min(hashes + 2, 6); // Shift down by 2, max h6
      headingText = line.replace(/^#+\s*/, '');
    }

    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

    return (
      <HeadingTag
        key={`heading-${index}`}
        className={`font-bold text-gray-900 tracking-tight ${
          level === 3 ? 'text-2xl' : 
          level === 4 ? 'text-xl' : 
          level === 5 ? 'text-lg' : 'text-base'
        }`}
      >
        {processTextContent(headingText, `heading-${index}`)}
      </HeadingTag>
    );
  };

  // Create paragraph element with smart text breaking
  const createParagraph = (text: string, index: number) => {
    // Break long paragraphs intelligently
    const sentences = text.split(/([.!?]+\s+)/).filter(Boolean);
    const paragraphs: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] || '';
      const delimiter = sentences[i + 1] || '';
      const fullSentence = sentence + delimiter;

      if (currentParagraph.length > 0 && (currentParagraph.length + fullSentence.length) > 300) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = fullSentence;
      } else {
        currentParagraph += fullSentence;
      }

      // End paragraph after 2-3 sentences if reasonable length
      const sentenceCount = (currentParagraph.match(/[.!?]/g) || []).length;
      if (sentenceCount >= 3 || (sentenceCount >= 2 && currentParagraph.length > 200)) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    }

    if (currentParagraph.trim().length > 0) {
      paragraphs.push(currentParagraph.trim());
    }

    return paragraphs.map((paragraph, idx) => (
      <div
        key={`paragraph-${index}-${idx}`}
        className="text-lg leading-8 text-gray-700 font-normal"
        style={{ textAlign: 'justify', lineHeight: '1.75' }}
      >
        {processTextContent(paragraph, `${index}-${idx}`)}
      </div>
    ));
  };

  // Process text content with comprehensive markdown and HTML handling
  const processTextContent = useCallback((text: string, elementId: string) => {
    let processedText = text;

    // Clean up any remaining HTML artifacts
    processedText = processedText
      .replace(/<\/?div[^>]*>/gi, '') // Remove div tags
      .replace(/<\/?span[^>]*>/gi, '') // Remove span tags
      .replace(/<br\s*\/?>/gi, ' ') // Convert br tags to spaces
      .replace(/&nbsp;/gi, ' ') // Convert non-breaking spaces
      .replace(/&amp;/gi, '&') // Convert HTML entities
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"');

    // Process existing markdown links first
    processedText = processedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, linkText, url) => {
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        return `<a href="${cleanUrl}" class="inline-link text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2 transition-colors duration-200 bg-blue-50/30 hover:bg-blue-50/50 px-1 py-0.5 rounded" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
      }
    );

    // Process inline code first (to preserve it from other formatting)
    const codeBlocks: string[] = [];
    processedText = processedText.replace(
      /`([^`]+)`/g,
      (match, code) => {
        const index = codeBlocks.length;
        codeBlocks.push(`<code class="bg-gray-100 text-purple-700 px-2 py-1 rounded text-sm font-mono">${code}</code>`);
        return `__CODE_BLOCK_${index}__`;
      }
    );

    // Smart anchor text insertion (only for specific elements to avoid over-linking)
    if (targetKeyword && anchorText && targetUrl && shouldInsertAnchorText(elementId)) {
      const keywordRegex = new RegExp(`\\b${targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (keywordRegex.test(processedText) && !processedText.includes(targetUrl)) {
        processedText = processedText.replace(
          keywordRegex,
          `<a href="${targetUrl}" class="anchor-link text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2 transition-colors duration-200" target="_blank" rel="noopener noreferrer">${anchorText}</a>`
        );
      }
    }

    // Process bold text with multiple patterns
    processedText = processedText
      // Handle section headers that end with :** pattern (like "Data Point:**" or "Title Tags and Meta Descriptions:**")
      // This matches text that starts with a letter, can contain letters, spaces, and common punctuation, ends with a colon and two asterisks
      .replace(/\b([A-Za-z][A-Za-z\s&,.-]+?):\*\*/g, '<strong class="font-bold text-gray-900">$1:</strong>')
      // Also handle patterns at the start of lines
      .replace(/^([A-Za-z][^:\n]*?):\*\*/gm, '<strong class="font-bold text-gray-900">$1:</strong>')
      // Handle multi-line bold text where ** is followed by whitespace and newline (most common case)
      .replace(/\*\*\s*\n\s*([^*]+?)(?=\n\s*\n|\n\s*$|$)/gs, '<strong class="font-bold text-gray-900">$1</strong>')
      // Handle ** at start of paragraph followed by content
      .replace(/^\*\*\s*\n\s*(.+?)(?=\n\s*\n|\n\s*$|$)/gms, '<strong class="font-bold text-gray-900">$1</strong>')
      // Standard markdown bold patterns (single line)
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      // Multi-line bold patterns (without newline after opening **) - fallback
      .replace(/\*\*([^*]+?)\*\*/gs, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/__([^_]+)__/g, '<strong class="font-bold text-gray-900">$1</strong>');

    // Process italic text with multiple patterns
    processedText = processedText
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-800 font-medium">$1</em>')
      .replace(/_([^_]+)_/g, '<em class="italic text-gray-800 font-medium">$1</em>');

    // Process strikethrough text
    processedText = processedText.replace(
      /~~([^~]+)~~/g,
      '<del class="line-through text-gray-500">$1</del>'
    );

    // Restore code blocks
    codeBlocks.forEach((code, index) => {
      processedText = processedText.replace(`__CODE_BLOCK_${index}__`, code);
    });

    // Clean up excessive whitespace and formatting artifacts
    processedText = processedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s*([.!?])\s*/g, '$1 ') // Fix punctuation spacing
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentence ending
      .trim();

    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  }, [targetKeyword, anchorText, targetUrl]);

  // Determine if anchor text should be inserted in this element
  const shouldInsertAnchorText = (elementId: string): boolean => {
    // Insert anchor text in middle elements to appear natural
    const numericPart = elementId.split('-').pop();
    const elementNumber = parseInt(numericPart || '0');
    
    // Insert in elements that are likely in the middle of content
    return elementNumber % 7 === 3 || elementNumber % 11 === 5;
  };

  // Handle content regeneration
  const handleContentRegeneration = async () => {
    if (!targetKeyword || !anchorText || !targetUrl) return;

    setIsRegenerating(true);
    try {
      const result = await enhancedBlogContentGenerator.generateContent({
        keyword: targetKeyword,
        anchorText,
        targetUrl
      });

      if (result.success && onRegenerateContent) {
        onRegenerateContent();
      }
    } catch (error) {
      console.error('Content regeneration failed:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="prose prose-xl prose-slate max-w-none enhanced-blog-content">
      <div className="space-y-8">
        {processContent(content)}
      </div>
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

// Enhanced Status Badge Component
const EnhancedStatusBadge = ({ 
  blogPost, 
  user, 
  authorEmail, 
  onClaim, 
  onUnclaim, 
  onDelete,
  onRegenerate,
  claiming = false 
}: {
  blogPost: BlogPost;
  user: any;
  authorEmail?: string | null;
  onClaim: () => void;
  onUnclaim: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
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
            <Button
              onClick={onRegenerate}
              variant="outline"
              size="sm"
              className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
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

// Main Component
const BeautifulBlogPost = () => {
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

  // Computed values
  const { effectiveScore, isPremiumScore } = usePremiumSEOScore(blogPost);
  
  const cleanTitle = useMemo(() => {
    if (!blogPost?.title) return '';
    
    // Enhanced title cleaning
    return blogPost.title
      .replace(/^h\d+[-\s]*/, '') // Remove h1-, h2-, etc. prefixes
      .replace(/[-\s]*[a-z0-9]{8}$/, '') // Remove random suffixes
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

  // Load blog post with enhanced error handling
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

  // Handle content regeneration
  const handleContentRegeneration = async () => {
    if (!blogPost || !blogPost.keywords?.[0] || !blogPost.anchor_text || !blogPost.target_url) {
      toast({
        title: "Cannot Regenerate",
        description: "Missing required information for content regeneration",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await enhancedBlogContentGenerator.generateContent({
        keyword: blogPost.keywords[0],
        anchorText: blogPost.anchor_text,
        targetUrl: blogPost.target_url,
        userId: user?.id
      });

      if (result.success) {
        // Update the blog post with new content
        const updatedPost = await blogService.updateBlogPost(blogPost.id, {
          content: result.content,
          title: result.title,
          word_count: result.wordCount
        });

        setBlogPost(updatedPost);
        
        toast({
          title: "Content Regenerated! ✨",
          description: "The blog post has been updated with fresh content",
        });
      } else {
        throw new Error(result.error || 'Content regeneration failed');
      }
    } catch (error: any) {
      toast({
        title: "Regeneration Failed",
        description: error.message || 'Unable to regenerate content',
        variant: "destructive"
      });
    }
  };

  // Handle claim
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

        {/* Supabase Connection Fixer */}
        <div className="max-w-4xl mx-auto px-6 py-2">
          <SupabaseConnectionFixerComponent onConnectionRestored={() => slug && loadBlogPost(slug)} />
        </div>

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
          
          {/* Enhanced Status Badge */}
          <EnhancedStatusBadge
            blogPost={blogPost}
            user={user}
            authorEmail={authorEmail}
            onClaim={handleClaim}
            onUnclaim={() => setShowUnclaimDialog(true)}
            onDelete={() => setShowDeleteDialog(true)}
            onRegenerate={handleContentRegeneration}
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
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="relative">
                <div className="px-8 md:px-12 lg:px-16 py-12 md:py-16">
                  <EnhancedContentProcessor
                    content={blogPost.content || ''}
                    title={cleanTitle}
                    targetKeyword={blogPost.keywords?.[0]}
                    anchorText={blogPost.anchor_text}
                    targetUrl={blogPost.target_url}
                    onRegenerateContent={handleContentRegeneration}
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
};

export { BeautifulBlogPost };
export default BeautifulBlogPost;
