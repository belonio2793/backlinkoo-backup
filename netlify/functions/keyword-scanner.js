const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { action, ...params } = JSON.parse(event.body || '{}');
    
    console.log('🔍 Keyword scanner request:', { action, params });

    switch (action) {
      case 'scan_serp':
        return await handleSERPScan(params, headers);
      case 'analyze_competitors':
        return await handleCompetitorAnalysis(params, headers);
      case 'find_broken_links':
        return await handleBrokenLinkScan(params, headers);
      case 'find_resource_pages':
        return await handleResourcePageScan(params, headers);
      case 'get_results':
        return await handleGetResults(params, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Keyword scanner error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};

async function handleSERPScan(params, headers) {
  const { keyword, location = 'US', language = 'en', search_depth = 50, filters = {} } = params;
  
  if (!keyword) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Keyword is required' })
    };
  }

  console.log(`🎯 Starting SERP scan for keyword: ${keyword}`);

  try {
    // Create scan session
    const sessionId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store scan configuration
    const { error: configError } = await supabase
      .from('keyword_scan_sessions')
      .insert({
        session_id: sessionId,
        keyword,
        location,
        language,
        search_depth,
        filters,
        status: 'running',
        started_at: new Date().toISOString()
      });

    if (configError) {
      console.error('Failed to create scan session:', configError);
    }

    // Perform SERP analysis (simulated for demo)
    const results = await performSERPAnalysis(keyword, search_depth, sessionId);

    // Update session status
    await supabase
      .from('keyword_scan_sessions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        results_count: results.length
      })
      .eq('session_id', sessionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        session_id: sessionId,
        results_count: results.length,
        initial_results: results.slice(0, 10),
        message: `Found ${results.length} potential opportunities`
      })
    };

  } catch (error) {
    console.error('SERP scan error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleCompetitorAnalysis(params, headers) {
  const { competitor_domains, target_keywords } = params;
  
  if (!competitor_domains || !Array.isArray(competitor_domains)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Competitor domains array is required' })
    };
  }

  console.log(`🏆 Analyzing ${competitor_domains.length} competitors`);

  try {
    const analyses = [];
    const allOpportunities = [];

    for (const domain of competitor_domains) {
      const analysis = await analyzeCompetitorDomain(domain, target_keywords || []);
      analyses.push(analysis);
      allOpportunities.push(...analysis.gap_opportunities);

      // Store competitor analysis
      const { error } = await supabase
        .from('competitor_analyses')
        .insert({
          competitor_domain: domain,
          domain_rating: analysis.domain_rating,
          backlink_count: analysis.backlink_count,
          referring_domains: analysis.referring_domains,
          top_keywords: analysis.top_keywords,
          backlink_sources: analysis.backlink_sources,
          analysis_date: analysis.analysis_date,
          opportunities_found: analysis.gap_opportunities.length
        });

      if (error) {
        console.error('Failed to store competitor analysis:', error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analyses,
        total_opportunities: allOpportunities.length,
        opportunities: allOpportunities
      })
    };

  } catch (error) {
    console.error('Competitor analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleBrokenLinkScan(params, headers) {
  const { domain, keywords } = params;
  
  if (!domain) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Domain is required' })
    };
  }

  console.log(`🔗 Scanning for broken links on: ${domain}`);

  try {
    const opportunities = await findBrokenLinkOpportunities(domain, keywords || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        domain,
        opportunities_found: opportunities.length,
        opportunities
      })
    };

  } catch (error) {
    console.error('Broken link scan error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleResourcePageScan(params, headers) {
  const { keywords, filters = {} } = params;
  
  if (!keywords || !Array.isArray(keywords)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Keywords array is required' })
    };
  }

  console.log(`📚 Finding resource pages for: ${keywords.join(', ')}`);

  try {
    const opportunities = await findResourcePageOpportunities(keywords, filters);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        keywords,
        opportunities_found: opportunities.length,
        opportunities
      })
    };

  } catch (error) {
    console.error('Resource page scan error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleGetResults(params, headers) {
  const { session_id } = params;
  
  if (!session_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Session ID is required' })
    };
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('keyword_scan_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !session) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Scan session not found' })
      };
    }

    const { data: results, error: resultsError } = await supabase
      .from('serp_results')
      .select('*')
      .eq('session_id', session_id)
      .order('position', { ascending: true });

    if (resultsError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: resultsError.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        session,
        results: results || [],
        results_count: results?.length || 0
      })
    };

  } catch (error) {
    console.error('Error getting scan results:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

// Helper functions

async function performSERPAnalysis(keyword, searchDepth, sessionId) {
  const results = [];

  // Mock SERP data - in production this would use real search APIs
  const mockSERPData = [
    {
      position: 1,
      url: 'https://techcrunch.com/ai-tools-marketing',
      domain: 'techcrunch.com',
      title: `Best AI Tools for ${keyword} in 2024`,
      snippet: `Comprehensive guide to AI ${keyword} tools...`,
      estimated_da: 93,
      opportunity_type: 'guest_post'
    },
    {
      position: 2,
      url: 'https://hubspot.com/marketing-ai-guide',
      domain: 'hubspot.com',
      title: `${keyword}: Complete Guide`,
      snippet: `Learn how to use AI for ${keyword}...`,
      estimated_da: 89,
      opportunity_type: 'resource_page'
    },
    {
      position: 3,
      url: 'https://marketingland.com/ai-tools-list',
      domain: 'marketingland.com',
      title: `50 ${keyword} Tools You Should Know`,
      snippet: `Curated list of the best ${keyword} tools...`,
      estimated_da: 76,
      opportunity_type: 'resource_page'
    },
    {
      position: 4,
      url: 'https://blog.buffer.com/ai-marketing',
      domain: 'buffer.com',
      title: `How We Use AI for ${keyword}`,
      snippet: `Case study on AI implementation...`,
      estimated_da: 82,
      opportunity_type: 'guest_post'
    },
    {
      position: 5,
      url: 'https://contentmarketinginstitute.com/ai',
      domain: 'contentmarketinginstitute.com',
      title: `AI ${keyword} Strategies`,
      snippet: `Expert insights on AI content...`,
      estimated_da: 78,
      opportunity_type: 'guest_post'
    },
    {
      position: 6,
      url: 'https://neilpatel.com/blog/ai-tools',
      domain: 'neilpatel.com',
      title: `${keyword} AI Tools That Work`,
      snippet: `My favorite AI tools for ${keyword}...`,
      estimated_da: 85,
      opportunity_type: 'guest_post'
    },
    {
      position: 7,
      url: 'https://searchengineland.com/ai-seo',
      domain: 'searchengineland.com',
      title: `AI and ${keyword}: What You Need to Know`,
      snippet: `How AI is changing ${keyword}...`,
      estimated_da: 81,
      opportunity_type: 'contact_opportunity'
    },
    {
      position: 8,
      url: 'https://moz.com/blog/ai-marketing',
      domain: 'moz.com',
      title: `The Future of ${keyword} with AI`,
      snippet: `Predictions for AI in ${keyword}...`,
      estimated_da: 88,
      opportunity_type: 'guest_post'
    }
  ];

  const limitedResults = mockSERPData.slice(0, Math.min(searchDepth, mockSERPData.length));

  for (let i = 0; i < limitedResults.length; i++) {
    const item = limitedResults[i];
    
    const result = {
      session_id: sessionId,
      keyword,
      position: item.position,
      url: item.url,
      domain: item.domain,
      title: item.title,
      snippet: item.snippet,
      domain_rating: item.estimated_da,
      page_authority: Math.floor(item.estimated_da * 0.8),
      backlinks: Math.floor(Math.random() * 50000) + 1000,
      opportunity_type: item.opportunity_type,
      opportunity_score: calculateOpportunityScore(item),
      difficulty_level: item.estimated_da > 80 ? 'hard' : item.estimated_da > 60 ? 'medium' : 'easy',
      estimated_success_rate: calculateSuccessRate(item),
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
      .insert(result);

    if (error) {
      console.error('Failed to store SERP result:', error);
    }
  }

  return results;
}

async function analyzeCompetitorDomain(domain, keywords) {
  // Mock competitor analysis data
  const mockData = {
    domain_rating: Math.floor(Math.random() * 40) + 50, // 50-90
    backlink_count: Math.floor(Math.random() * 100000) + 10000,
    referring_domains: Math.floor(Math.random() * 5000) + 500,
    top_keywords: keywords.slice(0, 3).concat(['marketing automation', 'digital tools'])
  };

  const backlink_sources = [
    {
      domain: 'forbes.com',
      url: `https://forbes.com/tech-startups-2024`,
      anchor_text: 'innovative marketing platform',
      domain_rating: 94,
      link_type: 'dofollow',
      context: 'Article about tech startups',
      first_seen: '2024-01-15',
      opportunity_available: false
    },
    {
      domain: 'entrepreneur.com',
      url: `https://entrepreneur.com/marketing-tools-guide`,
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
      url: `https://inc.com/small-business-tools`,
      anchor_text: domain,
      domain_rating: 91,
      link_type: 'dofollow',
      context: 'Small business tools roundup',
      first_seen: '2024-01-28',
      opportunity_available: true,
      opportunity_type: 'similar_roundup'
    }
  ];

  const gap_opportunities = backlink_sources
    .filter(source => source.opportunity_available)
    .map((source, index) => ({
      id: `comp_opp_${Date.now()}_${index}`,
      domain: source.domain,
      url: source.url,
      opportunity_type: 'competitor_gap',
      priority: source.domain_rating > 85 ? 'high' : 'medium',
      estimated_da: source.domain_rating,
      success_probability: source.domain_rating > 85 ? 60 : 75,
      effort_required: 'medium',
      contact_method: 'email',
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

async function findBrokenLinkOpportunities(domain, keywords) {
  const opportunities = [];

  // Mock broken link detection
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

  return opportunities;
}

async function findResourcePageOpportunities(keywords, filters) {
  const opportunities = [];

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
      discovered_via: `resource_search_${keywords.join('_')}`
    });
  }

  return opportunities;
}

function calculateOpportunityScore(item) {
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

function calculateSuccessRate(item) {
  let rate = 50; // Base rate
  
  // Adjust based on domain authority
  if (item.estimated_da > 80) rate -= 20; // Harder to get links from high DA sites
  else if (item.estimated_da < 40) rate += 10; // Easier for lower DA sites
  
  // Position factor
  rate += Math.max(0, 10 - item.position);
  
  return Math.max(20, Math.min(90, rate));
}
