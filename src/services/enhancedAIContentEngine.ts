/**
 * Enhanced Backlink ∞ Algorithm Content Engine
 * Implements advanced content generation for original SEO-optimized content
 * using Backlink ∞ Algorithm technology with sophisticated prompt templates
 */

import { openAIService } from './api/openai';
import { grokService } from './api/grok';
import { cohereService } from './api/cohere';
import { huggingFaceService } from './api/huggingface';
import { SmartFallbackContent } from './smartFallbackContent';
import { formatBlogContent } from '../utils/textFormatting';

export interface ContentGenerationRequest {
  keyword: string;
  targetUrl: string;
  anchorText?: string;
  userLocation?: string;
  contentLength?: 'short' | 'medium' | 'long';
  contentTone?: 'professional' | 'casual' | 'technical' | 'friendly';
  seoFocus?: 'high' | 'medium' | 'balanced';
  industry?: string;
  targetAudience?: string;
}

export interface AIProviderResult {
  content: string;
  provider: string;
  success: boolean;
  usage: { tokens: number; cost: number };
  error?: string;
  generationTime: number;
}

export interface EnhancedContentResult {
  finalContent: string;
  bestContent: string;
  selectedProvider: string;
  metadata: {
    title: string;
    metaDescription: string;
    keywords: string[];
    seoScore: number;
    wordCount: number;
    readingTime: number;
  };
  processingTime: number;
  totalCost: number;
}

export class EnhancedAIContentEngine {
  private providers = [
    { name: 'huggingface', service: huggingFaceService, weight: 0.60 }, // Primary
    { name: 'cohere', service: cohereService, weight: 0.40 } // Secondary
    // OpenAI and Grok disabled as requested
  ];

  /**
   * Generate sophisticated prompt templates based on SEO guidelines
   */
  private generatePromptTemplates(request: ContentGenerationRequest): {
    primary: string;
    secondary: string;
    creative: string;
  } {
    const { keyword, targetUrl, anchorText, contentLength, seoFocus, industry, targetAudience } = request;
    const anchor = anchorText || keyword;
    const wordCount = this.getWordCountTarget(contentLength);
    const currentYear = new Date().getFullYear();

    const seoGuidelines = `
SEO CONTENT FORMATTING REQUIREMENTS:
✅ Headline Structure:
- Use ONE <h1> tag for the main title
- Use <h2> for major section headings (3-5 sections)
- Use <h3> for subpoints under each h2 (5-8 subheadings)

✅ Paragraph Structure:
- Keep paragraphs short (2–4 sentences max)
- Use line breaks between paragraphs
- Avoid long blocks of text

✅ Keyword Optimization:
- Include main keyword "${keyword}" in the <h1> tag
- Include keyword in first 100 words
- Use keyword 2-4 times in body (avoid keyword stuffing)
- Use related keywords and synonyms naturally

✅ Anchor Text and Hyperlinks:
- Use natural anchor text (not just "click here")
- ALWAYS hyperlink "${anchor}" to ${targetUrl}
- Links must open in new tab: target="_blank" rel="noopener noreferrer"
- Example: <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a>

✅ Text Emphasis:
- Use <strong> for bold important keywords and value points
- Use <em> for italic emphasis or stylistic voice

✅ Content Quality:
- Minimum ${wordCount} words
- Original, not duplicate content
- Include intro and conclusion
- Use bullet points or numbered lists where helpful
- Ensure mobile-responsive formatting
`;

    const primaryPrompt = `Create a comprehensive ${wordCount} word article about "${keyword}" that provides genuine value to readers. Naturally integrate the hyperlink <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a> where it makes contextual sense.

${seoGuidelines}

IMPORTANT: Avoid generic templates and formulaic structures. Create unique content that specifically addresses "${keyword}" rather than following a standard "How to Master [keyword]" or "Best Practices for [keyword]" format.

CONTENT APPROACH:
- Research what people actually want to know about "${keyword}"
- Provide specific, actionable information unique to this topic
- Use natural, conversational language that demonstrates expertise
- Share insights, tips, or perspectives that aren't commonly found elsewhere
- Make the content genuinely helpful for someone interested in "${keyword}"
${industry ? `- Consider ${industry} industry context naturally` : ''}
${targetAudience ? `- Write for: ${targetAudience}` : ''}

STRUCTURE GUIDELINES (not rigid rules):
- Create an engaging title that includes "${keyword}" naturally
- Start with context that hooks the reader
- Organize content logically with clear headers
- Include specific examples, data, or real-world applications
- End with practical takeaways
- Keep paragraphs readable (2-4 sentences)

Focus on being genuinely helpful rather than following SEO templates. The best SEO content is content that serves users well.`;

    const secondaryPrompt = `Write a ${wordCount} word in-depth article about "${keyword}" that demonstrates real expertise and authority. Include the hyperlink <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a> naturally within the content.

${seoGuidelines}

EXPERTISE-FOCUSED APPROACH:
- Show deep understanding of "${keyword}" beyond surface-level information
- Include specific examples, case studies, or real-world applications
- Address common questions or misconceptions about "${keyword}"
- Provide actionable advice that readers can actually implement
- Use data, research, or expert insights to back up claims
- Share practical tips that demonstrate hands-on experience

CONTENT DEPTH REQUIREMENTS:
- Go beyond basic definitions - assume readers want substantial information
- Include nuanced perspectives or lesser-known aspects of "${keyword}"
- Address potential challenges or considerations
- Provide context about why "${keyword}" matters
- Include relevant current information or trends for ${currentYear}
- Natural keyword usage that flows with the content
- Strategic but contextual placement of <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a>

WRITING STYLE:
- Authoritative but approachable tone
- Use clear explanations without unnecessary jargon
- Focus on being genuinely helpful
- Engage readers with interesting insights

Prioritize creating content that truly serves readers while maintaining technical SEO requirements.`;

    const creativePrompt = `Create a compelling ${wordCount} word article about "${keyword}" that breaks away from typical blog templates. Include the hyperlink <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a> where it adds value for readers.

${seoGuidelines}

CREATIVE CONTENT PHILOSOPHY:
- Tell a story or share a unique perspective about "${keyword}"
- Use engaging examples, analogies, or scenarios
- Address "${keyword}" from an angle that readers haven't seen before
- Include surprising facts, insights, or contrarian viewpoints
- Make complex aspects of "${keyword}" easy to understand
- Connect "${keyword}" to broader trends or implications
- Use conversational tone that feels like expert guidance from a friend

ENGAGEMENT TECHNIQUES:
- Start with a question, scenario, or interesting observation
- Use specific examples rather than abstract concepts
- Include actionable steps or practical advice
- Address common misconceptions or surprises about "${keyword}"
- End with thought-provoking conclusions or next steps
- Vary paragraph length and sentence structure for readability

AVOID GENERIC APPROACHES:
- Don't use "Complete Guide" or "Best Practices" formulas
- Avoid starting every section with "Understanding" or "What is"
- Skip predictable structures like "Benefits of [keyword]"
- Don't list obvious points that any basic article would cover

Create content that readers would want to bookmark, share, or reference later because it offers genuine value and fresh insights about "${keyword}".`

    return {
      primary: primaryPrompt,
      secondary: secondaryPrompt,
      creative: creativePrompt
    };
  }

  private getWordCountTarget(length?: string): number {
    switch (length) {
      case 'short': return 1000; // Minimum for SEO
      case 'medium': return 1500;
      case 'long': return 2500;
      default: return 1200; // Ensure minimum 1000+ words
    }
  }

  /**
   * Generate content using multiple Backlink ∞ Algorithm providers with different prompt approaches
   */
  async generateContent(request: ContentGenerationRequest): Promise<EnhancedContentResult> {
    console.log('🚀 Starting enhanced Backlink ∞ Algorithm content generation:', request);
    
    const startTime = Date.now();
    const prompts = this.generatePromptTemplates(request);
    const results: AIProviderResult[] = [];

    // Generate content from multiple providers in parallel
    const generationPromises = this.providers.map(async (provider, index) => {
      const providerStartTime = Date.now();
      
      try {
        console.log(`🤖 Generating content with ${provider.name}...`);
        
        // Use different prompts for variety
        const promptVariations = [prompts.primary, prompts.secondary, prompts.creative];
        const selectedPrompt = promptVariations[index % promptVariations.length];
        
        const systemPrompt = this.getSystemPrompt(provider.name, request);
        
        let result;
        if (provider.name === 'huggingface') {
          const fullPrompt = `${systemPrompt}\n\n${selectedPrompt}`;
          result = await provider.service.generateText(fullPrompt, {
            model: 'gpt2',
            maxLength: Math.min(this.getMaxTokens(request.contentLength), 1500),
            temperature: 0.7
          });
        } else if (provider.name === 'cohere') {
          const fullPrompt = `${systemPrompt}\n\n${selectedPrompt}`;
          result = await provider.service.generateText(fullPrompt, {
            model: 'command',
            maxTokens: this.getMaxTokens(request.contentLength),
            temperature: 0.7
          });
        }

        const generationTime = Date.now() - providerStartTime;

        return {
          content: result?.content || '',
          provider: provider.name,
          success: result?.success || false,
          usage: result?.usage || { tokens: 0, cost: 0 },
          error: result?.error,
          generationTime
        };

      } catch (error) {
        console.error(`❌ Error with ${provider.name}:`, error);
        return {
          content: '',
          provider: provider.name,
          success: false,
          usage: { tokens: 0, cost: 0 },
          error: error instanceof Error ? error.message : 'Unknown error',
          generationTime: Date.now() - providerStartTime
        };
      }
    });

    // Wait for all generations to complete
    const generationResults = await Promise.all(generationPromises);
    results.push(...generationResults);

    // Select the best content based on quality metrics
    const bestResult = this.selectBestContent(results, request);
    
    // Enhance and optimize the selected content
    const enhancedContent = await this.enhanceContent(bestResult.content, request);
    
    // Generate metadata
    const metadata = this.generateMetadata(enhancedContent, request);

    const totalCost = results.reduce((sum, r) => sum + r.usage.cost, 0);
    const processingTime = Date.now() - startTime;

    console.log('✅ Enhanced Backlink ∞ Algorithm content generation complete:', {
      bestProvider: bestResult.provider,
      wordCount: metadata.wordCount,
      seoScore: metadata.seoScore,
      totalCost: `$${totalCost.toFixed(4)}`,
      processingTime: `${processingTime}ms`,
      finalContentLength: enhancedContent.length,
      hasFinalContent: !!enhancedContent && enhancedContent.length > 0
    });

    if (!enhancedContent || enhancedContent.length < 50) {
      console.error('❌ Enhanced content is empty or too short:', {
        enhancedContent: enhancedContent,
        enhancedContentLength: enhancedContent?.length,
        bestResultContent: bestResult.content,
        bestResultContentLength: bestResult.content?.length
      });
    }

    return {
      finalContent: enhancedContent,
      bestContent: enhancedContent,
      selectedProvider: bestResult.provider,
      metadata: {
        title: metadata.title,
        metaDescription: metadata.metaDescription,
        keywords: metadata.keywords,
        seoScore: metadata.seoScore,
        wordCount: metadata.wordCount,
        readingTime: metadata.readingTime
      },
      processingTime,
      totalCost
    };
  }

  private getSystemPrompt(provider: string, request: ContentGenerationRequest): string {
    const basePrompt = `You are a world-class SEO content writer and digital marketing expert. Create original, high-quality content that ranks well in search engines while providing genuine value to readers.`;

    switch (provider) {
      case 'huggingface':
        return `${basePrompt} Focus on natural language generation with conversational flow. Create engaging, human-like content that connects with readers. Generate comprehensive, SEO-optimized content with proper HTML structure.`;
      case 'cohere':
        return `${basePrompt} Emphasize clarity, coherence, and logical flow. Create well-structured, easy-to-read content with excellent SEO optimization.`;
      default:
        return basePrompt;
    }
  }

  private getMaxTokens(length?: string): number {
    switch (length) {
      case 'short': return 1200;
      case 'medium': return 2200;
      case 'long': return 3500;
      default: return 2800;
    }
  }

  /**
   * Select the best content based on quality metrics
   */
  private selectBestContent(results: AIProviderResult[], request: ContentGenerationRequest): AIProviderResult {
    console.log('🔍 Selecting best content from results:', {
      totalResults: results.length,
      successfulResults: results.filter(r => r.success).length,
      resultsWithContent: results.filter(r => r.content.length > 100).length,
      providers: results.map(r => ({ provider: r.provider, success: r.success, contentLength: r.content.length }))
    });

    const successfulResults = results.filter(r => r.success && r.content.length > 100);

    if (successfulResults.length === 0) {
      console.warn('⚠️ No successful AI results, using fallback content generation');

      const fallbackContent = SmartFallbackContent.generateContent(
        request.keyword,
        request.targetUrl,
        request.anchorText
      );

      console.log('📝 Fallback content generated:', {
        contentLength: fallbackContent.length,
        hasH1: fallbackContent.includes('<h1>'),
        keyword: request.keyword
      });

      // Return the first result as fallback
      return results[0] || {
        content: fallbackContent,
        provider: 'fallback',
        success: true,
        usage: { tokens: 0, cost: 0 },
        generationTime: 0
      };
    }

    // Score each result based on multiple factors
    const scoredResults = successfulResults.map(result => {
      let score = 0;
      
      // Content length score (prefer target word count)
      const targetWords = this.getWordCountTarget(request.contentLength);
      const actualWords = result.content.split(/\s+/).length;
      const lengthRatio = Math.min(actualWords / targetWords, targetWords / actualWords);
      score += lengthRatio * 30;
      
      // Keyword presence score
      const keywordPresence = this.countKeywordMentions(result.content, request.keyword);
      score += Math.min(keywordPresence * 5, 20);
      
      // Link integration score
      const hasProperLink = result.content.includes(request.targetUrl) || 
                           result.content.includes(request.anchorText || request.keyword);
      score += hasProperLink ? 20 : 0;
      
      // Structure score (headings, paragraphs)
      const hasHeadings = /#{1,3}\s/.test(result.content) || /<h[1-6]/.test(result.content);
      const hasParagraphs = result.content.split('\n\n').length > 3;
      score += (hasHeadings ? 15 : 0) + (hasParagraphs ? 10 : 0);
      
      // Provider weight
      const provider = this.providers.find(p => p.name === result.provider);
      score += (provider?.weight || 0) * 100;
      
      return { ...result, score };
    });

    // Return the highest scoring result
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults[0];
  }

  private countKeywordMentions(content: string, keyword: string): number {
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    return (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  }

  /**
   * Enhance and optimize the selected content according to SEO guidelines
   */
  private async enhanceContent(content: string, request: ContentGenerationRequest): Promise<string> {
    console.log('🔧 Starting content enhancement:', {
      originalLength: content.length,
      keyword: request.keyword,
      hasH1: content.includes('<h1>') || content.includes('# ')
    });

    let enhanced = content;
    const anchorText = request.anchorText || request.keyword;

    // Ensure proper heading structure (only one H1 per page)
    if (!enhanced.includes('<h1>') && !enhanced.includes('# ')) {
      // Let the AI-generated content provide its own title - don't force a template
      console.warn('⚠️ Generated content missing H1 tag - content may need manual review');
    }

    try {
      // Convert markdown to proper HTML structure
      console.log('📝 Converting markdown to HTML...');
      enhanced = this.convertMarkdownToSEOHTML(enhanced);
      console.log('📝 After markdown conversion:', { length: enhanced.length });

      // Ensure proper paragraph structure (short paragraphs, 2-4 sentences)
      enhanced = this.optimizeParagraphStructure(enhanced);
      console.log('📝 After paragraph optimization:', { length: enhanced.length });

      // Integrate backlink naturally with proper anchor text
      enhanced = this.integrateBacklinkNaturally(enhanced, request);
      console.log('📝 After backlink integration:', { length: enhanced.length });

      // Add proper keyword emphasis using strong and em tags
      enhanced = this.addKeywordEmphasis(enhanced, request);
      console.log('📝 After keyword emphasis:', { length: enhanced.length });

      // Ensure proper content length (minimum 1000 words)
      enhanced = await this.ensureContentLength(enhanced, request);
      console.log('📝 After content length check:', { length: enhanced.length });

      // Note: Meta tags and structured data should be handled by the page template, not inline content

      // Apply enhanced text formatting (bullet points, capitalization)
      enhanced = formatBlogContent(enhanced);
      console.log('📝 After text formatting:', { length: enhanced.length });
    } catch (enhancementError) {
      console.error('❌ Error during content enhancement:', enhancementError);
      console.log('🔧 Falling back to original content due to enhancement error');
      enhanced = content; // Fall back to original content if enhancement fails
    }

    const finalContent = enhanced.trim();
    console.log('✅ Content enhancement complete:', {
      originalLength: content.length,
      finalLength: finalContent.length,
      success: finalContent.length > 50
    });

    return finalContent;
  }
  
  /**
   * Convert markdown to SEO-optimized HTML structure
   */
  private convertMarkdownToSEOHTML(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert markdown bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert markdown italic
      .replace(/#{1}\s(.+)/g, '<h1>$1</h1>') // H1 headings
      .replace(/#{2}\s(.+)/g, '<h2>$1</h2>') // H2 headings
      .replace(/#{3}\s(.+)/g, '<h3>$1</h3>') // H3 headings
      .replace(/#{4,6}\s(.+)/g, '<h3>$1</h3>') // Convert H4-H6 to H3 for better SEO
      .replace(/^([^<\n]+)$/gm, (match) => {
        // Wrap non-heading lines in paragraphs if not already wrapped
        if (!match.startsWith('<') && match.trim() && !match.includes('</')) {
          return `<p>${match}</p>`;
        }
        return match;
      });
  }
  
  /**
   * Optimize paragraph structure for SEO (2-4 sentences per paragraph)
   */
  private optimizeParagraphStructure(content: string): string {
    return content.replace(/<p>([^<]+)<\/p>/g, (match, text) => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 4) {
        // Split long paragraphs
        const midpoint = Math.ceil(sentences.length / 2);
        const part1 = sentences.slice(0, midpoint).join('. ') + '.';
        const part2 = sentences.slice(midpoint).join('. ') + '.';
        return `<p>${part1}</p>\n\n<p>${part2}</p>`;
      }
      return match;
    });
  }
  
  /**
   * Integrate backlink naturally with proper anchor text and attributes
   */
  private integrateBacklinkNaturally(content: string, request: ContentGenerationRequest): string {
    const hasTargetUrl = content.includes(request.targetUrl);
    const anchorText = request.anchorText || request.keyword;
    
    if (!hasTargetUrl) {
      // Create proper link with SEO attributes
      const linkHtml = `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
      
      // Find the best place to insert the link (middle of content)
      const paragraphs = content.split('</p>');
      if (paragraphs.length > 3) {
        const targetIndex = Math.floor(paragraphs.length / 2);
        const targetParagraph = paragraphs[targetIndex];
        
        // Try to replace keyword naturally
        const keywordRegex = new RegExp(`\\b${request.keyword}\\b`, 'i');
        if (keywordRegex.test(targetParagraph)) {
          paragraphs[targetIndex] = targetParagraph.replace(keywordRegex, linkHtml);
        } else {
          // Add a natural reference paragraph
          const linkParagraph = `<p>For comprehensive ${request.keyword} solutions and expert guidance, ${linkHtml} offers advanced tools and strategies.</p>`;
          paragraphs.splice(targetIndex, 0, linkParagraph);
        }
        
        content = paragraphs.join('</p>');
      }
    }
    
    return content;
  }
  
  /**
   * Add proper keyword emphasis using strong and em tags
   */
  private addKeywordEmphasis(content: string, request: ContentGenerationRequest): string {
    const keyword = request.keyword;
    let enhancedContent = content;
    
    // Add strong tags to first few keyword mentions (but not if already in a link)
    let keywordCount = 0;
    enhancedContent = enhancedContent.replace(
      new RegExp(`(?<!<[^>]*?)\\b${keyword}\\b(?![^<]*?>)`, 'gi'),
      (match) => {
        keywordCount++;
        if (keywordCount <= 2) {
          return `<strong>${match}</strong>`;
        } else if (keywordCount <= 4) {
          return `<em>${match}</em>`;
        }
        return match;
      }
    );
    
    return enhancedContent;
  }
  
  /**
   * Ensure content meets minimum length requirements (1000+ words)
   */
  private async ensureContentLength(content: string, request: ContentGenerationRequest): Promise<string> {
    const wordCount = content.split(/\s+/).length;

    if (wordCount < 1000) {
      // If content is too short, log a warning but don't add template content
      console.warn(`⚠️ Generated content for "${request.keyword}" is only ${wordCount} words. Consider using better prompts or different AI providers.`);
      // Don't add template content - let the AI generate unique content only
    }

    return content;
  }
  

  
  /**
   * Add meta tags and structured data hints
   */
  private addMetaTagsHints(content: string, request: ContentGenerationRequest): string {
    const title = this.extractTitle(content) || `${request.keyword}: Complete Guide ${new Date().getFullYear()}`;
    const metaDescription = this.generateMetaDescription(request);
    
    const metaHints = `
<!-- SEO Meta Tags (add to head section) -->
<!-- <meta name="description" content="${metaDescription}"> -->
<!-- <meta name="keywords" content="${request.keyword}, ${request.keyword} guide, ${request.keyword} tips, best ${request.keyword}"> -->
<!-- <title>${title}</title> -->

<!-- Structured Data (add to head section) -->
<!--
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${title}",
  "description": "${metaDescription}",
  "keywords": "${request.keyword}, ${request.keyword} guide, ${request.keyword} strategies",
  "author": {
    "@type": "Organization",
    "name": "Backlink ∞"
  }
}
</script>
-->

`;
    
    return metaHints + content;
  }
  
  /**
   * Extract title from content
   */
  private extractTitle(content: string): string | null {
    const titleMatch = content.match(/<h1>([^<]+)<\/h1>/);
    return titleMatch ? titleMatch[1] : null;
  }
  
  /**
   * Generate SEO-optimized meta description
   */
  private generateMetaDescription(request: ContentGenerationRequest): string {
    const keyword = request.keyword;
    const description = `Complete ${keyword} guide with expert strategies, best practices, and actionable tips. Learn how to master ${keyword} with proven techniques and professional insights.`;
    return description.substring(0, 155); // Keep under 160 characters
  }

  /**
   * Generate metadata for the content
   */
  private generateMetadata(content: string, request: ContentGenerationRequest) {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Extract or generate title
    const titleMatch = content.match(/<h1>(.*?)<\/h1>|^#\s(.+)/m);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 
                 `${request.keyword}: Complete Guide ${new Date().getFullYear()}`;

    // Generate keywords
    const keywords = [
      request.keyword,
      `${request.keyword} guide`,
      `${request.keyword} tips`,
      `best ${request.keyword}`,
      `${request.keyword} strategies`,
      `${request.keyword} ${new Date().getFullYear()}`
    ];

    // Generate meta description
    const metaDescription = `Comprehensive ${request.keyword} guide with expert insights, practical tips, and proven strategies. Learn from industry experts.`.substring(0, 160);

    // Calculate SEO score based on various factors
    let seoScore = 70; // Base score
    
    if (wordCount >= 1000) seoScore += 10;
    if (wordCount >= 1500) seoScore += 5;
    if (content.includes(request.targetUrl)) seoScore += 10;
    if (content.includes('<h1>') || content.includes('# ')) seoScore += 5;
    if ((content.match(/<h[2-6]>/g) || []).length >= 3) seoScore += 5;
    if (this.countKeywordMentions(content, request.keyword) >= 3) seoScore += 5;
    
    seoScore = Math.min(seoScore, 100);

    return {
      title,
      metaDescription,
      keywords,
      seoScore,
      wordCount,
      readingTime
    };
  }

  /**
   * Generate fallback content when all Backlink ∞ Algorithm providers fail
   */
  private generateFallbackContent(request: ContentGenerationRequest): string {
    const { keyword, targetUrl, anchorText } = request;
    const anchor = anchorText || keyword;
    const currentYear = new Date().getFullYear();

    return `<h1>${keyword}: Your Complete ${currentYear} Guide</h1>

<h2>Introduction</h2>

<p>Welcome to the comprehensive guide on ${keyword}. In today's digital landscape, understanding <strong>${keyword}</strong> is crucial for success. This guide will provide you with everything you need to know to master ${keyword} effectively.</p>

<h2>What is ${keyword}?</h2>

<p><em>${keyword}</em> represents a fundamental aspect of modern business strategy. Whether you're just starting out or looking to improve your existing approach, ${keyword} offers numerous opportunities for growth and development.</p>

<h2>Key Benefits of ${keyword}</h2>

<ul>
<li><strong>Enhanced Performance</strong>: Implementing ${keyword} strategies can significantly improve your results</li>
<li><strong>Competitive Advantage</strong>: Stay ahead with advanced ${keyword} techniques</li>
<li><strong>Cost Efficiency</strong>: Optimize your resources through strategic ${keyword} implementation</li>
<li><strong>Long-term Growth</strong>: Build sustainable success with proven ${keyword} methodologies</li>
</ul>

<h2>Best Practices for ${keyword}</h2>

<h3>Getting Started</h3>
<p>Begin your ${keyword} journey with a solid foundation. Understanding the basics is essential before moving to advanced techniques.</p>

<h3>Advanced Strategies</h3>
<p>For those ready to take their ${keyword} efforts to the next level, consider exploring <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchor}</a> for comprehensive solutions and expert guidance.</p>

<h3>Common Mistakes to Avoid</h3>
<ul>
<li>Neglecting proper planning and research</li>
<li>Focusing on quantity over quality</li>
<li>Ignoring user experience considerations</li>
<li>Failing to adapt to industry changes</li>
</ul>

<h2>Implementation Tips</h2>

<p><strong>Start Small</strong>: Begin with manageable goals and scale gradually</p>
<p><strong>Monitor Progress</strong>: Track your results and adjust strategies accordingly</p>
<p><strong>Stay Updated</strong>: Keep up with the latest ${keyword} trends and best practices</p>
<p><strong>Seek Expert Help</strong>: Consider professional guidance when needed</p>

<h2>Conclusion</h2>

<p><strong>${keyword}</strong> success requires dedication, strategy, and the right tools. By following the guidelines in this comprehensive guide, you'll be well-positioned to achieve your ${keyword} objectives.</p>

<p>Ready to get started? <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">Explore our ${keyword} solutions</a> and take your efforts to the next level.</p>

<p><em>This guide provides foundational knowledge for ${keyword} success. For advanced strategies and personalized guidance, consider consulting with industry experts.</em></p>`;
  }

  /**
   * Test connectivity to all Backlink ∞ Algorithm providers
   */
  async testAllProviders(): Promise<{
    [provider: string]: { available: boolean; configured: boolean }
  }> {
    const results: { [key: string]: { available: boolean; configured: boolean } } = {};

    for (const provider of this.providers) {
      const configured = provider.service.isConfigured();
      let available = false;

      if (configured) {
        try {
          available = await provider.service.testConnection();
        } catch (error) {
          console.warn(`Test failed for ${provider.name}:`, error);
        }
      }

      results[provider.name] = { available, configured };
    }

    return results;
  }
}

export const enhancedAIContentEngine = new EnhancedAIContentEngine();
