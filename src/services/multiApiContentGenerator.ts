import { aiContentGenerator } from './aiContentGenerator';
import { supabase } from '@/integrations/supabase/client';

interface MultiAPIContentParams {
  targetUrl: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentType: 'blog-post' | 'editorial' | 'guest-post' | 'resource-page';
  wordCount: number;
  tone: string;
  autoDelete: boolean;
  userEmail?: string;
  userId?: string;
}

interface GeneratedCampaign {
  id: string;
  content: {
    title: string;
    slug: string;
    metaDescription: string;
    content: string;
    targetUrl: string;
    keywords: string[];
    contextualLinks: ContextualLink[];
  };
  seoMetrics: {
    readabilityScore: number;
    keywordDensity: number;
    seoScore: number;
  };
  status: 'active' | 'scheduled_for_deletion';
  createdAt: string;
  deleteAt?: string;
  isRegistered: boolean;
}

interface ContextualLink {
  anchorText: string;
  targetUrl: string;
  position: number;
  context: string;
  seoRelevance: number;
}

interface SEOAnalysis {
  titleOptimization: number;
  metaDescriptionScore: number;
  keywordDistribution: number;
  contentStructure: number;
  readability: number;
  overallScore: number;
}

export class MultiAPIContentGenerator {
  private openAIKey?: string;
  private anthropicKey?: string;
  private geminiKey?: string;

  constructor(apiKeys?: { openai?: string; anthropic?: string; gemini?: string }) {
    this.openAIKey = apiKeys?.openai;
    this.anthropicKey = apiKeys?.anthropic;
    this.geminiKey = apiKeys?.gemini;
  }

  async generateCampaignContent(params: MultiAPIContentParams): Promise<GeneratedCampaign> {
    // Generate base content using existing AI generator
    const baseContent = await aiContentGenerator.generateContent({
      targetUrl: params.targetUrl,
      primaryKeyword: params.primaryKeyword,
      secondaryKeywords: params.secondaryKeywords,
      contentType: this.mapContentType(params.contentType),
      wordCount: params.wordCount,
      tone: params.tone,
      customInstructions: 'Focus on SEO optimization and natural contextual link placement'
    });

    // Enhance content with multiple API providers
    const enhancedContent = await this.enhanceWithMultipleAPIs(baseContent, params);

    // Generate contextual links
    const contextualLinks = await this.generateContextualLinks(
      enhancedContent.content,
      params.targetUrl,
      params.primaryKeyword,
      params.secondaryKeywords
    );

    // Calculate SEO metrics
    const seoMetrics = this.calculateSEOMetrics(enhancedContent, params);

    // Create campaign in database
    const campaignId = await this.createCampaign(params, enhancedContent, contextualLinks);

    // Set auto-deletion timer if user is not registered
    const deleteAt = params.autoDelete && !params.userId 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
      : undefined;

    if (deleteAt) {
      await this.scheduleAutoDeletion(campaignId, deleteAt);
    }

    return {
      id: campaignId,
      content: {
        ...enhancedContent,
        contextualLinks
      },
      seoMetrics,
      status: deleteAt ? 'scheduled_for_deletion' : 'active',
      createdAt: new Date().toISOString(),
      deleteAt,
      isRegistered: !!params.userId
    };
  }

  private async enhanceWithMultipleAPIs(
    baseContent: any,
    params: MultiAPIContentParams
  ): Promise<any> {
    let enhancedContent = { ...baseContent };

    // Try enhancing with different API providers
    try {
      // Use OpenAI for title optimization
      if (this.openAIKey) {
        enhancedContent.title = await this.optimizeTitleWithOpenAI(
          enhancedContent.title,
          params.primaryKeyword
        );
      }

      // Use Anthropic for content flow and readability
      if (this.anthropicKey) {
        enhancedContent.content = await this.enhanceReadabilityWithAnthropic(
          enhancedContent.content,
          params.tone
        );
      }

      // Use Gemini for SEO optimization
      if (this.geminiKey) {
        enhancedContent.metaDescription = await this.optimizeMetaWithGemini(
          enhancedContent.metaDescription,
          params.primaryKeyword
        );
      }
    } catch (error) {
      console.warn('API enhancement failed, using base content:', error);
    }

    return enhancedContent;
  }

  private async generateContextualLinks(
    content: string,
    targetUrl: string,
    primaryKeyword: string,
    secondaryKeywords: string[]
  ): Promise<ContextualLink[]> {
    const links: ContextualLink[] = [];
    
    // Find natural anchor text opportunities
    const keywordPhrases = [primaryKeyword, ...secondaryKeywords];
    
    keywordPhrases.forEach((keyword, index) => {
      const variations = this.generateAnchorTextVariations(keyword);
      
      variations.forEach(variation => {
        const regex = new RegExp(`\\b${variation}\\b(?![^<]*>)`, 'gi');
        const matches = content.match(regex);
        
        if (matches && matches.length > 0) {
          // Use first occurrence for primary keyword, distribute others
          const position = content.indexOf(matches[0]);
          
          if (position > -1) {
            links.push({
              anchorText: variation,
              targetUrl,
              position,
              context: this.extractContext(content, position, 100),
              seoRelevance: index === 0 ? 1.0 : 0.7 // Primary keyword gets highest relevance
            });
          }
        }
      });
    });

    // Ensure we have at least one contextual link
    if (links.length === 0) {
      links.push({
        anchorText: `learn more about ${primaryKeyword}`,
        targetUrl,
        position: content.length - 200,
        context: 'Conclusion section',
        seoRelevance: 0.8
      });
    }

    return links.slice(0, 3); // Limit to 3 contextual links for natural flow
  }

  private generateAnchorTextVariations(keyword: string): string[] {
    return [
      keyword,
      `${keyword} solutions`,
      `best ${keyword}`,
      `${keyword} services`,
      `professional ${keyword}`,
      `${keyword} experts`,
      `comprehensive ${keyword}`,
      `effective ${keyword}`
    ];
  }

  private extractContext(content: string, position: number, length: number): string {
    const start = Math.max(0, position - length / 2);
    const end = Math.min(content.length, position + length / 2);
    return content.substring(start, end).replace(/<[^>]*>/g, ''); // Remove HTML tags
  }

  private calculateSEOMetrics(content: any, params: MultiAPIContentParams) {
    const text = content.content.replace(/<[^>]*>/g, ''); // Strip HTML
    const wordCount = text.split(/\s+/).length;
    
    // Calculate keyword density
    const primaryKeywordCount = (text.match(new RegExp(params.primaryKeyword, 'gi')) || []).length;
    const keywordDensity = (primaryKeywordCount / wordCount) * 100;
    
    // Calculate readability (simplified Flesch reading ease)
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence));
    
    // Calculate overall SEO score
    const seoScore = this.calculateOverallSEOScore({
      titleOptimization: content.title.toLowerCase().includes(params.primaryKeyword.toLowerCase()) ? 90 : 50,
      metaDescriptionScore: content.metaDescription.length >= 150 && content.metaDescription.length <= 160 ? 95 : 70,
      keywordDistribution: keywordDensity >= 1 && keywordDensity <= 3 ? 85 : 60,
      contentStructure: content.content.includes('<h2>') && content.content.includes('<h3>') ? 90 : 70,
      readability: readabilityScore,
      overallScore: 0
    });

    return {
      readabilityScore: Math.round(readabilityScore),
      keywordDensity: Math.round(keywordDensity * 10) / 10,
      seoScore: Math.round(seoScore)
    };
  }

  private calculateOverallSEOScore(metrics: SEOAnalysis): number {
    const weights = {
      titleOptimization: 0.2,
      metaDescriptionScore: 0.15,
      keywordDistribution: 0.25,
      contentStructure: 0.2,
      readability: 0.2
    };

    return (
      metrics.titleOptimization * weights.titleOptimization +
      metrics.metaDescriptionScore * weights.metaDescriptionScore +
      metrics.keywordDistribution * weights.keywordDistribution +
      metrics.contentStructure * weights.contentStructure +
      metrics.readability * weights.readability
    );
  }

  private async createCampaign(
    params: MultiAPIContentParams,
    content: any,
    contextualLinks: ContextualLink[]
  ): Promise<string> {
    if (!params.userId) {
      // For guest users, create a temporary campaign
      return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: `AI Generated: ${content.title}`,
          target_url: params.targetUrl,
          keywords: [params.primaryKeyword, ...params.secondaryKeywords],
          status: 'completed',
          links_requested: contextualLinks.length,
          links_delivered: contextualLinks.length,
          completed_backlinks: contextualLinks.map(link => link.targetUrl),
          user_id: params.userId
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return `error_${Date.now()}`;
    }
  }

  private async scheduleAutoDeletion(campaignId: string, deleteAt: string): Promise<void> {
    // In a real implementation, this would use a job queue or cron job
    // For now, we'll store the deletion schedule and check it periodically
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'scheduled_for_deletion',
          updated_at: deleteAt 
        })
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to schedule auto-deletion:', error);
    }
  }

  async cleanupExpiredCampaigns(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('campaigns')
        .delete()
        .eq('status', 'scheduled_for_deletion')
        .lt('updated_at', now)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup expired campaigns:', error);
      return 0;
    }
  }

  async saveCampaignForUser(campaignId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      return !error;
    } catch (error) {
      console.error('Failed to save campaign for user:', error);
      return false;
    }
  }

  private mapContentType(type: string): string {
    const typeMap: Record<string, string> = {
      'blog-post': 'how-to',
      'editorial': 'opinion',
      'guest-post': 'review',
      'resource-page': 'listicle'
    };
    return typeMap[type] || 'how-to';
  }

  // Mock API enhancement methods (replace with actual API calls)
  private async optimizeTitleWithOpenAI(title: string, keyword: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock optimization
    if (!title.toLowerCase().includes(keyword.toLowerCase())) {
      return `${keyword}: ${title}`;
    }
    return title;
  }

  private async enhanceReadabilityWithAnthropic(content: string, tone: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock enhancement - add transition words
    return content.replace(/\. ([A-Z])/g, '. Furthermore, $1');
  }

  private async optimizeMetaWithGemini(metaDescription: string, keyword: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock optimization
    if (!metaDescription.toLowerCase().includes(keyword.toLowerCase())) {
      return `${metaDescription} Learn more about ${keyword} solutions.`;
    }
    return metaDescription;
  }
}

// Export singleton instance
export const multiApiContentGenerator = new MultiAPIContentGenerator();

// Export types
export type { MultiAPIContentParams, GeneratedCampaign, ContextualLink };
