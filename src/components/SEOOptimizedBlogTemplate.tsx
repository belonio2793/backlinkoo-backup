import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Lightbulb, 
  ArrowRight, 
  Quote, 
  Clock, 
  BookOpen, 
  List, 
  ChevronUp, 
  Share2, 
  Copy,
  Target,
  Star,
  TrendingUp,
  Calendar,
  Eye,
  Search,
  ExternalLink,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SEOOptimizedBlogTemplateProps {
  title: string;
  content: string;
  metaDescription?: string;
  keywords?: string[];
  targetUrl?: string;
  anchorText?: string;
  author?: string;
  publishDate?: string;
  readingTime?: number;
  seoScore?: number;
  viewCount?: number;
  slug?: string;
}

export function SEOOptimizedBlogTemplate({
  title,
  content,
  metaDescription,
  keywords = [],
  targetUrl,
  anchorText,
  author = "Content Creator",
  publishDate = new Date().toISOString(),
  readingTime,
  seoScore = 85,
  viewCount = 0,
  slug
}: SEOOptimizedBlogTemplateProps) {
  const { toast } = useToast();
  const [readingProgress, setReadingProgress] = useState(0);
  const [showTOC, setShowTOC] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Calculate reading progress and scroll position
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate reading time if not provided
  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const actualReadingTime = readingTime || calculateReadingTime(content);

  // Parse content into structured elements for better SEO and readability
  const parseContent = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements: any[] = [];
    
    const processNode = (node: Node, index: number = 0): any => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        return text && text.length > 10 ? { type: 'text', content: text, id: `text-${index}` } : null;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const content = element.textContent?.trim() || '';
        const innerHTML = element.innerHTML;
        
        // Skip empty elements
        if (!content && !innerHTML) return null;
        
        switch (tagName) {
          case 'h1':
            return { type: 'h1', content, id: generateSlug(content, index) };
          case 'h2':
            return { type: 'h2', content, id: generateSlug(content, index) };
          case 'h3':
            return { type: 'h3', content, id: generateSlug(content, index) };
          case 'h4':
            return { type: 'h4', content, id: generateSlug(content, index) };
          case 'h5':
            return { type: 'h5', content, id: generateSlug(content, index) };
          case 'h6':
            return { type: 'h6', content, id: generateSlug(content, index) };
          case 'p':
            return { type: 'paragraph', content: innerHTML, id: `p-${index}` };
          case 'ul':
            const listItems = Array.from(element.querySelectorAll('li')).map((li, i) => ({
              content: li.innerHTML || '',
              id: `li-${index}-${i}`
            }));
            return { type: 'list', items: listItems, id: `ul-${index}` };
          case 'ol':
            const numberedItems = Array.from(element.querySelectorAll('li')).map((li, i) => ({
              content: li.innerHTML || '',
              id: `oli-${index}-${i}`,
              number: i + 1
            }));
            return { type: 'orderedList', items: numberedItems, id: `ol-${index}` };
          case 'blockquote':
            return { type: 'quote', content: innerHTML, id: `quote-${index}` };
          case 'table':
            return { type: 'table', content: innerHTML, id: `table-${index}` };
          case 'code':
            return { type: 'code', content, id: `code-${index}` };
          case 'pre':
            return { type: 'codeBlock', content: innerHTML, id: `pre-${index}` };
          default:
            if (content.length > 20) {
              return { type: 'paragraph', content: innerHTML, id: `default-${index}` };
            }
            return null;
        }
      }
      return null;
    };

    Array.from(doc.body.childNodes).forEach((node, index) => {
      const processed = processNode(node, index);
      if (processed) elements.push(processed);
    });

    return elements;
  };

  // Generate SEO-friendly slugs for headings
  const generateSlug = (text: string, index: number) => {
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return slug || `heading-${index}`;
  };

  // Enhanced element rendering with SEO optimization
  const renderElement = (element: any, index: number) => {
    const { type, content, id } = element;

    switch (type) {
      case 'h1':
        return (
          <div key={id} className="text-center mb-16 scroll-mt-24">
            <header>
              <h1 
                id={id}
                className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight mb-6"
              >
                {content}
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
            </header>
          </div>
        );

      case 'h2':
        return (
          <div key={id} className="mt-20 mb-10 scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <h2 
                id={id}
                className="text-3xl lg:text-4xl font-bold text-gray-900 flex-1"
              >
                {content}
              </h2>
            </div>
            <Separator className="bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 h-1 rounded-full" />
          </div>
        );

      case 'h3':
        return (
          <h3 
            key={id} 
            id={id} 
            className="text-2xl lg:text-3xl font-semibold text-gray-800 mt-16 mb-8 flex items-center gap-3 scroll-mt-24"
          >
            <ArrowRight className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <span>{content}</span>
          </h3>
        );

      case 'h4':
        return (
          <h4 
            key={id} 
            id={id} 
            className="text-xl lg:text-2xl font-semibold text-gray-800 mt-12 mb-6 flex items-center gap-2 scroll-mt-24"
          >
            <Lightbulb className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <span>{content}</span>
          </h4>
        );

      case 'h5':
        return (
          <h5 
            key={id} 
            id={id} 
            className="text-lg lg:text-xl font-semibold text-gray-700 mt-10 mb-4 scroll-mt-24"
          >
            {content}
          </h5>
        );

      case 'h6':
        return (
          <h6 
            key={id} 
            id={id} 
            className="text-base lg:text-lg font-semibold text-gray-600 mt-8 mb-3 scroll-mt-24"
          >
            {content}
          </h6>
        );

      case 'paragraph':
        const isHighlightParagraph = content.includes(anchorText || '') || 
                                   content.includes('<strong>') || 
                                   content.includes('<em>') ||
                                   content.includes('<u>');
        
        return (
          <div key={id} className={`mb-8 ${isHighlightParagraph ? 'relative' : ''}`}>
            {isHighlightParagraph && (
              <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
            )}
            <p 
              className={`text-lg lg:text-xl leading-relaxed text-gray-700 ${
                isHighlightParagraph 
                  ? 'pl-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 shadow-sm' 
                  : ''
              }`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        );

      case 'list':
        return (
          <Card key={id} className="mb-10 border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 hover:shadow-xl transition-all duration-500">
            <CardContent className="p-8">
              <ul className="space-y-5">
                {element.items.map((item: any, itemIndex: number) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 group hover:transform hover:scale-[1.02] transition-all duration-300"
                    style={{ animationDelay: `${itemIndex * 150}ms` }}
                  >
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mt-1 group-hover:shadow-lg transition-all duration-300">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span 
                      className="text-gray-800 leading-relaxed font-medium group-hover:text-gray-900 transition-colors text-lg"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );

      case 'orderedList':
        return (
          <Card key={id} className="mb-10 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-500">
            <CardContent className="p-8">
              <ol className="space-y-5">
                {element.items.map((item: any, itemIndex: number) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-5 group hover:transform hover:scale-[1.01] transition-all duration-300"
                    style={{ animationDelay: `${itemIndex * 150}ms` }}
                  >
                    <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                      <span className="text-white font-bold text-base">{item.number}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <span 
                        className="text-gray-800 leading-relaxed font-medium group-hover:text-gray-900 transition-colors text-lg"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        );

      case 'quote':
        return (
          <Card key={id} className="mb-10 border-l-8 border-blue-400 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-lg">
            <CardContent className="p-8">
              <div className="flex gap-6">
                <Quote className="w-10 h-10 text-blue-400 flex-shrink-0 mt-2" />
                <blockquote 
                  className="text-xl lg:text-2xl italic text-gray-800 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Card key={id} className="mb-10 overflow-hidden">
            <CardContent className="p-0">
              <div 
                className="overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: `<table class="w-full border-collapse">${content}</table>` }}
              />
            </CardContent>
          </Card>
        );

      case 'code':
        return (
          <code 
            key={id}
            className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 border"
          >
            {content}
          </code>
        );

      case 'codeBlock':
        return (
          <Card key={id} className="mb-8 bg-gray-900 text-green-400 overflow-hidden">
            <CardContent className="p-6">
              <pre 
                className="overflow-x-auto text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </CardContent>
          </Card>
        );

      default:
        return (
          <p 
            key={id} 
            className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-8"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
    }
  };

  const elements = parseContent(content);
  const headings = elements.filter(el => ['h1', 'h2', 'h3', 'h4'].includes(el.type));

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
          title: title,
          text: metaDescription || title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <article className="max-w-5xl mx-auto">
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": metaDescription || title.substring(0, 160),
            "author": {
              "@type": "Person",
              "name": author
            },
            "datePublished": publishDate,
            "dateModified": publishDate,
            "keywords": keywords.join(", "),
            "wordCount": content.replace(/<[^>]*>/g, '').split(/\s+/).length,
            "url": typeof window !== 'undefined' ? window.location.href : ''
          })
        }}
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Article Header */}
      <header className="text-center mb-16">
        {/* Meta Information */}
        <Card className="mb-12 border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-3 text-blue-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">{actualReadingTime} min read</span>
                </div>
                <div className="flex items-center gap-3 text-purple-600">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">{elements.length} sections</span>
                </div>
                <div className="flex items-center gap-3 text-green-600">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">SEO Score: {seoScore}/100</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">{format(new Date(publishDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-orange-600">
                  <Eye className="w-5 h-5" />
                  <span className="font-semibold">{viewCount.toLocaleString()} views</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {headings.length > 2 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTOC(!showTOC)}
                    className="flex items-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    Table of Contents
                  </Button>
                )}
                <Button variant="outline" onClick={sharePost} className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Table of Contents */}
            {showTOC && headings.length > 2 && (
              <div className="mt-8 pt-8 border-t border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Table of Contents
                </h3>
                <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {headings.map((heading, index) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 ${
                        heading.type === 'h1' ? 'text-blue-800 font-bold text-base' :
                        heading.type === 'h2' ? 'text-blue-700 font-semibold text-sm' :
                        heading.type === 'h3' ? 'text-blue-600 font-medium text-sm' :
                        'text-blue-500 text-sm'
                      }`}
                    >
                      <span className="line-clamp-2">{heading.content}</span>
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Description */}
        {metaDescription && (
          <div className="mb-12">
            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto font-medium">
              {metaDescription}
            </p>
          </div>
        )}

        {/* Target URL Display */}
        {targetUrl && (
          <Card className="mb-12 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 text-blue-700">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Featured Resource:</span>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 font-medium"
                >
                  {anchorText || targetUrl}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      {/* Enhanced Content with SEO Structure */}
      <div className="space-y-8">
        {elements.map((element, index) => (
          <div
            key={element.id}
            className="animate-fade-in"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            {renderElement(element, index)}
          </div>
        ))}
      </div>

      {/* Keywords Section */}
      {keywords && keywords.length > 0 && (
        <Card className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Keywords & Topics</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {keywords.map((keyword, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="px-4 py-2 text-sm font-medium bg-white border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call-to-Action Section */}
      {targetUrl && anchorText && (
        <Card className="mt-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 border-0 text-white shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                <Star className="w-12 h-12 text-yellow-300" />
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Take Action?</h3>
              <p className="text-blue-100 mb-8 text-xl leading-relaxed">
                Don't let this opportunity pass by. Take the next step towards achieving your goals with our comprehensive solutions.
              </p>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                {anchorText}
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-xl"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        )}

        {headings.length > 2 && (
          <Button
            onClick={() => setShowTOC(!showTOC)}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl lg:hidden"
          >
            <List className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Reading Progress Footer */}
      <div className="mt-20 text-center">
        <div className="inline-flex items-center gap-6 px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200 shadow-lg">
          <div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
            {Math.round(readingProgress)}% Complete
          </Badge>
        </div>
      </div>
    </article>
  );
}
