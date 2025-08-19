import React from 'react';
import { BlogTemplateProps } from '@/types/blogTemplateTypes';

export const ModernBusinessTemplate: React.FC<BlogTemplateProps> = ({
  post,
  styles,
  layout,
  customStyles = {},
  className = ''
}) => {
  const finalStyles = { ...styles, ...customStyles };

  return (
    <div 
      className={`modern-business-template ${className}`}
      style={{ 
        background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
        minHeight: '100vh',
        fontFamily: finalStyles.bodyFont
      }}
    >
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <article 
          className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: finalStyles.backgroundColor }}
        >
          {/* Gradient Top Border */}
          <div 
            className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl"
            style={{ 
              background: `linear-gradient(90deg, ${finalStyles.primaryColor} 0%, ${finalStyles.accentColor} 100%)` 
            }}
          />

          {/* Header */}
          <header className="text-left mb-12">
            {post.category && (
              <div className="flex items-center gap-4 mb-6">
                <span 
                  className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                  style={{ 
                    background: `linear-gradient(135deg, ${finalStyles.primaryColor} 0%, ${finalStyles.accentColor} 100%)`,
                    color: 'white'
                  }}
                >
                  {post.category}
                </span>
              </div>
            )}
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              style={{ 
                background: `linear-gradient(135deg, ${finalStyles.primaryColor} 0%, ${finalStyles.accentColor} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: finalStyles.headingFont,
                letterSpacing: '-0.03em'
              }}
            >
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p 
                className="text-xl md:text-2xl font-medium leading-relaxed mb-8"
                style={{ color: finalStyles.secondaryColor }}
              >
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border-t-4"
                 style={{ borderTopColor: finalStyles.accentColor }}>
              {post.author && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: finalStyles.accentColor }}
                  />
                  <span 
                    className="font-semibold"
                    style={{ color: finalStyles.secondaryColor }}
                  >
                    {post.author}
                  </span>
                </div>
              )}
              {post.publishDate && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: finalStyles.accentColor }}
                  />
                  <span 
                    className="font-semibold"
                    style={{ color: finalStyles.secondaryColor }}
                  >
                    {post.publishDate}
                  </span>
                </div>
              )}
              {post.readingTime && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: finalStyles.accentColor }}
                  />
                  <span 
                    className="font-semibold"
                    style={{ color: finalStyles.secondaryColor }}
                  >
                    {post.readingTime}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <div 
            className="blog-content text-lg leading-relaxed"
            style={{ 
              color: finalStyles.textColor,
              fontFamily: finalStyles.bodyFont
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <footer className="mt-16 pt-8">
              <div 
                className="p-6 rounded-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${finalStyles.primaryColor} 0%, ${finalStyles.accentColor} 100%)` 
                }}
              >
                <h3 className="text-lg font-bold text-white mb-4">Related Topics</h3>
                <div className="flex flex-wrap gap-3">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 text-sm font-semibold rounded-full bg-white bg-opacity-20 text-white backdrop-blur-sm"
                    >
                      {tag}
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
          font-size: 2.25rem;
          font-weight: 700;
          color: ${finalStyles.primaryColor};
          margin: 3.5rem 0 2rem 0;
          line-height: 1.2;
          position: relative;
          padding-left: 1rem;
        }

        .blog-content h2::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: ${finalStyles.accentColor};
          border-radius: 2px;
        }

        .blog-content h3 {
          font-family: ${finalStyles.headingFont};
          font-size: 1.75rem;
          color: ${finalStyles.primaryColor};
          margin: 3rem 0 1.5rem 0;
          font-weight: 600;
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
          padding: 2px 0;
          transition: all 0.3s ease;
        }

        .blog-content a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: ${finalStyles.accentColor};
          transition: width 0.3s ease;
        }

        .blog-content a:hover::after {
          width: 100%;
        }

        .blog-content blockquote {
          margin: 3rem 0;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-left: 6px solid ${finalStyles.accentColor};
          border-radius: 0 15px 15px 0;
          font-style: italic;
          font-size: 1.2rem;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .blog-content ul, .blog-content ol {
          margin: 2rem 0;
          padding-left: 2rem;
        }

        .blog-content li {
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .blog-content ul li::marker {
          color: ${finalStyles.accentColor};
          font-weight: bold;
        }

        .blog-content code {
          background: #f1f5f9;
          color: ${finalStyles.primaryColor};
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.9em;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }

        .blog-content pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 2rem;
          border-radius: 12px;
          overflow-x: auto;
          margin: 2.5rem 0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .blog-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          border: none;
        }

        @media (max-width: 768px) {
          .blog-content {
            font-size: 1rem;
          }
          
          .blog-content h2 {
            font-size: 1.875rem;
            padding-left: 0.75rem;
          }
          
          .blog-content h3 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernBusinessTemplate;
