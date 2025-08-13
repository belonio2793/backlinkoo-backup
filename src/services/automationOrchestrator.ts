/**
 * Automation Orchestrator
 * Coordinates the entire automation workflow: content generation → posting → reporting
 */

import { supabase } from '@/integrations/supabase/client';
import { automationLogger } from './automationLogger';
import { contentGenerationService } from './contentGenerationService';
import { telegraphService } from './telegraphService';
import { targetSitesManager } from './targetSitesManager';

export interface CampaignData {
  id: string;
  name: string;
  keywords: string[];
  anchor_texts: string[];
  target_url: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
}

export interface AutomationResult {
  success: boolean;
  articleUrl?: string;
  articleTitle?: string;
  targetSite?: string;
  linkPlaced?: boolean;
  anchorText?: string;
  error?: string;
  submissionId?: string;
}

class AutomationOrchestrator {
  constructor() {
    automationLogger.info('system', 'Automation orchestrator initialized');
  }

  async processCampaign(campaign: CampaignData): Promise<AutomationResult> {
    const { id: campaignId, keywords, anchor_texts, target_url, user_id } = campaign;

    automationLogger.campaignStarted(campaignId);
    automationLogger.info('campaign', 'Starting campaign processing', {
      keywords: keywords.slice(0, 3),
      targetUrl: target_url
    }, campaignId);

    try {
      // Step 1: Check service configurations
      const contentStatus = contentGenerationService.getStatus();
      if (!contentStatus.configured) {
        throw new Error(contentStatus.message);
      }

      // Step 2: Generate content using OpenAI
      automationLogger.info('article_submission', 'Generating content with OpenAI', {}, campaignId);
      
      const generatedContent = await contentGenerationService.generateBlogPost({
        keywords,
        anchorTexts: anchor_texts,
        targetUrl: target_url,
        campaignId,
        targetSite: 'Telegraph',
        wordCount: 800,
        tone: 'professional'
      });

      // Step 3: Post to Telegraph
      automationLogger.info('article_submission', 'Posting to Telegraph', {
        title: generatedContent.title.substring(0, 50),
        hasAnchorLink: generatedContent.hasAnchorLink
      }, campaignId);

      const postResult = await telegraphService.postArticle({
        title: generatedContent.title,
        content: generatedContent.content,
        campaignId,
        authorName: 'SEO Content Bot'
      });

      if (!postResult.success) {
        throw new Error(postResult.error || 'Failed to post to Telegraph');
      }

      // Step 4: Save submission to database
      const submissionData = {
        campaign_id: campaignId,
        target_site_id: 'telegraph',
        article_title: generatedContent.title,
        article_content: generatedContent.content,
        article_url: postResult.url,
        status: 'published',
        published_date: new Date().toISOString(),
        backlink_url: generatedContent.hasAnchorLink ? target_url : null,
        anchor_text: generatedContent.anchorText,
        notes: `Auto-generated and posted via automation. Word count: ${generatedContent.wordCount}`,
        metadata: {
          telegraph_path: postResult.path,
          views: postResult.views || 0,
          generation_model: 'gpt-3.5-turbo',
          content_stats: {
            word_count: generatedContent.wordCount,
            has_anchor_link: generatedContent.hasAnchorLink,
            keywords_used: keywords.slice(0, 5)
          }
        }
      };

      automationLogger.debug('database', 'Saving submission to database', {
        articleUrl: postResult.url,
        title: generatedContent.title.substring(0, 30)
      }, campaignId);

      const { data: submission, error: submissionError } = await supabase
        .from('article_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) {
        automationLogger.error('database', 'Failed to save submission', submissionData, campaignId, submissionError);
        // Continue anyway - we still posted successfully
      } else {
        automationLogger.info('database', 'Submission saved successfully', {
          submissionId: submission.id
        }, campaignId);
      }

      // Step 5: Update campaign stats
      await this.updateCampaignStats(campaignId, true);

      // Step 6: Mark target site as used (Telegraph)
      await targetSitesManager.markSiteUsed('telegraph', campaignId);
      await targetSitesManager.markSubmissionResult('telegraph', true, campaignId);

      automationLogger.info('campaign', 'Campaign processing completed successfully', {
        articleUrl: postResult.url,
        title: generatedContent.title.substring(0, 50),
        hasBacklink: generatedContent.hasAnchorLink
      }, campaignId);

      return {
        success: true,
        articleUrl: postResult.url!,
        articleTitle: generatedContent.title,
        targetSite: 'Telegraph',
        linkPlaced: generatedContent.hasAnchorLink,
        anchorText: generatedContent.anchorText,
        submissionId: submission?.id
      };

    } catch (error) {
      automationLogger.error('campaign', 'Campaign processing failed', {
        keywords: keywords.slice(0, 3),
        targetUrl: target_url
      }, campaignId, error as Error);

      // Update campaign stats for failure
      await this.updateCampaignStats(campaignId, false);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async updateCampaignStats(campaignId: string, success: boolean): Promise<void> {
    try {
      // Get current campaign data
      const { data: campaign, error: fetchError } = await supabase
        .from('automation_campaigns')
        .select('links_built, target_sites_used')
        .eq('id', campaignId)
        .single();

      if (fetchError) {
        automationLogger.error('database', 'Failed to fetch campaign for stats update', {}, campaignId, fetchError);
        return;
      }

      const updates: any = {};

      if (success) {
        // Increment links built
        updates.links_built = (campaign.links_built || 0) + 1;
        
        // Add telegraph to sites used if not already there
        const sitesUsed = campaign.target_sites_used || [];
        if (!sitesUsed.includes('telegra.ph')) {
          updates.target_sites_used = [...sitesUsed, 'telegra.ph'];
        }
      }

      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('automation_campaigns')
        .update(updates)
        .eq('id', campaignId);

      if (updateError) {
        automationLogger.error('database', 'Failed to update campaign stats', updates, campaignId, updateError);
      } else {
        automationLogger.debug('database', 'Campaign stats updated', updates, campaignId);
      }

    } catch (error) {
      automationLogger.error('database', 'Error updating campaign stats', {}, campaignId, error as Error);
    }
  }

  async getCampaignSubmissions(campaignId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('article_submissions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('submission_date', { ascending: false });

      if (error) {
        automationLogger.error('database', 'Failed to fetch campaign submissions', {}, campaignId, error);
        return [];
      }

      return data || [];
    } catch (error) {
      automationLogger.error('database', 'Error fetching campaign submissions', {}, campaignId, error as Error);
      return [];
    }
  }

  async getUserSubmissions(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('article_submissions')
        .select(`
          *,
          automation_campaigns!inner(
            name,
            keywords,
            target_url,
            user_id
          )
        `)
        .eq('automation_campaigns.user_id', userId)
        .order('submission_date', { ascending: false })
        .limit(limit);

      if (error) {
        automationLogger.error('database', 'Failed to fetch user submissions', { userId, limit }, undefined, error);
        return [];
      }

      return data || [];
    } catch (error) {
      automationLogger.error('database', 'Error fetching user submissions', { userId }, undefined, error as Error);
      return [];
    }
  }

  // Test the full automation workflow
  async testAutomation(campaignId: string): Promise<AutomationResult> {
    automationLogger.info('system', 'Running test automation workflow', {}, campaignId);

    const testCampaign: CampaignData = {
      id: campaignId,
      name: 'Test Campaign',
      keywords: ['SEO tools', 'digital marketing', 'automation'],
      anchor_texts: ['powerful SEO platform', 'learn more', 'advanced tools'],
      target_url: 'https://example.com',
      user_id: 'test-user',
      status: 'active'
    };

    return this.processCampaign(testCampaign);
  }

  // Get service status
  getStatus(): {
    contentGeneration: any;
    telegraph: any;
    overall: boolean;
  } {
    const contentStatus = contentGenerationService.getStatus();
    const telegraphStatus = telegraphService.getStatus();

    return {
      contentGeneration: contentStatus,
      telegraph: telegraphStatus,
      overall: contentStatus.configured && telegraphStatus.configured
    };
  }
}

export const automationOrchestrator = new AutomationOrchestrator();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).automationOrchestrator = automationOrchestrator;
  console.log('🔧 Automation orchestrator available at window.automationOrchestrator');
}

export default automationOrchestrator;
