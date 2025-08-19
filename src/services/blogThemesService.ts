export interface BlogTheme {
  id: string;
  name: string;
  description: string;
  preview_image?: string;
  styles: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
    accentColor: string;
  };
  layout: {
    headerStyle: 'minimal' | 'bold' | 'centered' | 'sidebar';
    contentWidth: 'narrow' | 'medium' | 'wide';
    spacing: 'compact' | 'normal' | 'relaxed';
  };
  features: string[];
  template_html: string;
  template_css: string;
}

export interface DomainThemeSettings {
  domain_id: string;
  theme_id: string;
  custom_styles?: Partial<BlogTheme['styles']>;
  custom_settings?: Record<string, any>;
  updated_at: string;
}

export class BlogThemesService {
  private static themes: BlogTheme[] = [
    {
      id: 'minimal',
      name: 'Minimal Clean',
      description: 'Clean, minimal design perfect for professional content',
      styles: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        headingFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif',
        accentColor: '#3b82f6'
      },
      layout: {
        headerStyle: 'minimal',
        contentWidth: 'medium',
        spacing: 'normal'
      },
      features: ['responsive', 'seo_optimized', 'fast_loading'],
      template_html: this.getMinimalTemplate(),
      template_css: this.getMinimalCSS()
    },
    {
      id: 'modern',
      name: 'Modern Business',
      description: 'Contemporary design with bold typography and clean lines',
      styles: {
        primaryColor: '#0f172a',
        secondaryColor: '#475569',
        backgroundColor: '#ffffff',
        textColor: '#334155',
        headingFont: 'Poppins, sans-serif',
        bodyFont: 'Open Sans, sans-serif',
        accentColor: '#06b6d4'
      },
      layout: {
        headerStyle: 'bold',
        contentWidth: 'medium',
        spacing: 'relaxed'
      },
      features: ['responsive', 'seo_optimized', 'modern_design', 'social_sharing'],
      template_html: this.getModernTemplate(),
      template_css: this.getModernCSS()
    },
    {
      id: 'elegant',
      name: 'Elegant Editorial',
      description: 'Sophisticated design inspired by premium publications',
      styles: {
        primaryColor: '#7c2d12',
        secondaryColor: '#a3a3a3',
        backgroundColor: '#fefefe',
        textColor: '#262626',
        headingFont: 'Playfair Display, serif',
        bodyFont: 'Source Sans Pro, sans-serif',
        accentColor: '#ea580c'
      },
      layout: {
        headerStyle: 'centered',
        contentWidth: 'narrow',
        spacing: 'relaxed'
      },
      features: ['responsive', 'seo_optimized', 'typography_focused', 'reading_optimized'],
      template_html: this.getElegantTemplate(),
      template_css: this.getElegantCSS()
    },
    {
      id: 'tech',
      name: 'Tech Focus',
      description: 'Modern tech-inspired design with syntax highlighting',
      styles: {
        primaryColor: '#1f2937',
        secondaryColor: '#6b7280',
        backgroundColor: '#f9fafb',
        textColor: '#374151',
        headingFont: 'JetBrains Mono, monospace',
        bodyFont: 'Inter, sans-serif',
        accentColor: '#10b981'
      },
      layout: {
        headerStyle: 'minimal',
        contentWidth: 'wide',
        spacing: 'normal'
      },
      features: ['responsive', 'seo_optimized', 'syntax_highlighting', 'tech_focused'],
      template_html: this.getTechTemplate(),
      template_css: this.getTechCSS()
    }
  ];

  /**
   * Get all available blog themes
   */
  static getAllThemes(): BlogTheme[] {
    return [...this.themes];
  }

  /**
   * Get theme by ID
   */
  static getThemeById(themeId: string): BlogTheme | null {
    return this.themes.find(theme => theme.id === themeId) || null;
  }

  /**
   * Get default theme
   */
  static getDefaultTheme(): BlogTheme {
    return this.themes[0]; // Minimal theme as default
  }

  /**
   * Generate blog post HTML with selected theme
   */
  static generateThemedBlogPost(
    content: string,
    title: string,
    theme: BlogTheme,
    customStyles?: Partial<BlogTheme['styles']>
  ): string {
    const finalStyles = { ...theme.styles, ...customStyles };
    
    return theme.template_html
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{CONTENT\}\}/g, content)
      .replace(/\{\{PRIMARY_COLOR\}\}/g, finalStyles.primaryColor)
      .replace(/\{\{SECONDARY_COLOR\}\}/g, finalStyles.secondaryColor)
      .replace(/\{\{BACKGROUND_COLOR\}\}/g, finalStyles.backgroundColor)
      .replace(/\{\{TEXT_COLOR\}\}/g, finalStyles.textColor)
      .replace(/\{\{HEADING_FONT\}\}/g, finalStyles.headingFont)
      .replace(/\{\{BODY_FONT\}\}/g, finalStyles.bodyFont)
      .replace(/\{\{ACCENT_COLOR\}\}/g, finalStyles.accentColor)
      .replace(/\{\{THEME_CSS\}\}/g, theme.template_css);
  }

  /**
   * Generate theme preview
   */
  static generateThemePreview(theme: BlogTheme): string {
    const sampleContent = `
      <h1>Sample Blog Post Title</h1>
      <p class="lead">This is a sample lead paragraph that shows how your content will look with this theme.</p>
      <h2>Section Heading</h2>
      <p>This is regular paragraph text that demonstrates the typography and spacing of your chosen theme. The theme affects how your content is displayed to visitors.</p>
      <ul>
        <li>List item one</li>
        <li>List item two</li>
        <li>List item three</li>
      </ul>
      <blockquote>This is a sample blockquote that shows how highlighted content appears.</blockquote>
    `;

    return this.generateThemedBlogPost(
      sampleContent,
      'Sample Blog Post',
      theme
    );
  }

  // Template HTML structures
  private static getMinimalTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>{{THEME_CSS}}</style>
</head>
<body>
    <article class="blog-post">
        <header class="post-header">
            <h1 class="post-title">{{TITLE}}</h1>
        </header>
        <div class="post-content">
            {{CONTENT}}
        </div>
    </article>
</body>
</html>`;
  }

  private static getModernTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>{{THEME_CSS}}</style>
</head>
<body>
    <div class="container">
        <article class="blog-post modern">
            <header class="post-header bold">
                <h1 class="post-title">{{TITLE}}</h1>
                <div class="post-meta">
                    <time class="post-date">{{DATE}}</time>
                </div>
            </header>
            <div class="post-content">
                {{CONTENT}}
            </div>
        </article>
    </div>
</body>
</html>`;
  }

  private static getElegantTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>{{THEME_CSS}}</style>
</head>
<body>
    <div class="elegant-container">
        <article class="blog-post elegant">
            <header class="post-header centered">
                <h1 class="post-title serif">{{TITLE}}</h1>
                <div class="divider"></div>
            </header>
            <div class="post-content narrow">
                {{CONTENT}}
            </div>
        </article>
    </div>
</body>
</html>`;
  }

  private static getTechTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>{{THEME_CSS}}</style>
</head>
<body>
    <div class="tech-container">
        <article class="blog-post tech">
            <header class="post-header minimal">
                <h1 class="post-title mono">{{TITLE}}</h1>
            </header>
            <div class="post-content wide">
                {{CONTENT}}
            </div>
        </article>
    </div>
</body>
</html>`;
  }

  // CSS styles for each theme
  private static getMinimalCSS(): string {
    return `
      body {
        font-family: {{BODY_FONT}};
        line-height: 1.7;
        color: {{TEXT_COLOR}};
        background-color: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 20px;
      }
      
      .blog-post {
        max-width: 650px;
        margin: 0 auto;
      }
      
      .post-header {
        text-align: center;
        margin-bottom: 3rem;
      }
      
      .post-title {
        font-family: {{HEADING_FONT}};
        font-size: 2.5rem;
        font-weight: 700;
        color: {{PRIMARY_COLOR}};
        margin: 0;
        line-height: 1.2;
      }
      
      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 1.8rem;
        color: {{PRIMARY_COLOR}};
        margin: 2.5rem 0 1rem 0;
      }
      
      .post-content p {
        margin-bottom: 1.5rem;
      }
      
      .post-content a {
        color: {{ACCENT_COLOR}};
        text-decoration: none;
      }
      
      .post-content a:hover {
        text-decoration: underline;
      }
    `;
  }

  private static getModernCSS(): string {
    return `
      body {
        font-family: {{BODY_FONT}};
        line-height: 1.6;
        color: {{TEXT_COLOR}};
        background-color: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 0;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      .blog-post.modern {
        background: white;
        border-radius: 12px;
        padding: 3rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .post-header.bold {
        border-bottom: 3px solid {{ACCENT_COLOR}};
        padding-bottom: 2rem;
        margin-bottom: 3rem;
      }
      
      .post-title {
        font-family: {{HEADING_FONT}};
        font-size: 3rem;
        font-weight: 800;
        color: {{PRIMARY_COLOR}};
        margin: 0;
        line-height: 1.1;
      }
      
      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 2rem;
        color: {{PRIMARY_COLOR}};
        margin: 3rem 0 1.5rem 0;
        font-weight: 700;
      }
      
      .post-content a {
        color: {{ACCENT_COLOR}};
        text-decoration: none;
        font-weight: 600;
      }
    `;
  }

  private static getElegantCSS(): string {
    return `
      body {
        font-family: {{BODY_FONT}};
        line-height: 1.8;
        color: {{TEXT_COLOR}};
        background-color: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 2rem;
      }
      
      .elegant-container {
        max-width: 600px;
        margin: 0 auto;
      }
      
      .post-header.centered {
        text-align: center;
        margin-bottom: 4rem;
      }
      
      .post-title.serif {
        font-family: {{HEADING_FONT}};
        font-size: 2.8rem;
        font-weight: 400;
        color: {{PRIMARY_COLOR}};
        margin: 0 0 1rem 0;
        line-height: 1.3;
      }
      
      .divider {
        width: 60px;
        height: 2px;
        background-color: {{ACCENT_COLOR}};
        margin: 0 auto;
      }
      
      .post-content.narrow {
        max-width: 500px;
        margin: 0 auto;
      }
      
      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 2rem;
        color: {{PRIMARY_COLOR}};
        margin: 3rem 0 1.5rem 0;
        font-weight: 400;
      }
      
      .post-content p {
        margin-bottom: 2rem;
        font-size: 1.1rem;
      }
    `;
  }

  private static getTechCSS(): string {
    return `
      body {
        font-family: {{BODY_FONT}};
        line-height: 1.6;
        color: {{TEXT_COLOR}};
        background-color: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 1rem;
      }
      
      .tech-container {
        max-width: 900px;
        margin: 0 auto;
      }
      
      .post-header.minimal {
        border-left: 4px solid {{ACCENT_COLOR}};
        padding-left: 2rem;
        margin-bottom: 3rem;
      }
      
      .post-title.mono {
        font-family: {{HEADING_FONT}};
        font-size: 2.2rem;
        font-weight: 600;
        color: {{PRIMARY_COLOR}};
        margin: 0;
        line-height: 1.3;
      }
      
      .post-content.wide {
        max-width: 100%;
      }
      
      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 1.6rem;
        color: {{PRIMARY_COLOR}};
        margin: 2.5rem 0 1rem 0;
        font-weight: 600;
      }
      
      .post-content code {
        background-color: #f3f4f6;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: {{HEADING_FONT}};
        font-size: 0.9rem;
      }
    `;
  }
}

export default BlogThemesService;
