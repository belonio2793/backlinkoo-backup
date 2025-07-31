import { supabase } from '@/integrations/supabase/client';

export interface SlugOptions {
  title: string;
  customSlug?: string;
  keywords?: string[];
  includeDate?: boolean;
  includeKeyword?: boolean;
  randomSuffix?: boolean;
  maxLength?: number;
  separator?: '-' | '_' | '.';
}

export interface SlugSuggestion {
  slug: string;
  isAvailable: boolean;
  score: number; // SEO score based on length, keywords, etc.
  type: 'title-based' | 'keyword-based' | 'date-based' | 'random' | 'custom';
  description: string;
}

export class SlugGenerationService {
  private readonly maxLength = 60;
  private readonly minLength = 3;

  /**
   * Generate multiple slug suggestions for user to choose from
   */
  async generateSlugSuggestions(options: SlugOptions): Promise<SlugSuggestion[]> {
    const suggestions: SlugSuggestion[] = [];
    const { title, keywords = [], customSlug, separator = '-' } = options;

    // 1. Custom slug (if provided)
    if (customSlug?.trim()) {
      const cleanCustom = this.cleanSlug(customSlug, separator);
      suggestions.push({
        slug: cleanCustom,
        isAvailable: await this.checkSlugAvailability(cleanCustom),
        score: this.calculateSEOScore(cleanCustom, keywords),
        type: 'custom',
        description: 'Your custom slug'
      });
    }

    // 2. Title-based slug (main suggestion)
    const titleSlug = this.generateFromTitle(title, separator);
    suggestions.push({
      slug: titleSlug,
      isAvailable: await this.checkSlugAvailability(titleSlug),
      score: this.calculateSEOScore(titleSlug, keywords),
      type: 'title-based',
      description: 'Based on your title'
    });

    // 3. Keyword-enhanced slug
    if (keywords.length > 0) {
      const keywordSlug = this.generateWithKeywords(title, keywords, separator);
      if (keywordSlug !== titleSlug) {
        suggestions.push({
          slug: keywordSlug,
          isAvailable: await this.checkSlugAvailability(keywordSlug),
          score: this.calculateSEOScore(keywordSlug, keywords),
          type: 'keyword-based',
          description: 'Optimized with keywords'
        });
      }
    }

    // 4. Date-based slug
    if (options.includeDate) {
      const dateSlug = this.generateWithDate(title, separator);
      suggestions.push({
        slug: dateSlug,
        isAvailable: await this.checkSlugAvailability(dateSlug),
        score: this.calculateSEOScore(dateSlug, keywords),
        type: 'date-based',
        description: 'Includes current date'
      });
    }

    // 5. Generate alternatives for unavailable slugs
    const unavailableSlugs = suggestions.filter(s => !s.isAvailable);
    for (const suggestion of unavailableSlugs) {
      const alternatives = await this.generateAlternatives(suggestion.slug, separator);
      for (const alt of alternatives) {
        suggestions.push({
          slug: alt,
          isAvailable: await this.checkSlugAvailability(alt),
          score: this.calculateSEOScore(alt, keywords),
          type: 'random',
          description: `Alternative to "${suggestion.slug}"`
        });
      }
    }

    // Remove duplicates and sort by availability and score
    const uniqueSuggestions = this.removeDuplicatesSlugs(suggestions);
    return this.sortSuggestions(uniqueSuggestions);
  }

  /**
   * Generate a guaranteed unique slug
   */
  async generateUniqueSlug(options: SlugOptions): Promise<string> {
    const suggestions = await this.generateSlugSuggestions(options);
    
    // Return first available suggestion
    const available = suggestions.find(s => s.isAvailable);
    if (available) {
      return available.slug;
    }

    // If no suggestions are available, generate with random suffix
    const baseSlug = options.customSlug || this.generateFromTitle(options.title, options.separator);
    return this.generateWithRandomSuffix(baseSlug, options.separator);
  }

  /**
   * Clean and format a slug
   */
  private cleanSlug(input: string, separator: string = '-'): string {
    return input
      .toLowerCase()
      .trim()
      // Strip HTML tags first
      .replace(/<[^>]*>/g, '')
      // Replace spaces and special characters with separator
      .replace(/[^a-z0-9]+/g, separator)
      // Remove consecutive separators
      .replace(new RegExp(`${separator}+`, 'g'), separator)
      // Remove leading/trailing separators
      .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')
      // Limit length
      .substring(0, this.maxLength);
  }

  /**
   * Generate slug from title
   */
  private generateFromTitle(title: string, separator: string = '-'): string {
    // Strip HTML tags first
    const cleanTitle = title.replace(/<[^>]*>/g, '');

    // Remove common stop words for better SEO
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'to', 'in', 'for', 'on', 'by', 'about', 'like', 'through', 'over', 'before', 'between', 'after', 'since', 'without', 'under', 'within', 'along', 'following', 'across', 'behind', 'beyond', 'plus', 'except', 'but', 'up', 'out', 'around', 'down', 'off', 'above', 'near'];

    const words = cleanTitle.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(word =>
      word.length > 2 && !stopWords.includes(word)
    );

    // Use meaningful words if available, otherwise use all words
    const wordsToUse = meaningfulWords.length > 0 ? meaningfulWords : words;

    return this.cleanSlug(wordsToUse.join(' '), separator);
  }

  /**
   * Generate slug with keywords included
   */
  private generateWithKeywords(title: string, keywords: string[], separator: string = '-'): string {
    // Strip HTML tags from title and keywords
    const cleanTitle = title.replace(/<[^>]*>/g, '');
    const cleanKeywords = keywords.map(k => k.replace(/<[^>]*>/g, ''));

    const titleWords = cleanTitle.toLowerCase().split(/\s+/);
    const keywordWords = cleanKeywords.map(k => k.toLowerCase()).slice(0, 2); // Limit to 2 keywords

    // Combine title words with keywords, removing duplicates
    const allWords = [...new Set([...titleWords.slice(0, 4), ...keywordWords])];

    return this.cleanSlug(allWords.join(' '), separator);
  }

  /**
   * Generate slug with current date
   */
  private generateWithDate(title: string, separator: string = '-'): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const baseSlug = this.generateFromTitle(title, separator);
    return `${year}${separator}${month}${separator}${day}${separator}${baseSlug}`;
  }

  /**
   * Generate alternatives for unavailable slugs
   */
  private async generateAlternatives(baseSlug: string, separator: string = '-'): Promise<string[]> {
    const alternatives: string[] = [];
    
    // Strategy 1: Add random words
    const randomWords = ['guide', 'tips', 'ultimate', 'complete', 'best', 'top', 'essential', 'advanced', 'beginner', 'expert'];
    for (const word of randomWords.slice(0, 3)) {
      alternatives.push(`${baseSlug}${separator}${word}`);
      alternatives.push(`${word}${separator}${baseSlug}`);
    }
    
    // Strategy 2: Add numbers
    for (let i = 1; i <= 10; i++) {
      alternatives.push(`${baseSlug}${separator}${i}`);
    }
    
    // Strategy 3: Add current year
    const currentYear = new Date().getFullYear();
    alternatives.push(`${baseSlug}${separator}${currentYear}`);
    
    // Strategy 4: Add random suffix
    for (let i = 0; i < 5; i++) {
      alternatives.push(this.generateWithRandomSuffix(baseSlug, separator));
    }
    
    return alternatives;
  }

  /**
   * Generate slug with random suffix
   */
  private generateWithRandomSuffix(baseSlug: string, separator: string = '-'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}${separator}${timestamp}${separator}${random}`;
  }

  /**
   * Check if slug is available
   */
  private async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error checking slug availability:', error);
        return false;
      }

      return data === null;
    } catch (error) {
      console.warn('Error checking slug availability:', error);
      return false;
    }
  }

  /**
   * Calculate SEO score for a slug
   */
  private calculateSEOScore(slug: string, keywords: string[] = []): number {
    let score = 100;
    
    // Length scoring (optimal 3-50 characters)
    if (slug.length < 3) score -= 30;
    else if (slug.length > 50) score -= 20;
    else if (slug.length > 60) score -= 40;
    
    // Keyword presence
    const lowerSlug = slug.toLowerCase();
    const keywordMatches = keywords.filter(keyword => 
      lowerSlug.includes(keyword.toLowerCase())
    ).length;
    score += keywordMatches * 10;
    
    // Readability (prefer fewer hyphens)
    const separatorCount = (slug.match(/-/g) || []).length;
    if (separatorCount > 5) score -= 10;
    
    // Avoid numbers at the end (less SEO friendly)
    if (/\d+$/.test(slug)) score -= 5;
    
    // Avoid random suffixes
    if (slug.includes('_') || /[a-z]{6,}$/.test(slug.split('-').pop() || '')) {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Remove duplicate suggestions
   */
  private removeDuplicatesSlugs(suggestions: SlugSuggestion[]): SlugSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      if (seen.has(suggestion.slug)) {
        return false;
      }
      seen.add(suggestion.slug);
      return true;
    });
  }

  /**
   * Sort suggestions by availability and score
   */
  private sortSuggestions(suggestions: SlugSuggestion[]): SlugSuggestion[] {
    return suggestions.sort((a, b) => {
      // Available slugs first
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      
      // Then by score
      return b.score - a.score;
    });
  }

  /**
   * Validate a custom slug
   */
  validateSlug(slug: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!slug || slug.trim().length === 0) {
      errors.push('Slug cannot be empty');
    }
    
    if (slug.length < this.minLength) {
      errors.push(`Slug must be at least ${this.minLength} characters long`);
    }
    
    if (slug.length > this.maxLength) {
      errors.push(`Slug cannot exceed ${this.maxLength} characters`);
    }
    
    if (!/^[a-z0-9\-._]+$/i.test(slug)) {
      errors.push('Slug can only contain letters, numbers, hyphens, underscores, and dots');
    }
    
    if (/^[-._]|[-._]$/.test(slug)) {
      errors.push('Slug cannot start or end with separators');
    }
    
    if (/[-._]{2,}/.test(slug)) {
      errors.push('Slug cannot contain consecutive separators');
    }
    
    // SEO warnings (not errors)
    const warnings: string[] = [];
    if (slug.length > 50) {
      warnings.push('Slugs shorter than 50 characters are better for SEO');
    }
    
    if ((slug.match(/-/g) || []).length > 5) {
      warnings.push('Too many hyphens may hurt readability');
    }
    
    return {
      isValid: errors.length === 0,
      errors: [...errors, ...warnings]
    };
  }

  /**
   * Generate slug from multiple sources intelligently
   */
  generateIntelligentSlug(options: {
    title: string;
    content?: string;
    keywords?: string[];
    category?: string;
  }): string {
    const { title, content, keywords = [], category } = options;
    
    // Extract important words from content if provided
    let contentKeywords: string[] = [];
    if (content) {
      const contentText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
      const words = contentText.split(/\s+/);
      const wordFreq: { [key: string]: number } = {};
      
      // Count word frequency
      words.forEach(word => {
        if (word.length > 4 && !/\d/.test(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      
      // Get top frequent words
      contentKeywords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word);
    }
    
    // Combine all keywords
    const allKeywords = [...keywords, ...contentKeywords];
    if (category) allKeywords.push(category);
    
    return this.generateWithKeywords(title, allKeywords);
  }
}

export const slugGenerationService = new SlugGenerationService();
