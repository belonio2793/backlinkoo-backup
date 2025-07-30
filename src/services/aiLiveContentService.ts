/**
 * AI Live Content Generation Service - Server-Side via Netlify Functions
 * Handles content generation using secure server-side API calls
 */

interface GenerationResult {
  content: string;
  wordCount: number;
  provider: string;
  success: boolean;
  error?: string;
}

class AILiveContentService {
  constructor() {
    console.log('✅ AI Live Content Service initialized - using server-side API calls');
  }

  async checkHealth(): Promise<boolean> {
    // Health check via Netlify function
    try {
      const response = await fetch('/.netlify/functions/check-ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'OpenAI' })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.configured || false;
      }
      return false;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async generateContent(
    prompt: string,
    keyword: string,
    anchorText: string,
    url: string,
    retryCount: number = 3
  ): Promise<GenerationResult> {
    try {
      console.log('Generating content via Netlify function...');

      const response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword,
          url,
          anchorText,
          wordCount: 1200,
          contentType: 'article',
          tone: 'professional'
        })
      });

      if (!response.ok) {
        throw new Error(`Netlify function error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const wordCount = result.content.split(/\s+/).length;
        console.log(`Content generated successfully: ${wordCount} words`);

        return {
          content: result.content,
          wordCount,
          provider: 'OpenAI',
          success: true
        };
      } else {
        throw new Error(result.error || 'Content generation failed');
      }

    } catch (error) {
      console.error('Content generation failed:', error);

      // Retry logic with exponential backoff
      if (retryCount > 0 && (error instanceof Error &&
          (error.message.includes('429') || error.message.includes('500') || error.message.includes('502')))) {
        console.log(`Retrying in ${(4 - retryCount) * 1000}ms... (${retryCount} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, (4 - retryCount) * 1000));
        return this.generateContent(prompt, keyword, anchorText, url, retryCount - 1);
      }

      return {
        content: '',
        wordCount: 0,
        provider: 'OpenAI',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  generateSlug(keyword: string): string {
    const baseSlug = keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }

  validateContent(content: string, keyword: string, anchorText: string, url: string) {
    const issues = [];
    let score = 0;

    // Check word count
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 1000) {
      issues.push(`Content too short: ${wordCount} words (minimum 1000 required)`);
    } else {
      score += 30;
    }

    // Check keyword presence
    const keywordRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const keywordMatches = content.match(keywordRegex);
    if (!keywordMatches || keywordMatches.length === 0) {
      issues.push('Target keyword not found in content');
    } else if (keywordMatches.length > 10) {
      issues.push('Potential keyword stuffing detected');
      score += 10;
    } else {
      score += 25;
    }

    // Check anchor text and URL
    if (!content.includes(anchorText)) {
      issues.push('Anchor text not found in content');
    } else {
      score += 25;
    }

    if (!content.includes(url)) {
      issues.push('Target URL not found in content');
    } else {
      score += 20;
    }

    // Check for basic HTML structure
    if (content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>')) {
      score += 10;
    } else {
      issues.push('No proper heading structure detected');
    }

    return {
      score,
      isValid: score >= 70 && issues.length === 0,
      issues,
      wordCount
    };
  }
}

export const aiLiveContentService = new AILiveContentService();
