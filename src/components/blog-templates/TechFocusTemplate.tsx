import React from 'react';
import { BlogTemplateProps } from '@/types/blogTemplateTypes';

export const TechFocusTemplate: React.FC<BlogTemplateProps> = ({
  post,
  styles,
  layout,
  customStyles = {},
  className = ''
}) => {
  const finalStyles = { ...styles, ...customStyles };

  return (
    <div 
      className={`tech-focus-template ${className}`}
      style={{ 
        backgroundColor: finalStyles.backgroundColor,
        minHeight: '100vh',
        fontFamily: finalStyles.bodyFont,
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <article>
          {/* Header */}
          <header 
            className="relative p-8 mb-16 rounded-xl border-l-6"
            style={{ 
              background: `linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(17, 24, 39, 0.05) 100%)`,
              borderLeftColor: finalStyles.accentColor
            }}
          >
            {/* Hash Symbol */}
            <div 
              className="absolute left-4 top-8 text-4xl opacity-70"
              style={{ 
                color: finalStyles.accentColor,
                fontFamily: finalStyles.headingFont
              }}
            >
              #
            </div>
            
            <div className="pl-12">
              {post.category && (
                <div className="flex items-center gap-3 mb-6">
                  <span 
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white"
                    style={{ backgroundColor: finalStyles.accentColor }}
                  >
                    {post.category}
                  </span>
                  <div className="flex gap-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: finalStyles.accentColor }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full opacity-50"
                      style={{ backgroundColor: finalStyles.accentColor }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full opacity-25"
                      style={{ backgroundColor: finalStyles.accentColor }}
                    />
                  </div>
                </div>
              )}
              
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
                style={{ 
                  color: finalStyles.primaryColor,
                  fontFamily: finalStyles.headingFont,
                  letterSpacing: '-0.02em'
                }}
              >
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p 
                  className="text-lg md:text-xl leading-relaxed mb-6"
                  style={{ color: finalStyles.secondaryColor }}
                >
                  {post.excerpt}
                </p>
              )}
              
              <div 
                className="flex flex-wrap items-center gap-6 text-sm"
                style={{ 
                  fontFamily: finalStyles.headingFont,
                  color: finalStyles.secondaryColor
                }}
              >
                {post.author && (
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: finalStyles.accentColor }}
                    />
                    <span>Author: {post.author}</span>
                  </div>
                )}
                {post.publishDate && (
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: finalStyles.accentColor }}
                    />
                    <span>Date: {post.publishDate}</span>
                  </div>
                )}
                {post.readingTime && (
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: finalStyles.accentColor }}
                    />
                    <span>Time: {post.readingTime}</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div 
            className="blog-content text-lg leading-relaxed"
            style={{ 
              color: finalStyles.textColor,
              fontFamily: finalStyles.bodyFont,
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <footer className="mt-16 pt-8">
              <div 
                className="p-6 rounded-xl border-l-4"
                style={{ 
                  background: `linear-gradient(135deg, ${finalStyles.primaryColor}05 0%, ${finalStyles.accentColor}05 100%)`,
                  borderLeftColor: finalStyles.accentColor
                }}
              >
                <h3 
                  className="text-lg font-bold mb-4 flex items-center gap-2"
                  style={{ 
                    color: finalStyles.primaryColor,
                    fontFamily: finalStyles.headingFont
                  }}
                >
                  <span style={{ color: finalStyles.accentColor }}>//</span>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-3">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-semibold rounded border"
                      style={{ 
                        borderColor: finalStyles.accentColor,
                        color: finalStyles.accentColor,
                        backgroundColor: `${finalStyles.accentColor}10`,
                        fontFamily: finalStyles.headingFont
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </footer>
          )}
        </article>
      </div>

      <style jsx>{`
        .blog-content h2 {
          font-family: ${finalStyles.headingFont};
          font-size: 2rem;
          color: ${finalStyles.primaryColor};
          margin: 3.5rem 0 1.5rem 0;
          font-weight: 700;
          position: relative;
          padding-left: 2rem;
        }

        .blog-content h2::before {
          content: '## ';
          position: absolute;
          left: 0;
          color: ${finalStyles.accentColor};
          font-weight: 400;
        }

        .blog-content h3 {
          font-family: ${finalStyles.headingFont};
          font-size: 1.5rem;
          color: ${finalStyles.primaryColor};
          margin: 3rem 0 1rem 0;
          font-weight: 600;
          position: relative;
          padding-left: 2.5rem;
        }

        .blog-content h3::before {
          content: '### ';
          position: absolute;
          left: 0;
          color: ${finalStyles.accentColor};
          font-weight: 400;
        }

        .blog-content p {
          margin-bottom: 2rem;
          line-height: 1.8;
        }

        .blog-content a {
          color: ${finalStyles.accentColor};
          text-decoration: none;
          font-weight: 600;
          position: relative;
          transition: all 0.3s ease;
        }

        .blog-content a:hover {
          color: #34d399;
          text-shadow: 0 0 8px rgba(5, 150, 105, 0.3);
        }

        .blog-content code {
          background: #1e293b;
          color: #64ffda;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          font-family: ${finalStyles.headingFont};
          font-size: 0.95rem;
          font-weight: 600;
          border: 1px solid #334155;
        }

        .blog-content pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 2rem;
          border-radius: 12px;
          overflow-x: auto;
          margin: 2.5rem 0;
          border: 1px solid #334155;
          position: relative;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .blog-content pre::before {
          content: attr(data-lang);
          position: absolute;
          top: 0.5rem;
          right: 1rem;
          background: ${finalStyles.accentColor};
          color: white;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .blog-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .blog-content blockquote {
          margin: 3rem 0;
          padding: 2rem;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-left: 4px solid ${finalStyles.accentColor};
          border-radius: 0 12px 12px 0;
          color: #94a3b8;
          font-style: italic;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .blog-content blockquote::before {
          content: 'ℹ️';
          position: absolute;
          top: 1rem;
          left: -0.5rem;
          background: ${finalStyles.accentColor};
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .blog-content ul, .blog-content ol {
          margin: 2rem 0;
          padding-left: 2rem;
        }

        .blog-content ul li {
          position: relative;
          margin-bottom: 1rem;
          line-height: 1.8;
        }

        .blog-content ul li::marker {
          content: '▸ ';
          color: ${finalStyles.accentColor};
          font-weight: bold;
        }

        .terminal-output {
          background: #000;
          color: #00ff00;
          padding: 1.5rem;
          border-radius: 8px;
          font-family: ${finalStyles.headingFont};
          font-size: 0.9rem;
          margin: 2rem 0;
          position: relative;
          border: 1px solid #333;
        }

        .terminal-output::before {
          content: '$ ';
          color: ${finalStyles.accentColor};
          font-weight: bold;
        }

        .syntax-highlight .keyword {
          color: #ff6b6b;
          font-weight: 600;
        }

        .syntax-highlight .string {
          color: #4ecdc4;
        }

        .syntax-highlight .comment {
          color: #6c7086;
          font-style: italic;
        }

        .syntax-highlight .function {
          color: #74c0fc;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .blog-content {
            font-size: 1rem;
          }
          
          .blog-content h2 {
            font-size: 1.75rem;
            padding-left: 1.5rem;
          }
          
          .blog-content h3 {
            font-size: 1.25rem;
            padding-left: 2rem;
          }
          
          .blog-content pre {
            padding: 1.5rem;
            font-size: 0.85rem;
          }
        }

        @media (prefers-color-scheme: dark) {
          body:not(.light-mode) .tech-focus-template {
            background: #0f172a;
            color: #e2e8f0;
          }
          
          body:not(.light-mode) .blog-content code {
            background: #1e293b;
            color: #64ffda;
          }
        }
      `}</style>
    </div>
  );
};

export default TechFocusTemplate;
