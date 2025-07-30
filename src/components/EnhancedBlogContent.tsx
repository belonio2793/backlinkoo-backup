import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Lightbulb, ArrowRight, Quote, Clock, BookOpen, List } from 'lucide-react';

interface EnhancedBlogContentProps {
  content: string;
  keyword?: string;
  anchorText?: string;
  targetUrl?: string;
}

export function EnhancedBlogContent({ content, keyword, anchorText, targetUrl }: EnhancedBlogContentProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [showTOC, setShowTOC] = useState(false);

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate reading time
  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };
  // Parse the content and extract structured elements
  const parseContent = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements: any[] = [];
    
    const processNode = (node: Node, index: number = 0): any => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        return text ? { type: 'text', content: text, id: `text-${index}` } : null;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const content = element.textContent?.trim() || '';
        const innerHTML = element.innerHTML;
        
        switch (tagName) {
          case 'h1':
            return { type: 'h1', content, id: `h1-${index}` };
          case 'h2':
            return { type: 'h2', content, id: `h2-${index}` };
          case 'h3':
            return { type: 'h3', content, id: `h3-${index}` };
          case 'p':
            return { type: 'paragraph', content: innerHTML, id: `p-${index}` };
          case 'ul':
            const listItems = Array.from(element.querySelectorAll('li')).map((li, i) => 
              ({ content: li.textContent?.trim() || '', id: `li-${index}-${i}` })
            );
            return { type: 'list', items: listItems, id: `ul-${index}` };
          case 'ol':
            const numberedItems = Array.from(element.querySelectorAll('li')).map((li, i) => 
              ({ content: li.textContent?.trim() || '', id: `oli-${index}-${i}`, number: i + 1 })
            );
            return { type: 'orderedList', items: numberedItems, id: `ol-${index}` };
          case 'blockquote':
            return { type: 'quote', content, id: `quote-${index}` };
          case 'a':
            return { 
              type: 'link', 
              content, 
              href: element.getAttribute('href'),
              isTargetLink: element.getAttribute('href') === targetUrl,
              id: `link-${index}`
            };
          default:
            return { type: 'text', content, id: `default-${index}` };
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

  const renderElement = (element: any) => {
    const { type, content, id } = element;

    switch (type) {
      case 'h1':
        return (
          <div key={id} className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
              {content}
            </h1>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
          </div>
        );

      case 'h2':
        return (
          <div key={id} className="mt-16 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 flex-1">
                {content}
              </h2>
            </div>
            <Separator className="bg-gradient-to-r from-blue-200 to-purple-200 h-0.5" />
          </div>
        );

      case 'h3':
        return (
          <h3 key={id} className="text-2xl font-semibold text-gray-800 mt-12 mb-6 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            {content}
          </h3>
        );

      case 'paragraph':
        const isHighlightParagraph = content.includes(anchorText || '') || content.includes('professional guidance');
        return (
          <div key={id} className={`mb-6 ${isHighlightParagraph ? 'relative' : ''}`}>
            {isHighlightParagraph && (
              <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
            )}
            <p 
              className={`text-lg leading-relaxed ${
                isHighlightParagraph 
                  ? 'text-gray-900 font-medium pl-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100' 
                  : 'text-gray-700'
              }`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        );

      case 'list':
        return (
          <Card key={id} className="mb-8 border-gray-200 bg-gray-50">
            <div className="p-6">
              <ul className="space-y-4">
                {element.items.map((item: any, index: number) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 leading-relaxed font-medium">
                      {item.content}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        );

      case 'orderedList':
        return (
          <Card key={id} className="mb-8 border-blue-200 bg-blue-50">
            <div className="p-6">
              <ol className="space-y-4">
                {element.items.map((item: any) => (
                  <li key={item.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{item.number}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-800 leading-relaxed font-medium">
                        {item.content}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        );

      case 'quote':
        return (
          <Card key={id} className="mb-8 border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="p-6">
              <div className="flex gap-4">
                <Quote className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                <blockquote className="text-lg italic text-gray-800 leading-relaxed">
                  {content}
                </blockquote>
              </div>
            </div>
          </Card>
        );

      default:
        return (
          <p key={id} className="text-lg text-gray-700 leading-relaxed mb-6">
            {content}
          </p>
        );
    }
  };

  const elements = parseContent(content);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Content with enhanced styling */}
      <div className="space-y-6">
        {elements.map(renderElement)}
      </div>

      {/* Call-to-action section if there's a target link */}
      {targetUrl && anchorText && (
        <Card className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <div className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-6 text-lg">
              Take the next step and explore our comprehensive solutions.
            </p>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {anchorText}
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </Card>
      )}

      {/* Reading progress indicator */}
      <div className="mt-12 text-center">
        <Badge variant="secondary" className="px-4 py-2">
          <span className="text-sm font-medium">
            {keyword ? `Learn more about ${keyword}` : 'Continue reading for more insights'}
          </span>
        </Badge>
      </div>
    </div>
  );
}
