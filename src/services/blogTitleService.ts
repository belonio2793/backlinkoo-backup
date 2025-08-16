/**
 * Blog Title Service
 * 
 * Provides title correction, variations, and autosuggest functionality for blog posts.
 * Includes automatic typo detection and correction features.
 */

import { blogService } from './blogService';
import type { BlogPost } from './blogService';

export interface TitleSuggestion {
  original: string;
  corrected: string;
  variations: string[];
  confidence: number;
  corrections: Array<{
    from: string;
    to: string;
    type: 'spelling' | 'grammar' | 'capitalization' | 'punctuation';
  }>;
}

export interface TitleVariation {
  title: string;
  style: 'original' | 'question' | 'how-to' | 'listicle' | 'ultimate-guide' | 'power-words' | 'emotional';
  score: number;
}

export class BlogTitleService {
  
  // Common spelling corrections and typos
  private static readonly SPELLING_CORRECTIONS = new Map([
    // Social media platforms
    ['faceook', 'Facebook'],
    ['facbook', 'Facebook'],
    ['faebook', 'Facebook'],
    ['facbeook', 'Facebook'],
    ['tweeter', 'Twitter'],
    ['twittr', 'Twitter'],
    ['instgram', 'Instagram'],
    ['instagam', 'Instagram'],
    ['linkedn', 'LinkedIn'],
    ['linkdin', 'LinkedIn'],
    
    // Common tech terms
    ['javascrpt', 'JavaScript'],
    ['javscript', 'JavaScript'],
    ['pythn', 'Python'],
    ['phyton', 'Python'],
    ['reactjs', 'React'],
    ['angualr', 'Angular'],
    ['vuejs', 'Vue.js'],
    
    // Marketing terms
    ['markting', 'marketing'],
    ['advertsing', 'advertising'],
    ['braning', 'branding'],
    ['influencr', 'influencer'],
    
    // General misspellings
    ['the', 'the'],
    ['begining', 'beginning'],
    ['recieve', 'receive'],
    ['seperate', 'separate'],
    ['definately', 'definitely'],
    ['neccessary', 'necessary'],
    ['occuring', 'occurring'],
    ['percieve', 'perceive'],
    ['priviledge', 'privilege'],
    ['recomend', 'recommend'],
    ['refering', 'referring'],
    ['succesful', 'successful'],
    ['transfering', 'transferring'],
    ['truely', 'truly'],
    ['untill', 'until'],
    ['writting', 'writing']
  ]);

  // Power words for engaging titles
  private static readonly POWER_WORDS = [
    'Ultimate', 'Complete', 'Essential', 'Proven', 'Secret', 'Hidden', 'Exclusive',
    'Revolutionary', 'Breakthrough', 'Advanced', 'Expert', 'Professional', 'Master',
    'Comprehensive', 'Definitive', 'Insider', 'Elite', 'Premium', 'Powerful',
    'Amazing', 'Incredible', 'Stunning', 'Remarkable', 'Outstanding', 'Exceptional'
  ];

  // Question starters for question-style titles
  private static readonly QUESTION_STARTERS = [
    'How to', 'What is', 'Why', 'When', 'Where', 'Which', 'Who',
    'How can', 'What are', 'How do', 'What makes', 'How does'
  ];

  /**
   * Analyze and correct a blog title
   */
  static analyzeTitleCorrections(title: string): TitleSuggestion {
    if (!title) {
      return {
        original: title,
        corrected: title,
        variations: [],
        confidence: 0,
        corrections: []
      };
    }

    let correctedTitle = title;
    const corrections: Array<{from: string; to: string; type: string}> = [];
    
    // Apply spelling corrections
    for (const [wrong, correct] of this.SPELLING_CORRECTIONS) {
      const wrongRegex = new RegExp(`\\b${wrong}\\b`, 'gi');
      if (wrongRegex.test(correctedTitle)) {
        const matches = correctedTitle.match(wrongRegex);
        if (matches) {
          correctedTitle = correctedTitle.replace(wrongRegex, correct);
          corrections.push({
            from: matches[0],
            to: correct,
            type: 'spelling'
          });
        }
      }
    }

    // Fix capitalization issues
    const capitalizedTitle = this.fixCapitalization(correctedTitle);
    if (capitalizedTitle !== correctedTitle) {
      corrections.push({
        from: correctedTitle,
        to: capitalizedTitle,
        type: 'capitalization'
      });
      correctedTitle = capitalizedTitle;
    }

    // Generate variations
    const variations = this.generateTitleVariations(correctedTitle);

    // Calculate confidence based on number of corrections made
    const confidence = corrections.length === 0 ? 100 : Math.max(0, 100 - (corrections.length * 20));

    return {
      original: title,
      corrected: correctedTitle,
      variations: variations.map(v => v.title),
      confidence,
      corrections
    };
  }

  /**
   * Generate title variations for a given title
   */
  static generateTitleVariations(title: string): TitleVariation[] {
    const variations: TitleVariation[] = [];
    const baseTitle = this.cleanTitle(title);
    
    // Original
    variations.push({
      title: baseTitle,
      style: 'original',
      score: 85
    });

    // How-to style
    if (!baseTitle.toLowerCase().startsWith('how to')) {
      variations.push({
        title: `How to ${baseTitle.charAt(0).toLowerCase()}${baseTitle.slice(1)}`,
        style: 'how-to',
        score: 90
      });
    }

    // Question style
    const questionVariation = this.createQuestionVariation(baseTitle);
    if (questionVariation) {
      variations.push({
        title: questionVariation,
        style: 'question',
        score: 88
      });
    }

    // Ultimate guide style
    if (!baseTitle.toLowerCase().includes('ultimate')) {
      variations.push({
        title: `The Ultimate Guide to ${baseTitle}`,
        style: 'ultimate-guide',
        score: 92
      });
    }

    // Listicle style
    const listicleVariation = this.createListicleVariation(baseTitle);
    if (listicleVariation) {
      variations.push({
        title: listicleVariation,
        style: 'listicle',
        score: 87
      });
    }

    // Power words variation
    const powerWordsVariation = this.addPowerWords(baseTitle);
    if (powerWordsVariation !== baseTitle) {
      variations.push({
        title: powerWordsVariation,
        style: 'power-words',
        score: 89
      });
    }

    // Emotional variation
    const emotionalVariation = this.createEmotionalVariation(baseTitle);
    if (emotionalVariation) {
      variations.push({
        title: emotionalVariation,
        style: 'emotional',
        score: 86
      });
    }

    return variations.sort((a, b) => b.score - a.score);
  }

  /**
   * Automatically correct a blog post's title and update it
   */
  static async correctBlogPostTitle(postId: string): Promise<{
    success: boolean;
    originalTitle: string;
    correctedTitle: string;
    corrections: any[];
    message: string;
  }> {
    try {
      // Get the blog post
      const blogServiceInstance = new blogService();
      const { data: post, error } = await blogServiceInstance.getBlogPost(postId);
      
      if (error || !post) {
        return {
          success: false,
          originalTitle: '',
          correctedTitle: '',
          corrections: [],
          message: `Failed to find blog post: ${error?.message || 'Post not found'}`
        };
      }

      const originalTitle = post.title || '';
      const analysis = this.analyzeTitleCorrections(originalTitle);
      
      // Only update if corrections were made
      if (analysis.corrections.length === 0) {
        return {
          success: true,
          originalTitle,
          correctedTitle: originalTitle,
          corrections: [],
          message: 'No corrections needed'
        };
      }

      // Update the blog post with corrected title
      const updateResult = await blogServiceInstance.updateBlogPost(postId, {
        title: analysis.corrected,
        updated_at: new Date().toISOString()
      });

      if (updateResult.error) {
        return {
          success: false,
          originalTitle,
          correctedTitle: analysis.corrected,
          corrections: analysis.corrections,
          message: `Failed to update post: ${updateResult.error.message}`
        };
      }

      return {
        success: true,
        originalTitle,
        correctedTitle: analysis.corrected,
        corrections: analysis.corrections,
        message: `Successfully corrected ${analysis.corrections.length} issue(s) in title`
      };

    } catch (error) {
      return {
        success: false,
        originalTitle: '',
        correctedTitle: '',
        corrections: [],
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Suggest title improvements for a blog post
   */
  static async suggestTitleImprovements(postId: string): Promise<{
    success: boolean;
    currentTitle: string;
    suggestions: TitleVariation[];
    analysis: TitleSuggestion;
    message: string;
  }> {
    try {
      const blogServiceInstance = new blogService();
      const { data: post, error } = await blogServiceInstance.getBlogPost(postId);
      
      if (error || !post) {
        return {
          success: false,
          currentTitle: '',
          suggestions: [],
          analysis: {
            original: '',
            corrected: '',
            variations: [],
            confidence: 0,
            corrections: []
          },
          message: `Failed to find blog post: ${error?.message || 'Post not found'}`
        };
      }

      const currentTitle = post.title || '';
      const analysis = this.analyzeTitleCorrections(currentTitle);
      const suggestions = this.generateTitleVariations(analysis.corrected);

      return {
        success: true,
        currentTitle,
        suggestions,
        analysis,
        message: `Generated ${suggestions.length} title suggestions`
      };

    } catch (error) {
      return {
        success: false,
        currentTitle: '',
        suggestions: [],
        analysis: {
          original: '',
          corrected: '',
          variations: [],
          confidence: 0,
          corrections: []
        },
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Bulk correct titles for multiple blog posts
   */
  static async bulkCorrectTitles(postIds: string[]): Promise<{
    totalProcessed: number;
    corrected: number;
    failed: number;
    results: Array<{
      postId: string;
      success: boolean;
      originalTitle: string;
      correctedTitle: string;
      corrections: any[];
    }>;
  }> {
    const results = [];
    let corrected = 0;
    let failed = 0;

    for (const postId of postIds) {
      try {
        const result = await this.correctBlogPostTitle(postId);
        results.push({
          postId,
          success: result.success,
          originalTitle: result.originalTitle,
          correctedTitle: result.correctedTitle,
          corrections: result.corrections
        });

        if (result.success && result.corrections.length > 0) {
          corrected++;
        } else if (!result.success) {
          failed++;
        }
      } catch (error) {
        results.push({
          postId,
          success: false,
          originalTitle: '',
          correctedTitle: '',
          corrections: []
        });
        failed++;
      }
    }

    return {
      totalProcessed: postIds.length,
      corrected,
      failed,
      results
    };
  }

  // Helper methods

  private static cleanTitle(title: string): string {
    return title
      .replace(/^(H\d+:\s*|Title:\s*)/i, '') // Remove H1:, Title: prefixes
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static fixCapitalization(title: string): string {
    // Capitalize first letter and letters after certain punctuation
    return title.replace(/(^|\s|:|-)\w/g, (match) => match.toUpperCase())
      .replace(/\bAnd\b|\bOr\b|\bBut\b|\bOf\b|\bIn\b|\bOn\b|\bAt\b|\bTo\b|\bFor\b|\bThe\b|\bA\b|\bAn\b/g, 
        (match, offset, string) => {
          // Don't lowercase if it's the first word
          return offset === 0 ? match : match.toLowerCase();
        });
  }

  private static createQuestionVariation(title: string): string | null {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('guide') || lowerTitle.includes('tips')) {
      return `What Are the Best ${title}?`;
    }
    
    if (lowerTitle.includes('power') || lowerTitle.includes('unleash')) {
      return `How Can You ${title}?`;
    }
    
    if (lowerTitle.includes('dominating') || lowerTitle.includes('master')) {
      return `Why Is ${title} Important?`;
    }
    
    return null;
  }

  private static createListicleVariation(title: string): string | null {
    const numbers = ['5', '7', '10', '15', '20'];
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('guide')) {
      return `${randomNumber} Essential Tips for ${title}`;
    }
    
    if (lowerTitle.includes('power') || lowerTitle.includes('unleash')) {
      return `${randomNumber} Ways to ${title}`;
    }
    
    return `${randomNumber} Secrets to ${title}`;
  }

  private static addPowerWords(title: string): string {
    const powerWord = this.POWER_WORDS[Math.floor(Math.random() * this.POWER_WORDS.length)];
    
    // Don't add if title already has power words
    const hasExistingPowerWord = this.POWER_WORDS.some(word => 
      title.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasExistingPowerWord) {
      return title;
    }
    
    return `${powerWord} ${title}`;
  }

  private static createEmotionalVariation(title: string): string | null {
    const emotional = [
      'Transform Your Life with',
      'Discover the Secrets of',
      'Unlock the Power of',
      'Master the Art of',
      'Achieve Success Through'
    ];
    
    const emotionalPrefix = emotional[Math.floor(Math.random() * emotional.length)];
    return `${emotionalPrefix} ${title}`;
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).BlogTitleService = BlogTitleService;
  console.log('📝 Blog Title Service available globally');
}
