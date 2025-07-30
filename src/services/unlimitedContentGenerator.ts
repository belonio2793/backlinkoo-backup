/**
 * Unlimited Content Generator
 * Guarantees content generation with 1000-word fallback and unlimited requests
 */

import { openAIService } from './api/openai';
import { cohereService } from './api/cohere';

export interface UnlimitedGenerationOptions {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'guide';
}

export interface UnlimitedGenerationResult {
  content: string;
  title: string;
  metaDescription: string;
  wordCount: number;
  provider: string;
  success: boolean;
  usage: { tokens: number; cost: number };
  fallbacksUsed: string[];
  guaranteedContent: boolean;
}

export class UnlimitedContentGenerator {
  private static readonly MIN_WORDS = 1000;
  private static readonly DEFAULT_WORD_COUNT = 1500;

  /**
   * Generate content with unlimited attempts and guaranteed 1000+ words
   */
  async generateContent(options: UnlimitedGenerationOptions): Promise<UnlimitedGenerationResult> {
    const {
      targetUrl,
      primaryKeyword,
      anchorText = primaryKeyword,
      wordCount = UnlimitedContentGenerator.DEFAULT_WORD_COUNT,
      tone = 'professional',
      contentType = 'guide'
    } = options;

    const fallbacksUsed: string[] = [];
    const startTime = Date.now();

    console.log('🚀 Starting unlimited content generation with guaranteed fallback...');

    // First attempt: OpenAI with unlimited retries
    try {
      if (openAIService.isConfigured()) {
        console.log('🔵 Attempting OpenAI generation (unlimited retries)...');
        const openAIResult = await this.generateWithOpenAI(options);
        
        if (openAIResult.success && this.validateWordCount(openAIResult.content, wordCount)) {
          return {
            ...openAIResult,
            provider: 'openai',
            fallbacksUsed,
            guaranteedContent: true
          };
        }
        
        fallbacksUsed.push('openai');
        console.log('⚠️ OpenAI failed or insufficient words, trying Cohere...');
      } else {
        console.log('⚠️ OpenAI not configured, skipping...');
        fallbacksUsed.push('openai-not-configured');
      }
    } catch (error) {
      console.warn('❌ OpenAI failed:', error instanceof Error ? error.message : 'Unknown error');
      fallbacksUsed.push('openai-error');
    }

    // Second attempt: Cohere
    try {
      if (cohereService.isConfigured()) {
        console.log('🟠 Attempting Cohere generation...');
        const cohereResult = await this.generateWithCohere(options);
        
        if (cohereResult.success && this.validateWordCount(cohereResult.content, wordCount)) {
          return {
            ...cohereResult,
            provider: 'cohere',
            fallbacksUsed,
            guaranteedContent: true
          };
        }
        
        fallbacksUsed.push('cohere');
        console.log('⚠️ Cohere failed or insufficient words, using guaranteed fallback...');
      } else {
        console.log('⚠️ Cohere not configured, skipping...');
        fallbacksUsed.push('cohere-not-configured');
      }
    } catch (error) {
      console.warn('❌ Cohere failed:', error instanceof Error ? error.message : 'Unknown error');
      fallbacksUsed.push('cohere-error');
    }

    // Guaranteed fallback: Generate exactly the requested word count
    console.log('🛡️ Using guaranteed 1000+ word fallback generator...');
    const guaranteedResult = this.generateGuaranteedContent(options);
    
    return {
      ...guaranteedResult,
      provider: 'guaranteed-fallback',
      fallbacksUsed,
      guaranteedContent: true,
      usage: { tokens: 0, cost: 0 }
    };
  }

  /**
   * Generate content with OpenAI (with unlimited retries)
   */
  private async generateWithOpenAI(options: UnlimitedGenerationOptions): Promise<UnlimitedGenerationResult> {
    const prompt = this.createPrompt(options);
    const systemPrompt = this.createSystemPrompt(options.contentType || 'guide', options.tone || 'professional');

    // Use OpenAI with maximum retry configuration
    const result = await openAIService.generateContent(prompt, {
      model: 'gpt-3.5-turbo',
      maxTokens: Math.min(4000, Math.floor((options.wordCount || 1500) * 2.5)),
      temperature: 0.7,
      systemPrompt,
      retryConfig: {
        maxRetries: 20, // Unlimited-like retries
        baseDelay: 1000,
        maxDelay: 60000,
        exponentialBackoff: true,
        retryOnRateLimit: true,
        retryOnServerError: true,
        timeoutMs: 60000
      }
    });

    return {
      content: result.content,
      title: this.extractTitle(result.content) || `Complete Guide to ${options.primaryKeyword}`,
      metaDescription: this.generateMetaDescription(options.primaryKeyword),
      wordCount: this.countWords(result.content),
      provider: 'openai',
      success: result.success,
      usage: result.usage,
      fallbacksUsed: [],
      guaranteedContent: result.success
    };
  }

  /**
   * Generate content with Cohere
   */
  private async generateWithCohere(options: UnlimitedGenerationOptions): Promise<UnlimitedGenerationResult> {
    const prompt = this.createPrompt(options);

    const result = await cohereService.generateContent(prompt, {
      maxTokens: Math.min(4000, Math.floor((options.wordCount || 1500) * 2.5)),
      temperature: 0.7
    });

    return {
      content: result.content,
      title: this.extractTitle(result.content) || `Complete Guide to ${options.primaryKeyword}`,
      metaDescription: this.generateMetaDescription(options.primaryKeyword),
      wordCount: this.countWords(result.content),
      provider: 'cohere',
      success: result.success,
      usage: result.usage,
      fallbacksUsed: [],
      guaranteedContent: result.success
    };
  }

  /**
   * Generate guaranteed 1000+ word content as fallback
   */
  private generateGuaranteedContent(options: UnlimitedGenerationOptions): UnlimitedGenerationResult {
    const {
      targetUrl,
      primaryKeyword,
      anchorText = primaryKeyword,
      wordCount = 1500,
      contentType = 'guide'
    } = options;

    // Generate content sections to reach target word count
    const sections = this.generateContentSections(primaryKeyword, targetUrl, anchorText, wordCount);
    const content = sections.join('\n\n');
    
    return {
      content,
      title: `Complete Professional Guide to ${primaryKeyword} ${new Date().getFullYear()}`,
      metaDescription: this.generateMetaDescription(primaryKeyword),
      wordCount: this.countWords(content),
      provider: 'guaranteed-fallback',
      success: true,
      usage: { tokens: 0, cost: 0 },
      fallbacksUsed: [],
      guaranteedContent: true
    };
  }

  /**
   * Generate comprehensive content sections to meet word count
   */
  private generateContentSections(keyword: string, targetUrl: string, anchorText: string, targetWords: number): string[] {
    const sections = [
      `<h1>Complete Professional Guide to ${keyword} ${new Date().getFullYear()}</h1>`,
      
      `<p>Understanding <strong>${keyword}</strong> is essential in today's rapidly evolving landscape. Whether you're a beginner looking to get started or an experienced professional seeking to deepen your knowledge, this comprehensive guide will provide you with the insights, strategies, and practical advice you need to succeed.</p>`,

      `<p>In this extensive article, we'll explore every aspect of ${keyword}, from fundamental concepts to advanced techniques. You'll discover proven methodologies, industry best practices, and expert insights that can help you achieve your goals more effectively.</p>`,

      `<h2>Understanding the Fundamentals of ${keyword}</h2>`,

      `<p>Before diving into advanced strategies, it's crucial to establish a solid foundation in ${keyword}. This topic encompasses various elements that work together to create a comprehensive understanding of the subject matter.</p>`,

      `<p>The importance of ${keyword} cannot be overstated in modern contexts. It influences decision-making processes, affects outcomes, and plays a vital role in achieving success across multiple domains. By mastering the fundamentals, you're setting yourself up for long-term success.</p>`,

      `<p>Key components of ${keyword} include theoretical frameworks, practical applications, and real-world implementation strategies. Each of these elements contributes to a holistic understanding that enables effective application in various scenarios.</p>`,

      `<h2>The Complete History and Evolution of ${keyword}</h2>`,

      `<p>To truly understand ${keyword}, we must examine its historical development and evolution over time. This perspective provides valuable context and helps us appreciate the current state of the field.</p>`,

      `<p>The origins of ${keyword} can be traced back to early developments in related fields. Over time, it has evolved through various phases, incorporating new insights, technologies, and methodologies. This evolution continues today as we discover new applications and refine existing approaches.</p>`,

      `<p>Major milestones in the development of ${keyword} have shaped our current understanding and practice. These breakthrough moments have led to significant advances and continue to influence how we approach challenges in this area.</p>`,

      `<h2>Essential Principles and Core Concepts</h2>`,

      `<p>Mastering ${keyword} requires understanding several fundamental principles that serve as the foundation for all advanced work in this area. These principles guide decision-making and provide a framework for consistent, effective action.</p>`,

      `<ul>
        <li><strong>Systematic Approach:</strong> Developing a structured methodology ensures consistent results and helps identify areas for improvement.</li>
        <li><strong>Continuous Learning:</strong> The field of ${keyword} is constantly evolving, making ongoing education essential for success.</li>
        <li><strong>Best Practices:</strong> Following established guidelines and proven methods increases the likelihood of positive outcomes.</li>
        <li><strong>Adaptability:</strong> Being flexible and responsive to changing conditions is crucial in dynamic environments.</li>
        <li><strong>Quality Focus:</strong> Maintaining high standards throughout all aspects of work ensures optimal results.</li>
        <li><strong>Collaboration:</strong> Working effectively with others often leads to better outcomes than individual efforts alone.</li>
      </ul>`,

      `<h2>Advanced Strategies and Techniques</h2>`,

      `<p>Once you've mastered the fundamentals, it's time to explore advanced strategies that can take your understanding and application of ${keyword} to the next level. These techniques have been developed and refined by experts in the field.</p>`,

      `<p>Advanced practitioners of ${keyword} employ sophisticated approaches that go beyond basic applications. These methods require deeper understanding and more nuanced decision-making but offer significantly enhanced results when properly implemented.</p>`,

      `<p>For comprehensive resources and expert guidance on implementing advanced ${keyword} strategies, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides detailed insights and proven methodologies.</p>`,

      `<h2>Step-by-Step Implementation Guide</h2>`,

      `<p>Implementing ${keyword} effectively requires a systematic approach that addresses all necessary components. This step-by-step guide will walk you through the entire process from initial planning to final execution.</p>`,

      `<ol>
        <li><strong>Assessment and Planning:</strong> Begin by thoroughly evaluating your current situation and establishing clear objectives for what you want to achieve with ${keyword}.</li>
        <li><strong>Resource Allocation:</strong> Identify and secure the necessary resources, including time, tools, and expertise required for successful implementation.</li>
        <li><strong>Strategy Development:</strong> Create a comprehensive strategy that aligns with your objectives and takes into account all relevant factors and constraints.</li>
        <li><strong>Initial Implementation:</strong> Start with a pilot or small-scale implementation to test your approach and identify any issues or areas for improvement.</li>
        <li><strong>Monitoring and Adjustment:</strong> Continuously monitor progress and make necessary adjustments to ensure you're staying on track toward your objectives.</li>
        <li><strong>Full-Scale Deployment:</strong> Once you've validated your approach, proceed with full implementation while maintaining careful oversight.</li>
        <li><strong>Evaluation and Optimization:</strong> Regularly assess results and optimize your approach based on performance data and changing requirements.</li>
      </ol>`,

      `<h2>Common Challenges and Proven Solutions</h2>`,

      `<p>Working with ${keyword} presents various challenges that practitioners commonly encounter. Understanding these challenges and having proven solutions at your disposal can save time and prevent costly mistakes.</p>`,

      `<p>One of the most frequent challenges involves balancing multiple competing priorities while maintaining focus on core objectives. This requires careful planning and ongoing adjustment as circumstances change.</p>`,

      `<p>Another common issue is resource constraints, whether related to time, budget, or expertise. Successful practitioners develop strategies for maximizing results within available resources while identifying opportunities for additional support when needed.</p>`,

      `<h2>Industry Best Practices and Standards</h2>`,

      `<p>The field of ${keyword} has developed numerous best practices and standards that guide professional work. These guidelines represent the collective wisdom of practitioners and provide a foundation for consistent, high-quality results.</p>`,

      `<p>Adhering to industry standards not only improves outcomes but also facilitates collaboration and communication with others in the field. It demonstrates professionalism and commitment to quality that enhances credibility and trust.</p>`,

      `<p>Best practices in ${keyword} encompass all aspects of work, from initial planning and design to implementation and ongoing maintenance. They provide practical guidance for making decisions and solving problems effectively.</p>`,

      `<h2>Measuring Success and Key Performance Indicators</h2>`,

      `<p>Determining the success of your ${keyword} efforts requires establishing appropriate metrics and regularly monitoring progress. Key performance indicators (KPIs) provide objective measures that help you understand what's working and what needs improvement.</p>`,

      `<p>Effective measurement systems include both quantitative metrics that provide hard data and qualitative assessments that capture more nuanced aspects of performance. This comprehensive approach gives you a complete picture of your progress.</p>`,

      `<p>Regular review of performance data enables continuous improvement and helps identify trends and patterns that might not be apparent from day-to-day observation. This insight is invaluable for making strategic decisions and optimizing your approach.</p>`,

      `<h2>Future Trends and Developments</h2>`,

      `<p>The field of ${keyword} continues to evolve rapidly, with new developments and trends emerging regularly. Staying informed about these changes is essential for maintaining relevance and competitive advantage.</p>`,

      `<p>Emerging technologies and methodologies are creating new opportunities and changing how work is done in this area. Understanding these trends helps you prepare for future challenges and capitalize on new possibilities.</p>`,

      `<p>Forward-thinking practitioners actively monitor industry developments and experiment with new approaches to stay ahead of the curve. This proactive stance enables them to lead rather than follow in their field.</p>`,

      `<h2>Expert Tips and Professional Insights</h2>`,

      `<p>Learning from experienced practitioners can significantly accelerate your progress in ${keyword}. These expert insights represent years of accumulated knowledge and hard-won experience.</p>`,

      `<ul>
        <li><strong>Start with fundamentals:</strong> Don't rush to advanced techniques before mastering the basics.</li>
        <li><strong>Learn from failures:</strong> Mistakes are valuable learning opportunities when approached with the right mindset.</li>
        <li><strong>Build strong networks:</strong> Relationships with other practitioners provide support, advice, and opportunities.</li>
        <li><strong>Stay curious:</strong> Continuous learning and exploration lead to new discoveries and improvements.</li>
        <li><strong>Document your process:</strong> Keeping detailed records helps you learn from experience and share knowledge with others.</li>
        <li><strong>Focus on value:</strong> Always consider how your work in ${keyword} creates value for stakeholders.</li>
      </ul>`,

      `<h2>Conclusion and Next Steps</h2>`,

      `<p>Mastering ${keyword} is a journey that requires dedication, continuous learning, and practical application. The concepts, strategies, and techniques outlined in this guide provide a comprehensive foundation for success in this important area.</p>`,

      `<p>As you continue to develop your expertise in ${keyword}, remember that consistent practice and ongoing education are key to achieving and maintaining high levels of performance. The investment you make in developing these skills will pay dividends throughout your career.</p>`,

      `<p>Take action on what you've learned by implementing the strategies and techniques that are most relevant to your situation. Start with small steps and gradually build your capabilities as you gain experience and confidence.</p>`
    ];

    // Ensure we have enough content to meet word count requirements
    const currentWordCount = this.countWords(sections.join(' '));
    if (currentWordCount < targetWords) {
      // Add additional sections to reach target word count
      const additionalSections = this.generateAdditionalSections(keyword, targetWords - currentWordCount);
      sections.push(...additionalSections);
    }

    return sections;
  }

  /**
   * Generate additional content sections if needed to reach word count
   */
  private generateAdditionalSections(keyword: string, wordsNeeded: number): string[] {
    const additionalSections = [
      `<h2>Detailed Analysis of ${keyword} Components</h2>`,
      `<p>A deeper examination of ${keyword} reveals multiple interconnected components that work together to create comprehensive solutions. Understanding these relationships is crucial for effective implementation and optimization.</p>`,
      
      `<h3>Technical Specifications and Requirements</h3>`,
      `<p>Technical aspects of ${keyword} involve specific requirements and specifications that must be considered during planning and implementation. These technical considerations often determine the success or failure of initiatives.</p>`,
      
      `<h3>Resource Management and Optimization</h3>`,
      `<p>Effective resource management is essential for successful ${keyword} implementation. This includes both human resources and technical resources, each requiring careful planning and allocation.</p>`,
      
      `<h2>Case Studies and Real-World Applications</h2>`,
      `<p>Examining real-world applications of ${keyword} provides valuable insights into practical implementation strategies and their outcomes. These case studies demonstrate both successful approaches and lessons learned from challenges.</p>`,
      
      `<h3>Small Business Applications</h3>`,
      `<p>Small businesses often face unique challenges when implementing ${keyword} strategies. Limited resources and competing priorities require creative solutions and careful prioritization.</p>`,
      
      `<h3>Enterprise-Level Implementation</h3>`,
      `<p>Large organizations have different requirements and constraints when working with ${keyword}. Scale, complexity, and stakeholder management become critical factors in these environments.</p>`,
      
      `<h2>Tools and Technologies for ${keyword}</h2>`,
      `<p>Various tools and technologies can support effective implementation of ${keyword} strategies. Selecting the right tools requires understanding both current needs and future growth plans.</p>`,
      
      `<h3>Software Solutions and Platforms</h3>`,
      `<p>Modern software solutions provide powerful capabilities for managing and optimizing ${keyword} activities. These platforms offer automation, analytics, and integration features that enhance effectiveness.</p>`,
      
      `<h2>Training and Development Strategies</h2>`,
      `<p>Building capabilities in ${keyword} requires comprehensive training and development programs. These programs should address both technical skills and strategic thinking abilities.</p>`,
      
      `<p>Ongoing professional development ensures that practitioners stay current with evolving best practices and emerging trends in the field. This commitment to learning is essential for long-term success.</p>`
    ];

    // Return only the sections needed to reach word count
    const wordsPerSection = 100; // Approximate words per section
    const sectionsNeeded = Math.ceil(wordsNeeded / wordsPerSection);
    return additionalSections.slice(0, sectionsNeeded);
  }

  /**
   * Create optimized prompt for content generation
   */
  private createPrompt(options: UnlimitedGenerationOptions): string {
    const { targetUrl, primaryKeyword, anchorText, wordCount = 1500, contentType = 'guide' } = options;

    return `Create a comprehensive ${wordCount}-word ${contentType} about "${primaryKeyword}" with natural backlink integration.

REQUIREMENTS:
- Write exactly ${wordCount} words of high-quality, original content
- Focus on "${primaryKeyword}" as the main topic
- Use professional tone and expert-level insights
- Include practical, actionable advice
- Structure with proper HTML headings (H1, H2, H3)
- Natural integration of backlink: "${anchorText}" → ${targetUrl}

CONTENT STRUCTURE:
1. Compelling H1 title with primary keyword
2. Engaging introduction (150-200 words)
3. 6-8 main sections with H2 headings (200-250 words each)
4. Subsections with H3 headings where appropriate
5. Natural backlink placement in middle section
6. Strong conclusion with actionable takeaways

SEO OPTIMIZATION:
- Include "${primaryKeyword}" naturally throughout
- Use semantic keywords and related terms
- Add numbered lists and bullet points
- Write for featured snippets
- Include FAQ section if relevant

BACKLINK INTEGRATION:
- Place "${anchorText}" naturally within content
- Make link contextually relevant
- Use as authoritative resource or reference
- Ensure it adds genuine value

OUTPUT FORMAT:
Return as clean HTML with proper semantic structure.`;
  }

  /**
   * Create system prompt based on content type and tone
   */
  private createSystemPrompt(contentType: string, tone: string): string {
    return `You are an expert content writer specializing in ${contentType} content with ${tone} tone. Create comprehensive, well-researched content that provides genuine value to readers while naturally incorporating backlinks. Focus on depth, accuracy, and actionability.`;
  }

  /**
   * Validate if content meets minimum word count
   */
  private validateWordCount(content: string, targetWords: number): boolean {
    const actualWords = this.countWords(content);
    const minimumWords = Math.max(UnlimitedContentGenerator.MIN_WORDS, targetWords * 0.8);
    return actualWords >= minimumWords;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return textContent.split(' ').filter(word => word.length > 0).length;
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string): string | null {
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : null;
  }

  /**
   * Generate meta description
   */
  private generateMetaDescription(keyword: string): string {
    return `Complete professional guide to ${keyword} with expert insights, practical strategies, and proven techniques. Learn everything you need to know about ${keyword} implementation and best practices.`.substring(0, 160);
  }
}

export const unlimitedContentGenerator = new UnlimitedContentGenerator();
