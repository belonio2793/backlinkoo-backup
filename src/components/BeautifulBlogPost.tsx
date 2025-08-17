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
  ShieldCheck, XCircle, MessageCircle, RefreshCw, Wand2,
  BookOpen, Hash, Quote
} from 'lucide-react';

// Components
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

// Enhanced Content Processor for optimal SEO and readability
interface EnhancedContentProcessorProps {
  content: string;
  title: string;
  targetKeyword?: string;
  anchorText?: string;
  targetUrl?: string;
  onRegenerateContent?: () => void;
}

// Advanced content structure analyzer for perfect readability
const analyzeContentStructure = (content: string) => {
  const analysis = {
    hasHeadings: /#{1,6}\s|<h[1-6]/.test(content),
    hasLists: /^\s*[-*+]\s|^\s*\d+\.\s/m.test(content),
    hasBlockquotes: /^\s*>/m.test(content),
    averageSentenceLength: 0,
    paragraphCount: 0,
    readabilityScore: 0
  };

  // Calculate average sentence length for readability
  const sentences = content.match(/[.!?]+/g);
  const words = content.match(/\b\w+\b/g);
  if (sentences && words) {
    analysis.averageSentenceLength = words.length / sentences.length;
  }

  // Count paragraphs
  analysis.paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  // Basic readability score (Flesch-Kincaid inspired)
  if (analysis.averageSentenceLength > 0) {
    analysis.readabilityScore = Math.max(0, Math.min(100, 
      100 - ((analysis.averageSentenceLength * 1.015) + (6.84 * 1))
    ));
  }

  return analysis;
};

// Enhanced Content Processor with superior structure and SEO optimization
const EnhancedContentProcessor = ({ 
  content, 
  title, 
  targetKeyword, 
  anchorText, 
  targetUrl,
  onRegenerateContent
}: EnhancedContentProcessorProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState(analyzeContentStructure(content));

  useEffect(() => {
    setContentAnalysis(analyzeContentStructure(content));
  }, [content]);

  // Enhanced content processing with superior semantic HTML structure
  const processContent = useCallback((rawContent: string) => {
    if (!rawContent?.trim()) {
      return (
        <section className="text-center py-16" role="alert" aria-live="polite">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-6" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Unavailable</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            This article content is currently being processed or has encountered an issue.
          </p>
          {onRegenerateContent && (
            <Button
              onClick={handleContentRegeneration}
              disabled={isRegenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200"
              aria-label="Regenerate article content"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-3 animate-spin" aria-hidden="true" />
                  Regenerating Content...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-3" aria-hidden="true" />
                  Regenerate Content
                </>
              )}
            </Button>
          )}
        </section>
      );
    }

    // Comprehensive content cleaning and optimization
    let cleanContent = EnhancedBlogCleaner.cleanContent(rawContent, title);

    // Advanced content normalization for web standards
    cleanContent = cleanContent
      // Remove AI generation artifacts and metadata
      .replace(/(?:Natural Link Integration|Link Placement|Anchor Text|URL Integration|Link Strategy|Backlink Placement):\s*/gi, '')
      // Normalize whitespace and punctuation
      .replace(/\s+/g, ' ')
      .replace(/\s+([.!?])/g, '$1')
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      // Remove title duplication with enhanced pattern matching
      .replace(new RegExp(`^\\s*(?:##+\\s*)?${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\n|$)`, 'gim'), '')
      .trim();

    // Parse content into semantic HTML structure
    return parseContentIntoSemanticHTML(cleanContent);
  }, [title, targetKeyword, anchorText, targetUrl, onRegenerateContent, isRegenerating]);

  // Parse content into semantic HTML with accessibility and SEO optimization
  const parseContentIntoSemanticHTML = useCallback((content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    let headingCount = 0;

    while (currentIndex < lines.length) {
      const line = lines[currentIndex];

      if (!line?.trim()) {
        currentIndex++;
        continue;
      }

      // Enhanced heading detection with proper hierarchy
      if (isHeading(line)) {
        headingCount++;
        const headingElement = createSemanticHeading(line, currentIndex, headingCount);
        elements.push(headingElement);
        currentIndex++;
        continue;
      }

      // Numbered lists with proper semantic structure
      if (/^\d+\.\s/.test(line)) {
        const listData = extractOrderedList(lines, currentIndex);
        elements.push(createSemanticOrderedList(listData.items, currentIndex));
        currentIndex = listData.nextIndex;
        continue;
      }

      // Bullet lists with enhanced detection
      if (/^[-•*+●○]\s/.test(line)) {
        const listData = extractUnorderedList(lines, currentIndex);
        elements.push(createSemanticUnorderedList(listData.items, currentIndex));
        currentIndex = listData.nextIndex;
        continue;
      }

      // Blockquotes for testimonials and emphasis
      if (/^>\s/.test(line)) {
        const quoteData = extractBlockquote(lines, currentIndex);
        elements.push(createSemanticBlockquote(quoteData.items, currentIndex));
        currentIndex = quoteData.nextIndex;
        continue;
      }

      // Enhanced paragraph creation with readability optimization
      const paragraphData = extractParagraph(lines, currentIndex);
      if (paragraphData.lines.length > 0) {
        elements.push(createSemanticParagraph(paragraphData.lines.join(' '), paragraphData.nextIndex));
        currentIndex = paragraphData.nextIndex;
        continue;
      }

      currentIndex++;
    }

    // Ensure content is wrapped in semantic sections
    return elements.length > 0 ? (
      <div className="prose prose-xl prose-slate max-w-none" role="main">
        {elements}
      </div>
    ) : (
      <section className="text-center py-12" role="alert">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <p className="text-lg text-gray-600">Content processing complete. No readable content found.</p>
      </section>
    );
  }, [targetKeyword, anchorText, targetUrl]);

  // Helper functions for content parsing

  const isHeading = (line: string): boolean => {
    return /^#{1,6}\s/.test(line) || 
           /^<h[1-6]/.test(line) || 
           (line.length > 5 && line.length < 100 && !line.includes('.') && !line.includes(','));
  };

  const extractOrderedList = (lines: string[], startIndex: number) => {
    const items: string[] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length && /^\d+\.\s/.test(lines[currentIndex])) {
      const cleanItem = lines[currentIndex].replace(/^\d+\.\s/, '').trim();
      if (cleanItem.length > 0) {
        items.push(cleanItem);
      }
      currentIndex++;
    }

    return { items, nextIndex: currentIndex };
  };

  const extractUnorderedList = (lines: string[], startIndex: number) => {
    const items: string[] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length && /^[-•*+●○]\s/.test(lines[currentIndex])) {
      const cleanItem = lines[currentIndex].replace(/^[-•*+●○]\s/, '').trim();
      if (cleanItem.length > 0) {
        items.push(cleanItem);
      }
      currentIndex++;
    }

    return { items, nextIndex: currentIndex };
  };

  const extractBlockquote = (lines: string[], startIndex: number) => {
    const items: string[] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length && /^>\s/.test(lines[currentIndex])) {
      const cleanItem = lines[currentIndex].replace(/^>\s/, '').trim();
      if (cleanItem.length > 0) {
        items.push(cleanItem);
      }
      currentIndex++;
    }

    return { items, nextIndex: currentIndex };
  };

  const extractParagraph = (lines: string[], startIndex: number) => {
    const paragraphLines: string[] = [];
    let currentIndex = startIndex;

    while (currentIndex < lines.length &&
           !isHeading(lines[currentIndex]) &&
           !/^\d+\.\s/.test(lines[currentIndex]) &&
           !/^[-•*+●○]\s/.test(lines[currentIndex]) &&
           !/^>\s/.test(lines[currentIndex])) {
      
      if (lines[currentIndex].trim().length > 0) {
        paragraphLines.push(lines[currentIndex]);
      }
      currentIndex++;

      // Break on empty line (paragraph boundary)
      if (currentIndex < lines.length && lines[currentIndex].trim() === '') {
        currentIndex++;
        break;
      }
    }

    return { lines: paragraphLines, nextIndex: currentIndex };
  };

  // Semantic HTML element creators

  const createSemanticHeading = (line: string, index: number, headingNumber: number) => {
    let headingText = line;
    let level = 2; // Start with h2 for article content

    if (line.startsWith('<h')) {
      const match = line.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/);
      if (match) {
        level = Math.min(parseInt(match[1]) + 1, 6);
        headingText = match[2];
      }
    } else if (line.startsWith('#')) {
      const hashes = line.match(/^#+/)?.[0].length || 1;
      level = Math.min(hashes + 1, 6);
      headingText = line.replace(/^#+\s*/, '');
    }

    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
    const headingId = `section-${headingNumber}`;

    return (
      <HeadingTag
        key={`heading-${index}`}
        id={headingId}
        className={`font-bold text-gray-900 tracking-tight mb-6 mt-12 scroll-mt-24 ${
          level === 2 ? 'text-3xl lg:text-4xl' : 
          level === 3 ? 'text-2xl lg:text-3xl' : 
          level === 4 ? 'text-xl lg:text-2xl' : 
          level === 5 ? 'text-lg lg:text-xl' : 'text-base lg:text-lg'
        }`}
        role="heading"
        aria-level={level}
      >
        <Hash className="inline h-6 w-6 mr-3 text-blue-600 opacity-70" aria-hidden="true" />
        {processInlineContent(headingText, `heading-${index}`)}
      </HeadingTag>
    );
  };

  const createSemanticOrderedList = (items: string[], index: number) => (
    <ol 
      key={`ordered-list-${index}`} 
      className="ml-8 space-y-4 list-decimal list-outside my-8"
      role="list"
    >
      {items.map((item, idx) => (
        <li 
          key={idx} 
          className="text-lg leading-8 text-gray-700 pl-4 font-normal"
          role="listitem"
        >
          {processInlineContent(item, `ol-${index}-${idx}`)}
        </li>
      ))}
    </ol>
  );

  const createSemanticUnorderedList = (items: string[], index: number) => (
    <ul 
      key={`unordered-list-${index}`} 
      className="ml-8 space-y-4 list-disc list-outside my-8"
      role="list"
    >
      {items.map((item, idx) => (
        <li 
          key={idx} 
          className="text-lg leading-8 text-gray-700 pl-4 font-normal"
          role="listitem"
        >
          {processInlineContent(item, `ul-${index}-${idx}`)}
        </li>
      ))}
    </ul>
  );

  const createSemanticBlockquote = (items: string[], index: number) => (
    <blockquote 
      key={`blockquote-${index}`}
      className="border-l-4 border-blue-500 pl-8 py-6 my-8 bg-blue-50/30 rounded-r-lg"
      role="blockquote"
    >
      <Quote className="h-8 w-8 text-blue-500 mb-4 opacity-60" aria-hidden="true" />
      {items.map((item, idx) => (
        <p key={idx} className="text-lg leading-8 text-gray-700 italic font-medium mb-4 last:mb-0">
          {processInlineContent(item, `quote-${index}-${idx}`)}
        </p>
      ))}
    </blockquote>
  );

  const createSemanticParagraph = (text: string, index: number) => {
    // Intelligent paragraph breaking for optimal readability
    const sentences = text.split(/([.!?]+\s+)/).filter(Boolean);
    const paragraphs: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] || '';
      const delimiter = sentences[i + 1] || '';
      const fullSentence = sentence + delimiter;

      // Break paragraphs at optimal length for readability (250-350 words)
      if (currentParagraph.length > 0 && (currentParagraph.length + fullSentence.length) > 1400) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = fullSentence;
      } else {
        currentParagraph += fullSentence;
      }

      // Create natural paragraph breaks after 2-4 sentences
      const sentenceCount = (currentParagraph.match(/[.!?]/g) || []).length;
      if (sentenceCount >= 4 || (sentenceCount >= 2 && currentParagraph.length > 800)) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    }

    if (currentParagraph.trim().length > 0) {
      paragraphs.push(currentParagraph.trim());
    }

    return paragraphs.map((paragraph, idx) => (
      <p
        key={`paragraph-${index}-${idx}`}
        className="text-lg leading-9 text-gray-700 font-normal mb-6 text-justify hyphens-auto"
        style={{ 
          textAlign: 'justify',
          lineHeight: '1.8',
          letterSpacing: '0.01em'
        }}
      >
        {processInlineContent(paragraph, `p-${index}-${idx}`)}
      </p>
    ));
  };

  // Enhanced inline content processing with accessibility and SEO
  const processInlineContent = useCallback((text: string, elementId: string) => {
    let processedText = text;

    // Clean HTML entities and artifacts
    processedText = processedText
      .replace(/<\/?(?:div|span)[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"');

    // Process markdown links with enhanced accessibility
    processedText = processedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, linkText, url) => {
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        return `<a href="${cleanUrl}" class="inline-link text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2 transition-all duration-200 bg-blue-50/20 hover:bg-blue-50/40 px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" target="_blank" rel="noopener noreferrer" aria-label="External link: ${linkText.trim()}">${linkText.trim()}</a>`;
      }
    );

    // Process inline code with syntax highlighting
    processedText = processedText.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 text-purple-700 px-2 py-1 rounded text-sm font-mono border border-gray-200 shadow-sm">$1</code>'
    );

    // Smart anchor text insertion for natural link placement
    if (targetKeyword && anchorText && targetUrl && shouldInsertAnchorText(elementId)) {
      const keywordRegex = new RegExp(`\\b${targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (keywordRegex.test(processedText) && !processedText.includes(targetUrl)) {
        processedText = processedText.replace(
          keywordRegex,
          `<a href="${targetUrl}" class="anchor-link text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" target="_blank" rel="noopener noreferrer" aria-label="Learn more: ${anchorText}">${anchorText}</a>`
        );
      }
    }

    // Enhanced text formatting with proper semantic markup
    processedText = processedText
      // Section headers with colons
      .replace(/\b([A-Za-z][A-Za-z\s&,.-]+?):\*\*/g, '<strong class="font-bold text-gray-900 block mb-3">$1:</strong>')
      .replace(/^([A-Za-z][^:\n]*?):\*\*/gm, '<strong class="font-bold text-gray-900 block mb-3">$1:</strong>')
      // Bold text formatting
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/__([^_]+)__/g, '<strong class="font-bold text-gray-900">$1</strong>')
      // Italic text formatting
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-800 font-medium">$1</em>')
      .replace(/_([^_]+)_/g, '<em class="italic text-gray-800 font-medium">$1</em>')
      // Strikethrough formatting
      .replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500">$1</del>');

    // Final cleanup for optimal presentation
    processedText = processedText
      .replace(/\s+/g, ' ')
      .replace(/\s*([.!?])\s*/g, '$1 ')
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      .replace(/^\*\*\s*|\s*\*\*$/g, '')
      .trim();

    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  }, [targetKeyword, anchorText, targetUrl]);

  // Determine optimal anchor text placement for natural SEO
  const shouldInsertAnchorText = (elementId: string): boolean => {
    const numericPart = elementId.split('-').pop();
    const elementNumber = parseInt(numericPart || '0');
    
    // Strategic placement for natural link distribution
    return elementNumber % 8 === 3 || elementNumber % 13 === 7;
  };

  // Handle content regeneration with user feedback
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
    <article className="enhanced-blog-content" role="article" aria-labelledby="article-title">
      <div className="space-y-8">
        {processContent(content)}
      </div>
      
      {/* Content quality indicator */}
      {contentAnalysis.readabilityScore > 0 && (
        <aside className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg" role="complementary">
          <p className="text-sm text-green-700">
            <ShieldCheck className="inline h-4 w-4 mr-2" aria-hidden="true" />
            Content readability score: {Math.round(contentAnalysis.readabilityScore)}/100
          </p>
        </aside>
      )}
    </article>
  );
};

// Reading Progress Indicator with enhanced UX
const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      
      setProgress(Math.min(Math.max(scrolled, 0), 100));
      setIsVisible(scrolled > 5); // Show after scrolling 5%
    };

    let timeoutId: NodeJS.Timeout;
    const throttledUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateProgress, 16); // ~60fps
    };

    window.addEventListener('scroll', throttledUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 z-50 transition-all duration-300 shadow-lg"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    />
  );
};

// Enhanced Status Badge with accessibility improvements
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
      <section className="flex items-center justify-center gap-4 mb-12" role="status" aria-live="polite">
        <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full shadow-sm">
          <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
          <div className="text-center">
            <span className="font-semibold text-green-700 text-lg">
              {isOwnPost ? 'Your Article' : 'Claimed Article'}
            </span>
            {!isOwnPost && authorEmail && (
              <div className="text-sm text-green-600 mt-1">
                by {maskEmail(authorEmail)}
              </div>
            )}
          </div>
        </div>
        
        {isOwnPost && (
          <div className="flex gap-3">
            <Button
              onClick={onRegenerate}
              variant="outline"
              size="sm"
              className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-200"
              aria-label="Regenerate article content"
            >
              <Wand2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Regenerate
            </Button>
            {canUnclaim && (
              <Button
                onClick={onUnclaim}
                variant="outline"
                size="sm"
                className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-50 transition-all duration-200"
                aria-label="Unclaim this article"
              >
                <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Unclaim
              </Button>
            )}
            {canDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="rounded-full border-red-300 text-red-700 hover:bg-red-50 transition-all duration-200"
                aria-label="Delete this article"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="flex items-center justify-center gap-4 mb-12" role="status" aria-live="polite">
      <Badge className="px-6 py-3 text-base font-medium rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300">
        <Timer className="mr-2 h-5 w-5" aria-hidden="true" />
        Available to Claim
      </Badge>
      
      <div className="flex gap-3">
        {canClaim && (
          <Button
            onClick={onClaim}
            disabled={claiming}
            size="sm"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 transition-all duration-200"
            aria-label={user ? 'Claim this article' : 'Login to claim this article'}
          >
            {claiming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" aria-hidden="true" />
                Claiming...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-5 w-5" aria-hidden="true" />
                {user ? 'Claim Article' : 'Login to Claim'}
              </>
            )}
          </Button>
        )}
        {canDelete && (
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="rounded-full border-red-300 text-red-700 hover:bg-red-50 transition-all duration-200"
            aria-label="Delete this article"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </section>
  );
};

// Main Beautiful Blog Post Component
const BeautifulBlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Computed values with enhanced processing
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
    return Math.max(1, Math.ceil(wordCount / 250)); // 250 words per minute average
  }, [blogPost?.content, blogPost?.reading_time]);

  const formattedDate = useMemo(() => {
    if (!blogPost?.created_at) return 'Date unavailable';
    try {
      return format(new Date(blogPost.created_at), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  }, [blogPost?.created_at]);

  // Enhanced blog post loading with comprehensive error handling
  const loadBlogPost = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      const post = await blogService.getBlogPostBySlug(slug);
      
      if (!post) {
        setError(new Error(`Article not found: ${slug}`));
        return;
      }

      setBlogPost(post);

      // Fetch author information for claimed posts
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
          console.warn('Could not fetch author information:', error);
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

  // Enhanced content regeneration
  const handleContentRegeneration = async () => {
    if (!blogPost?.keywords?.[0] || !blogPost.anchor_text || !blogPost.target_url) {
      toast({
        title: "Regeneration Unavailable",
        description: "This article is missing required information for content regeneration.",
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
        const updatedPost = await blogService.updateBlogPost(blogPost.id, {
          content: result.content,
          title: result.title,
          word_count: result.wordCount
        });

        setBlogPost(updatedPost);
        
        toast({
          title: "Content Regenerated Successfully! ✨",
          description: "Your article has been updated with fresh, optimized content.",
        });
      } else {
        throw new Error(result.error || 'Content regeneration failed');
      }
    } catch (error: any) {
      toast({
        title: "Regeneration Failed",
        description: error.message || 'Unable to regenerate content at this time.',
        variant: "destructive"
      });
    }
  };

  // Enhanced claim handling
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
          title: "Article Claimed Successfully! 🎉",
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
        title: "Unexpected Error",
        description: "An error occurred while claiming the article. Please try again.",
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
          text: blogPost?.meta_description || blogPost?.excerpt || `Read "${cleanTitle}" - an insightful article.`,
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

  // Loading state with enhanced UX
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="flex items-center justify-center py-24" role="main">
          <div className="text-center space-y-6 max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" aria-hidden="true" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Loading Article</h1>
              <p className="text-lg text-gray-600">Please wait while we prepare your content...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state with enhanced UX
  if (error || !blogPost) {
    return (
      <>
        <Header />
        <BlogErrorBoundary
          error={error || new Error('Article not found')}
          slug={slug}
          onRetry={() => slug && loadBlogPost(slug)}
        />
        <Footer />
      </>
    );
  }

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": cleanTitle,
    "description": blogPost.meta_description || blogPost.excerpt,
    "datePublished": blogPost.created_at,
    "dateModified": blogPost.updated_at || blogPost.created_at,
    "wordCount": blogPost.word_count,
    "keywords": blogPost.keywords?.join(', '),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="beautiful-blog-wrapper min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        
        {/* Structured Data for SEO */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Reading Progress Indicator */}
        <ReadingProgress />
        
        <Header />

        {/* Connection Health Check */}
        <div className="max-w-4xl mx-auto px-6 py-2">
          <SupabaseConnectionFixerComponent onConnectionRestored={() => slug && loadBlogPost(slug)} />
        </div>

        {/* Enhanced Navigation */}
        <nav className="sticky top-16 z-30 border-b border-gray-200/50 bg-white/90 backdrop-blur-md" role="navigation">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-200"
                aria-label="Return to blog listing"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Articles
              </Button>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="rounded-full transition-all duration-200"
                  aria-label="Share this article"
                >
                  <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Share
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="rounded-full transition-all duration-200"
                  aria-label="Copy article link"
                >
                  <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Article Container */}
        <main className="max-w-5xl mx-auto px-6 py-16 lg:px-8" role="main">
          
          {/* Article Status */}
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

          {/* Article Header with Enhanced SEO */}
          <header className="text-center mb-20">
            <div className="mb-16">
              <h1 
                id="article-title"
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8 tracking-tight max-w-4xl mx-auto"
              >
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

            {/* Enhanced Meta Information */}
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 py-6 border-t border-b border-gray-200/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  <time dateTime={blogPost.created_at} className="text-gray-700">
                    {formattedDate}
                  </time>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <span className="text-gray-700">{readingTime} minute read</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-5 w-5 text-purple-600" aria-hidden="true" />
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

          {/* Enhanced Article Content */}
          <section className="mb-20">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
              <div className="relative">
                <div className="px-8 md:px-12 lg:px-20 py-16 md:py-20">
                  <EnhancedContentProcessor
                    content={blogPost.content || ''}
                    title={cleanTitle}
                    targetKeyword={blogPost.keywords?.[0]}
                    anchorText={blogPost.anchor_text}
                    targetUrl={blogPost.target_url}
                    onRegenerateContent={handleContentRegeneration}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-50/5 pointer-events-none" />
              </div>
            </Card>
          </section>

          {/* Enhanced Keywords Section */}
          {blogPost.keywords?.length && (
            <section className="mb-16">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50/50 via-white to-blue-50/50">
                <CardContent className="p-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center justify-center gap-3">
                    <Sparkles className="h-8 w-8 text-purple-600" aria-hidden="true" />
                    Article Topics & Keywords
                  </h2>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {blogPost.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="px-8 py-4 bg-white/90 border-purple-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 rounded-full text-base font-medium shadow-sm hover:shadow-md"
                      >
                        <Hash className="h-4 w-4 mr-2 text-purple-500" aria-hidden="true" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Enhanced Engagement Section */}
          <section className="mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
              <CardContent className="p-16 text-center">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">
                    Found This Article Helpful?
                  </h2>
                  <p className="text-gray-600 mb-12 text-xl leading-relaxed font-light">
                    Share it with your network and help others discover valuable insights! Your engagement helps us create more quality content.
                  </p>
                  <div className="flex justify-center gap-6">
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="lg"
                      className="rounded-full px-10 py-4 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 text-lg"
                      aria-label="Share this article on social media"
                    >
                      <Share2 className="mr-3 h-6 w-6" aria-hidden="true" />
                      Share Article
                    </Button>
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      size="lg"
                      className="rounded-full px-10 py-4 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 text-lg"
                      aria-label="Copy article link to clipboard"
                    >
                      <Copy className="mr-3 h-6 w-6" aria-hidden="true" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

        </main>

        {/* Enhanced Dialog Components */}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3 text-xl">
                <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                Delete Article
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base leading-relaxed">
                Are you sure you want to permanently delete "{cleanTitle}"? This action cannot be undone and will remove the article from all systems.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="px-6 py-2">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700 px-6 py-2"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unclaim Confirmation Dialog */}
        <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3 text-xl">
                <XCircle className="h-6 w-6 text-orange-600" aria-hidden="true" />
                Unclaim Article
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base leading-relaxed">
                Are you sure you want to unclaim "{cleanTitle}"? This will return the article to the available pool for others to claim.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="px-6 py-2">Keep Claimed</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleUnclaim} 
                className="bg-orange-600 hover:bg-orange-700 px-6 py-2"
              >
                Unclaim Article
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Claim Login Modal */}
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

        {/* Premium Payment Modal */}
        <EnhancedUnifiedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          defaultTab="premium"
          onSuccess={() => {
            setShowPaymentModal(false);
            toast({
              title: "Welcome to Premium! 🌟",
              description: "Your premium subscription is now active. Enjoy enhanced features!",
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
