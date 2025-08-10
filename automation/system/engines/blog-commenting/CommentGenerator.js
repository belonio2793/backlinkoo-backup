/**
 * Comment Generator - AI-powered contextual comment generation
 */

import { SystemLogger } from '../../core/SystemLogger.js';

export class CommentGenerator {
  constructor(config) {
    this.config = config;
    this.logger = new SystemLogger('CommentGenerator');
    this.templates = [];
    this.spinSyntax = new Map();
  }

  async initialize() {
    this.logger.info('Initializing Comment Generator...');
    
    try {
      await this.loadTemplates();
      await this.loadSpinSyntax();
      
      this.logger.success('Comment Generator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Comment Generator:', error);
      throw error;
    }
  }

  async loadTemplates() {
    // Default comment templates with placeholders
    this.templates = this.config.commentTemplates || [
      {
        type: 'agreement',
        templates: [
          "Great points about {topic}! I especially agree with your thoughts on {specific_point}. {personal_experience}",
          "This really resonates with me. I've had similar experiences with {topic} and found that {insight}.",
          "Excellent article! Your perspective on {topic} is spot on. {additional_thought}"
        ]
      },
      {
        type: 'question',
        templates: [
          "Thanks for sharing this insight about {topic}. I'm curious about {question}. Have you found any {specific_aspect}?",
          "Interesting read! I wonder if {question} applies in {context}? Would love to hear your thoughts.",
          "Great post! Quick question about {specific_point} - {question}?"
        ]
      },
      {
        type: 'experience',
        templates: [
          "I can relate to this! In my experience with {topic}, I've found that {experience}. {conclusion}",
          "This brings back memories of when I {experience}. Your advice about {topic} would have been helpful then!",
          "Speaking from experience, {topic} is definitely {opinion}. I learned this when {experience}."
        ]
      },
      {
        type: 'appreciation',
        templates: [
          "Thank you for writing this! {specific_appreciation} really helped me understand {topic} better.",
          "What a helpful post! I particularly appreciated {specific_point}. {personal_benefit}",
          "This is exactly what I needed to read today. Your insights on {topic} are {positive_adjective}."
        ]
      }
    ];
  }

  async loadSpinSyntax() {
    // Spin syntax for variation
    this.spinSyntax.set('positive_adjectives', [
      'helpful', 'insightful', 'valuable', 'informative', 'excellent', 'fantastic', 'amazing', 'useful'
    ]);
    
    this.spinSyntax.set('transition_phrases', [
      'In my experience', 'From what I\'ve seen', 'Based on my observations', 'I\'ve found that', 'It seems to me'
    ]);
    
    this.spinSyntax.set('agreement_starters', [
      'I completely agree', 'You\'re absolutely right', 'This is so true', 'I couldn\'t agree more', 'Exactly my thoughts'
    ]);
  }

  async generateComment(options) {
    this.logger.debug('Generating comment for:', options.postTitle);
    
    try {
      // Analyze post content for context
      const context = this.analyzeContent(options);
      
      // Select appropriate template type
      const templateType = this.selectTemplateType(context);
      
      // Generate base comment
      let comment = this.generateFromTemplate(templateType, context, options);
      
      // Apply spinning if enabled
      if (this.config.enableSpinning) {
        comment = this.applySpin(comment);
      }
      
      // Add backlink if allowed and configured
      if (options.allowsLinks && options.backlink) {
        comment = this.addBacklink(comment, options.backlink);
      }
      
      // Final validation and cleanup
      comment = this.cleanupComment(comment);
      
      return {
        text: comment,
        type: templateType,
        length: comment.length,
        hasLink: comment.includes('http'),
        confidence: this.calculateConfidence(comment, context)
      };
      
    } catch (error) {
      this.logger.error('Failed to generate comment:', error);
      throw error;
    }
  }

  analyzeContent(options) {
    const { postTitle, postContent, postUrl } = options;
    
    const context = {
      topics: [],
      keywords: [],
      sentiment: 'neutral',
      mainSubject: '',
      specificPoints: [],
      domain: ''
    };

    try {
      // Extract domain for context
      context.domain = new URL(postUrl).hostname;
      
      // Combine title and content for analysis
      const fullText = `${postTitle} ${postContent || ''}`.toLowerCase();
      
      // Extract main topics
      context.topics = this.extractTopics(fullText);
      context.keywords = this.extractKeywords(fullText);
      context.mainSubject = this.extractMainSubject(postTitle);
      context.specificPoints = this.extractSpecificPoints(fullText);
      context.sentiment = this.analyzeSentiment(fullText);
      
    } catch (error) {
      this.logger.warn('Error analyzing content:', error);
    }

    return context;
  }

  extractTopics(text) {
    const topicPatterns = {
      'SEO': /seo|search engine|ranking|optimization|keywords/i,
      'content marketing': /content|marketing|blogging|writing|audience/i,
      'web development': /development|coding|programming|website|web/i,
      'business': /business|entrepreneur|startup|company|revenue/i,
      'technology': /technology|tech|software|app|digital/i,
      'lifestyle': /lifestyle|health|fitness|travel|personal/i
    };

    const topics = [];
    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(text)) {
        topics.push(topic);
      }
    });

    return topics.slice(0, 3); // Max 3 topics
  }

  extractKeywords(text) {
    // Simple keyword extraction
    const words = text.split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  extractMainSubject(title) {
    // Extract the main subject from the title
    const cleaned = title.replace(/^(how to|why|what|when|where)\s+/i, '');
    const words = cleaned.split(/\s+/).slice(0, 3);
    return words.join(' ').toLowerCase();
  }

  extractSpecificPoints(text) {
    // Extract specific points or statements
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => sentence.length > 30 && sentence.length < 150)
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }

  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'helpful', 'useful', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'poor', 'worst'];
    
    const words = text.split(/\s+/);
    const positive = positiveWords.filter(word => words.includes(word)).length;
    const negative = negativeWords.filter(word => words.includes(word)).length;
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  selectTemplateType(context) {
    // Select template type based on content context
    if (context.sentiment === 'positive') {
      return Math.random() > 0.5 ? 'appreciation' : 'agreement';
    }
    
    if (context.topics.length > 0) {
      return Math.random() > 0.6 ? 'experience' : 'question';
    }
    
    // Default to agreement type
    return 'agreement';
  }

  generateFromTemplate(templateType, context, options) {
    const templateGroup = this.templates.find(group => group.type === templateType);
    if (!templateGroup) {
      throw new Error(`Template type not found: ${templateType}`);
    }

    const template = templateGroup.templates[
      Math.floor(Math.random() * templateGroup.templates.length)
    ];

    // Replace placeholders
    let comment = template;
    
    // Replace context-specific placeholders
    comment = comment.replace(/{topic}/g, context.topics[0] || context.mainSubject || 'this topic');
    comment = comment.replace(/{specific_point}/g, 
      context.specificPoints[0] || 'the main points you made');
    comment = comment.replace(/{question}/g, this.generateQuestion(context));
    comment = comment.replace(/{personal_experience}/g, this.generatePersonalExperience(context));
    comment = comment.replace(/{insight}/g, this.generateInsight(context));
    comment = comment.replace(/{additional_thought}/g, this.generateAdditionalThought(context));
    comment = comment.replace(/{specific_appreciation}/g, 
      `Your explanation of ${context.mainSubject || 'this'}`);
    comment = comment.replace(/{personal_benefit}/g, 
      'This will definitely help with my own projects.');
    comment = comment.replace(/{positive_adjective}/g, 
      this.spinSyntax.get('positive_adjectives')[
        Math.floor(Math.random() * this.spinSyntax.get('positive_adjectives').length)
      ]);

    return comment;
  }

  generateQuestion(context) {
    const questionStarters = [
      `how do you handle`,
      `what's your experience with`,
      `have you tried`,
      `do you recommend`,
      `what would you suggest for`
    ];
    
    const starter = questionStarters[Math.floor(Math.random() * questionStarters.length)];
    const topic = context.topics[0] || context.mainSubject || 'this approach';
    
    return `${starter} ${topic}`;
  }

  generatePersonalExperience(context) {
    const experiences = [
      `I've been working with ${context.mainSubject || 'this'} for a while now.`,
      `In my own projects, I've found similar challenges.`,
      `This reminds me of my own journey with ${context.topics[0] || 'this field'}.`,
      `I can definitely relate to this experience.`
    ];
    
    return experiences[Math.floor(Math.random() * experiences.length)];
  }

  generateInsight(context) {
    const insights = [
      `consistency is key`,
      `it takes time but the results are worth it`,
      `the fundamentals really matter`,
      `starting small and scaling up works well`,
      `having a clear strategy helps a lot`
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  generateAdditionalThought(context) {
    const thoughts = [
      `Looking forward to implementing these ideas!`,
      `Thanks for sharing your expertise.`,
      `This gives me a lot to think about.`,
      `I'll definitely be bookmarking this for reference.`,
      `Keep up the great work!`
    ];
    
    return thoughts[Math.floor(Math.random() * thoughts.length)];
  }

  applySpin(comment) {
    // Apply basic spinning to create variations
    const spinPatterns = [
      [/\bgreat\b/gi, ['excellent', 'fantastic', 'amazing', 'wonderful']],
      [/\bhelpful\b/gi, ['useful', 'valuable', 'beneficial', 'informative']],
      [/\bthank you\b/gi, ['thanks', 'much appreciated', 'grateful for this']],
      [/\bI think\b/gi, ['I believe', 'In my opinion', 'From my perspective']]
    ];

    spinPatterns.forEach(([pattern, replacements]) => {
      comment = comment.replace(pattern, () => {
        return replacements[Math.floor(Math.random() * replacements.length)];
      });
    });

    return comment;
  }

  addBacklink(comment, backlink) {
    // Add backlink naturally to the comment
    const linkPhrases = [
      `By the way, I wrote about a similar topic here: ${backlink.url}`,
      `This reminds me of something I covered on my blog: ${backlink.url}`,
      `For more insights on this, check out: ${backlink.url}`,
      `I have some additional thoughts on this topic at ${backlink.url}`
    ];

    if (Math.random() > 0.7) { // 30% chance to add backlink
      const linkPhrase = linkPhrases[Math.floor(Math.random() * linkPhrases.length)];
      comment += ` ${linkPhrase}`;
    }

    return comment;
  }

  cleanupComment(comment) {
    // Clean up and validate the comment
    return comment
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Fix spacing after punctuation
      .trim();
  }

  calculateConfidence(comment, context) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for longer, more detailed comments
    if (comment.length > 100) confidence += 0.1;
    if (comment.length > 150) confidence += 0.1;
    
    // Higher confidence for topic relevance
    if (context.topics.length > 0) confidence += 0.2;
    
    // Higher confidence for specific mentions
    if (context.specificPoints.length > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }
}
