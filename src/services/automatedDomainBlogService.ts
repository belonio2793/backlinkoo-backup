import { DomainBlogService } from './domainBlogService';
import { DomainBlogTemplateService } from './domainBlogTemplateService';
import { realTimeFeedService } from './realTimeFeedService';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPublishingResult {
  success: boolean;
  publishedUrls: string[];
  domains: string[];
  error?: string;
}

export interface CampaignBlogParams {
  campaignId: string;
  keywords: string[];
  targetUrl: string;
  brandName?: string;
  maxDomains?: number;
}

export class AutomatedDomainBlogService {
  
  /**
   * Publish blog posts across available domains for a campaign
   */
  static async publishCampaignBlogs(params: CampaignBlogParams): Promise<BlogPublishingResult> {
    try {
      console.log(`📝 Starting domain blog publishing for campaign ${params.campaignId}`);
      
      // Get available blog-enabled domains
      const availableDomains = await DomainBlogService.getBlogEnabledDomains();
      
      if (availableDomains.length === 0) {
        console.log('📭 No blog-enabled domains available for publishing');
        return {
          success: true, // Not an error, just no domains
          publishedUrls: [],
          domains: [],
          error: 'No blog-enabled domains available. Enable blogging on your domains to get additional backlinks.'
        };
      }

      const maxDomains = Math.min(params.maxDomains || 3, availableDomains.length);
      const selectedDomains = availableDomains.slice(0, maxDomains);
      
      console.log(`🎯 Publishing to ${selectedDomains.length} domains:`, selectedDomains.map(d => d.domain));
      
      // Emit real-time update
      realTimeFeedService.emitSystemEvent(
        `Publishing blogs to ${selectedDomains.length} domain${selectedDomains.length > 1 ? 's' : ''}: ${selectedDomains.map(d => d.domain).join(', ')}`,
        'info'
      );
      
      const publishedPosts = await DomainBlogTemplateService.publishToMultipleDomains(
        params.keywords,
        params.targetUrl,
        maxDomains,
        params.brandName
      );
      
      // Log to campaign activity
      await this.logCampaignActivity(
        params.campaignId,
        'info',
        `Published ${publishedPosts.length} blog posts across domains: ${publishedPosts.map(p => p.domain).join(', ')}`
      );
      
      // Emit real-time events for each published post
      publishedPosts.forEach(post => {
        realTimeFeedService.emitBacklinkCreated(
          params.campaignId,
          post.published_url,
          `Blog Post: ${post.title}`,
          post.domain,
          'domain-blog'
        );
      });
      
      const result: BlogPublishingResult = {
        success: true,
        publishedUrls: publishedPosts.map(p => p.published_url),
        domains: publishedPosts.map(p => p.domain)
      };
      
      console.log(`✅ Successfully published ${publishedPosts.length} domain blog posts`);
      return result;
      
    } catch (error) {
      console.error('❌ Domain blog publishing failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log error to campaign activity
      await this.logCampaignActivity(
        params.campaignId,
        'error',
        `Domain blog publishing failed: ${errorMessage}`
      );
      
      return {
        success: false,
        publishedUrls: [],
        domains: [],
        error: errorMessage
      };
    }
  }
  
  /**
   * Check if user has blog-enabled domains available
   */
  static async hasAvailableDomains(): Promise<boolean> {
    try {
      const domains = await DomainBlogService.getBlogEnabledDomains();
      return domains.length > 0;
    } catch (error) {
      console.error('Error checking available domains:', error);
      return false;
    }
  }
  
  /**
   * Get blog publishing statistics
   */
  static async getBlogPublishingStats(): Promise<{
    availableDomains: number;
    totalPagesPublished: number;
    domainList: string[];
  }> {
    try {
      const domains = await DomainBlogService.getBlogEnabledDomains();
      const stats = await DomainBlogService.getBlogStats();
      
      return {
        availableDomains: domains.length,
        totalPagesPublished: stats.total_pages_published,
        domainList: domains.map(d => d.domain)
      };
    } catch (error) {
      console.error('Error getting blog stats:', error);
      return {
        availableDomains: 0,
        totalPagesPublished: 0,
        domainList: []
      };
    }
  }
  
  /**
   * Generate blog preview for campaign
   */
  static async generateBlogPreview(
    keywords: string[],
    targetUrl: string,
    domainId?: string,
    brandName?: string
  ): Promise<{
    title: string;
    content: string;
    previewUrl: string;
  }> {
    try {
      const blogPost = await DomainBlogTemplateService.generateBlogPost(
        keywords,
        targetUrl,
        brandName,
        undefined,
        domainId
      );
      
      let previewUrl = '/blog/preview';
      if (domainId) {
        const domains = await DomainBlogService.getValidatedDomains();
        const domain = domains.find(d => d.id === domainId);
        if (domain) {
          previewUrl = DomainBlogService.createBlogURL(domain.domain, domain.blog_subdirectory, blogPost.slug);
        }
      }
      
      return {
        title: blogPost.title,
        content: blogPost.content,
        previewUrl
      };
    } catch (error) {
      console.error('Error generating blog preview:', error);
      throw error;
    }
  }
  
  /**
   * Configure automatic blog publishing for campaigns
   */
  static async configureCampaignBlogSettings(
    campaignId: string,
    settings: {
      enableDomainBlogs: boolean;
      maxDomainsPerCampaign: number;
      preferredDomains?: string[];
    }
  ): Promise<boolean> {
    try {
      // Store campaign blog settings
      const { error } = await supabase
        .from('campaign_blog_settings')
        .upsert({
          campaign_id: campaignId,
          enable_domain_blogs: settings.enableDomainBlogs,
          max_domains_per_campaign: settings.maxDomainsPerCampaign,
          preferred_domains: settings.preferredDomains || [],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'campaign_id'
        });
      
      if (error) {
        console.error('Error saving campaign blog settings:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in configureCampaignBlogSettings:', error);
      return false;
    }
  }
  
  /**
   * Get campaign blog settings
   */
  static async getCampaignBlogSettings(campaignId: string): Promise<{
    enableDomainBlogs: boolean;
    maxDomainsPerCampaign: number;
    preferredDomains: string[];
  } | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_blog_settings')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();
      
      if (error || !data) {
        // Return default settings
        return {
          enableDomainBlogs: true,
          maxDomainsPerCampaign: 2,
          preferredDomains: []
        };
      }
      
      return {
        enableDomainBlogs: data.enable_domain_blogs,
        maxDomainsPerCampaign: data.max_domains_per_campaign,
        preferredDomains: data.preferred_domains || []
      };
    } catch (error) {
      console.error('Error getting campaign blog settings:', error);
      return null;
    }
  }
  
  /**
   * Log activity to campaign
   */
  private static async logCampaignActivity(
    campaignId: string,
    type: 'info' | 'warning' | 'error',
    message: string
  ): Promise<void> {
    try {
      await supabase
        .from('automation_campaign_logs')
        .insert({
          campaign_id: campaignId,
          log_type: type,
          message,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging campaign activity:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }
}

export default AutomatedDomainBlogService;
