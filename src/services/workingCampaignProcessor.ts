/**
 * Working Campaign Processor
 * 
 * Simplified campaign processing that uses working endpoints and avoids
 * complex database structures that don't exist.
 */

import { supabase } from '@/integrations/supabase/client';
import { realTimeFeedService } from './realTimeFeedService';
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';

export interface SimpleCampaign {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export class WorkingCampaignProcessor {
  
  /**
   * Process a campaign from start to finish using working endpoints
   */
  async processCampaign(campaign: SimpleCampaign): Promise<{ success: boolean; publishedUrl?: string; error?: string }> {
    const keyword = campaign.keywords[0] || 'default keyword';
    const anchorText = campaign.anchor_texts[0] || 'click here';
    const targetUrl = campaign.target_url;
    
    try {
      console.log(`🚀 Processing campaign: ${campaign.name}`);
      
      // Step 1: Update status to active
      await this.updateCampaignStatus(campaign.id, 'active');
      await this.logActivity(campaign.id, 'info', 'Campaign processing started');

      // Step 2: Generate content using working-content-generator
      console.log('📝 Generating content...');
      realTimeFeedService.emitSystemEvent(`Generating content for "${keyword}"`, 'info');
      
      const content = await this.generateContent(keyword, anchorText, targetUrl);
      console.log('✅ Content generated successfully');
      
      realTimeFeedService.emitContentGenerated(
        campaign.id,
        campaign.name,
        keyword,
        content.length,
        campaign.user_id
      );

      // Step 3: Publish to Telegraph
      console.log('📤 Publishing to Telegraph...');
      realTimeFeedService.emitSystemEvent(`Publishing content to Telegraph.ph`, 'info');
      
      const publishedUrl = await this.publishToTelegraph(keyword, content, anchorText, targetUrl);
      console.log('✅ Published successfully:', publishedUrl);

      // Step 4: Save published link to database
      await this.savePublishedLink(campaign.id, publishedUrl);
      
      realTimeFeedService.emitUrlPublished(
        campaign.id,
        campaign.name,
        keyword,
        publishedUrl,
        'Telegraph.ph',
        campaign.user_id
      );

      // Step 5: Mark campaign as completed
      await this.updateCampaignStatus(campaign.id, 'completed');
      await this.logActivity(campaign.id, 'info', `Campaign completed successfully. Published: ${publishedUrl}`);
      
      realTimeFeedService.emitCampaignCompleted(
        campaign.id,
        campaign.name,
        keyword,
        [publishedUrl]
      );

      console.log('🎉 Campaign processing completed successfully');
      
      return { 
        success: true, 
        publishedUrl 
      };

    } catch (error) {
      console.error('❌ Campaign processing failed:', error);
      
      const errorMessage = formatErrorForUI(error);
      
      // Mark campaign as paused with error
      await this.updateCampaignStatus(campaign.id, 'paused');
      await this.logActivity(campaign.id, 'error', `Campaign failed: ${errorMessage}`);
      
      realTimeFeedService.emitCampaignFailed(
        campaign.id,
        campaign.name,
        keyword,
        errorMessage
      );

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Generate content using working-content-generator
   */
  private async generateContent(keyword: string, anchorText: string, targetUrl: string): Promise<string> {
    const endpoint = '/.netlify/functions/working-content-generator';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword,
        anchorText,
        targetUrl
      })
    });

    if (!response.ok) {
      throw new Error(`Content generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Content generation failed');
    }

    return data.data?.content || this.generateFallbackContent(keyword, anchorText, targetUrl);
  }

  /**
   * Publish content to Telegraph
   */
  private async publishToTelegraph(keyword: string, content: string, anchorText: string, targetUrl: string): Promise<string> {
    // Create Telegraph account
    const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        short_name: 'LinkBuilder',
        author_name: 'Automated Content',
        author_url: ''
      })
    });

    if (!accountResponse.ok) {
      throw new Error(`Failed to create Telegraph account: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    
    if (!accountData.ok) {
      throw new Error(`Telegraph account creation failed: ${accountData.error}`);
    }

    const accessToken = accountData.result.access_token;

    // Create page with content
    const title = `The Ultimate Guide to ${keyword}`;
    const telegraphContent = this.convertToTelegraphFormat(content, anchorText, targetUrl);

    const pageResponse = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        title,
        author_name: 'Automated Content',
        content: telegraphContent
      })
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to create Telegraph page: ${pageResponse.status}`);
    }

    const pageData = await pageResponse.json();
    
    if (!pageData.ok) {
      throw new Error(`Telegraph page creation failed: ${pageData.error}`);
    }

    return `https://telegra.ph/${pageData.result.path}`;
  }

  /**
   * Convert content to Telegraph format with backlink
   */
  private convertToTelegraphFormat(content: string, anchorText: string, targetUrl: string): any[] {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const telegraphNodes: any[] = [];

    paragraphs.forEach((paragraph, index) => {
      const text = paragraph.trim();
      
      if (text.startsWith('#')) {
        // Header
        telegraphNodes.push({
          tag: 'h3',
          children: [text.replace(/^#+\s*/, '')]
        });
      } else {
        // Regular paragraph
        if (index === Math.floor(paragraphs.length / 2)) {
          // Insert backlink in the middle paragraph
          telegraphNodes.push({
            tag: 'p',
            children: [
              text + ' For more information about this topic, visit ',
              {
                tag: 'a',
                attrs: { href: targetUrl },
                children: [anchorText]
              },
              ' for expert guidance and resources.'
            ]
          });
        } else {
          telegraphNodes.push({
            tag: 'p',
            children: [text]
          });
        }
      }
    });

    return telegraphNodes;
  }

  /**
   * Generate fallback content if API fails
   */
  private generateFallbackContent(keyword: string, anchorText: string, targetUrl: string): string {
    return `# Understanding ${keyword}: A Comprehensive Guide

In today's competitive landscape, ${keyword} has become increasingly important for businesses and individuals alike. This guide provides valuable insights and practical strategies.

## What is ${keyword}?

${keyword} represents a fundamental concept that can significantly impact your success. Understanding its core principles is essential for anyone looking to excel in this area.

## Key Benefits

The implementation of effective ${keyword} strategies offers numerous advantages:
- Enhanced performance and efficiency
- Better decision-making capabilities  
- Improved outcomes and results
- Competitive advantage in the market

## Getting Started

To begin your journey with ${keyword}, it's important to start with solid foundations and proven methodologies. Many experts recommend following established best practices.

## Professional Guidance

When implementing ${keyword} strategies, professional guidance can make a significant difference. For comprehensive resources and expert advice, consider exploring specialized services that focus on this area.

## Conclusion

Mastering ${keyword} requires dedication, proper guidance, and consistent effort. With the right approach and resources, anyone can achieve success in this important domain.`;
  }

  /**
   * Save published link to database
   */
  private async savePublishedLink(campaignId: string, publishedUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_published_links')
        .insert({
          campaign_id: campaignId,
          platform: 'telegraph',
          published_url: publishedUrl
        });

      if (error) {
        console.warn('Failed to save published link:', error);
        // Don't throw error - the publishing was successful
      }
    } catch (error) {
      console.warn('Error saving published link:', error);
      // Don't throw error - the publishing was successful
    }
  }

  /**
   * Update campaign status
   */
  private async updateCampaignStatus(campaignId: string, status: SimpleCampaign['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Error updating campaign status:', error);
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  }

  /**
   * Log campaign activity
   */
  private async logActivity(campaignId: string, level: 'info' | 'warning' | 'error', message: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_logs')
        .insert({
          campaign_id: campaignId,
          level,
          message
        });

      if (error) {
        console.warn('Failed to log activity:', error);
      }
    } catch (error) {
      console.warn('Error logging activity:', error);
    }
  }
}

// Export singleton instance
export const workingCampaignProcessor = new WorkingCampaignProcessor();
