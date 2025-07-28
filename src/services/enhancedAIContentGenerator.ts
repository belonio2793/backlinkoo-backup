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

interface GeneratedContent {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  targetUrl: string;
  keywords: string[];
  wordCount: number;
  createdAt: string;
  status: 'draft' | 'published';
  seoScore: number;
  contextualLinks: ContextualLink[];
}

interface ContextualLink {
  anchorText: string;
  targetUrl: string;
  position: number;
  context: string;
  seoRelevance: number;
}

export class EnhancedAIContentGenerator {
  private openAIKey?: string;
  private grokKey?: string;
  private deepAIKey?: string;
  private huggingfaceToken?: string;
  private cohereKey?: string;
  private rytrKey?: string;

  constructor() {
    // Get API keys from environment variables
    this.openAIKey = process.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    this.grokKey = process.env.GROK_API_KEY || import.meta.env.VITE_GROK_API_KEY;
    this.deepAIKey = process.env.DEEPAI_API_KEY || import.meta.env.VITE_DEEPAI_API_KEY;
    this.huggingfaceToken = process.env.HUGGINGFACE_TOKEN || import.meta.env.VITE_HUGGINGFACE_TOKEN;
    this.cohereKey = process.env.COHERE_API_KEY || import.meta.env.VITE_COHERE_API_KEY;
    this.rytrKey = process.env.RYTR_API_KEY || import.meta.env.VITE_RYTR_API_KEY;
  }

  async generateContent(params: MultiAPIContentParams): Promise<GeneratedContent> {
    console.log('🚀 Enhanced AI Content Generation Started', {
      primaryKeyword: params.primaryKeyword,
      contentType: params.contentType,
      wordCount: params.wordCount,
      hasOpenAI: !!this.openAIKey,
      hasGrok: !!this.grokKey,
      hasDeepAI: !!this.deepAIKey,
      hasHuggingFace: !!this.huggingfaceToken,
      hasCohere: !!this.cohereKey,
      hasRytr: !!this.rytrKey
    });

    // Try multiple AI providers in order of preference
    let content: GeneratedContent | null = null;

    // 1. Try OpenAI first (most reliable)
    if (this.openAIKey && !content) {
      try {
        content = await this.generateWithOpenAI(params);
        console.log('✅ OpenAI generation successful');
      } catch (error) {
        console.warn('❌ OpenAI generation failed:', error);
      }
    }

    // 2. Try Grok as backup
    if (this.grokKey && !content) {
      try {
        content = await this.generateWithGrok(params);
        console.log('✅ Grok generation successful');
      } catch (error) {
        console.warn('❌ Grok generation failed:', error);
      }
    }

    // 3. Try Cohere as backup
    if (this.cohereKey && !content) {
      try {
        content = await this.generateWithCohere(params);
        console.log('✅ Cohere generation successful');
      } catch (error) {
        console.warn('❌ Cohere generation failed:', error);
      }
    }

    // 4. Try HuggingFace as backup
    if (this.huggingfaceToken && !content) {
      try {
        content = await this.generateWithHuggingFace(params);
        console.log('✅ HuggingFace generation successful');
      } catch (error) {
        console.warn('❌ HuggingFace generation failed:', error);
      }
    }

    // 5. Fallback to mock generator if all APIs fail
    if (!content) {
      console.log('⚠️ All AI APIs failed, using fallback mock generator');
      content = await this.generateFallbackContent(params);
    }

    // Enhance content with additional processing
    const enhancedContent = await this.enhanceContent(content, params);

    return enhancedContent;
  }

  private async generateWithOpenAI(params: MultiAPIContentParams): Promise<GeneratedContent> {
    const prompt = this.createPrompt(params);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    return this.parseAIResponse(content, params);
  }

  private async generateWithGrok(params: MultiAPIContentParams): Promise<GeneratedContent> {
    const prompt = this.createPrompt(params);
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.grokKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'grok-2-1212',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from Grok');
    }

    return this.parseAIResponse(content, params);
  }

  private async generateWithCohere(params: MultiAPIContentParams): Promise<GeneratedContent> {
    const prompt = this.createPrompt(params);
    
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.cohereKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 3000,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.generations?.[0]?.text;

    if (!content) {
      throw new Error('No content generated from Cohere');
    }

    return this.parseAIResponse(content, params);
  }

  private async generateWithHuggingFace(params: MultiAPIContentParams): Promise<GeneratedContent> {
    const prompt = this.createPrompt(params);
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
      {
        headers: {
          'Authorization': `Bearer ${this.huggingfaceToken}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 3000,
            temperature: 0.7,
            do_sample: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data[0]?.generated_text || data.generated_text;

    if (!content) {
      throw new Error('No content generated from HuggingFace');
    }

    return this.parseAIResponse(content, params);
  }

  private createPrompt(params: MultiAPIContentParams): string {
    return `Write a comprehensive, SEO-optimized blog post about "${params.primaryKeyword}" that naturally mentions and links to ${params.targetUrl}.

Requirements:
- ${params.wordCount}+ words
- ${params.tone} tone
- Include the keyword "${params.primaryKeyword}" naturally throughout
- Include secondary keywords: ${params.secondaryKeywords.join(', ')}
- Add 2-3 contextual backlinks to ${params.targetUrl} with relevant anchor text
- Structure with clear headings (H1, H2, H3)
- Include actionable tips and insights
- Make it valuable for readers interested in ${params.primaryKeyword}
- Content type: ${params.contentType}

Format the response as JSON with:
{
  "title": "Engaging SEO title with keyword",
  "content": "Full HTML formatted blog post content with proper headings and structure",
  "metaDescription": "SEO meta description under 160 characters",
  "excerpt": "Brief excerpt for preview (150 characters max)",
  "contextualLinks": [{"anchor": "anchor text", "url": "${params.targetUrl}"}],
  "seoScore": 85,
  "keywords": ["${params.primaryKeyword}", ${params.secondaryKeywords.map(k => `"${k}"`).join(', ')}]
}`;
  }

  private parseAIResponse(content: string, params: MultiAPIContentParams): GeneratedContent {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      
      return {
        title: parsed.title || `Complete Guide to ${params.primaryKeyword}`,
        slug: this.generateSlug(parsed.title || params.primaryKeyword),
        metaDescription: parsed.metaDescription || `Learn everything about ${params.primaryKeyword} with expert insights and strategies.`,
        content: parsed.content || content,
        targetUrl: params.targetUrl,
        keywords: parsed.keywords || [params.primaryKeyword, ...params.secondaryKeywords],
        wordCount: (parsed.content || content).split(' ').length,
        createdAt: new Date().toISOString(),
        status: 'published',
        seoScore: parsed.seoScore || 85,
        contextualLinks: parsed.contextualLinks || [{ 
          anchorText: params.primaryKeyword, 
          targetUrl: params.targetUrl, 
          position: 0, 
          context: 'Main content', 
          seoRelevance: 1.0 
        }]
      };
    } catch (parseError) {
      // If JSON parsing fails, treat as plain text
      return {
        title: `The Ultimate Guide to ${params.primaryKeyword}`,
        slug: this.generateSlug(params.primaryKeyword),
        metaDescription: `Comprehensive guide to ${params.primaryKeyword} with actionable insights and strategies.`,
        content: this.formatContentAsHTML(content, params),
        targetUrl: params.targetUrl,
        keywords: [params.primaryKeyword, ...params.secondaryKeywords],
        wordCount: content.split(' ').length,
        createdAt: new Date().toISOString(),
        status: 'published',
        seoScore: 80,
        contextualLinks: [{ 
          anchorText: params.primaryKeyword, 
          targetUrl: params.targetUrl, 
          position: 0, 
          context: 'Main content', 
          seoRelevance: 1.0 
        }]
      };
    }
  }

  private async generateFallbackContent(params: MultiAPIContentParams): Promise<GeneratedContent> {
    // Use existing mock generator as fallback
    const baseContent = await aiContentGenerator.generateContent({
      targetUrl: params.targetUrl,
      primaryKeyword: params.primaryKeyword,
      secondaryKeywords: params.secondaryKeywords,
      contentType: this.mapContentType(params.contentType),
      wordCount: params.wordCount,
      tone: params.tone,
      customInstructions: 'Create comprehensive, SEO-optimized content with natural backlinks'
    });

    return {
      ...baseContent,
      seoScore: 82,
      contextualLinks: [{ 
        anchorText: params.primaryKeyword, 
        targetUrl: params.targetUrl, 
        position: 0, 
        context: 'Main content', 
        seoRelevance: 1.0 
      }]
    };
  }

  private async enhanceContent(content: GeneratedContent, params: MultiAPIContentParams): Promise<GeneratedContent> {
    // Add additional processing like:
    // - SEO optimization
    // - Readability improvements
    // - Link placement optimization
    
    const enhancedContent = { ...content };

    // Ensure proper link integration
    if (enhancedContent.contextualLinks.length === 0) {
      enhancedContent.contextualLinks = [{ 
        anchorText: `expert ${params.primaryKeyword} solutions`, 
        targetUrl: params.targetUrl, 
        position: enhancedContent.content.length / 2, 
        context: 'Mid-content', 
        seoRelevance: 0.9 
      }];
    }

    // Add natural backlinks to content if not present
    if (!enhancedContent.content.includes(params.targetUrl)) {
      const domain = new URL(params.targetUrl).hostname.replace('www.', '');
      enhancedContent.content = enhancedContent.content.replace(
        /\. ([A-Z][^.]*?)(expert|professional|comprehensive|leading)([^.]*?)\./,
        `. $1$2$3. For more advanced strategies, visit <a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">${domain}</a> for expert guidance.`
      );
    }

    return enhancedContent;
  }

  private formatContentAsHTML(content: string, params: MultiAPIContentParams): string {
    // Convert plain text to properly formatted HTML
    let formatted = content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => {
        if (paragraph.includes(params.primaryKeyword) && !paragraph.startsWith('<h')) {
          return `<p>${paragraph}</p>`;
        }
        return paragraph;
      })
      .join('\n\n');

    // Add heading structure if missing
    if (!formatted.includes('<h1>')) {
      formatted = `<h1>The Ultimate Guide to ${params.primaryKeyword}</h1>\n\n${formatted}`;
    }

    return formatted;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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

  // Test API connections
  async testAPIConnections(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    // Test OpenAI
    if (this.openAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${this.openAIKey}` }
        });
        results.openai = response.ok;
      } catch {
        results.openai = false;
      }
    }

    // Test Grok
    if (this.grokKey) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.grokKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'test' }],
            model: 'grok-2-1212',
            max_tokens: 10
          })
        });
        results.grok = response.ok;
      } catch {
        results.grok = false;
      }
    }

    // Test Cohere
    if (this.cohereKey) {
      try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.cohereKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'command',
            prompt: 'test',
            max_tokens: 10
          })
        });
        results.cohere = response.ok;
      } catch {
        results.cohere = false;
      }
    }

    return results;
  }
}

// Export singleton instance
export const enhancedAIContentGenerator = new EnhancedAIContentGenerator();

// Export types
export type { MultiAPIContentParams, GeneratedContent, ContextualLink };
