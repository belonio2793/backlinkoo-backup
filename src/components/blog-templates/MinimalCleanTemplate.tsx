import React from 'react';
import { BlogTemplateProps } from '@/types/blogTemplateTypes';

export const MinimalCleanTemplate: React.FC<BlogTemplateProps> = ({
  post,
  styles,
  layout,
  customStyles = {},
  className = ''
}) => {
  const finalStyles = { ...styles, ...customStyles };

  const containerClass = `
    ${layout.contentWidth === 'narrow' ? 'max-w-2xl' : layout.contentWidth === 'medium' ? 'max-w-4xl' : 'max-w-6xl'}
    ${layout.spacing === 'compact' ? 'space-y-4' : layout.spacing === 'normal' ? 'space-y-6' : 'space-y-8'}
    mx-auto px-6 py-12 min-h-screen
  `;

  return (
    <div 
      className={`minimal-clean-template ${className}`}
      style={{ 
        backgroundColor: finalStyles.backgroundColor,
        color: finalStyles.textColor,
        fontFamily: finalStyles.bodyFont
      }}
    >
      <article className={containerClass}>
        {/* Header */}
        <header className="text-left mb-16 pb-8 border-b border-gray-100">
          {post.category && (
            <div 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: finalStyles.accentColor }}
            >
              {post.category}
            </div>
          )}
          
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6"
            style={{ 
              color: finalStyles.primaryColor,
              fontFamily: finalStyles.headingFont,
              letterSpacing: '-0.025em'
            }}
          >
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p 
              className="text-xl leading-relaxed mb-6"
              style={{ color: finalStyles.secondaryColor }}
            >
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-6 text-sm">
            {post.author && (
              <span style={{ color: finalStyles.secondaryColor }}>
                By {post.author}
              </span>
            )}
            {post.publishDate && (
              <span style={{ color: finalStyles.secondaryColor }}>
                {post.publishDate}
              </span>
            )}
            {post.readingTime && (
              <span style={{ color: finalStyles.secondaryColor }}>
                {post.readingTime} read
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div 
            className="blog-content text-lg leading-relaxed"
            style={{ 
              color: finalStyles.textColor,
              fontFamily: finalStyles.bodyFont
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <footer className="mt-16 pt-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm rounded-full border"
                  style={{ 
                    borderColor: finalStyles.accentColor,
                    color: finalStyles.accentColor,
                    backgroundColor: `${finalStyles.accentColor}10`
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>

      <style jsx>{`
        .blog-content h2 {
          font-family: ${finalStyles.headingFont};
          font-size: 2rem;
          font-weight: 600;
          color: ${finalStyles.primaryColor};
          margin: 3rem 0 1.5rem 0;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        .blog-content h3 {
          font-family: ${finalStyles.headingFont};
          font-size: 1.5rem;
          font-weight: 600;
          color: ${finalStyles.primaryColor};
          margin: 2.5rem 0 1rem 0;
          line-height: 1.4;
        }

        .blog-content p {
          margin-bottom: 1.75rem;
          line-height: 1.8;
        }

        .blog-content a {
          color: ${finalStyles.accentColor};
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }

        .blog-content a:hover {
          border-bottom-color: ${finalStyles.accentColor};
        }

        .blog-content blockquote {
          margin: 2rem 0;
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-left: 4px solid ${finalStyles.accentColor};
          font-style: italic;
          color: ${finalStyles.secondaryColor};
          border-radius: 0 8px 8px 0;
        }

        .blog-content ul, .blog-content ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }

        .blog-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }

        .blog-content code {
          background: #f1f5f9;
          color: ${finalStyles.primaryColor};
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.9em;
          font-weight: 600;
        }

        .blog-content pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 2rem 0;
        }

        .blog-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        @media (max-width: 768px) {
          .blog-content {
            font-size: 1rem;
          }
          
          .blog-content h2 {
            font-size: 1.75rem;
          }
          
          .blog-content h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MinimalCleanTemplate;
