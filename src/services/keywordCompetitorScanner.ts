/**
 * Keyword & Competitor Scanner Service
 * Discovers link opportunities from SERPs and competitor analysis
 */

import { supabase } from '@/integrations/supabase/client';

export interface SERPResult {
  id: string;
  keyword: string;
  position: number;
  url: string;
  domain: string;
  title: string;
  snippet: string;
  domain_rating?: number;
  page_authority?: number;
  backlinks?: number;
  opportunity_type: 'guest_post' | 'broken_link' | 'competitor_backlink' | 'resource_page' | 'contact_opportunity';
  opportunity_score: number; // 0-100
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_success_rate: number;
  contact_info?: {
    email?: string;
    contact_form?: string;
    social_profiles?: string[];
  };
  analysis_data: {
    accepts_guest_posts: boolean;
    has_resource_page: boolean;
    has_broken_links: boolean;
    content_gaps: string[];
    last_updated: string;
    site_quality_score: number;
  };
  discovered_at: string;
}

export interface CompetitorAnalysis {
  competitor_domain: string;
  domain_rating: number;
  backlink_count: number;
  referring_domains: number;
  top_keywords: string[];
  backlink_sources: BacklinkSource[];
  gap_opportunities: LinkOpportunity[];
  analysis_date: string;
}

export interface BacklinkSource {
  domain: string;
  url: string;
  anchor_text: string;
  domain_rating: number;
  link_type: 'dofollow' | 'nofollow';
  context: string;
  first_seen: string;
  opportunity_available: boolean;
  opportunity_type?: string;
}

export interface LinkOpportunity {
  id: string;
  domain: string;
  url: string;
  opportunity_type: 'guest_post' | 'broken_link' | 'unlinked_mention' | 'resource_page' | 'competitor_gap';
  priority: 'high' | 'medium' | 'low';
  estimated_da: number;
  success_probability: number;
  effort_required: 'low' | 'medium' | 'high';
  contact_method: 'email' | 'form' | 'social' | 'manual';
  notes: string;
  discovered_via: string;
}

export interface ScanConfiguration {
  keyword: string;
  location: string;
  language: string;
  search_depth: number; // Number of results to analyze
  competitor_domains?: string[];
  filters: {
    min_domain_rating?: number;
    max_spam_score?: number;
    exclude_domains?: string[];
    include_only?: string[];
  };
  analysis_depth: 'basic' | 'detailed' | 'comprehensive';
}

export class KeywordCompetitorScanner {
  
  /**
   * Start comprehensive SERP scan for keyword opportunities
   */
  static async scanKeywordSERP(config: ScanConfiguration): Promise<{
    success: boolean;
    session_id?: string;
    initial_results?: SERPResult[];
    error?: string;
  }> {
    try {
      console.log('🔍 Starting SERP scan for keyword:', config.keyword);

      // Create scan session
      const sessionId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store scan configuration
      const { error: configError } = await supabase
        .from('keyword_scan_sessions')
        .insert({
          session_id: sessionId,
          keyword: config.keyword,
          location: config.location,
          language: config.language,
          search_depth: config.search_depth,
          filters: config.filters,
          analysis_depth: config.analysis_depth,
          status: 'running',
          started_at: new Date().toISOString()
        });

      if (configError) {
        console.error('Failed to create scan session:', configError);
      }

      // Start the scanning process
      const results = await this.performSERPAnalysis(config, sessionId);

      return {
        success: true,
        session_id: sessionId,
        initial_results: results.slice(0, 10) // Return first 10 for immediate display
      };

    } catch (error: any) {
      console.error('SERP scan error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze competitor backlink profiles
   */
  static async analyzeCompetitors(
    competitorDomains: string[],
    targetKeywords: string[]
  ): Promise<{
    success: boolean;
    analyses?: CompetitorAnalysis[];
    opportunities?: LinkOpportunity[];
    error?: string;
  }> {
    try {
      console.log('🏆 Analyzing competitors:', competitorDomains);

      const analyses: CompetitorAnalysis[] = [];
      const allOpportunities: LinkOpportunity[] = [];

      for (const domain of competitorDomains) {
        const analysis = await this.analyzeCompetitorDomain(domain, targetKeywords);
        analyses.push(analysis);
        allOpportunities.push(...analysis.gap_opportunities);
      }

      // Store competitor analysis
      const { error: storeError } = await supabase
        .from('competitor_analyses')
        .insert(
          analyses.map(analysis => ({
            competitor_domain: analysis.competitor_domain,
            domain_rating: analysis.domain_rating,
            backlink_count: analysis.backlink_count,
            referring_domains: analysis.referring_domains,
            top_keywords: analysis.top_keywords,
            backlink_sources: analysis.backlink_sources,
            analysis_date: analysis.analysis_date,
            opportunities_found: analysis.gap_opportunities.length
          }))
        );

      if (storeError) {
        console.error('Failed to store competitor analysis:', storeError);
      }

      return {
        success: true,
        analyses,
        opportunities: allOpportunities
      };

    } catch (error: any) {
      console.error('Competitor analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find broken link opportunities
   */
  static async findBrokenLinkOpportunities(
    domain: string,
    relevantKeywords: string[]
  ): Promise<{
    success: boolean;
    opportunities?: LinkOpportunity[];
    error?: string;
  }> {
    try {
      console.log('🔗 Scanning for broken links on:', domain);

      // Simulate broken link detection
      const opportunities: LinkOpportunity[] = [];

      // In a real implementation, this would:
      // 1. Crawl the target website
      // 2. Check all outbound links for 404s
      // 3. Identify relevant broken links
      // 4. Suggest replacement content

      const mockBrokenLinks = [
        {
          broken_url: `https://${domain}/old-resource`,
          context_page: `https://${domain}/resources`,
          anchor_text: 'comprehensive guide',
          relevance_score: 85
        },
        {
          broken_url: `https://${domain}/outdated-tool`,
          context_page: `https://${domain}/tools`,
          anchor_text: 'useful tool',
          relevance_score: 72
        }
      ];

      for (let i = 0; i < mockBrokenLinks.length; i++) {
        const brokenLink = mockBrokenLinks[i];
        opportunities.push({
          id: `broken_${Date.now()}_${i}`,
          domain,
          url: brokenLink.context_page,
          opportunity_type: 'broken_link',
          priority: brokenLink.relevance_score > 80 ? 'high' : 'medium',
          estimated_da: Math.floor(Math.random() * 40) + 40, // 40-80
          success_probability: brokenLink.relevance_score,
          effort_required: 'medium',
          contact_method: 'email',
          notes: `Broken link: ${brokenLink.broken_url} (${brokenLink.anchor_text})`,
          discovered_via: 'broken_link_scan'
        });
      }

      return {
        success: true,
        opportunities
      };

    } catch (error: any) {
      console.error('Broken link scan error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Discover resource page opportunities
   */
  static async findResourcePageOpportunities(
    keywords: string[],
    filters: ScanConfiguration['filters']
  ): Promise<{
    success: boolean;
    opportunities?: LinkOpportunity[];
    error?: string;
  }> {
    try {
      console.log('📚 Finding resource page opportunities for:', keywords);

      const opportunities: LinkOpportunity[] = [];

      // Resource page search queries
      const resourceQueries = keywords.flatMap(keyword => [
        `"${keyword}" resources`,
        `"${keyword}" tools`,
        `"${keyword}" links`,
        `best ${keyword} resources`,
        `useful ${keyword} tools`,
        `${keyword} directory`
      ]);

      for (const query of resourceQueries.slice(0, 5)) { // Limit for demo
        const results = await this.searchResourcePages(query, filters);
        opportunities.push(...results);
      }

      // Remove duplicates based on domain
      const uniqueOpportunities = opportunities.filter((opp, index, self) => 
        index === self.findIndex(o => o.domain === opp.domain)
      );

      return {
        success: true,
        opportunities: uniqueOpportunities
      };

    } catch (error: any) {
      console.error('Resource page discovery error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get scan results by session
   */
  static async getScanResults(sessionId: string): Promise<{
    success: boolean;
    results?: SERPResult[];
    status?: string;
    error?: string;
  }> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('keyword_scan_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return { success: false, error: 'Scan session not found' };
      }

      const { data: results, error: resultsError } = await supabase
        .from('serp_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('position', { ascending: true });

      if (resultsError) {
        return { success: false, error: resultsError.message };
      }

      return {
        success: true,
        results: results || [],
        status: session.status
      };

    } catch (error: any) {
      console.error('Error getting scan results:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private helper methods

  private static async performSERPAnalysis(
    config: ScanConfiguration,
    sessionId: string
  ): Promise<SERPResult[]> {
    const results: SERPResult[] = [];

    // Simulate SERP results - in production this would use:
    // - Google Custom Search API
    // - Bing Search API
    // - SerpAPI
    // - ScrapingBee
    
    const mockSERPData = [
      {
        position: 1,
        url: 'https://techcrunch.com/ai-tools-marketing',
        domain: 'techcrunch.com',
        title: 'Best AI Tools for Marketing in 2024',
        snippet: 'Comprehensive guide to AI marketing tools...',
        estimated_da: 93
      },
      {
        position: 2,
        url: 'https://hubspot.com/marketing-ai-guide',
        domain: 'hubspot.com',
        title: 'AI Marketing: Complete Guide',
        snippet: 'Learn how to use AI for marketing...',
        estimated_da: 89
      },
      {
        position: 3,
        url: 'https://marketingland.com/ai-tools-list',
        domain: 'marketingland.com',
        title: '50 AI Marketing Tools You Should Know',
        snippet: 'Curated list of the best AI tools...',
        estimated_da: 76
      },
      {
        position: 4,
        url: 'https://blog.buffer.com/ai-marketing',
        domain: 'buffer.com',
        title: 'How We Use AI for Social Media Marketing',
        snippet: 'Case study on AI implementation...',
        estimated_da: 82
      },
      {
        position: 5,
        url: 'https://contentmarketinginstitute.com/ai',
        domain: 'contentmarketinginstitute.com',
        title: 'AI Content Marketing Strategies',
        snippet: 'Expert insights on AI content...',
        estimated_da: 78
      }
    ];

    for (let i = 0; i < Math.min(config.search_depth, mockSERPData.length); i++) {
      const item = mockSERPData[i];
      
      const result: SERPResult = {
        id: `serp_${sessionId}_${i}`,
        keyword: config.keyword,
        position: item.position,
        url: item.url,
        domain: item.domain,
        title: item.title,
        snippet: item.snippet,
        domain_rating: item.estimated_da,
        page_authority: Math.floor(item.estimated_da * 0.8),
        backlinks: Math.floor(Math.random() * 50000) + 1000,
        opportunity_type: this.determineOpportunityType(item.domain, item.title),
        opportunity_score: this.calculateOpportunityScore(item),
        difficulty_level: item.estimated_da > 80 ? 'hard' : item.estimated_da > 60 ? 'medium' : 'easy',
        estimated_success_rate: this.calculateSuccessRate(item),
        contact_info: await this.findContactInfo(item.domain),
        analysis_data: {
          accepts_guest_posts: Math.random() > 0.4,
          has_resource_page: Math.random() > 0.6,
          has_broken_links: Math.random() > 0.3,
          content_gaps: ['AI automation', 'Tool comparisons', 'Case studies'],
          last_updated: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          site_quality_score: Math.floor(Math.random() * 30) + 70
        },
        discovered_at: new Date().toISOString()
      };

      results.push(result);

      // Store result in database
      const { error } = await supabase
        .from('serp_results')
        .insert({
          session_id: sessionId,
          keyword: result.keyword,
          position: result.position,
          url: result.url,
          domain: result.domain,
          title: result.title,
          snippet: result.snippet,
          domain_rating: result.domain_rating,
          opportunity_type: result.opportunity_type,
          opportunity_score: result.opportunity_score,
          difficulty_level: result.difficulty_level,
          analysis_data: result.analysis_data,
          discovered_at: result.discovered_at
        });

      if (error) {
        console.error('Failed to store SERP result:', error);
      }
    }

    return results;
  }

  private static async analyzeCompetitorDomain(
    domain: string,
    keywords: string[]
  ): Promise<CompetitorAnalysis> {
    // Simulate competitor analysis - in production would use:
    // - Ahrefs API
    // - SEMrush API
    // - Majestic API
    // - Moz API

    const mockData = {
      domain_rating: Math.floor(Math.random() * 40) + 50, // 50-90
      backlink_count: Math.floor(Math.random() * 100000) + 10000,
      referring_domains: Math.floor(Math.random() * 5000) + 500,
      top_keywords: keywords.slice(0, 3).concat(['marketing automation', 'digital tools'])
    };

    const backlink_sources: BacklinkSource[] = [
      {
        domain: 'forbes.com',
        url: 'https://forbes.com/tech-startups-2024',
        anchor_text: 'innovative marketing platform',
        domain_rating: 94,
        link_type: 'dofollow',
        context: 'Article about tech startups',
        first_seen: '2024-01-15',
        opportunity_available: false
      },
      {
        domain: 'entrepreneur.com',
        url: 'https://entrepreneur.com/marketing-tools-guide',
        anchor_text: 'best marketing tools',
        domain_rating: 87,
        link_type: 'dofollow',
        context: 'Resource list article',
        first_seen: '2024-02-03',
        opportunity_available: true,
        opportunity_type: 'resource_inclusion'
      },
      {
        domain: 'inc.com',
        url: 'https://inc.com/small-business-tools',
        anchor_text: domain,
        domain_rating: 91,
        link_type: 'dofollow',
        context: 'Small business tools roundup',
        first_seen: '2024-01-28',
        opportunity_available: true,
        opportunity_type: 'similar_roundup'
      }
    ];

    const gap_opportunities: LinkOpportunity[] = backlink_sources
      .filter(source => source.opportunity_available)
      .map((source, index) => ({
        id: `comp_opp_${Date.now()}_${index}`,
        domain: source.domain,
        url: source.url,
        opportunity_type: 'competitor_gap' as const,
        priority: source.domain_rating > 85 ? 'high' as const : 'medium' as const,
        estimated_da: source.domain_rating,
        success_probability: source.domain_rating > 85 ? 60 : 75,
        effort_required: 'medium' as const,
        contact_method: 'email' as const,
        notes: `Competitor ${domain} has link from ${source.context}`,
        discovered_via: `competitor_analysis_${domain}`
      }));

    return {
      competitor_domain: domain,
      domain_rating: mockData.domain_rating,
      backlink_count: mockData.backlink_count,
      referring_domains: mockData.referring_domains,
      top_keywords: mockData.top_keywords,
      backlink_sources,
      gap_opportunities,
      analysis_date: new Date().toISOString()
    };
  }

  private static async searchResourcePages(
    query: string,
    filters: ScanConfiguration['filters']
  ): Promise<LinkOpportunity[]> {
    const opportunities: LinkOpportunity[] = [];

    // Mock resource page results
    const mockResults = [
      {
        domain: 'awesomemarketingtools.com',
        url: 'https://awesomemarketingtools.com/resources',
        title: 'Marketing Tools and Resources',
        estimated_da: 45
      },
      {
        domain: 'digitalmarketinginstitute.com',
        url: 'https://digitalmarketinginstitute.com/tools',
        title: 'Digital Marketing Tools Directory',
        estimated_da: 72
      },
      {
        domain: 'marketingland.com',
        url: 'https://marketingland.com/tools',
        title: 'Marketing Tools We Recommend',
        estimated_da: 76
      }
    ];

    for (let i = 0; i < mockResults.length; i++) {
      const result = mockResults[i];
      
      if (filters.min_domain_rating && result.estimated_da < filters.min_domain_rating) {
        continue;
      }

      opportunities.push({
        id: `resource_${Date.now()}_${i}`,
        domain: result.domain,
        url: result.url,
        opportunity_type: 'resource_page',
        priority: result.estimated_da > 70 ? 'high' : 'medium',
        estimated_da: result.estimated_da,
        success_probability: 70,
        effort_required: 'low',
        contact_method: 'email',
        notes: `Resource page: ${result.title}`,
        discovered_via: `resource_search_${query}`
      });
    }

    return opportunities;
  }

  private static determineOpportunityType(domain: string, title: string): SERPResult['opportunity_type'] {
    if (title.toLowerCase().includes('guest') || domain.includes('blog')) {
      return 'guest_post';
    }
    if (title.toLowerCase().includes('resource') || title.toLowerCase().includes('tools')) {
      return 'resource_page';
    }
    if (title.toLowerCase().includes('contact') || title.toLowerCase().includes('submit')) {
      return 'contact_opportunity';
    }
    return 'competitor_backlink';
  }

  private static calculateOpportunityScore(item: any): number {
    let score = 50; // Base score
    
    // Domain authority boost
    if (item.estimated_da > 80) score += 30;
    else if (item.estimated_da > 60) score += 20;
    else if (item.estimated_da > 40) score += 10;
    
    // Position factor (higher positions are easier to contact)
    score += Math.max(0, 20 - (item.position * 2));
    
    // Random factor for demonstration
    score += Math.floor(Math.random() * 20) - 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private static calculateSuccessRate(item: any): number {
    let rate = 50; // Base rate
    
    // Adjust based on domain authority
    if (item.estimated_da > 80) rate -= 20; // Harder to get links from high DA sites
    else if (item.estimated_da < 40) rate += 10; // Easier for lower DA sites
    
    // Position factor
    rate += Math.max(0, 10 - item.position);
    
    return Math.max(20, Math.min(90, rate));
  }

  private static async findContactInfo(domain: string): Promise<SERPResult['contact_info']> {
    // Simulate contact info discovery
    const hasEmail = Math.random() > 0.6;
    const hasContactForm = Math.random() > 0.4;
    const hasSocial = Math.random() > 0.7;

    return {
      email: hasEmail ? `contact@${domain}` : undefined,
      contact_form: hasContactForm ? `https://${domain}/contact` : undefined,
      social_profiles: hasSocial ? [`https://twitter.com/${domain.split('.')[0]}`] : undefined
    };
  }
}
