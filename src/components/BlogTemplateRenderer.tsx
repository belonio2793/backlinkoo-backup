import React from 'react';
import { BlogPost, ThemeStyles, ThemeLayout } from '@/types/blogTemplateTypes';
import ImprovedBlogThemesService from '@/services/improvedBlogThemesService';

interface BlogTemplateRendererProps {
  themeId: string;
  post: BlogPost;
  customStyles?: Partial<ThemeStyles>;
  className?: string;
  onError?: (error: Error) => void;
}

export const BlogTemplateRenderer: React.FC<BlogTemplateRendererProps> = ({
  themeId,
  post,
  customStyles = {},
  className = '',
  onError
}) => {
  try {
    // Get the theme configuration
    const theme = ImprovedBlogThemesService.getThemeById(themeId);
    
    if (!theme) {
      const error = new Error(`Theme with ID "${themeId}" not found`);
      onError?.(error);
      return (
        <div className="p-8 text-center">
          <div className="text-red-600 font-semibold mb-2">Theme Not Found</div>
          <div className="text-gray-600">The theme "{themeId}" is not available.</div>
        </div>
      );
    }

    // Get the theme component
    const ThemeComponent = theme.component;
    
    if (!ThemeComponent) {
      const error = new Error(`Component for theme "${themeId}" not found`);
      onError?.(error);
      return (
        <div className="p-8 text-center">
          <div className="text-red-600 font-semibold mb-2">Component Error</div>
          <div className="text-gray-600">The template component for "{theme.name}" is not available.</div>
        </div>
      );
    }

    // Merge custom styles with theme styles
    const finalStyles = ImprovedBlogThemesService.mergeStyles(theme.styles, customStyles);

    return (
      <div className={`blog-template-renderer ${className}`}>
        <ThemeComponent
          post={post}
          styles={finalStyles}
          layout={theme.layout}
          customStyles={customStyles}
        />
      </div>
    );
  } catch (error) {
    const renderError = error instanceof Error ? error : new Error('Unknown rendering error');
    onError?.(renderError);
    
    return (
      <div className="p-8 text-center border border-red-200 bg-red-50 rounded-lg">
        <div className="text-red-600 font-semibold mb-2">Rendering Error</div>
        <div className="text-red-800 text-sm mb-4">{renderError.message}</div>
        <div className="text-gray-600">
          Please check the theme configuration and try again.
        </div>
      </div>
    );
  }
};

interface BlogTemplatePreviewProps {
  themeId: string;
  customStyles?: Partial<ThemeStyles>;
  title?: string;
  className?: string;
  onError?: (error: Error) => void;
}

export const BlogTemplatePreview: React.FC<BlogTemplatePreviewProps> = ({
  themeId,
  customStyles = {},
  title = 'Sample Blog Post',
  className = '',
  onError
}) => {
  const samplePost = ImprovedBlogThemesService.createSamplePost(title);

  return (
    <BlogTemplateRenderer
      themeId={themeId}
      post={samplePost}
      customStyles={customStyles}
      className={className}
      onError={onError}
    />
  );
};

export default BlogTemplateRenderer;
