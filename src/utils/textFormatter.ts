/**
 * Text Formatting Utility
 * Handles punctuation, sentence structure, and grammar formatting
 */

interface FormattingOptions {
  capitalizeFirst?: boolean;
  ensureEndPunctuation?: boolean;
  fixSpacing?: boolean;
  properNouns?: boolean;
  removeExtraSpaces?: boolean;
  fixQuotes?: boolean;
  oxfordComma?: boolean;
}

class TextFormatter {
  private static readonly PROPER_NOUNS = [
    'AI', 'API', 'SEO', 'URL', 'URLs', 'HTTP', 'HTTPS', 'CSS', 'HTML', 'JavaScript', 'TypeScript',
    'React', 'Stripe', 'Google', 'LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'YouTube',
    'Premium', 'Pro', 'Basic', 'Enterprise', 'Standard', 'Advanced', 'Professional',
    'Chrome', 'Firefox', 'Safari', 'Edge', 'iOS', 'Android', 'Windows', 'Mac', 'Linux',
    'GitHub', 'GitLab', 'Bitbucket', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Backlink', 'Backlinkoo', 'SaaS', 'B2B', 'B2C', 'CRM', 'CMS', 'CDP', 'SEM', 'PPC',
    'COVID', 'COVID-19', 'EU', 'US', 'USA', 'UK', 'CEO', 'CTO', 'CMO', 'VP', 'HR',
    'Q1', 'Q2', 'Q3', 'Q4', 'ROI', 'KPI', 'SLA', 'SDK', 'IDE', 'UI', 'UX', 'QA'
  ];

  private static readonly SENTENCE_ENDINGS = ['.', '!', '?', ':', ';'];
  
  private static readonly CONTRACTIONS: Record<string, string> = {
    "cant": "can't",
    "wont": "won't",
    "dont": "don't",
    "isnt": "isn't",
    "arent": "aren't",
    "wasnt": "wasn't",
    "werent": "weren't",
    "hasnt": "hasn't",
    "havent": "haven't",
    "hadnt": "hadn't",
    "shouldnt": "shouldn't",
    "wouldnt": "wouldn't",
    "couldnt": "couldn't",
    "mustnt": "mustn't",
    "neednt": "needn't",
    "heres": "here's",
    "theres": "there's",
    "wheres": "where's",
    "hows": "how's",
    "whats": "what's",
    "whos": "who's",
    "whens": "when's",
    "whys": "why's",
    "youre": "you're",
    "were": "we're",
    "theyre": "they're",
    "ive": "I've",
    "youve": "you've",
    "weve": "we've",
    "theyve": "they've",
    "im": "I'm",
    "youll": "you'll",
    "well": "we'll",
    "theyll": "they'll",
    "youd": "you'd",
    "wed": "we'd",
    "theyd": "they'd"
  };

  /**
   * Main formatting function
   */
  static format(text: string, options: FormattingOptions = {}): string {
    if (!text || typeof text !== 'string') return text;

    const defaultOptions: FormattingOptions = {
      capitalizeFirst: true,
      ensureEndPunctuation: true,
      fixSpacing: true,
      properNouns: true,
      removeExtraSpaces: true,
      fixQuotes: true,
      oxfordComma: false
    };

    const opts = { ...defaultOptions, ...options };
    let formatted = text;

    // Remove extra spaces first
    if (opts.removeExtraSpaces) {
      formatted = this.removeExtraSpaces(formatted);
    }

    // Fix spacing around punctuation
    if (opts.fixSpacing) {
      formatted = this.fixSpacing(formatted);
    }

    // Fix contractions
    formatted = this.fixContractions(formatted);

    // Fix proper nouns
    if (opts.properNouns) {
      formatted = this.fixProperNouns(formatted);
    }

    // Capitalize first letter of sentences
    if (opts.capitalizeFirst) {
      formatted = this.capitalizeSentences(formatted);
    }

    // Ensure proper end punctuation
    if (opts.ensureEndPunctuation) {
      formatted = this.ensureEndPunctuation(formatted);
    }

    // Add Oxford commas if requested
    if (opts.oxfordComma) {
      formatted = this.addOxfordCommas(formatted);
    }

    return formatted.trim();
  }

  /**
   * Remove multiple consecutive spaces
   */
  private static removeExtraSpaces(text: string): string {
    return text.replace(/\s+/g, ' ');
  }

  /**
   * Fix spacing around punctuation
   */
  private static fixSpacing(text: string): string {
    return text
      // Remove spaces before punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      // Add space after punctuation if missing
      .replace(/([,.!?;:])(?=[a-zA-Z])/g, '$1 ')
      // Fix spacing around parentheses
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      // Fix spacing around hyphens and em dashes
      .replace(/\s+-\s+/g, ' - ')
      .replace(/\s+—\s+/g, ' — ');
  }

  /**
   * Fix common contractions
   */
  private static fixContractions(text: string): string {
    let result = text;
    
    Object.entries(this.CONTRACTIONS).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      result = result.replace(regex, correct);
    });

    return result;
  }

  /**
   * Fix proper noun capitalization
   */
  private static fixProperNouns(text: string): string {
    let result = text;
    
    this.PROPER_NOUNS.forEach(noun => {
      const regex = new RegExp(`\\b${noun.toLowerCase()}\\b`, 'gi');
      result = result.replace(regex, noun);
    });

    return result;
  }

  /**
   * Capitalize the first letter of sentences
   */
  private static capitalizeSentences(text: string): string {
    // Capitalize first letter of text
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Capitalize after sentence endings
    const sentenceEndRegex = /([.!?:])\s+([a-z])/g;
    result = result.replace(sentenceEndRegex, (match, punctuation, letter) => {
      return punctuation + ' ' + letter.toUpperCase();
    });

    return result;
  }

  /**
   * Ensure proper end punctuation
   */
  private static ensureEndPunctuation(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return trimmed;
    
    const lastChar = trimmed.slice(-1);
    if (!this.SENTENCE_ENDINGS.includes(lastChar)) {
      // Add period if it's a complete sentence (contains subject and verb indicators)
      if (this.isCompleteSentence(trimmed)) {
        return trimmed + '.';
      }
    }
    
    return trimmed;
  }

  /**
   * Add Oxford commas to lists
   */
  private static addOxfordCommas(text: string): string {
    // Match patterns like "A, B and C" and replace with "A, B, and C"
    return text.replace(/(\w+),\s+(\w+)\s+and\s+(\w+)/g, '$1, $2, and $3');
  }

  /**
   * Check if text appears to be a complete sentence
   */
  private static isCompleteSentence(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    
    // Basic indicators of a complete sentence
    const hasSubject = words.some(word => 
      ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'the'].includes(word)
    );
    
    const hasVerb = words.some(word => 
      ['is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'can', 'could', 'should', 'would', 'do', 'does', 'did'].includes(word) ||
      word.endsWith('ing') || word.endsWith('ed') || word.endsWith('s')
    );
    
    return hasSubject && hasVerb && words.length >= 3;
  }

  /**
   * Format specific content types
   */
  static formatTitle(text: string): string {
    return this.format(text, {
      capitalizeFirst: true,
      ensureEndPunctuation: false,
      properNouns: true,
      fixSpacing: true
    });
  }

  static formatDescription(text: string): string {
    return this.format(text, {
      capitalizeFirst: true,
      ensureEndPunctuation: true,
      properNouns: true,
      fixSpacing: true,
      oxfordComma: true
    });
  }

  static formatListItem(text: string): string {
    return this.format(text, {
      capitalizeFirst: true,
      ensureEndPunctuation: false,
      properNouns: true,
      fixSpacing: true
    });
  }

  static formatSentence(text: string): string {
    return this.format(text, {
      capitalizeFirst: true,
      ensureEndPunctuation: true,
      properNouns: true,
      fixSpacing: true
    });
  }

  /**
   * Format numbers and units properly
   */
  static formatNumbers(text: string): string {
    return text
      // Add commas to large numbers
      .replace(/\b(\d{4,})\b/g, (match) => {
        return parseInt(match).toLocaleString();
      })
      // Fix spacing around units
      .replace(/(\d)\s*(%)/, '$1$2')
      .replace(/(\d)\s*(GB|MB|KB|TB)/gi, '$1 $2')
      .replace(/(\d)\s*(px|em|rem|vh|vw)/gi, '$1$2');
  }

  /**
   * Format technical terms consistently
   */
  static formatTechnicalTerms(text: string): string {
    const technicalTerms: Record<string, string> = {
      'back-link': 'backlink',
      'back link': 'backlink',
      'web site': 'website',
      'web page': 'webpage',
      'e-mail': 'email',
      'data base': 'database',
      'user name': 'username',
      'pass word': 'password',
      'sign up': 'sign-up',
      'log in': 'login',
      'check out': 'checkout',
      'set up': 'setup'
    };

    let result = text;
    Object.entries(technicalTerms).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      result = result.replace(regex, correct);
    });

    return result;
  }

  /**
   * Comprehensive formatting for UI text
   */
  static formatUIText(text: string, type: 'title' | 'description' | 'label' | 'button' | 'link' = 'description'): string {
    let formatted = text;

    // Apply technical terms formatting
    formatted = this.formatTechnicalTerms(formatted);
    
    // Apply number formatting
    formatted = this.formatNumbers(formatted);

    // Apply type-specific formatting
    switch (type) {
      case 'title':
        return this.formatTitle(formatted);
      case 'description':
        return this.formatDescription(formatted);
      case 'label':
      case 'button':
      case 'link':
        return this.formatListItem(formatted);
      default:
        return this.formatSentence(formatted);
    }
  }
}

export default TextFormatter;
export { type FormattingOptions };
