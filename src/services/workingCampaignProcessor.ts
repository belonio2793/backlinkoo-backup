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
   * Generate content using available endpoints with fallbacks
   */
  private async generateContent(keyword: string, anchorText: string, targetUrl: string): Promise<string> {
    // Try multiple endpoints in order of preference
    const endpoints = [
      '/.netlify/functions/working-content-generator',
      '/.netlify/functions/generate-automation-content',
      '/.netlify/functions/ai-content-generator'
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying content generation endpoint: ${endpoint}`);

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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Content generation failed');
        }

        // Extract content from different response formats
        let content = null;
        if (data.data?.content) {
          content = data.data.content;
        } else if (data.content && Array.isArray(data.content)) {
          content = data.content[0]?.content;
        } else if (data.content) {
          content = data.content;
        }

        if (content) {
          console.log(`✅ Content generated successfully using ${endpoint}`);
          return content;
        }

        throw new Error('No content in response');

      } catch (error) {
        console.warn(`❌ Failed to generate content with ${endpoint}:`, error.message);
        lastError = error;

        // If it's an API key issue, log it but continue to fallback
        if (error.message?.includes('OpenAI API') || error.message?.includes('API key')) {
          console.log('🔧 OpenAI API key not configured, using fallback content');
          break; // Skip other endpoints and go to fallback
        }
      }
    }

    // All endpoints failed, use fallback content
    console.log('📝 All endpoints failed, generating fallback content');
    return this.generateFallbackContent(keyword, anchorText, targetUrl);
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
    const templates = [
      this.generateArticleTemplate(keyword, anchorText, targetUrl),
      this.generateGuideTemplate(keyword, anchorText, targetUrl),
      this.generateTipsTemplate(keyword, anchorText, targetUrl)
    ];

    // Randomly select a template
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateArticleTemplate(keyword: string, anchorText: string, targetUrl: string): string {
    return `<h1>Understanding ${keyword}: A Professional Guide</h1>

<p>In today's competitive business landscape, ${keyword} has emerged as a critical factor for success. This comprehensive guide examines the key aspects, implementation strategies, and best practices surrounding ${keyword}.</p>

<h2>Introduction to ${keyword}</h2>

<p>${keyword} represents more than just a trending concept—it's a fundamental shift in how modern organizations approach their strategic objectives. Understanding its implications is essential for any business looking to maintain competitive advantage.</p>

<h2>Core Principles and Benefits</h2>

<p>The implementation of effective ${keyword} strategies offers numerous advantages:</p>

<ul>
<li>Enhanced operational efficiency and productivity</li>
<li>Improved customer satisfaction and engagement</li>
<li>Better scalability and long-term sustainability</li>
<li>Increased ROI and measurable business outcomes</li>
<li>Competitive differentiation in the marketplace</li>
</ul>

<h2>Implementation Framework</h2>

<p>Successful ${keyword} implementation requires a structured approach that considers both technical and organizational factors. Key components include stakeholder alignment, resource allocation, and phased rollout strategies.</p>

<h2>Best Practices and Expert Guidance</h2>

<p>When developing your ${keyword} strategy, it's crucial to leverage proven methodologies and expert insights. For comprehensive guidance and professional support, consider exploring <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>, which offers specialized expertise in this domain.</p>

<h2>Measuring Success and ROI</h2>

<p>Effective ${keyword} initiatives should include clear metrics and KPIs to track progress and demonstrate value. Regular assessment and optimization ensure continued success and alignment with business objectives.</p>

<h2>Future Considerations</h2>

<p>As the landscape surrounding ${keyword} continues to evolve, organizations must stay informed about emerging trends, technologies, and best practices. Proactive adaptation and continuous improvement are key to long-term success.</p>

<h2>Conclusion</h2>

<p>The strategic importance of ${keyword} cannot be overstated in today's business environment. Organizations that invest in proper implementation and ongoing optimization will be best positioned to achieve sustainable competitive advantage and drive meaningful business results.</p>`;
  }

  private generateGuideTemplate(keyword: string, anchorText: string, targetUrl: string): string {
    return `<h1>${keyword}: Your Complete Guide to Success</h1>

<p>Welcome to the comprehensive guide on ${keyword}! Whether you're just getting started or looking to enhance your existing knowledge, this guide provides everything you need to know to succeed with ${keyword}.</p>

<h2>Why ${keyword} Matters More Than Ever</h2>

<p>${keyword} has become increasingly important in today's fast-paced business environment. Companies that master ${keyword} strategies often see significant improvements in their performance, efficiency, and overall success rates.</p>

<h2>Essential Components of ${keyword}</h2>

<p>To effectively implement ${keyword}, you need to understand its core components:</p>

<ul>
<li><strong>Strategic Planning:</strong> Developing a clear roadmap for ${keyword} implementation</li>
<li><strong>Resource Allocation:</strong> Ensuring adequate resources for successful execution</li>
<li><strong>Performance Monitoring:</strong> Tracking progress and measuring success</li>
<li><strong>Continuous Improvement:</strong> Adapting and optimizing based on results</li>
</ul>

<h2>Step-by-Step Implementation</h2>

<p>Successfully implementing ${keyword} requires a systematic approach. Start by assessing your current situation, then develop a clear plan that outlines your objectives, timeline, and success metrics.</p>

<h2>Common Challenges and Solutions</h2>

<p>Many organizations face similar challenges when implementing ${keyword}. These typically include resource constraints, technical complexity, and resistance to change. However, with proper planning and expert guidance, these challenges can be overcome.</p>

<h2>Professional Resources and Support</h2>

<p>For organizations looking to accelerate their ${keyword} journey, professional guidance can be invaluable. <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides expert insights and proven strategies that can help you achieve your goals more efficiently.</p>

<h2>Measuring Your Success</h2>

<p>Effective ${keyword} implementation should be measured through key performance indicators that align with your business objectives. Regular monitoring and analysis ensure you stay on track and can make adjustments as needed.</p>

<h2>Looking Ahead</h2>

<p>The future of ${keyword} continues to evolve with new technologies and methodologies. Staying informed about industry trends and best practices will help you maintain your competitive edge and continue to see positive results.</p>`;
  }

  private generateTipsTemplate(keyword: string, anchorText: string, targetUrl: string): string {
    return `<h1>${keyword} Made Simple: Expert Tips and Strategies</h1>

<p>Navigating the world of ${keyword} can seem overwhelming, but with the right approach and strategies, anyone can master this important skill. Here are proven tips and techniques to help you succeed.</p>

<h2>Getting Started with ${keyword}</h2>

<p>The key to success with ${keyword} is starting with a solid foundation. Begin by understanding the fundamentals and building your knowledge gradually through practical application and continuous learning.</p>

<h2>Top 10 ${keyword} Tips</h2>

<ol>
<li><strong>Start with clear objectives:</strong> Define what you want to achieve with ${keyword}</li>
<li><strong>Focus on quality over quantity:</strong> Better results come from doing fewer things well</li>
<li><strong>Stay consistent:</strong> Regular effort leads to better outcomes than sporadic intense work</li>
<li><strong>Learn from experts:</strong> Leverage proven strategies and best practices</li>
<li><strong>Monitor your progress:</strong> Track key metrics to ensure you're on the right path</li>
<li><strong>Be patient:</strong> Real results take time to develop and mature</li>
<li><strong>Stay adaptable:</strong> Be willing to adjust your approach based on results</li>
<li><strong>Invest in tools:</strong> The right resources can significantly improve efficiency</li>
<li><strong>Network with others:</strong> Learn from peers and industry professionals</li>
<li><strong>Keep learning:</strong> Stay updated with latest trends and developments</li>
</ol>

<h2>Common Mistakes to Avoid</h2>

<p>Many people make predictable mistakes when working with ${keyword}. Avoid these common pitfalls: rushing the process, ignoring data and feedback, not having clear goals, and trying to do everything at once.</p>

<h2>Tools and Resources</h2>

<p>Success with ${keyword} is much easier when you have access to the right tools and resources. Professional guidance can significantly accelerate your progress and help you avoid costly mistakes.</p>

<h2>Expert Guidance</h2>

<p>When you're ready to take your ${keyword} efforts to the next level, consider working with experienced professionals. <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> offers specialized expertise and proven strategies that can help you achieve better results faster.</p>

<h2>Building Long-term Success</h2>

<p>Sustainable success with ${keyword} comes from building strong foundations, maintaining consistent effort, and continuously improving your approach based on results and feedback.</p>

<h2>Take Action Today</h2>

<p>The best time to start improving your ${keyword} results is now. Begin with small, manageable steps and gradually build momentum as you gain experience and confidence. Remember, every expert was once a beginner.</p>`;
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
