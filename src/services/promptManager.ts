export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  type: PromptType;
  template: string;
  platforms: string[];
  minLength: number;
  maxLength: number;
  tone: PromptTone[];
  useCase: string[];
  variables: string[];
}

export type PromptType = 
  | 'long-form-blog'
  | 'microblog-social'
  | 'forum-reply'
  | 'qa-answer'
  | 'press-release'
  | 'how-to-guide'
  | 'directory-entry';

export type PromptTone = 
  | 'informative'
  | 'professional'
  | 'friendly'
  | 'conversational'
  | 'formal'
  | 'casual';

export type PlatformType = 
  | 'blog'
  | 'social'
  | 'forum'
  | 'qa'
  | 'news'
  | 'directory'
  | 'documentation';

export interface PlatformConfig {
  name: string;
  type: PlatformType;
  domain: string;
  preferredPrompts: PromptType[];
  contentLimits: {
    minWords: number;
    maxWords: number;
    maxCharacters?: number;
  };
  linkPolicy: 'friendly' | 'moderate' | 'strict';
  domainRating: number;
  isActive: boolean;
}

class PromptManager {
  private prompts: PromptTemplate[];
  private platforms: PlatformConfig[];

  constructor() {
    this.prompts = this.initializePrompts();
    this.platforms = this.initializePlatforms();
  }

  private initializePrompts(): PromptTemplate[] {
    return [
      {
        id: 'long-form-blog',
        name: 'Long-Form Blog/Article',
        description: 'Comprehensive blog post with detailed insights',
        type: 'long-form-blog',
        template: `Write a well-structured blog post about [KEYWORD].

Include an introduction, main body with useful insights, and a conclusion.
Within the article, naturally include a hyperlink using [ANCHOR_TEXT] pointing to [TARGET_URL].
Ensure the backlink is contextually relevant and flows naturally with the content.

Structure:
1. Compelling headline
2. Introduction (hook + preview)
3. Main content with 3-4 key points
4. Practical examples or case studies
5. Conclusion with actionable takeaways

Tone: [TONE]
Length: ~600 words
SEO: Include relevant keywords naturally throughout
Backlink placement: Mid-article for maximum impact`,
        platforms: ['wordpress', 'ghost', 'medium', 'dev.to', 'hashnode', 'webflow'],
        minLength: 500,
        maxLength: 800,
        tone: ['informative', 'professional', 'friendly'],
        useCase: ['blog', 'documentation', 'thought-leadership'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL', 'TONE']
      },
      {
        id: 'microblog-social',
        name: 'Microblog/Social Post',
        description: 'Short, engaging social media content',
        type: 'microblog-social',
        template: `Write a short social media post (max 280 characters) about [KEYWORD].

Include [ANCHOR_TEXT] linking to [TARGET_URL].
Make it catchy and engaging while relevant to the topic.

Requirements:
- Hook readers in first 20 characters
- Include relevant hashtags (2-3 max)
- Clear call-to-action
- Conversational tone
- Link placement at end for better engagement

Format: Text + Link + Hashtags`,
        platforms: ['twitter', 'mastodon', 'bluesky', 'linkedin', 'tumblr'],
        minLength: 50,
        maxLength: 280,
        tone: ['friendly', 'conversational', 'casual'],
        useCase: ['social', 'promotion', 'engagement'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL']
      },
      {
        id: 'forum-reply',
        name: 'Forum/Community Reply',
        description: 'Helpful forum response with natural link inclusion',
        type: 'forum-reply',
        template: `Pretend you are replying to a forum thread where people are discussing [KEYWORD].

Write a helpful response that shares useful information and casually mentions [ANCHOR_TEXT] linking to [TARGET_URL] as a resource.

Guidelines:
- Start by acknowledging the discussion
- Provide genuine value and insights
- Share personal experience if relevant
- Mention the link naturally as additional resource
- Keep tone conversational, not overly promotional
- Include a question to encourage further discussion

Tone: Conversational, helpful
Length: 150–200 words
Link placement: Mid-response as supporting resource`,
        platforms: ['discourse', 'reddit', 'forum'],
        minLength: 150,
        maxLength: 250,
        tone: ['conversational', 'friendly', 'helpful'],
        useCase: ['community', 'discussion', 'support'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL']
      },
      {
        id: 'qa-answer',
        name: 'Q&A/Knowledge Base Answer',
        description: 'Comprehensive answer with step-by-step guidance',
        type: 'qa-answer',
        template: `Answer a user's question about [KEYWORD].

Provide step-by-step advice, ensuring the answer is valuable and self-contained.
Naturally suggest [ANCHOR_TEXT] with a link to [TARGET_URL] as a further resource at the end of your response.

Structure:
1. Direct answer to the question
2. Step-by-step instructions or explanation
3. Pro tips or common pitfalls to avoid
4. Additional resources (including your link)
5. Encouragement or call to action

Requirements:
- Answer must be complete and actionable
- Use numbered lists or bullet points for clarity
- Include relevant examples
- Link as "additional resource" not primary answer
- Professional but approachable tone

Length: 200–300 words
Link placement: In "Additional Resources" section`,
        platforms: ['stackoverflow', 'quora', 'reddit', 'discourse'],
        minLength: 200,
        maxLength: 350,
        tone: ['informative', 'professional', 'helpful'],
        useCase: ['qa', 'education', 'support'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL']
      },
      {
        id: 'press-release',
        name: 'Press Release/Announcement',
        description: 'Professional announcement or news format',
        type: 'press-release',
        template: `Write a professional press release about [KEYWORD].

Include key highlights, structured with a headline, subheading, and body text.
Mention [ANCHOR_TEXT] linking to [TARGET_URL] as the official source.

Structure:
1. Compelling headline
2. Location and date line
3. Lead paragraph (who, what, when, where, why)
4. Supporting paragraphs with details
5. Quote from spokesperson/expert
6. Company/organization boilerplate
7. Contact information

Requirements:
- Use third-person perspective
- Include specific facts and figures
- Write in inverted pyramid style
- Link in context as official source
- Professional, authoritative tone

Tone: Formal, professional
Length: 300-400 words
Link placement: As official source or reference`,
        platforms: ['news', 'blog', 'corporate'],
        minLength: 300,
        maxLength: 500,
        tone: ['formal', 'professional'],
        useCase: ['news', 'announcement', 'corporate'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL']
      },
      {
        id: 'how-to-guide',
        name: 'Educational/How-to Guide',
        description: 'Step-by-step instructional content',
        type: 'how-to-guide',
        template: `Write a how-to guide that explains [KEYWORD] step by step.

Use a clear structure with numbered steps.
In one step, insert [ANCHOR_TEXT] linking to [TARGET_URL] as a recommended resource/tool.

Structure:
1. Introduction explaining what will be accomplished
2. Prerequisites or requirements
3. Step-by-step instructions (5-8 steps)
4. Tips for success
5. Common troubleshooting
6. Conclusion with next steps

Requirements:
- Each step should be actionable
- Include time estimates where relevant
- Use clear, simple language
- Add helpful tips or warnings
- Link as recommended tool/resource within steps
- Include expected outcomes

Length: 400–500 words
Link placement: Within relevant step as recommended tool`,
        platforms: ['blog', 'documentation', 'tutorial'],
        minLength: 400,
        maxLength: 600,
        tone: ['informative', 'friendly', 'instructional'],
        useCase: ['education', 'tutorial', 'documentation'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL']
      },
      {
        id: 'directory-entry',
        name: 'Directory/Resource List Entry',
        description: 'Concise directory-style listing',
        type: 'directory-entry',
        template: `Create a directory-style entry about [KEYWORD].

Include a short description, benefits, and use case.
Link to [TARGET_URL] with [ANCHOR_TEXT] as the reference site.

Structure:
1. Brief title/heading
2. One-sentence description
3. Key benefits (2-3 bullet points)
4. Primary use cases
5. Link with clear call-to-action

Requirements:
- Concise and scannable format
- Focus on key value propositions
- Use bullet points for benefits
- Clear, direct language
- Strong call-to-action for link
- Include relevant tags/categories

Length: ~100 words
Format: Structured listing
Link placement: Primary call-to-action`,
        platforms: ['directory', 'resource-list', 'catalog'],
        minLength: 80,
        maxLength: 150,
        tone: ['informative', 'professional'],
        useCase: ['directory', 'listing', 'catalog'],
        variables: ['KEYWORD', 'ANCHOR_TEXT', 'TARGET_URL']
      }
    ];
  }

  private initializePlatforms(): PlatformConfig[] {
    return [
      // High-Quality Blog Platforms
      {
        name: 'Dev.to',
        type: 'blog',
        domain: 'dev.to',
        preferredPrompts: ['long-form-blog', 'how-to-guide', 'qa-answer'],
        contentLimits: { minWords: 300, maxWords: 2000 },
        linkPolicy: 'friendly',
        domainRating: 86,
        isActive: true
      },
      {
        name: 'Medium',
        type: 'blog',
        domain: 'medium.com',
        preferredPrompts: ['long-form-blog', 'how-to-guide'],
        contentLimits: { minWords: 400, maxWords: 1500 },
        linkPolicy: 'moderate',
        domainRating: 96,
        isActive: true
      },
      {
        name: 'Ghost CMS',
        type: 'blog',
        domain: 'ghost.org',
        preferredPrompts: ['long-form-blog', 'press-release', 'how-to-guide'],
        contentLimits: { minWords: 300, maxWords: 3000 },
        linkPolicy: 'friendly',
        domainRating: 82,
        isActive: true
      },
      {
        name: 'WordPress',
        type: 'blog',
        domain: 'wordpress.com',
        preferredPrompts: ['long-form-blog', 'how-to-guide', 'press-release'],
        contentLimits: { minWords: 300, maxWords: 5000 },
        linkPolicy: 'friendly',
        domainRating: 94,
        isActive: true
      },
      {
        name: 'Hashnode',
        type: 'blog',
        domain: 'hashnode.com',
        preferredPrompts: ['long-form-blog', 'how-to-guide'],
        contentLimits: { minWords: 400, maxWords: 2000 },
        linkPolicy: 'friendly',
        domainRating: 75,
        isActive: true
      },
      
      // Forum/Community Platforms
      {
        name: 'Reddit',
        type: 'forum',
        domain: 'reddit.com',
        preferredPrompts: ['forum-reply', 'qa-answer'],
        contentLimits: { minWords: 50, maxWords: 500 },
        linkPolicy: 'strict',
        domainRating: 91,
        isActive: false // High moderation
      },
      {
        name: 'Discourse',
        type: 'forum',
        domain: 'discourse.org',
        preferredPrompts: ['forum-reply', 'qa-answer', 'how-to-guide'],
        contentLimits: { minWords: 100, maxWords: 1000 },
        linkPolicy: 'moderate',
        domainRating: 78,
        isActive: true
      },
      
      // Social Platforms
      {
        name: 'LinkedIn',
        type: 'social',
        domain: 'linkedin.com',
        preferredPrompts: ['microblog-social', 'press-release'],
        contentLimits: { minWords: 10, maxWords: 100, maxCharacters: 3000 },
        linkPolicy: 'moderate',
        domainRating: 100,
        isActive: true
      },
      {
        name: 'Tumblr',
        type: 'social',
        domain: 'tumblr.com',
        preferredPrompts: ['microblog-social', 'long-form-blog'],
        contentLimits: { minWords: 20, maxWords: 1000 },
        linkPolicy: 'friendly',
        domainRating: 86,
        isActive: true
      }
    ];
  }

  // Get appropriate prompt based on platform and content type
  selectOptimalPrompt(platformName: string, contentType?: PromptType, tone?: PromptTone): PromptTemplate | null {
    const platform = this.platforms.find(p => p.name.toLowerCase() === platformName.toLowerCase());
    
    if (!platform) {
      return this.prompts[0]; // Default to long-form blog
    }

    // Filter prompts by platform preferences
    let compatiblePrompts = this.prompts.filter(prompt => 
      platform.preferredPrompts.includes(prompt.type)
    );

    // If content type specified, filter by that
    if (contentType) {
      compatiblePrompts = compatiblePrompts.filter(prompt => prompt.type === contentType);
    }

    // If tone specified, filter by that
    if (tone) {
      compatiblePrompts = compatiblePrompts.filter(prompt => prompt.tone.includes(tone));
    }

    // Return best match or first compatible prompt
    return compatiblePrompts.length > 0 ? compatiblePrompts[0] : this.prompts[0];
  }

  // Generate content using selected prompt
  generatePrompt(template: PromptTemplate, variables: Record<string, string>): string {
    let prompt = template.template;
    
    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `[${key.toUpperCase()}]`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });

    return prompt;
  }

  // Get compatible platforms for specific content type
  getCompatiblePlatforms(contentType: PromptType): PlatformConfig[] {
    return this.platforms.filter(platform => 
      platform.isActive && platform.preferredPrompts.includes(contentType)
    );
  }

  // Suggest best platforms for a keyword
  suggestPlatformsForKeyword(keyword: string): PlatformConfig[] {
    // Simple keyword analysis for platform recommendation
    const techKeywords = ['code', 'programming', 'development', 'api', 'software', 'javascript', 'react', 'node'];
    const businessKeywords = ['marketing', 'business', 'strategy', 'sales', 'finance', 'management'];
    const generalKeywords = ['how to', 'guide', 'tutorial', 'tips', 'best practices'];

    const lowerKeyword = keyword.toLowerCase();
    
    if (techKeywords.some(k => lowerKeyword.includes(k))) {
      return this.platforms.filter(p => 
        ['Dev.to', 'Hashnode', 'Discourse'].includes(p.name) && p.isActive
      );
    }
    
    if (businessKeywords.some(k => lowerKeyword.includes(k))) {
      return this.platforms.filter(p => 
        ['Medium', 'LinkedIn', 'WordPress'].includes(p.name) && p.isActive
      );
    }
    
    // Default to high-quality general platforms
    return this.platforms.filter(p => 
      p.isActive && p.domainRating >= 80
    ).sort((a, b) => b.domainRating - a.domainRating);
  }

  // Get all available prompts
  getAllPrompts(): PromptTemplate[] {
    return this.prompts;
  }

  // Get all active platforms
  getActivePlatforms(): PlatformConfig[] {
    return this.platforms.filter(p => p.isActive);
  }

  // Get prompt by ID
  getPromptById(id: string): PromptTemplate | null {
    return this.prompts.find(p => p.id === id) || null;
  }

  // Get platform by name
  getPlatformByName(name: string): PlatformConfig | null {
    return this.platforms.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }

  // Validate content length for platform
  validateContentLength(content: string, platformName: string): boolean {
    const platform = this.getPlatformByName(platformName);
    if (!platform) return true;

    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;

    const withinWordLimits = wordCount >= platform.contentLimits.minWords && 
                            wordCount <= platform.contentLimits.maxWords;
    
    const withinCharLimits = !platform.contentLimits.maxCharacters || 
                            charCount <= platform.contentLimits.maxCharacters;

    return withinWordLimits && withinCharLimits;
  }
}

export const promptManager = new PromptManager();
export default promptManager;
