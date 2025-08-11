/**
 * Error Categorization and Tracking System
 * Categorizes errors by type, tracks patterns, and provides insights for incremental development
 */

import { activeLogger, debugLog } from './activeErrorLogger';

export interface ErrorCategory {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  commonCauses: string[];
  solutions: string[];
  preventionTips: string[];
  automationImpact: 'none' | 'minor' | 'moderate' | 'severe' | 'blocking';
}

export interface ErrorPattern {
  id: string;
  signature: string;
  category: string;
  frequency: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedComponents: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolved: boolean;
  resolutionNotes?: string;
  workArounds: string[];
}

export interface DevelopmentInsight {
  id: string;
  type: 'bottleneck' | 'improvement' | 'warning' | 'opportunity';
  title: string;
  description: string;
  component: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'minimal' | 'moderate' | 'significant';
  recommendation: string;
  dataPoints: any[];
  createdAt: Date;
}

class ErrorCategorizationSystem {
  private static instance: ErrorCategorizationSystem;
  private categories: Map<string, ErrorCategory> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private insights: DevelopmentInsight[] = [];
  private analysisInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeCategories();
    this.startPatternAnalysis();
  }

  public static getInstance(): ErrorCategorizationSystem {
    if (!ErrorCategorizationSystem.instance) {
      ErrorCategorizationSystem.instance = new ErrorCategorizationSystem();
    }
    return ErrorCategorizationSystem.instance;
  }

  private initializeCategories(): void {
    const automationCategories: ErrorCategory[] = [
      {
        id: 'database_connection',
        name: 'Database Connection',
        description: 'Issues connecting to or querying Supabase database',
        severity: 'critical',
        commonCauses: [
          'Network connectivity issues',
          'Invalid credentials',
          'Rate limiting',
          'Database maintenance',
          'Firewall restrictions'
        ],
        solutions: [
          'Check network connection',
          'Verify Supabase credentials',
          'Implement exponential backoff',
          'Use connection pooling',
          'Add fallback database'
        ],
        preventionTips: [
          'Implement retry logic with backoff',
          'Monitor connection health',
          'Use environment-specific configs',
          'Set up database alerts'
        ],
        automationImpact: 'blocking'
      },
      {
        id: 'api_integration',
        name: 'API Integration',
        description: 'External API failures (OpenAI, rank tracking, etc.)',
        severity: 'high',
        commonCauses: [
          'API rate limits exceeded',
          'Invalid API keys',
          'Service outages',
          'Malformed requests',
          'Authentication failures'
        ],
        solutions: [
          'Verify API keys',
          'Implement rate limiting',
          'Add request validation',
          'Use circuit breakers',
          'Set up backup providers'
        ],
        preventionTips: [
          'Monitor API usage quotas',
          'Implement graceful degradation',
          'Cache API responses when possible',
          'Use multiple API providers'
        ],
        automationImpact: 'severe'
      },
      {
        id: 'campaign_management',
        name: 'Campaign Management',
        description: 'Issues with campaign creation, modification, or execution',
        severity: 'high',
        commonCauses: [
          'Invalid campaign data',
          'Duplicate campaign names',
          'Permission errors',
          'Resource conflicts',
          'State synchronization issues'
        ],
        solutions: [
          'Validate input data',
          'Implement unique constraints',
          'Check user permissions',
          'Add conflict resolution',
          'Use atomic operations'
        ],
        preventionTips: [
          'Use form validation',
          'Implement proper state management',
          'Add confirmation dialogs',
          'Log all campaign changes'
        ],
        automationImpact: 'severe'
      },
      {
        id: 'content_generation',
        name: 'Content Generation',
        description: 'AI content generation failures or quality issues',
        severity: 'medium',
        commonCauses: [
          'Prompt engineering issues',
          'API response timeouts',
          'Content quality filters',
          'Token limits exceeded',
          'Model availability'
        ],
        solutions: [
          'Optimize prompts',
          'Increase timeout values',
          'Adjust quality filters',
          'Implement token management',
          'Use fallback models'
        ],
        preventionTips: [
          'Test prompts thoroughly',
          'Monitor content quality',
          'Implement content caching',
          'Use progressive enhancement'
        ],
        automationImpact: 'moderate'
      },
      {
        id: 'link_discovery',
        name: 'Link Discovery',
        description: 'Issues finding relevant linking opportunities',
        severity: 'medium',
        commonCauses: [
          'Search API limitations',
          'Invalid search parameters',
          'No results found',
          'Quality filtering too strict',
          'Scraping blocked'
        ],
        solutions: [
          'Diversify search sources',
          'Optimize search parameters',
          'Adjust quality filters',
          'Implement retry logic',
          'Use proxy rotation'
        ],
        preventionTips: [
          'Regularly update search algorithms',
          'Monitor discovery success rates',
          'Use multiple discovery methods',
          'Cache discovered opportunities'
        ],
        automationImpact: 'moderate'
      },
      {
        id: 'user_authentication',
        name: 'User Authentication',
        description: 'Login, registration, and permission issues',
        severity: 'high',
        commonCauses: [
          'Invalid credentials',
          'Session expiration',
          'Permission denied',
          'Email verification pending',
          'Account suspension'
        ],
        solutions: [
          'Verify credentials',
          'Refresh tokens',
          'Check permissions',
          'Resend verification email',
          'Contact support'
        ],
        preventionTips: [
          'Implement proper session management',
          'Use secure authentication flows',
          'Add clear error messages',
          'Monitor auth failure rates'
        ],
        automationImpact: 'blocking'
      },
      {
        id: 'payment_processing',
        name: 'Payment Processing',
        description: 'Subscription and payment related errors',
        severity: 'critical',
        commonCauses: [
          'Payment method declined',
          'Stripe webhook failures',
          'Subscription status sync issues',
          'Pricing plan conflicts',
          'Tax calculation errors'
        ],
        solutions: [
          'Update payment method',
          'Retry webhook processing',
          'Sync subscription status',
          'Review pricing configuration',
          'Fix tax calculations'
        ],
        preventionTips: [
          'Monitor payment success rates',
          'Implement webhook retry logic',
          'Use idempotency keys',
          'Test payment flows regularly'
        ],
        automationImpact: 'blocking'
      },
      {
        id: 'ui_interaction',
        name: 'UI Interaction',
        description: 'User interface errors and interaction issues',
        severity: 'low',
        commonCauses: [
          'Component state issues',
          'Form validation errors',
          'Navigation problems',
          'Loading state bugs',
          'Responsive design issues'
        ],
        solutions: [
          'Fix component state management',
          'Improve form validation',
          'Debug navigation flow',
          'Fix loading indicators',
          'Test responsive breakpoints'
        ],
        preventionTips: [
          'Use proper state management patterns',
          'Test across different devices',
          'Implement comprehensive form validation',
          'Monitor user interaction metrics'
        ],
        automationImpact: 'minor'
      }
    ];

    automationCategories.forEach(category => {
      this.categories.set(category.id, category);
    });

    debugLog.info('error_categorization', 'initialize', 'Error categories initialized', {
      count: automationCategories.length
    });
  }

  public categorizeError(error: any, component: string, operation: string): string {
    const errorMessage = (error?.message || String(error)).toLowerCase();
    const stack = error?.stack?.toLowerCase() || '';

    // Database related errors
    if (errorMessage.includes('supabase') || 
        errorMessage.includes('database') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('postgresql') ||
        stack.includes('supabase')) {
      return 'database_connection';
    }

    // API integration errors
    if (errorMessage.includes('openai') ||
        errorMessage.includes('api key') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('fetch')) {
      return 'api_integration';
    }

    // Campaign management errors
    if (component.includes('campaign') ||
        errorMessage.includes('campaign') ||
        operation.includes('campaign')) {
      return 'campaign_management';
    }

    // Content generation errors
    if (component.includes('content') ||
        component.includes('blog') ||
        errorMessage.includes('generation') ||
        errorMessage.includes('ai content')) {
      return 'content_generation';
    }

    // Link discovery errors
    if (component.includes('link') ||
        component.includes('discovery') ||
        errorMessage.includes('scraping') ||
        errorMessage.includes('search')) {
      return 'link_discovery';
    }

    // Authentication errors
    if (errorMessage.includes('auth') ||
        errorMessage.includes('login') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized')) {
      return 'user_authentication';
    }

    // Payment errors
    if (errorMessage.includes('payment') ||
        errorMessage.includes('stripe') ||
        errorMessage.includes('subscription') ||
        errorMessage.includes('billing')) {
      return 'payment_processing';
    }

    // UI interaction errors
    if (component.includes('ui') ||
        component.includes('component') ||
        errorMessage.includes('render') ||
        errorMessage.includes('hook')) {
      return 'ui_interaction';
    }

    // Default to API integration if unclear
    return 'api_integration';
  }

  public trackErrorPattern(error: any, component: string, operation: string): void {
    const category = this.categorizeError(error, component, operation);
    const signature = this.generateErrorSignature(error, component, operation);
    
    let pattern = this.patterns.get(signature);
    
    if (pattern) {
      // Update existing pattern
      pattern.frequency++;
      pattern.lastOccurrence = new Date();
      pattern.affectedComponents = Array.from(new Set([...pattern.affectedComponents, component]));
      
      // Update trend analysis
      const timeSinceFirst = Date.now() - pattern.firstOccurrence.getTime();
      const hoursElapsed = timeSinceFirst / (1000 * 60 * 60);
      const frequencyPerHour = pattern.frequency / Math.max(hoursElapsed, 1);
      
      if (frequencyPerHour > 5) {
        pattern.trend = 'increasing';
        pattern.priority = 'urgent';
      } else if (frequencyPerHour > 2) {
        pattern.trend = 'increasing';
        pattern.priority = 'high';
      } else {
        pattern.trend = 'stable';
      }
    } else {
      // Create new pattern
      pattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        signature,
        category,
        frequency: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        affectedComponents: [component],
        trend: 'stable',
        priority: 'low',
        resolved: false,
        workArounds: this.getSuggestedWorkArounds(category)
      };
    }
    
    this.patterns.set(signature, pattern);
    
    debugLog.info('error_categorization', 'track_pattern', 'Error pattern tracked', {
      signature,
      category,
      frequency: pattern.frequency,
      trend: pattern.trend,
      priority: pattern.priority
    });
  }

  private generateErrorSignature(error: any, component: string, operation: string): string {
    const errorMessage = (error?.message || String(error)).toLowerCase();
    const errorCode = error?.code || 'unknown';
    
    // Create a signature that groups similar errors
    const normalizedMessage = errorMessage
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
    
    return `${component}:${operation}:${errorCode}:${normalizedMessage}`;
  }

  private getSuggestedWorkArounds(category: string): string[] {
    const categoryData = this.categories.get(category);
    if (!categoryData) return [];
    
    return [
      ...categoryData.solutions.slice(0, 2), // First 2 solutions as workarounds
      'Check system logs for more details',
      'Try refreshing the page',
      'Contact support if issue persists'
    ];
  }

  public generateDevelopmentInsights(): DevelopmentInsight[] {
    const insights: DevelopmentInsight[] = [];
    const now = new Date();
    
    // Analyze error patterns for insights
    const patternsByCategory = new Map<string, ErrorPattern[]>();
    this.patterns.forEach(pattern => {
      if (!patternsByCategory.has(pattern.category)) {
        patternsByCategory.set(pattern.category, []);
      }
      patternsByCategory.get(pattern.category)!.push(pattern);
    });

    // Identify bottlenecks
    patternsByCategory.forEach((patterns, category) => {
      const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
      const urgentPatterns = patterns.filter(p => p.priority === 'urgent').length;
      
      if (totalFrequency > 20 || urgentPatterns > 2) {
        insights.push({
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'bottleneck',
          title: `High Error Rate in ${category}`,
          description: `The ${category} component has ${totalFrequency} errors with ${urgentPatterns} urgent patterns. This may be blocking automation progress.`,
          component: category,
          impact: urgentPatterns > 2 ? 'high' : 'medium',
          effort: 'significant',
          recommendation: this.getRecommendationForCategory(category),
          dataPoints: patterns.map(p => ({
            pattern: p.signature,
            frequency: p.frequency,
            trend: p.trend,
            components: p.affectedComponents
          })),
          createdAt: now
        });
      }
    });

    // Identify improvement opportunities
    const stableComponents = Array.from(patternsByCategory.entries())
      .filter(([_, patterns]) => patterns.every(p => p.trend === 'stable' && p.frequency < 5))
      .map(([category, _]) => category);

    if (stableComponents.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'opportunity',
        title: 'Stable Components Ready for Enhancement',
        description: `Components ${stableComponents.join(', ')} have stable error rates and could be enhanced with new features.`,
        component: 'multiple',
        impact: 'medium',
        effort: 'moderate',
        recommendation: 'Consider adding new automation features to these stable components',
        dataPoints: stableComponents.map(c => ({ component: c, status: 'stable' })),
        createdAt: now
      });
    }

    // Identify components with increasing error trends
    const increasingErrorComponents = Array.from(patternsByCategory.entries())
      .filter(([_, patterns]) => patterns.some(p => p.trend === 'increasing'))
      .map(([category, patterns]) => ({
        category,
        patterns: patterns.filter(p => p.trend === 'increasing')
      }));

    increasingErrorComponents.forEach(({ category, patterns }) => {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'warning',
        title: `Increasing Errors in ${category}`,
        description: `Error rates are increasing in ${category}. ${patterns.length} error patterns show upward trends.`,
        component: category,
        impact: 'high',
        effort: 'moderate',
        recommendation: `Investigate and fix increasing error patterns in ${category} before they become critical`,
        dataPoints: patterns.map(p => ({
          pattern: p.signature,
          frequency: p.frequency,
          trend: p.trend,
          lastOccurrence: p.lastOccurrence
        })),
        createdAt: now
      });
    });

    this.insights = insights;
    
    debugLog.info('error_categorization', 'generate_insights', 'Development insights generated', {
      totalInsights: insights.length,
      bottlenecks: insights.filter(i => i.type === 'bottleneck').length,
      warnings: insights.filter(i => i.type === 'warning').length,
      opportunities: insights.filter(i => i.type === 'opportunity').length
    });
    
    return insights;
  }

  private getRecommendationForCategory(category: string): string {
    const categoryData = this.categories.get(category);
    if (!categoryData) return 'Review and fix errors in this component';
    
    const topSolutions = categoryData.solutions.slice(0, 3);
    return `Focus on: ${topSolutions.join(', ')}. Impact: ${categoryData.automationImpact}`;
  }

  private startPatternAnalysis(): void {
    // Run pattern analysis every 2 minutes
    this.analysisInterval = setInterval(() => {
      this.analyzePatterns();
      this.generateDevelopmentInsights();
    }, 2 * 60 * 1000);
  }

  private analyzePatterns(): void {
    const now = Date.now();
    let analyzedPatterns = 0;
    
    this.patterns.forEach((pattern, signature) => {
      // Check if pattern has been resolved (no occurrences in last 30 minutes)
      const timeSinceLastOccurrence = now - pattern.lastOccurrence.getTime();
      if (timeSinceLastOccurrence > 30 * 60 * 1000 && !pattern.resolved) {
        pattern.resolved = true;
        pattern.trend = 'decreasing';
        pattern.priority = 'low';
        
        debugLog.info('error_categorization', 'pattern_resolved', 'Error pattern marked as resolved', {
          signature,
          frequency: pattern.frequency,
          duration: now - pattern.firstOccurrence.getTime()
        });
      }
      
      analyzedPatterns++;
    });
    
    debugLog.debug('error_categorization', 'analyze_patterns', 'Pattern analysis completed', {
      totalPatterns: analyzedPatterns,
      activePatterns: Array.from(this.patterns.values()).filter(p => !p.resolved).length
    });
  }

  // Public API methods
  public getCategories(): ErrorCategory[] {
    return Array.from(this.categories.values());
  }

  public getCategory(id: string): ErrorCategory | undefined {
    return this.categories.get(id);
  }

  public getPatterns(filter?: {
    category?: string;
    priority?: string;
    resolved?: boolean;
  }): ErrorPattern[] {
    let patterns = Array.from(this.patterns.values());
    
    if (filter) {
      if (filter.category) {
        patterns = patterns.filter(p => p.category === filter.category);
      }
      if (filter.priority) {
        patterns = patterns.filter(p => p.priority === filter.priority);
      }
      if (filter.resolved !== undefined) {
        patterns = patterns.filter(p => p.resolved === filter.resolved);
      }
    }
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  public getInsights(): DevelopmentInsight[] {
    return [...this.insights].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public markPatternResolved(patternId: string, resolutionNotes: string): void {
    const pattern = Array.from(this.patterns.values()).find(p => p.id === patternId);
    if (pattern) {
      pattern.resolved = true;
      pattern.resolutionNotes = resolutionNotes;
      pattern.priority = 'low';
      
      debugLog.info('error_categorization', 'mark_resolved', 'Pattern marked as resolved', {
        patternId,
        resolutionNotes
      });
    }
  }

  public getAutomationHealthScore(): {
    score: number;
    breakdown: Record<string, number>;
    recommendations: string[];
  } {
    const activePatterns = this.getPatterns({ resolved: false });
    const categories = this.getCategories();
    
    let totalScore = 100;
    const breakdown: Record<string, number> = {};
    const recommendations: string[] = [];
    
    categories.forEach(category => {
      const categoryPatterns = activePatterns.filter(p => p.category === category.id);
      const urgentCount = categoryPatterns.filter(p => p.priority === 'urgent').length;
      const highCount = categoryPatterns.filter(p => p.priority === 'high').length;
      
      let categoryScore = 100;
      
      // Deduct points based on severity and automation impact
      if (category.automationImpact === 'blocking') {
        categoryScore -= urgentCount * 30 + highCount * 15;
      } else if (category.automationImpact === 'severe') {
        categoryScore -= urgentCount * 20 + highCount * 10;
      } else if (category.automationImpact === 'moderate') {
        categoryScore -= urgentCount * 10 + highCount * 5;
      }
      
      categoryScore = Math.max(0, categoryScore);
      breakdown[category.name] = categoryScore;
      
      if (categoryScore < 70) {
        recommendations.push(`Fix ${category.name} issues (${urgentCount} urgent, ${highCount} high priority)`);
      }
    });
    
    const overallScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0) / categories.length;
    
    return {
      score: Math.round(overallScore),
      breakdown,
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    };
  }

  public shutdown(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
  }
}

// Export singleton instance and convenience methods
export const errorCategorization = ErrorCategorizationSystem.getInstance();

export const trackError = (error: any, component: string, operation: string): void => {
  errorCategorization.trackErrorPattern(error, component, operation);
};

export default errorCategorization;
