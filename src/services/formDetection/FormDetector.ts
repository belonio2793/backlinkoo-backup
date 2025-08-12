// Form Detection Service - Browser-safe interface
// The actual Playwright implementation will be in Netlify functions

export interface FormMap {
  id: string;
  url: string;
  domain: string;
  formSelector: string;
  action: string | null;
  method: string;
  fields: {
    comment?: string;
    name?: string;
    email?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  hidden: Record<string, string>;
  submitSelector?: string;
  confidence: number;
  status: 'detected' | 'validated' | 'failed' | 'posted';
  screenshot?: string;
  detectedAt: string;
  lastTested?: string;
}

export interface DiscoveryResult {
  formsFound: number;
  urls: string[];
  forms: FormMap[];
  query: string;
  searchTime: number;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  issues: string[];
  screenshot?: string;
  formMap: FormMap;
}

export interface PostingResult {
  success: boolean;
  message: string;
  screenshot?: string;
  response?: string;
  timeTaken: number;
}

export class FormDetectionService {
  
  // Discover forms using search APIs
  async discoverForms(query: string, options?: {
    maxResults?: number;
    targetDomains?: string[];
    includeSubdomains?: boolean;
  }): Promise<DiscoveryResult> {
    const response = await fetch('/.netlify/functions/form-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        maxResults: options?.maxResults || 50,
        targetDomains: options?.targetDomains,
        includeSubdomains: options?.includeSubdomains || false
      })
    });

    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Detect form structure on a specific URL
  async detectFormStructure(url: string): Promise<FormMap[]> {
    const response = await fetch('/.netlify/functions/form-detector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Detection failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.forms || [];
  }

  // Validate a form by testing its structure
  async validateForm(formId: string): Promise<ValidationResult> {
    const response = await fetch('/.netlify/functions/form-validator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId })
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Post to a form using automated filling
  async postToForm(formId: string, content: {
    name: string;
    email: string;
    website?: string;
    comment: string;
  }): Promise<PostingResult> {
    const response = await fetch('/.netlify/functions/form-poster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId,
        content
      })
    });

    if (!response.ok) {
      throw new Error(`Posting failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Batch operations
  async batchValidateForms(formIds: string[]): Promise<ValidationResult[]> {
    const response = await fetch('/.netlify/functions/batch-validator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formIds })
    });

    if (!response.ok) {
      throw new Error(`Batch validation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.results || [];
  }

  async batchPostToForms(postingJobs: Array<{
    formId: string;
    content: {
      name: string;
      email: string;
      website?: string;
      comment: string;
    };
  }>): Promise<PostingResult[]> {
    const response = await fetch('/.netlify/functions/batch-poster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs: postingJobs })
    });

    if (!response.ok) {
      throw new Error(`Batch posting failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.results || [];
  }

  // Search for comment forms using specific patterns
  async searchCommentForms(searchParams: {
    keywords: string[];
    includePatterns: string[];
    excludePatterns: string[];
    domains?: string[];
    maxPages?: number;
  }): Promise<DiscoveryResult> {
    const response = await fetch('/.netlify/functions/advanced-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(`Advanced discovery failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get form detection statistics
  async getDetectionStats(): Promise<{
    totalForms: number;
    validatedForms: number;
    successfulPosts: number;
    averageConfidence: number;
    topDomains: Array<{ domain: string; count: number }>;
    recentActivity: Array<{ action: string; timestamp: string; status: string }>;
  }> {
    const response = await fetch('/.netlify/functions/detection-stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Stats failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Utility functions for form analysis
export class FormAnalyzer {
  
  static calculateConfidence(formMap: Partial<FormMap>): number {
    let score = 0;
    
    // Base score for having form structure
    score += 10;
    
    // Field detection scores
    if (formMap.fields?.comment) score += 20;
    if (formMap.fields?.name) score += 10;
    if (formMap.fields?.email) score += 15;
    if (formMap.fields?.website) score += 5;
    
    // Method and action scores
    if (formMap.method === 'POST') score += 10;
    if (formMap.action) score += 5;
    
    // Submit selector
    if (formMap.submitSelector) score += 10;
    
    // Hidden fields (CSRF protection)
    if (formMap.hidden && Object.keys(formMap.hidden).length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  static identifyPlatform(url: string, formMap: FormMap): string {
    const domain = new URL(url).hostname.toLowerCase();
    
    // WordPress detection
    if (formMap.action?.includes('wp-comments-post.php') || 
        formMap.fields?.comment?.includes('#comment') ||
        domain.includes('wordpress')) {
      return 'wordpress';
    }
    
    // Substack detection
    if (domain.includes('substack.com')) {
      return 'substack';
    }
    
    // Medium detection
    if (domain.includes('medium.com')) {
      return 'medium';
    }
    
    // Ghost detection
    if (formMap.action?.includes('/members/api/') ||
        formMap.fields?.comment?.includes('ghost')) {
      return 'ghost';
    }
    
    // Blogger detection
    if (domain.includes('blogger.com') || domain.includes('blogspot.com')) {
      return 'blogger';
    }
    
    // Squarespace detection
    if (domain.includes('squarespace') ||
        formMap.action?.includes('squarespace')) {
      return 'squarespace';
    }
    
    return 'generic';
  }

  static validateFormStructure(formMap: FormMap): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!formMap.fields?.comment) {
      issues.push('No comment field detected');
    }
    
    if (!formMap.fields?.name && !formMap.fields?.email) {
      issues.push('Neither name nor email field detected');
    }
    
    if (!formMap.submitSelector) {
      issues.push('No submit button detected');
    }
    
    if (formMap.method?.toLowerCase() !== 'post') {
      issues.push('Form uses GET method instead of POST');
    }
    
    if (formMap.confidence < 50) {
      issues.push('Low confidence score in form detection');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  static generateFormSignature(formMap: FormMap): string {
    // Create a unique signature for the form structure
    const parts = [
      formMap.domain,
      formMap.method,
      Object.keys(formMap.fields).sort().join(','),
      Object.keys(formMap.hidden).length.toString()
    ];
    
    return parts.join('|');
  }
}

// Export singleton instance
export const formDetectionService = new FormDetectionService();
