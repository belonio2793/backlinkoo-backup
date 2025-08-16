import { supabase } from '@/integrations/supabase/client';

interface ContentGenerationRequest {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  userId?: string;
  campaignId?: string;
  promptIndex?: number;
}

interface ContentGenerationResponse {
  success: boolean;
  title: string;
  content: string;
  wordCount: number;
  anchorText: string;
  targetUrl: string;
  error?: string;
}

export class EnhancedBlogContentGenerator {
  private readonly prompts = [
    "Generate a blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}",
    "Write a article about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}",
    "Produce a write up on {{keyword}} that links {{anchor_text}} to {{url}}"
  ];

  /**
   * Generate blog content using ChatGPT 3.5 turbo with enhanced error handling
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    try {
      console.log('🚀 Starting enhanced blog content generation...');
      
      // Validate inputs
      if (!request.keyword || !request.anchorText || !request.targetUrl) {
        throw new Error('Missing required parameters: keyword, anchorText, and targetUrl are required');
      }

      // Select random prompt or use specified index
      const promptIndex = request.promptIndex ?? Math.floor(Math.random() * this.prompts.length);
      const selectedPrompt = this.prompts[promptIndex];
      
      console.log(`📝 Using prompt template ${promptIndex + 1}: ${selectedPrompt}`);

      // Generate content using multiple approaches for maximum reliability
      const approaches = [
        () => this.generateWithSupabaseEdgeFunction(request, selectedPrompt, promptIndex),
        () => this.generateWithNetlifyFunction(request, selectedPrompt, promptIndex),
        () => this.generateWithDirectOpenAI(request, selectedPrompt, promptIndex)
      ];

      for (let i = 0; i < approaches.length; i++) {
        try {
          console.log(`🔄 Trying generation approach ${i + 1}/${approaches.length}`);
          const result = await approaches[i]();
          
          if (result.success && result.content && result.content.length > 100) {
            console.log(`✅ Content generation successful with approach ${i + 1}`);
            return this.processAndValidateContent(result, request);
          }
        } catch (error) {
          console.warn(`⚠️ Approach ${i + 1} failed:`, error);
          if (i === approaches.length - 1) {
            throw error;
          }
        }
      }

      throw new Error('All content generation approaches failed');
    } catch (error: any) {
      console.error('❌ Enhanced blog content generation failed:', error);
      return {
        success: false,
        title: '',
        content: '',
        wordCount: 0,
        anchorText: request.anchorText,
        targetUrl: request.targetUrl,
        error: error.message || 'Content generation failed'
      };
    }
  }

  /**
   * Generate content using Supabase Edge Function
   */
  private async generateWithSupabaseEdgeFunction(
    request: ContentGenerationRequest, 
    prompt: string, 
    promptIndex: number
  ): Promise<ContentGenerationResponse> {
    console.log('🎯 Attempting generation with Supabase Edge Function...');

    const { data, error } = await supabase.functions.invoke('generate-content-openai', {
      body: {
        keyword: request.keyword,
        anchorText: request.anchorText,
        url: request.targetUrl,
        wordCount: 800,
        contentType: 'comprehensive',
        tone: 'professional',
        selectedPrompt: prompt,
        promptIndex
      }
    });

    if (error) {
      throw new Error(`Supabase Edge Function error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(`Supabase generation failed: ${data.error}`);
    }

    return {
      success: true,
      title: data.title || this.generateTitle(request.keyword),
      content: data.content,
      wordCount: data.wordCount || this.countWords(data.content),
      anchorText: request.anchorText,
      targetUrl: request.targetUrl
    };
  }

  /**
   * Generate content using Netlify Function
   */
  private async generateWithNetlifyFunction(
    request: ContentGenerationRequest, 
    prompt: string, 
    promptIndex: number
  ): Promise<ContentGenerationResponse> {
    console.log('🌐 Attempting generation with Netlify Function...');

    const response = await fetch('/.netlify/functions/working-content-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: request.keyword,
        anchorText: request.anchorText,
        targetUrl: request.targetUrl,
        userId: request.userId,
        campaignId: request.campaignId
      })
    });

    if (!response.ok) {
      throw new Error(`Netlify Function error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Netlify generation failed: ${data.error}`);
    }

    return {
      success: true,
      title: data.data.title,
      content: data.data.content,
      wordCount: data.data.wordCount,
      anchorText: request.anchorText,
      targetUrl: request.targetUrl
    };
  }

  /**
   * Generate content with direct OpenAI API call (fallback)
   */
  private async generateWithDirectOpenAI(
    request: ContentGenerationRequest, 
    prompt: string, 
    promptIndex: number
  ): Promise<ContentGenerationResponse> {
    console.log('🤖 Attempting direct OpenAI generation...');

    // This would require OpenAI API key to be available client-side
    // For security, this should only be used server-side
    throw new Error('Direct OpenAI generation not available in client-side environment');
  }

  /**
   * Process and validate generated content
   */
  private processAndValidateContent(
    result: ContentGenerationResponse, 
    request: ContentGenerationRequest
  ): ContentGenerationResponse {
    let { content, title } = result;

    // Clean up content
    content = this.cleanContent(content);
    
    // Ensure anchor text is properly inserted with hyperlink
    content = this.insertAnchorTextAndLink(content, request.anchorText, request.targetUrl);
    
    // Generate title if not provided
    if (!title || title.length < 10) {
      title = this.generateTitle(request.keyword);
    }

    // Validate content quality
    const wordCount = this.countWords(content);
    if (wordCount < 200) {
      throw new Error('Generated content is too short (less than 200 words)');
    }

    return {
      ...result,
      title,
      content,
      wordCount,
      success: true
    };
  }

  /**
   * Clean and format content
   */
  private cleanContent(content: string): string {
    return content
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove markdown artifacts
      .replace(/^\s*\*+\s*$|^\s*#+\s*$/gm, '')
      // Clean up HTML tags
      .replace(/<\/?(p|div|span)[^>]*>/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Insert anchor text with proper hyperlink in content
   */
  private insertAnchorTextAndLink(content: string, anchorText: string, targetUrl: string): string {
    // If anchor text already exists as a link, don't modify
    if (content.includes(`href="${targetUrl}"`)) {
      return content;
    }

    // Find the best location to insert the anchor text (around middle of content)
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const middleIndex = Math.floor(paragraphs.length / 2);
    
    if (paragraphs.length >= 3 && middleIndex < paragraphs.length) {
      // Insert the anchor text naturally in the middle paragraph
      const targetParagraph = paragraphs[middleIndex];
      
      // Try to replace a relevant keyword or add the anchor text naturally
      let modifiedParagraph = targetParagraph;
      
      // Check if anchor text already exists in the paragraph
      if (targetParagraph.toLowerCase().includes(anchorText.toLowerCase())) {
        // Replace existing anchor text with linked version
        const regex = new RegExp(`\\b${anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        modifiedParagraph = targetParagraph.replace(
          regex,
          `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`
        );
      } else {
        // Add anchor text at the end of the paragraph naturally
        modifiedParagraph = `${targetParagraph} For more information on this topic, check out <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for additional insights.`;
      }
      
      paragraphs[middleIndex] = modifiedParagraph;
    } else if (paragraphs.length > 0) {
      // Add to the last paragraph if structure is simple
      const lastIndex = paragraphs.length - 1;
      paragraphs[lastIndex] += ` Learn more about this at <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>.`;
    }

    return paragraphs.join('\n\n');
  }

  /**
   * Generate title from keyword
   */
  private generateTitle(keyword: string): string {
    const titleTemplates = [
      `The Complete Guide to ${keyword}`,
      `Mastering ${keyword}: Expert Tips and Strategies`,
      `${keyword}: Everything You Need to Know`,
      `Professional ${keyword} Techniques That Work`,
      `${keyword} Best Practices for Success`,
      `Advanced ${keyword} Strategies and Insights`,
      `${keyword}: A Comprehensive Overview`,
      `Essential ${keyword} Tips for Beginners`,
      `The Ultimate ${keyword} Handbook`,
      `${keyword} Secrets Revealed: A Professional Guide`
    ];
    
    return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, ' ');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Test content generation with sample data
   */
  async testGeneration(): Promise<ContentGenerationResponse> {
    const testRequest: ContentGenerationRequest = {
      keyword: 'SEO optimization',
      anchorText: 'professional SEO services',
      targetUrl: 'https://example.com/seo-services'
    };

    return this.generateContent(testRequest);
  }
}

export const enhancedBlogContentGenerator = new EnhancedBlogContentGenerator();
