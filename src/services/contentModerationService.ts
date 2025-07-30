import { supabase } from '@/integrations/supabase/client';
import { contentFilterService } from './contentFilterService';

export interface ModerationRequest {
  id: string;
  user_id?: string;
  content_type: 'blog_request' | 'generated_content' | 'user_input';
  original_content: string;
  target_url?: string;
  primary_keyword?: string;
  anchor_text?: string;
  flagged_terms: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  auto_decision?: boolean;
}

export interface ModerationDecision {
  request_id: string;
  decision: 'approve' | 'reject' | 'request_changes';
  admin_notes: string;
  alternative_suggestions?: string[];
  reviewed_by: string;
}

export class ContentModerationService {
  // Enhanced harmful content categories
  private readonly harmfulCategories = {
    violence: {
      keywords: [
        'kill', 'murder', 'assassinate', 'torture', 'massacre', 'brutality',
        'violence', 'violent', 'assault', 'attack', 'harm', 'hurt', 'injure',
        'destroy', 'annihilate', 'eliminate', 'exterminate', 'slaughter',
        'beating', 'stabbing', 'shooting', 'bombing', 'explosion', 'terror',
        'terrorist', 'terrorism', 'war crimes', 'genocide', 'abuse',
        'domestic violence', 'child abuse', 'physical harm', 'threatening'
      ],
      severity: 'critical' as const,
      autoReject: true
    },
    
    hurtful: {
      keywords: [
        'hate', 'hatred', 'racist', 'racism', 'discrimination', 'discriminate',
        'bigot', 'bigotry', 'prejudice', 'xenophobia', 'homophobia', 'transphobia',
        'islamophobia', 'antisemitism', 'supremacist', 'nazi', 'fascist',
        'slur', 'offensive', 'derogatory', 'insulting', 'degrading',
        'humiliate', 'humiliation', 'bully', 'bullying', 'harassment',
        'cyberbullying', 'stalking', 'intimidation', 'threatening behavior'
      ],
      severity: 'high' as const,
      autoReject: true
    },

    malicious: {
      keywords: [
        'hack', 'hacking', 'cyber attack', 'malware', 'virus', 'phishing',
        'scam', 'fraud', 'fraudulent', 'deceive', 'deception', 'manipulate',
        'exploit', 'exploitation', 'blackmail', 'extortion', 'ransom',
        'identity theft', 'data breach', 'illegal access', 'unauthorized',
        'sabotage', 'vandalism', 'revenge', 'retaliation', 'scheme',
        'con artist', 'ponzi', 'pyramid scheme', 'fake reviews', 'astroturfing'
      ],
      severity: 'high' as const,
      autoReject: false // Allow admin review for context
    },

    illegal: {
      keywords: [
        'drugs', 'cocaine', 'heroin', 'methamphetamine', 'illegal drugs',
        'drug dealing', 'drug trafficking', 'weapons', 'guns', 'firearms',
        'explosives', 'bomb', 'ammunition', 'illegal weapons', 'stolen goods',
        'money laundering', 'tax evasion', 'counterfeiting', 'piracy',
        'copyright infringement', 'trademark violation', 'patent theft',
        'insider trading', 'bribery', 'corruption', 'embezzlement'
      ],
      severity: 'critical' as const,
      autoReject: true
    },

    adult_explicit: {
      keywords: [
        'porn', 'pornography', 'pornographic', 'xxx', 'adult videos',
        'sex videos', 'explicit content', 'nudity', 'nude', 'naked',
        'erotic', 'sexual content', 'adult entertainment', 'strip club',
        'escort', 'prostitution', 'adult dating', 'cam girls', 'sexual services'
      ],
      severity: 'high' as const,
      autoReject: true
    },

    gambling: {
      keywords: [
        'casino', 'gambling', 'poker', 'blackjack', 'roulette', 'slots',
        'betting', 'sportsbook', 'lottery', 'jackpot', 'online casino',
        'sports betting', 'gambling addiction', 'bet online', 'crypto gambling'
      ],
      severity: 'medium' as const,
      autoReject: false
    },

    misinformation: {
      keywords: [
        'fake news', 'conspiracy', 'misinformation', 'disinformation',
        'false claims', 'unverified', 'debunked', 'hoax', 'propaganda',
        'misleading information', 'false advertising', 'deceptive claims'
      ],
      severity: 'medium' as const,
      autoReject: false
    }
  };

  async moderateContent(
    content: string,
    targetUrl?: string,
    primaryKeyword?: string,
    anchorText?: string,
    userId?: string,
    contentType: 'blog_request' | 'generated_content' | 'user_input' = 'blog_request'
  ): Promise<{ allowed: boolean; requiresReview: boolean; request?: ModerationRequest }> {
    
    // First run basic content filtering
    const filterResult = contentFilterService.filterContent(content);
    
    // Enhanced moderation check
    const moderationResult = this.checkHarmfulContent(content);
    
    if (moderationResult.flaggedTerms.length === 0 && filterResult.isAllowed) {
      return { allowed: true, requiresReview: false };
    }

    // Create moderation request
    const request: ModerationRequest = {
      id: crypto.randomUUID(),
      user_id: userId,
      content_type: contentType,
      original_content: content.substring(0, 1000), // Limit stored content
      target_url: targetUrl,
      primary_keyword: primaryKeyword,
      anchor_text: anchorText,
      flagged_terms: [...new Set([...filterResult.blockedTerms, ...moderationResult.flaggedTerms])],
      severity: this.determineSeverity(moderationResult.categories),
      category: moderationResult.categories.join(', '),
      status: moderationResult.autoReject ? 'rejected' : 'pending',
      created_at: new Date().toISOString(),
      auto_decision: moderationResult.autoReject
    };

    // Store moderation request
    try {
      await this.storeModerationRequest(request);
    } catch (error) {
      console.error('Failed to store moderation request:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: String(error)
      });
    }

    // Log the event
    await contentFilterService.logFilterEvent(
      content,
      { 
        isAllowed: false, 
        blockedTerms: request.flagged_terms, 
        severity: request.severity,
        reason: `Content flagged for moderation: ${request.category}`
      },
      userId,
      `moderation_${contentType}`
    );

    return {
      allowed: false,
      requiresReview: !moderationResult.autoReject,
      request
    };
  }

  private checkHarmfulContent(content: string): {
    flaggedTerms: string[];
    categories: string[];
    autoReject: boolean;
  } {
    const normalizedContent = content.toLowerCase();
    const flaggedTerms: string[] = [];
    const categories: string[] = [];
    let autoReject = false;

    // Check each category
    for (const [categoryName, categoryData] of Object.entries(this.harmfulCategories)) {
      for (const keyword of categoryData.keywords) {
        if (normalizedContent.includes(keyword.toLowerCase())) {
          flaggedTerms.push(keyword);
          if (!categories.includes(categoryName)) {
            categories.push(categoryName);
          }
          if (categoryData.autoReject) {
            autoReject = true;
          }
        }
      }
    }

    // Check for patterns that might indicate harmful intent
    const harmfulPatterns = [
      /\b(how to|tutorial|guide|instructions?)\s+(kill|harm|hurt|attack|destroy)\b/i,
      /\b(make|build|create)\s+(bomb|weapon|explosive|poison)\b/i,
      /\b(revenge|get back at|punish|make them pay)\b/i,
      /\b(illegal|black market|dark web)\s+(buy|sell|purchase|obtain)\b/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(content)) {
        flaggedTerms.push('harmful_pattern_detected');
        if (!categories.includes('malicious')) {
          categories.push('malicious');
        }
        autoReject = true;
      }
    }

    return { flaggedTerms, categories, autoReject };
  }

  private determineSeverity(categories: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (categories.some(cat => ['violence', 'illegal'].includes(cat))) {
      return 'critical';
    }
    if (categories.some(cat => ['hurtful', 'malicious', 'adult_explicit'].includes(cat))) {
      return 'high';
    }
    if (categories.some(cat => ['gambling', 'misinformation'].includes(cat))) {
      return 'medium';
    }
    return 'low';
  }

  private async storeModerationRequest(request: ModerationRequest): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_moderation_queue')
        .insert([request]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store moderation request:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: String(error)
      });
      // Fallback to localStorage for critical requests
      const stored = JSON.parse(localStorage.getItem('moderation_queue') || '[]');
      stored.push(request);
      localStorage.setItem('moderation_queue', JSON.stringify(stored));
    }
  }

  async getPendingModerationRequests(): Promise<ModerationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('content_moderation_queue')
        .select('*')
        .in('status', ['pending', 'under_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch moderation requests:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: String(error)
      });
      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('moderation_queue') || '[]');
      return stored.filter((req: ModerationRequest) => 
        ['pending', 'under_review'].includes(req.status)
      );
    }
  }

  async getModerationStats(days: number = 7): Promise<any> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('content_moderation_queue')
        .select('*')
        .gte('created_at', since);

      if (error) throw error;

      const total = data.length;
      const pending = data.filter(req => req.status === 'pending').length;
      const approved = data.filter(req => req.status === 'approved').length;
      const rejected = data.filter(req => req.status === 'rejected').length;
      const autoRejected = data.filter(req => req.auto_decision && req.status === 'rejected').length;

      const bySeverity = data.reduce((acc, req) => {
        acc[req.severity] = (acc[req.severity] || 0) + 1;
        return acc;
      }, {});

      const byCategory = data.reduce((acc, req) => {
        const categories = req.category.split(', ');
        categories.forEach(cat => {
          acc[cat] = (acc[cat] || 0) + 1;
        });
        return acc;
      }, {});

      return {
        total,
        pending,
        approved,
        rejected,
        autoRejected,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0',
        bySeverity,
        byCategory,
        topFlaggedTerms: this.getTopFlaggedTerms(data)
      };
    } catch (error) {
      console.error('Failed to get moderation stats:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      });
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        autoRejected: 0,
        approvalRate: '0',
        bySeverity: {},
        byCategory: {},
        topFlaggedTerms: []
      };
    }
  }

  private getTopFlaggedTerms(requests: ModerationRequest[]): Array<{ term: string; count: number }> {
    const termCounts: { [key: string]: number } = {};
    
    requests.forEach(req => {
      req.flagged_terms.forEach(term => {
        termCounts[term] = (termCounts[term] || 0) + 1;
      });
    });

    return Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([term, count]) => ({ term, count }));
  }

  async reviewModerationRequest(
    requestId: string,
    decision: ModerationDecision,
    adminId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_moderation_queue')
        .update({
          status: decision.decision === 'approve' ? 'approved' : 'rejected',
          admin_notes: decision.admin_notes,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log the admin decision
      await supabase.from('moderation_decisions').insert([{
        request_id: requestId,
        decision: decision.decision,
        admin_notes: decision.admin_notes,
        alternative_suggestions: decision.alternative_suggestions || [],
        reviewed_by: adminId,
        created_at: new Date().toISOString()
      }]);

      return true;
    } catch (error) {
      console.error('Failed to review moderation request:', error);
      return false;
    }
  }

  async updateRequestStatus(requestId: string, status: ModerationRequest['status']): Promise<void> {
    try {
      await supabase
        .from('content_moderation_queue')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  }

  async addToRemovalList(terms: string[], category: string, adminId: string): Promise<void> {
    try {
      const entries = terms.map(term => ({
        term: term.toLowerCase(),
        category,
        added_by: adminId,
        created_at: new Date().toISOString()
      }));

      await supabase.from('content_removal_list').insert(entries);
    } catch (error) {
      console.error('Failed to add terms to removal list:', error);
    }
  }

  async getRemovalList(): Promise<Array<{ term: string; category: string; added_by: string; created_at: string }>> {
    try {
      const { data, error } = await supabase
        .from('content_removal_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get removal list:', error);
      return [];
    }
  }

  // Quick test method for admins
  testContentForHarmful(content: string): {
    isHarmful: boolean;
    flaggedTerms: string[];
    categories: string[];
    severity: string;
    wouldAutoReject: boolean;
  } {
    const result = this.checkHarmfulContent(content);
    const severity = this.determineSeverity(result.categories);
    
    return {
      isHarmful: result.flaggedTerms.length > 0,
      flaggedTerms: result.flaggedTerms,
      categories: result.categories,
      severity,
      wouldAutoReject: result.autoReject
    };
  }
}

export const contentModerationService = new ContentModerationService();
