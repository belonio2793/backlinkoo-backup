/**
 * Automatic Domain Blog Theme Configuration Service
 * Automatically configures blog themes and settings when domains are added
 */

import { supabase } from '@/integrations/supabase/client';
import { DomainBlogTemplateService } from './domainBlogTemplateService';

interface BlogTheme {
  id: string;
  name: string;
  template: string;
  styles: Record<string, any>;
  isDefault?: boolean;
}

interface DomainBlogConfig {
  domainId: string;
  domain: string;
  themeId?: string;
  customStyles?: Record<string, any>;
  seoSettings?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  publishingSettings?: {
    postsPerPage?: number;
    autoPublish?: boolean;
    categoryPrefix?: string;
  };
}

interface AutoConfigResult {
  success: boolean;
  domainId: string;
  domain: string;
  themeConfigured: boolean;
  campaignIntegrated: boolean;
  message: string;
  error?: string;
}

export class AutoDomainBlogThemeService {
  
  /**
   * Default blog themes available for auto-assignment
   */
  private static readonly DEFAULT_THEMES: BlogTheme[] = [
    {
      id: 'minimal-clean',
      name: 'Minimal Clean',
      template: 'minimal',
      styles: {
        primaryColor: '#2563eb',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        headerStyle: 'minimal',
        layout: 'centered'
      },
      isDefault: true
    },
    {
      id: 'modern-business',
      name: 'Modern Business',
      template: 'business',
      styles: {
        primaryColor: '#059669',
        backgroundColor: '#f9fafb',
        textColor: '#111827',
        fontFamily: 'Roboto, sans-serif',
        headerStyle: 'corporate',
        layout: 'sidebar'
      }
    },
    {
      id: 'elegant-editorial',
      name: 'Elegant Editorial',
      template: 'editorial',
      styles: {
        primaryColor: '#7c3aed',
        backgroundColor: '#fefefe',
        textColor: '#374151',
        fontFamily: 'Playfair Display, serif',
        headerStyle: 'elegant',
        layout: 'magazine'
      }
    },
    {
      id: 'tech-focus',
      name: 'Tech Focus',
      template: 'tech',
      styles: {
        primaryColor: '#dc2626',
        backgroundColor: '#0f172a',
        textColor: '#e2e8f0',
        fontFamily: 'Fira Code, monospace',
        headerStyle: 'tech',
        layout: 'grid'
      }
    }
  ];

  /**
   * Automatically configure blog theme for a new domain
   */
  static async autoConfigureDomainBlogTheme(
    domainId: string, 
    domain: string,
    options: {
      preferredTheme?: string;
      customConfig?: Partial<DomainBlogConfig>;
      enableCampaignIntegration?: boolean;
    } = {}
  ): Promise<AutoConfigResult> {
    try {
      console.log(`🎨 Auto-configuring blog theme for domain: ${domain}`);

      // Check if domain already has blog theme configured
      const existingConfig = await this.getDomainBlogConfig(domainId);
      if (existingConfig) {
        return {
          success: true,
          domainId,
          domain,
          themeConfigured: true,
          campaignIntegrated: true,
          message: `Domain ${domain} already has blog theme configured`
        };
      }

      // Select theme (preferred or auto-assign)
      const selectedTheme = await this.selectThemeForDomain(domain, options.preferredTheme);
      
      // Create domain blog configuration
      const blogConfig: DomainBlogConfig = {
        domainId,
        domain,
        themeId: selectedTheme.id,
        customStyles: {
          ...selectedTheme.styles,
          ...options.customConfig?.customStyles
        },
        seoSettings: {
          metaTitle: `${this.extractBrandName(domain)} Blog`,
          metaDescription: `Latest insights and updates from ${this.extractBrandName(domain)}`,
          keywords: [
            this.extractBrandName(domain),
            'blog',
            'insights',
            'news',
            'updates'
          ],
          ...options.customConfig?.seoSettings
        },
        publishingSettings: {
          postsPerPage: 10,
          autoPublish: true,
          categoryPrefix: 'blog',
          ...options.customConfig?.publishingSettings
        }
      };

      // Save blog theme configuration
      const themeConfigured = await this.saveDomainBlogConfig(blogConfig);
      
      // Setup campaign integration if enabled
      let campaignIntegrated = false;
      if (options.enableCampaignIntegration !== false) {
        campaignIntegrated = await this.setupCampaignIntegration(domainId, domain);
      }

      // Update domain record to mark blog as enabled
      await this.enableDomainBlogging(domainId);

      return {
        success: true,
        domainId,
        domain,
        themeConfigured,
        campaignIntegrated,
        message: `Blog theme '${selectedTheme.name}' configured for ${domain}. Campaign integration ${campaignIntegrated ? 'enabled' : 'skipped'}.`
      };

    } catch (error) {
      console.error(`Error auto-configuring blog theme for ${domain}:`, error);
      return {
        success: false,
        domainId,
        domain,
        themeConfigured: false,
        campaignIntegrated: false,
        message: `Failed to configure blog theme for ${domain}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Bulk configure blog themes for multiple domains
   */
  static async bulkConfigureBlogThemes(
    domains: Array<{ id: string; domain: string }>,
    options: {
      themeRotation?: boolean;
      enableCampaignIntegration?: boolean;
      onProgress?: (completed: number, total: number, current: string, result: AutoConfigResult) => void;
    } = {}
  ): Promise<{
    successful: AutoConfigResult[];
    failed: AutoConfigResult[];
    totalProcessed: number;
  }> {
    const successful: AutoConfigResult[] = [];
    const failed: AutoConfigResult[] = [];
    let themeIndex = 0;

    for (let i = 0; i < domains.length; i++) {
      const { id, domain } = domains[i];
      
      try {
        // Rotate themes if enabled
        const preferredTheme = options.themeRotation 
          ? this.DEFAULT_THEMES[themeIndex % this.DEFAULT_THEMES.length].id
          : undefined;

        const result = await this.autoConfigureDomainBlogTheme(id, domain, {
          preferredTheme,
          enableCampaignIntegration: options.enableCampaignIntegration
        });

        if (result.success) {
          successful.push(result);
        } else {
          failed.push(result);
        }

        options.onProgress?.(i + 1, domains.length, domain, result);
        themeIndex++;

        // Rate limiting delay
        if (i < domains.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorResult: AutoConfigResult = {
          success: false,
          domainId: id,
          domain,
          themeConfigured: false,
          campaignIntegrated: false,
          message: `Configuration failed for ${domain}`,
          error: error instanceof Error ? error.message : String(error)
        };
        failed.push(errorResult);
        options.onProgress?.(i + 1, domains.length, domain, errorResult);
      }
    }

    return {
      successful,
      failed,
      totalProcessed: domains.length
    };
  }

  /**
   * Select appropriate theme for domain
   */
  private static async selectThemeForDomain(domain: string, preferredTheme?: string): Promise<BlogTheme> {
    // Return preferred theme if specified and valid
    if (preferredTheme) {
      const theme = this.DEFAULT_THEMES.find(t => t.id === preferredTheme);
      if (theme) return theme;
    }

    // Auto-select based on domain characteristics
    const domainLower = domain.toLowerCase();
    
    if (domainLower.includes('tech') || domainLower.includes('dev') || domainLower.includes('code')) {
      return this.DEFAULT_THEMES.find(t => t.id === 'tech-focus') || this.DEFAULT_THEMES[0];
    }
    
    if (domainLower.includes('business') || domainLower.includes('corp') || domainLower.includes('company')) {
      return this.DEFAULT_THEMES.find(t => t.id === 'modern-business') || this.DEFAULT_THEMES[0];
    }
    
    if (domainLower.includes('blog') || domainLower.includes('news') || domainLower.includes('magazine')) {
      return this.DEFAULT_THEMES.find(t => t.id === 'elegant-editorial') || this.DEFAULT_THEMES[0];
    }

    // Default to minimal clean theme
    return this.DEFAULT_THEMES.find(t => t.isDefault) || this.DEFAULT_THEMES[0];
  }

  /**
   * Extract brand name from domain
   */
  private static extractBrandName(domain: string): string {
    return domain
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Save domain blog configuration
   */
  private static async saveDomainBlogConfig(config: DomainBlogConfig): Promise<boolean> {
    try {
      // Try to use the domain_blog_themes table if it exists
      const { error: insertError } = await supabase
        .from('domain_blog_themes')
        .insert({
          domain_id: config.domainId,
          theme_name: config.themeId,
          theme_config: {
            styles: config.customStyles,
            seo: config.seoSettings,
            publishing: config.publishingSettings
          },
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('domain_blog_themes table not available, using fallback storage');
        // Fallback to storing in domain record itself
        const { error: updateError } = await supabase
          .from('domains')
          .update({
            blog_enabled: true,
            blog_theme_config: {
              themeId: config.themeId,
              styles: config.customStyles,
              seo: config.seoSettings,
              publishing: config.publishingSettings
            }
          })
          .eq('id', config.domainId);

        return !updateError;
      }

      return true;
    } catch (error) {
      console.error('Error saving domain blog config:', error);
      return false;
    }
  }

  /**
   * Get existing domain blog configuration
   */
  private static async getDomainBlogConfig(domainId: string): Promise<DomainBlogConfig | null> {
    try {
      // Try domain_blog_themes table first
      const { data: themeData, error: themeError } = await supabase
        .from('domain_blog_themes')
        .select('*')
        .eq('domain_id', domainId)
        .eq('is_active', true)
        .single();

      if (!themeError && themeData) {
        return {
          domainId,
          domain: themeData.domain || '',
          themeId: themeData.theme_name,
          customStyles: themeData.theme_config?.styles,
          seoSettings: themeData.theme_config?.seo,
          publishingSettings: themeData.theme_config?.publishing
        };
      }

      // Fallback to domain record
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('domain, blog_theme_config')
        .eq('id', domainId)
        .single();

      if (!domainError && domainData?.blog_theme_config) {
        return {
          domainId,
          domain: domainData.domain,
          themeId: domainData.blog_theme_config.themeId,
          customStyles: domainData.blog_theme_config.styles,
          seoSettings: domainData.blog_theme_config.seo,
          publishingSettings: domainData.blog_theme_config.publishing
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting domain blog config:', error);
      return null;
    }
  }

  /**
   * Setup campaign integration for domain
   */
  private static async setupCampaignIntegration(domainId: string, domain: string): Promise<boolean> {
    try {
      // Create campaign blog settings for this domain
      const { error } = await supabase
        .from('campaign_blog_settings')
        .insert({
          domain_id: domainId,
          domain_name: domain,
          enabled: true,
          posts_per_campaign: 2, // Default: 2 blog posts per campaign
          rotation_enabled: true,
          theme_rotation: false, // Keep consistent theme per domain
          auto_publish: true,
          seo_optimized: true,
          created_at: new Date().toISOString()
        })
        .single();

      if (error && !error.message.includes('duplicate key')) {
        console.warn('Campaign blog settings creation failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting up campaign integration:', error);
      return false;
    }
  }

  /**
   * Enable blogging for domain
   */
  private static async enableDomainBlogging(domainId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('domains')
        .update({ 
          blog_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

      return !error;
    } catch (error) {
      console.error('Error enabling domain blogging:', error);
      return false;
    }
  }

  /**
   * Get available themes
   */
  static getAvailableThemes(): BlogTheme[] {
    return [...this.DEFAULT_THEMES];
  }

  /**
   * Get theme by ID
   */
  static getThemeById(themeId: string): BlogTheme | undefined {
    return this.DEFAULT_THEMES.find(theme => theme.id === themeId);
  }

  /**
   * Preview theme configuration
   */
  static previewThemeForDomain(domain: string, themeId?: string): {
    theme: BlogTheme;
    previewConfig: DomainBlogConfig;
  } {
    const theme = themeId 
      ? this.getThemeById(themeId) || this.DEFAULT_THEMES[0]
      : this.selectThemeForDomain(domain);

    const previewConfig: DomainBlogConfig = {
      domainId: 'preview',
      domain,
      themeId: theme.id,
      customStyles: theme.styles,
      seoSettings: {
        metaTitle: `${this.extractBrandName(domain)} Blog`,
        metaDescription: `Latest insights and updates from ${this.extractBrandName(domain)}`,
        keywords: [this.extractBrandName(domain), 'blog', 'insights']
      },
      publishingSettings: {
        postsPerPage: 10,
        autoPublish: true,
        categoryPrefix: 'blog'
      }
    };

    return { theme, previewConfig };
  }
}

export default AutoDomainBlogThemeService;
