/**
 * Publishing Platform Service
 * Manages validated domains as publishing platforms for the automation system
 */

import { supabase } from '@/integrations/supabase/client';

export interface PublishingPlatform {
  id: string;
  domain: string;
  status: 'active' | 'inactive' | 'maintenance';
  blog_enabled: boolean;
  is_publishing_platform: boolean;
  netlify_state: string;
  pages_published: number;
  last_published?: string;
  created_at: string;
  dns_validated: boolean;
}

export interface ContentPublishRequest {
  platformId: string;
  title: string;
  content: string;
  keyword: string;
  anchorText: string;
  targetUrl: string;
  category?: string;
}

export interface PublishedContent {
  id: string;
  platform_id: string;
  title: string;
  content: string;
  keyword: string;
  anchor_text: string;
  target_url: string;
  published_url: string;
  published_at: string;
  campaign_id?: string;
}

export class PublishingPlatformService {
  
  /**
   * Get all active publishing platforms (validated domains)
   */
  static async getActivePlatforms(): Promise<PublishingPlatform[]> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('is_publishing_platform', true)
        .eq('status', 'active')
        .eq('dns_validated', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch active platforms:', error);
      return [];
    }
  }

  /**
   * Get platform by domain name
   */
  static async getPlatformByDomain(domain: string): Promise<PublishingPlatform | null> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', domain)
        .eq('is_publishing_platform', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch platform by domain:', error);
      return null;
    }
  }

  /**
   * Check if platform is ready for publishing
   */
  static async isPlatformReady(platformId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('status, dns_validated, is_publishing_platform')
        .eq('id', platformId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.status === 'active' && 
             data.dns_validated && 
             data.is_publishing_platform;
    } catch (error) {
      console.error('Failed to check platform readiness:', error);
      return false;
    }
  }

  /**
   * Publish content to a platform (mock implementation)
   * In real implementation, this would integrate with your blog publishing system
   */
  static async publishContent(request: ContentPublishRequest): Promise<{
    success: boolean;
    publishedUrl?: string;
    error?: string;
  }> {
    try {
      // Check if platform is ready
      const isReady = await this.isPlatformReady(request.platformId);
      if (!isReady) {
        return {
          success: false,
          error: 'Platform not ready for publishing'
        };
      }

      // Get platform details
      const { data: platform, error } = await supabase
        .from('domains')
        .select('domain')
        .eq('id', request.platformId)
        .single();

      if (error || !platform) {
        return {
          success: false,
          error: 'Platform not found'
        };
      }

      // Generate blog post URL (in real implementation, this would be the actual published URL)
      const slug = request.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const publishedUrl = `https://${platform.domain}/blog/${slug}`;

      // Store published content record
      const { error: insertError } = await supabase
        .from('published_content')
        .insert({
          platform_id: request.platformId,
          title: request.title,
          content: request.content,
          keyword: request.keyword,
          anchor_text: request.anchorText,
          target_url: request.targetUrl,
          published_url: publishedUrl,
          published_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to store published content:', insertError);
      }

      // Update platform statistics
      await supabase.rpc('increment_pages_published', {
        domain_id: request.platformId
      });

      console.log(`✅ Content published to ${platform.domain}: ${publishedUrl}`);

      return {
        success: true,
        publishedUrl
      };

    } catch (error) {
      console.error('Failed to publish content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get published content for a platform
   */
  static async getPlatformContent(platformId: string): Promise<PublishedContent[]> {
    try {
      const { data, error } = await supabase
        .from('published_content')
        .select('*')
        .eq('platform_id', platformId)
        .order('published_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch platform content:', error);
      return [];
    }
  }

  /**
   * Get all published URLs for automation system
   */
  static async getAllPublishedUrls(campaignId?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('published_content')
        .select('published_url');

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(item => item.published_url) || [];
    } catch (error) {
      console.error('Failed to fetch published URLs:', error);
      return [];
    }
  }

  /**
   * Update platform status
   */
  static async updatePlatformStatus(
    platformId: string, 
    status: 'active' | 'inactive' | 'maintenance'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('domains')
        .update({ status })
        .eq('id', platformId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to update platform status:', error);
      return false;
    }
  }

  /**
   * Get platform statistics for dashboard
   */
  static async getPlatformStats(): Promise<{
    totalPlatforms: number;
    activePlatforms: number;
    totalPosts: number;
    publishingRate: number;
  }> {
    try {
      const [platformsResult, postsResult] = await Promise.all([
        supabase
          .from('domains')
          .select('status, is_publishing_platform')
          .eq('is_publishing_platform', true),
        
        supabase
          .from('published_content')
          .select('id')
      ]);

      const platforms = platformsResult.data || [];
      const posts = postsResult.data || [];

      const totalPlatforms = platforms.length;
      const activePlatforms = platforms.filter(p => p.status === 'active').length;
      const totalPosts = posts.length;
      const publishingRate = totalPlatforms > 0 ? totalPosts / totalPlatforms : 0;

      return {
        totalPlatforms,
        activePlatforms,
        totalPosts,
        publishingRate
      };
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
      return {
        totalPlatforms: 0,
        activePlatforms: 0,
        totalPosts: 0,
        publishingRate: 0
      };
    }
  }
}
