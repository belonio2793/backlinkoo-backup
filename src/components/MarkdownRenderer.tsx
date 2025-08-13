import React from 'react';
import { processMarkdown, processBlogContent, processBoldText } from '@/utils/markdownProcessor';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  type?: 'inline' | 'block' | 'blog' | 'list';
  preserveLineBreaks?: boolean;
  addClasses?: boolean;
}

/**
 * MarkdownRenderer Component
 * Properly renders markdown content with bold text formatting
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  type = 'block',
  preserveLineBreaks = true,
  addClasses = true
}) => {
  if (!content) return null;

  const getProcessedContent = () => {
    switch (type) {
      case 'blog':
        return processBlogContent(content);
      case 'inline':
        return processBoldText(content);
      case 'list':
        return processMarkdown(content, { preserveLineBreaks: false, addClasses });
      default:
        return processMarkdown(content, { preserveLineBreaks, addClasses });
    }
  };

  const processedContent = getProcessedContent();
  const baseClasses = 'markdown-content';
  const finalClassName = `${baseClasses} ${className}`.trim();

  return (
    <div 
      className={finalClassName}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

/**
 * MarkdownList Component
 * Specifically for rendering lists with proper bold formatting
 */
interface MarkdownListProps {
  items: string[];
  className?: string;
  ordered?: boolean;
}

export const MarkdownList: React.FC<MarkdownListProps> = ({
  items,
  className = '',
  ordered = false
}) => {
  if (!items || items.length === 0) return null;

  const Tag = ordered ? 'ol' : 'ul';
  const baseClasses = 'space-y-2 markdown-list';
  const finalClassName = `${baseClasses} ${className}`.trim();

  return (
    <Tag className={finalClassName}>
      {items.map((item, index) => {
        const processedItem = processBoldText(item);
        return (
          <li 
            key={index}
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processedItem }}
          />
        );
      })}
    </Tag>
  );
};

/**
 * BoldTextRenderer Component
 * Simple component for rendering text with bold markdown
 */
interface BoldTextRendererProps {
  text: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

export const BoldTextRenderer: React.FC<BoldTextRendererProps> = ({
  text,
  className = '',
  as: Component = 'span'
}) => {
  if (!text) return null;

  const processedText = processBoldText(text);

  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
};

/**
 * Hook for processing markdown content
 */
export const useMarkdownProcessor = () => {
  const processContent = React.useCallback((content: string, type: 'inline' | 'block' | 'blog' = 'block') => {
    switch (type) {
      case 'blog':
        return processBlogContent(content);
      case 'inline':
        return processBoldText(content);
      default:
        return processMarkdown(content);
    }
  }, []);

  return { processContent };
};

export default MarkdownRenderer;
