import React from 'react';
import { BlogTemplateProps } from '@/types/blogTemplateTypes';

export const ElegantEditorialTemplate: React.FC<BlogTemplateProps> = ({
  post,
  styles,
  layout,
  customStyles = {},
  className = ''
}) => {
  const finalStyles = { ...styles, ...customStyles };

  return (
    <div 
      className={`elegant-editorial-template ${className}`}
      style={{ 
        backgroundColor: finalStyles.backgroundColor,
        minHeight: '100vh',
        fontFamily: finalStyles.bodyFont,
        fontSize: '17px',
        letterSpacing: '0.01em'
      }}
    >
      <div className="container mx-auto px-6 py-16 max-w-4xl min-h-screen">
        <article>
          {/* Header */}
          <header className="text-center mb-20 relative">
            {post.category && (
              <div 
                className="text-sm font-bold uppercase tracking-widest mb-6"
                style={{ 
                  color: finalStyles.accentColor,
                  letterSpacing: '0.15em'
                }}
              >
                {post.category}
              </div>
            )}
            
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl font-normal italic leading-tight mb-8"
              style={{ 
                color: finalStyles.primaryColor,
                fontFamily: finalStyles.headingFont,
                letterSpacing: '-0.02em',
                lineHeight: '1.2'
              }}
            >
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p 
                className="text-xl md:text-2xl italic leading-relaxed mb-10 max-w-3xl mx-auto"
                style={{ 
                  color: finalStyles.secondaryColor,
                  lineHeight: '1.5'
                }}
              >
                {post.excerpt}
              </p>
            )}
            
            {/* Decorative Divider */}
            <div 
              className="w-20 h-px mx-auto mb-8"
              style={{ 
                background: `linear-gradient(90deg, transparent 0%, ${finalStyles.accentColor} 50%, transparent 100%)` 
              }}
            />
            
            <div className="flex justify-center items-center gap-8 text-base">
              {post.author && (
                <span 
                  className="font-medium"
                  style={{ color: finalStyles.secondaryColor }}
                >
                  By {post.author}
                </span>
              )}
              {post.publishDate && (
                <span 
                  style={{ color: finalStyles.secondaryColor }}
                >
                  {post.publishDate}
                </span>
              )}
              {post.readingTime && (
                <span 
                  style={{ color: finalStyles.secondaryColor }}
                >
                  {post.readingTime}
                </span>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="max-w-3xl mx-auto">
            <div 
              className="blog-content text-xl leading-loose text-justify"
              style={{ 
                color: finalStyles.textColor,
                fontFamily: finalStyles.bodyFont,
                lineHeight: '1.8',
                hyphens: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <footer className="mt-20 pt-12 text-center">
              <div 
                className="w-12 h-px mx-auto mb-8"
                style={{ backgroundColor: finalStyles.accentColor }}
              />
              <h3 
                className="text-lg italic mb-6"
                style={{ 
                  color: finalStyles.primaryColor,
                  fontFamily: finalStyles.headingFont
                }}
              >
                Topics
              </h3>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 text-sm border border-opacity-30 rounded-sm"
                    style={{ 
                      borderColor: finalStyles.accentColor,
                      color: finalStyles.accentColor,
                      backgroundColor: `${finalStyles.accentColor}08`
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>

      <style jsx>{`
        .blog-content::first-letter {
          font-family: ${finalStyles.headingFont};
          font-size: 4rem;
          font-weight: 400;
          color: ${finalStyles.primaryColor};
          float: left;
          line-height: 3rem;
          margin: 0.5rem 0.5rem 0 0;
          font-style: italic;
        }

        .blog-content h2 {
          font-family: ${finalStyles.headingFont};
          font-size: 2.5rem;
          color: ${finalStyles.primaryColor};
          margin: 4rem 0 2rem 0;
          font-weight: 400;
          line-height: 1.3;
          text-align: center;
          font-style: italic;
          position: relative;
        }

        .blog-content h2::after {
          content: '';
          position: absolute;
          bottom: -1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 1px;
          background: ${finalStyles.accentColor};
        }

        .blog-content h3 {
          font-family: ${finalStyles.headingFont};
          font-size: 1.8rem;
          color: ${finalStyles.primaryColor};
          margin: 3rem 0 1.5rem 0;
          font-weight: 400;
          font-style: italic;
        }

        .blog-content p {
          margin-bottom: 2.5rem;
          line-height: 1.8;
        }

        .blog-content a {
          color: ${finalStyles.accentColor};
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid rgba(245, 158, 11, 0.3);
          transition: all 0.3s ease;
        }

        .blog-content a:hover {
          color: ${finalStyles.primaryColor};
          border-bottom-color: ${finalStyles.primaryColor};
        }

        .blog-content blockquote {
          margin: 4rem 0;
          padding: 0;
          background: none;
          border: none;
          font-family: ${finalStyles.headingFont};
          font-size: 1.5rem;
          font-style: italic;
          color: ${finalStyles.primaryColor};
          text-align: center;
          line-height: 1.6;
          position: relative;
        }

        .blog-content blockquote::before {
          content: '"';
          font-size: 4rem;
          color: ${finalStyles.accentColor};
          position: absolute;
          top: -1rem;
          left: 50%;
          transform: translateX(-50%);
          font-family: Georgia, serif;
        }

        .blog-content blockquote::after {
          content: '';
          position: absolute;
          bottom: -1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 1px;
          background: ${finalStyles.accentColor};
        }

        .blog-content ul, .blog-content ol {
          margin: 2.5rem 0;
          padding-left: 0;
          list-style: none;
        }

        .blog-content ul li {
          position: relative;
          margin-bottom: 1rem;
          padding-left: 2rem;
          line-height: 1.8;
        }

        .blog-content ul li::before {
          content: '◆';
          position: absolute;
          left: 0;
          color: ${finalStyles.accentColor};
          font-size: 0.8rem;
        }

        .blog-content code {
          background: #f5f5f0;
          color: ${finalStyles.primaryColor};
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 0.9em;
          font-weight: 500;
        }

        .blog-content pre {
          background: #fafaf7;
          color: ${finalStyles.textColor};
          padding: 2rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 3rem 0;
          border: 1px solid #e5e5e0;
          font-size: 0.9rem;
        }

        .blog-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        .pull-quote {
          font-family: ${finalStyles.headingFont};
          font-size: 1.8rem;
          font-style: italic;
          color: ${finalStyles.primaryColor};
          text-align: center;
          margin: 4rem 0;
          padding: 2rem 0;
          border-top: 1px solid ${finalStyles.accentColor};
          border-bottom: 1px solid ${finalStyles.accentColor};
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .blog-content {
            font-size: 1.1rem;
          }
          
          .blog-content::first-letter {
            font-size: 3rem;
            line-height: 2.5rem;
          }
          
          .blog-content h2 {
            font-size: 2rem;
          }
          
          .blog-content h3 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ElegantEditorialTemplate;
