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
      description: 'Ultra-clean minimalist design with elegant spacing and modern typography',
      styles: {
        primaryColor: '#1e40af',
        secondaryColor: '#64748b',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        headingFont: 'Inter, -apple-system, sans-serif',
        bodyFont: 'Inter, -apple-system, sans-serif',
        accentColor: '#3b82f6'
      },
      layout: {
        headerStyle: 'minimal',
        contentWidth: 'medium',
        spacing: 'relaxed'
      },
      features: ['responsive', 'seo_optimized', 'fast_loading', 'minimal_ui', 'clean_typography'],
      template_html: this.getMinimalTemplate(),
      template_css: this.getMinimalCSS()
    },
    {
      id: 'modern',
      name: 'Modern Business',
      description: 'Professional corporate design with bold visuals and engaging layouts',
      styles: {
        primaryColor: '#0f172a',
        secondaryColor: '#475569',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        headingFont: 'Poppins, system-ui, sans-serif',
        bodyFont: 'Open Sans, system-ui, sans-serif',
        accentColor: '#06b6d4'
      },
      layout: {
        headerStyle: 'bold',
        contentWidth: 'wide',
        spacing: 'relaxed'
      },
      features: ['responsive', 'seo_optimized', 'modern_design', 'social_sharing', 'corporate_style', 'hero_sections'],
      template_html: this.getModernTemplate(),
      template_css: this.getModernCSS()
    },
    {
      id: 'elegant',
      name: 'Elegant Editorial',
      description: 'Sophisticated magazine-style design with premium typography and refined layouts',
      styles: {
        primaryColor: '#92400e',
        secondaryColor: '#78716c',
        backgroundColor: '#fffbf7',
        textColor: '#1c1917',
        headingFont: 'Playfair Display, Georgia, serif',
        bodyFont: 'Source Sans Pro, system-ui, sans-serif',
        accentColor: '#f59e0b'
      },
      layout: {
        headerStyle: 'centered',
        contentWidth: 'narrow',
        spacing: 'relaxed'
      },
      features: ['responsive', 'seo_optimized', 'typography_focused', 'reading_optimized', 'magazine_style', 'premium_fonts'],
      template_html: this.getElegantTemplate(),
      template_css: this.getElegantCSS()
    },
    {
      id: 'tech',
      name: 'Tech Focus',
      description: 'Cutting-edge developer-focused design with advanced code highlighting and dark mode support',
      styles: {
        primaryColor: '#111827',
        secondaryColor: '#6b7280',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        headingFont: 'JetBrains Mono, Consolas, monospace',
        bodyFont: 'Inter, system-ui, sans-serif',
        accentColor: '#059669'
      },
      layout: {
        headerStyle: 'minimal',
        contentWidth: 'wide',
        spacing: 'compact'
      },
      features: ['responsive', 'seo_optimized', 'syntax_highlighting', 'tech_focused', 'dark_mode', 'code_blocks', 'developer_friendly'],
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
      * {
        box-sizing: border-box;
      }

      body {
        font-family: {{BODY_FONT}};
        line-height: 1.8;
        color: {{TEXT_COLOR}};
        background-color: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 0;
        font-size: 16px;
        font-weight: 400;
        letter-spacing: -0.01em;
      }

      .blog-post {
        max-width: 700px;
        margin: 0 auto;
        padding: 3rem 2rem;
        min-height: 100vh;
      }

      .post-header {
        text-align: left;
        margin-bottom: 4rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .post-title {
        font-family: {{HEADING_FONT}};
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 600;
        color: {{PRIMARY_COLOR}};
        margin: 0 0 1rem 0;
        line-height: 1.1;
        letter-spacing: -0.025em;
      }

      .post-meta {
        font-size: 0.9rem;
        color: {{SECONDARY_COLOR}};
        margin-top: 0.5rem;
      }

      .post-content {
        font-size: 1.125rem;
        max-width: 65ch;
      }

      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 2rem;
        font-weight: 600;
        color: {{PRIMARY_COLOR}};
        margin: 3rem 0 1.5rem 0;
        line-height: 1.3;
        letter-spacing: -0.02em;
      }

      .post-content h3 {
        font-family: {{HEADING_FONT}};
        font-size: 1.5rem;
        font-weight: 600;
        color: {{PRIMARY_COLOR}};
        margin: 2.5rem 0 1rem 0;
        line-height: 1.4;
      }

      .post-content p {
        margin-bottom: 1.75rem;
        color: {{TEXT_COLOR}};
      }

      .post-content a {
        color: {{ACCENT_COLOR}};
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s ease;
      }

      .post-content a:hover {
        border-bottom-color: {{ACCENT_COLOR}};
      }

      .post-content blockquote {
        margin: 2rem 0;
        padding: 1.5rem 2rem;
        background: #f8fafc;
        border-left: 4px solid {{ACCENT_COLOR}};
        font-style: italic;
        color: {{SECONDARY_COLOR}};
      }

      .post-content ul, .post-content ol {
        margin: 1.5rem 0;
        padding-left: 1.5rem;
      }

      .post-content li {
        margin-bottom: 0.5rem;
      }

      @media (max-width: 768px) {
        .blog-post {
          padding: 2rem 1.5rem;
        }

        .post-header {
          margin-bottom: 3rem;
        }

        .post-content {
          font-size: 1rem;
        }
      }
    `;
  }

  private static getModernCSS(): string {
    return `
      * {
        box-sizing: border-box;
      }

      body {
        font-family: {{BODY_FONT}};
        line-height: 1.7;
        color: {{TEXT_COLOR}};
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        margin: 0;
        padding: 0;
        font-size: 16px;
        min-height: 100vh;
      }

      .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 3rem 2rem;
      }

      .blog-post {
        background: {{BACKGROUND_COLOR}};
        border-radius: 20px;
        padding: 4rem 3rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        position: relative;
        overflow: hidden;
      }

      .blog-post::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, {{PRIMARY_COLOR}} 0%, {{ACCENT_COLOR}} 100%);
      }

      .post-header {
        text-align: left;
        margin-bottom: 4rem;
        position: relative;
      }

      .post-title {
        font-family: {{HEADING_FONT}};
        font-size: clamp(2.5rem, 6vw, 4rem);
        font-weight: 800;
        color: {{PRIMARY_COLOR}};
        margin: 0 0 1.5rem 0;
        line-height: 1.1;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, {{PRIMARY_COLOR}} 0%, {{ACCENT_COLOR}} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .post-subtitle {
        font-size: 1.25rem;
        color: {{SECONDARY_COLOR}};
        font-weight: 500;
        margin-bottom: 2rem;
      }

      .post-meta {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        padding: 1rem 0;
        border-top: 2px solid #f1f5f9;
        border-bottom: 2px solid #f1f5f9;
        font-size: 0.95rem;
        color: {{SECONDARY_COLOR}};
        font-weight: 600;
      }

      .post-content {
        font-size: 1.125rem;
        line-height: 1.8;
      }

      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 2.25rem;
        color: {{PRIMARY_COLOR}};
        margin: 3.5rem 0 2rem 0;
        font-weight: 700;
        line-height: 1.2;
        position: relative;
        padding-left: 1rem;
      }

      .post-content h2::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: {{ACCENT_COLOR}};
        border-radius: 2px;
      }

      .post-content h3 {
        font-family: {{HEADING_FONT}};
        font-size: 1.75rem;
        color: {{PRIMARY_COLOR}};
        margin: 3rem 0 1.5rem 0;
        font-weight: 600;
      }

      .post-content p {
        margin-bottom: 2rem;
        color: {{TEXT_COLOR}};
      }

      .post-content a {
        color: {{ACCENT_COLOR}};
        text-decoration: none;
        font-weight: 600;
        position: relative;
        padding: 2px 0;
        transition: all 0.3s ease;
      }

      .post-content a::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: {{ACCENT_COLOR}};
        transition: width 0.3s ease;
      }

      .post-content a:hover::after {
        width: 100%;
      }

      .post-content blockquote {
        margin: 3rem 0;
        padding: 2rem 2.5rem;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-left: 6px solid {{ACCENT_COLOR}};
        border-radius: 0 15px 15px 0;
        font-style: italic;
        font-size: 1.2rem;
        position: relative;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .post-content ul, .post-content ol {
        margin: 2rem 0;
        padding-left: 2rem;
      }

      .post-content li {
        margin-bottom: 1rem;
        position: relative;
      }

      .post-content ul li::marker {
        color: {{ACCENT_COLOR}};
        font-weight: bold;
      }

      .cta-section {
        margin-top: 4rem;
        padding: 3rem;
        background: linear-gradient(135deg, {{PRIMARY_COLOR}} 0%, {{ACCENT_COLOR}} 100%);
        border-radius: 20px;
        color: white;
        text-align: center;
      }

      @media (max-width: 768px) {
        .container {
          padding: 2rem 1rem;
        }

        .blog-post {
          padding: 2.5rem 1.5rem;
          border-radius: 15px;
        }

        .post-content {
          font-size: 1rem;
        }

        .post-meta {
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }
      }
    `;
  }

  private static getElegantCSS(): string {
    return `
      * {
        box-sizing: border-box;
      }

      body {
        font-family: {{BODY_FONT}};
        line-height: 1.9;
        color: {{TEXT_COLOR}};
        background: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 0;
        font-size: 17px;
        letter-spacing: 0.01em;
      }

      .elegant-container {
        max-width: 680px;
        margin: 0 auto;
        padding: 4rem 2rem;
        min-height: 100vh;
      }

      .post-header {
        text-align: center;
        margin-bottom: 5rem;
        position: relative;
      }

      .post-category {
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: {{ACCENT_COLOR}};
        margin-bottom: 1.5rem;
      }

      .post-title {
        font-family: {{HEADING_FONT}};
        font-size: clamp(2.5rem, 7vw, 4.5rem);
        font-weight: 400;
        color: {{PRIMARY_COLOR}};
        margin: 0 0 2rem 0;
        line-height: 1.2;
        letter-spacing: -0.02em;
        font-style: italic;
      }

      .post-subtitle {
        font-size: 1.3rem;
        color: {{SECONDARY_COLOR}};
        font-style: italic;
        margin-bottom: 2.5rem;
        line-height: 1.5;
      }

      .divider {
        width: 80px;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, {{ACCENT_COLOR}} 50%, transparent 100%);
        margin: 0 auto;
      }

      .post-meta {
        margin-top: 2rem;
        font-size: 0.95rem;
        color: {{SECONDARY_COLOR}};
        font-weight: 500;
        display: flex;
        justify-content: center;
        gap: 2rem;
      }

      .post-content {
        max-width: 580px;
        margin: 0 auto;
        font-size: 1.2rem;
        line-height: 1.8;
      }

      .post-content::first-letter {
        font-family: {{HEADING_FONT}};
        font-size: 4rem;
        font-weight: 400;
        color: {{PRIMARY_COLOR}};
        float: left;
        line-height: 3rem;
        margin: 0.5rem 0.5rem 0 0;
        font-style: italic;
      }

      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 2.5rem;
        color: {{PRIMARY_COLOR}};
        margin: 4rem 0 2rem 0;
        font-weight: 400;
        line-height: 1.3;
        text-align: center;
        font-style: italic;
        position: relative;
      }

      .post-content h2::after {
        content: '';
        position: absolute;
        bottom: -1rem;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 1px;
        background: {{ACCENT_COLOR}};
      }

      .post-content h3 {
        font-family: {{HEADING_FONT}};
        font-size: 1.8rem;
        color: {{PRIMARY_COLOR}};
        margin: 3rem 0 1.5rem 0;
        font-weight: 400;
        font-style: italic;
      }

      .post-content p {
        margin-bottom: 2.5rem;
        color: {{TEXT_COLOR}};
        text-align: justify;
        hyphens: auto;
      }

      .post-content a {
        color: {{ACCENT_COLOR}};
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid rgba(245, 158, 11, 0.3);
        transition: all 0.3s ease;
      }

      .post-content a:hover {
        color: {{PRIMARY_COLOR}};
        border-bottom-color: {{PRIMARY_COLOR}};
      }

      .post-content blockquote {
        margin: 3rem 0;
        padding: 0;
        background: none;
        border: none;
        font-family: {{HEADING_FONT}};
        font-size: 1.5rem;
        font-style: italic;
        color: {{PRIMARY_COLOR}};
        text-align: center;
        line-height: 1.6;
        position: relative;
      }

      .post-content blockquote::before {
        content: '"';
        font-size: 4rem;
        color: {{ACCENT_COLOR}};
        position: absolute;
        top: -1rem;
        left: 50%;
        transform: translateX(-50%);
        font-family: Georgia, serif;
      }

      .post-content blockquote::after {
        content: '';
        position: absolute;
        bottom: -1.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 1px;
        background: {{ACCENT_COLOR}};
      }

      .post-content ul, .post-content ol {
        margin: 2.5rem 0;
        padding-left: 0;
        list-style: none;
      }

      .post-content ul li {
        position: relative;
        margin-bottom: 1rem;
        padding-left: 2rem;
      }

      .post-content ul li::before {
        content: '◆';
        position: absolute;
        left: 0;
        color: {{ACCENT_COLOR}};
        font-size: 0.8rem;
      }

      .pull-quote {
        font-family: {{HEADING_FONT}};
        font-size: 1.8rem;
        font-style: italic;
        color: {{PRIMARY_COLOR}};
        text-align: center;
        margin: 4rem 0;
        padding: 2rem 0;
        border-top: 1px solid {{ACCENT_COLOR}};
        border-bottom: 1px solid {{ACCENT_COLOR}};
        line-height: 1.4;
      }

      @media (max-width: 768px) {
        .elegant-container {
          padding: 3rem 1.5rem;
        }

        .post-content {
          font-size: 1.1rem;
        }

        .post-content::first-letter {
          font-size: 3rem;
          line-height: 2.5rem;
        }

        .post-meta {
          flex-direction: column;
          gap: 0.5rem;
        }
      }
    `;
  }

  private static getTechCSS(): string {
    return `
      * {
        box-sizing: border-box;
      }

      body {
        font-family: {{BODY_FONT}};
        line-height: 1.7;
        color: {{TEXT_COLOR}};
        background: {{BACKGROUND_COLOR}};
        margin: 0;
        padding: 0;
        font-size: 16px;
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      body.dark-mode {
        background: #0f172a;
        color: #e2e8f0;
      }

      .tech-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
      }

      .post-header {
        position: relative;
        padding: 2rem 0 2rem 3rem;
        margin-bottom: 4rem;
        background: linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(17, 24, 39, 0.05) 100%);
        border-radius: 12px;
        border-left: 6px solid {{ACCENT_COLOR}};
      }

      .post-header::before {
        content: '# ';
        position: absolute;
        left: 1rem;
        top: 2rem;
        font-family: {{HEADING_FONT}};
        font-size: 2rem;
        color: {{ACCENT_COLOR}};
        opacity: 0.7;
      }

      .post-title {
        font-family: {{HEADING_FONT}};
        font-size: clamp(1.8rem, 5vw, 3rem);
        font-weight: 700;
        color: {{PRIMARY_COLOR}};
        margin: 0 0 1rem 0;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }

      .post-meta {
        display: flex;
        gap: 2rem;
        align-items: center;
        font-family: {{HEADING_FONT}};
        font-size: 0.9rem;
        color: {{SECONDARY_COLOR}};
        margin-top: 1rem;
      }

      .tech-badge {
        background: {{ACCENT_COLOR}};
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .post-content {
        font-size: 1.1rem;
        line-height: 1.8;
        max-width: 100%;
      }

      .post-content h2 {
        font-family: {{HEADING_FONT}};
        font-size: 2rem;
        color: {{PRIMARY_COLOR}};
        margin: 3.5rem 0 1.5rem 0;
        font-weight: 700;
        position: relative;
        padding-left: 2rem;
      }

      .post-content h2::before {
        content: '## ';
        position: absolute;
        left: 0;
        color: {{ACCENT_COLOR}};
        font-weight: 400;
      }

      .post-content h3 {
        font-family: {{HEADING_FONT}};
        font-size: 1.5rem;
        color: {{PRIMARY_COLOR}};
        margin: 3rem 0 1rem 0;
        font-weight: 600;
        position: relative;
        padding-left: 2.5rem;
      }

      .post-content h3::before {
        content: '### ';
        position: absolute;
        left: 0;
        color: {{ACCENT_COLOR}};
        font-weight: 400;
      }

      .post-content p {
        margin-bottom: 2rem;
        color: {{TEXT_COLOR}};
      }

      .post-content a {
        color: {{ACCENT_COLOR}};
        text-decoration: none;
        font-weight: 600;
        position: relative;
        transition: all 0.3s ease;
      }

      .post-content a:hover {
        color: #34d399;
        text-shadow: 0 0 8px rgba(5, 150, 105, 0.3);
      }

      .post-content code {
        background: #1e293b;
        color: #64ffda;
        padding: 0.4rem 0.6rem;
        border-radius: 6px;
        font-family: {{HEADING_FONT}};
        font-size: 0.95rem;
        font-weight: 600;
        border: 1px solid #334155;
      }

      .post-content pre {
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

      .post-content pre::before {
        content: attr(data-lang);
        position: absolute;
        top: 0.5rem;
        right: 1rem;
        background: {{ACCENT_COLOR}};
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .post-content pre code {
        background: none;
        border: none;
        padding: 0;
        color: inherit;
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .post-content blockquote {
        margin: 3rem 0;
        padding: 2rem;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-left: 4px solid {{ACCENT_COLOR}};
        border-radius: 0 12px 12px 0;
        color: #94a3b8;
        font-style: italic;
        position: relative;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .post-content blockquote::before {
        content: 'ℹ️';
        position: absolute;
        top: 1rem;
        left: -0.5rem;
        background: {{ACCENT_COLOR}};
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
      }

      .post-content ul, .post-content ol {
        margin: 2rem 0;
        padding-left: 2rem;
      }

      .post-content ul li {
        position: relative;
        margin-bottom: 1rem;
      }

      .post-content ul li::marker {
        content: '▸ ';
        color: {{ACCENT_COLOR}};
        font-weight: bold;
      }

      .terminal-output {
        background: #000;
        color: #00ff00;
        padding: 1.5rem;
        border-radius: 8px;
        font-family: {{HEADING_FONT}};
        font-size: 0.9rem;
        margin: 2rem 0;
        position: relative;
        border: 1px solid #333;
      }

      .terminal-output::before {
        content: '$ ';
        color: {{ACCENT_COLOR}};
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
        .tech-container {
          padding: 1.5rem;
        }

        .post-header {
          padding: 1.5rem 0 1.5rem 2rem;
          margin-bottom: 3rem;
        }

        .post-content {
          font-size: 1rem;
        }

        .post-content pre {
          padding: 1.5rem;
          font-size: 0.85rem;
        }

        .post-meta {
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }
      }

      @media (prefers-color-scheme: dark) {
        body:not(.light-mode) {
          background: #0f172a;
          color: #e2e8f0;
        }

        .post-content code {
          background: #1e293b;
          color: #64ffda;
        }
      }
    `;
  }
}

export default BlogThemesService;
