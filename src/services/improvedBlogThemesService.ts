import { ThemeConfig, BlogPost, ThemeStyles, ThemeLayout } from '@/types/blogTemplateTypes';
import { TEMPLATE_REGISTRY, TemplateId } from '@/components/blog-templates';

export interface DomainThemeSettings {
  domain_id: string;
  theme_id: string;
  custom_styles?: Partial<ThemeStyles>;
  custom_settings?: Record<string, any>;
  updated_at: string;
}

export class ImprovedBlogThemesService {
  private static themes: ThemeConfig[] = [
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
      component: TEMPLATE_REGISTRY.minimal
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
      component: TEMPLATE_REGISTRY.modern
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
      component: TEMPLATE_REGISTRY.elegant
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
      component: TEMPLATE_REGISTRY.tech
    }
  ];

  /**
   * Get all available blog themes
   */
  static getAllThemes(): ThemeConfig[] {
    return [...this.themes];
  }

  /**
   * Get theme by ID
   */
  static getThemeById(themeId: string): ThemeConfig | null {
    return this.themes.find(theme => theme.id === themeId) || null;
  }

  /**
   * Get default theme
   */
  static getDefaultTheme(): ThemeConfig {
    return this.themes[0]; // Minimal theme as default
  }

  /**
   * Get theme component
   */
  static getThemeComponent(themeId: string) {
    const theme = this.getThemeById(themeId);
    return theme?.component || null;
  }

  /**
   * Validate theme ID
   */
  static isValidThemeId(themeId: string): themeId is TemplateId {
    return themeId in TEMPLATE_REGISTRY;
  }

  /**
   * Get theme names for dropdown/selection
   */
  static getThemeOptions() {
    return this.themes.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      features: theme.features
    }));
  }

  /**
   * Create sample blog post for preview
   */
  static createSamplePost(title: string = 'Sample Blog Post'): BlogPost {
    return {
      title,
      content: `
        <p class="lead">This is a sample lead paragraph that shows how your content will look with this theme. The typography and styling demonstrate the visual hierarchy and readability.</p>
        
        <h2>Introduction</h2>
        <p>This is regular paragraph text that demonstrates the typography and spacing of your chosen theme. The theme affects how your content is displayed to visitors, including font choices, colors, and layout structure.</p>
        
        <p>You can see how <a href="#">links are styled</a> and how the text flows naturally. The line height and letter spacing have been optimized for readability across different devices.</p>
        
        <h3>Key Features</h3>
        <ul>
          <li>Responsive design that works on all devices</li>
          <li>Optimized typography for enhanced readability</li>
          <li>Professional color schemes and styling</li>
          <li>SEO-friendly semantic markup</li>
        </ul>
        
        <blockquote>This is a sample blockquote that shows how highlighted content appears. It's perfect for emphasizing key points or featuring testimonials.</blockquote>
        
        <h3>Code Examples</h3>
        <p>For technical content, you can include code snippets:</p>
        <pre data-lang="javascript"><code>function greetUser(name) {
  return \`Hello, \${name}! Welcome to our blog.\`;
}

const message = greetUser('Developer');
console.log(message);</code></pre>
        
        <p>Inline code like <code>console.log()</code> is also properly styled for technical documentation.</p>
        
        <h2>Conclusion</h2>
        <p>This sample content demonstrates how your blog posts will appear with the selected theme. Each theme offers a unique visual experience while maintaining excellent readability and user experience.</p>
      `,
      excerpt: 'This is a sample lead paragraph that shows how your content will look with this theme.',
      author: 'Content Creator',
      publishDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      readingTime: '3 min',
      tags: ['sample', 'demo', 'typography', 'design'],
      category: 'Example'
    };
  }

  /**
   * Merge custom styles with theme styles
   */
  static mergeStyles(
    baseStyles: ThemeStyles,
    customStyles: Partial<ThemeStyles> = {}
  ): ThemeStyles {
    return { ...baseStyles, ...customStyles };
  }

  /**
   * Generate CSS variables from theme styles
   */
  static generateCSSVariables(styles: ThemeStyles): Record<string, string> {
    return {
      '--theme-primary': styles.primaryColor,
      '--theme-secondary': styles.secondaryColor,
      '--theme-background': styles.backgroundColor,
      '--theme-text': styles.textColor,
      '--theme-accent': styles.accentColor,
      '--theme-heading-font': styles.headingFont,
      '--theme-body-font': styles.bodyFont,
    };
  }

  /**
   * Export theme as JSON
   */
  static exportTheme(themeId: string, customStyles?: Partial<ThemeStyles>) {
    const theme = this.getThemeById(themeId);
    if (!theme) return null;

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      styles: customStyles ? this.mergeStyles(theme.styles, customStyles) : theme.styles,
      layout: theme.layout,
      features: theme.features,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Get theme compatibility info
   */
  static getCompatibilityInfo() {
    return {
      supportedFeatures: [
        'responsive_design',
        'dark_mode_support',
        'syntax_highlighting',
        'seo_optimization',
        'social_sharing',
        'typography_controls',
        'color_customization'
      ],
      browserSupport: [
        'Chrome 70+',
        'Firefox 65+',
        'Safari 12+',
        'Edge 79+'
      ],
      accessibility: [
        'WCAG 2.1 AA compliant',
        'Screen reader friendly',
        'Keyboard navigation',
        'High contrast support'
      ]
    };
  }
}

export default ImprovedBlogThemesService;
