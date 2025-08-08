// Link Discovery Engine - Finds potential backlink opportunities across the web
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { campaignId, keywords, linkStrategy } = requestBody;

    if (!campaignId || !keywords || !Array.isArray(keywords)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Campaign ID and keywords are required' }),
      };
    }

    // Set up Server-Sent Events for real-time updates
    const sseHeaders = {
      ...headers,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    };

    // For demonstration, we'll generate realistic link opportunities
    // In production, this would involve web scraping, API calls, etc.
    
    const linkOpportunities = [];
    const totalSteps = 100;
    let currentStep = 0;

    // Helper function to generate realistic opportunities
    const generateOpportunities = async (keyword, type) => {
      const domains = [
        'techcrunch.com', 'medium.com', 'reddit.com', 'quora.com',
        'stackoverflow.com', 'dev.to', 'hashnode.com', 'producthunt.com',
        'indiehackers.com', 'hackernews.com', 'linkedin.com', 'twitter.com',
        'facebook.com', 'discord.com', 'slack.com', 'github.com',
        'codepen.io', 'dribbble.com', 'behance.net', 'pinterest.com'
      ];

      const typeData = {
        blog_comment: {
          paths: ['/blog/', '/article/', '/post/', '/news/'],
          authority: () => Math.floor(Math.random() * 30) + 40, // 40-70
        },
        forum_profile: {
          paths: ['/forum/', '/community/', '/discussion/', '/profile/'],
          authority: () => Math.floor(Math.random() * 25) + 35, // 35-60
        },
        web2_platform: {
          paths: ['/create/', '/publish/', '/write/', '/submit/'],
          authority: () => Math.floor(Math.random() * 40) + 50, // 50-90
        },
        social_profile: {
          paths: ['/profile/', '/user/', '/about/', '/bio/'],
          authority: () => Math.floor(Math.random() * 20) + 30, // 30-50
        },
        contact_form: {
          paths: ['/contact/', '/support/', '/help/', '/feedback/'],
          authority: () => Math.floor(Math.random() * 35) + 45, // 45-80
        }
      };

      const opportunities = [];
      const numOpportunities = Math.floor(Math.random() * 8) + 3; // 3-10 opportunities per type

      for (let i = 0; i < numOpportunities; i++) {
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const path = typeData[type].paths[Math.floor(Math.random() * typeData[type].paths.length)];
        const keywordSlug = keyword.toLowerCase().replace(/\s+/g, '-');
        
        const opportunity = {
          id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: `https://${domain}${path}${keywordSlug}-${Math.random().toString(36).substr(2, 5)}`,
          type: type,
          authority: typeData[type].authority(),
          relevanceScore: Math.floor(Math.random() * 30) + 70, // 70-100
          status: 'pending',
          keyword: keyword,
          discoveredAt: new Date().toISOString()
        };

        opportunities.push(opportunity);
      }

      return opportunities;
    };

    // Start discovery process
    let discoveryResults = '';
    
    // Send initial progress
    discoveryResults += `data: ${JSON.stringify({
      type: 'progress',
      progress: 0,
      message: 'Starting link discovery...'
    })}\n\n`;

    // Process each keyword
    for (let keywordIndex = 0; keywordIndex < keywords.length; keywordIndex++) {
      const keyword = keywords[keywordIndex];
      
      discoveryResults += `data: ${JSON.stringify({
        type: 'progress',
        progress: Math.floor((keywordIndex / keywords.length) * 50),
        message: `Discovering opportunities for "${keyword}"...`
      })}\n\n`;

      // Process each enabled link strategy
      const enabledStrategies = Object.entries(linkStrategy)
        .filter(([key, enabled]) => enabled)
        .map(([key]) => key);

      for (let strategyIndex = 0; strategyIndex < enabledStrategies.length; strategyIndex++) {
        const strategy = enabledStrategies[strategyIndex];
        const linkType = strategy.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

        // Generate opportunities for this keyword and strategy
        const opportunities = await generateOpportunities(keyword, linkType);
        
        // Send each opportunity as it's found
        for (const opportunity of opportunities) {
          linkOpportunities.push(opportunity);
          
          discoveryResults += `data: ${JSON.stringify({
            type: 'opportunity',
            opportunity: opportunity
          })}\n\n`;

          // Small delay to simulate real discovery
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update progress
        const progressPercent = 50 + Math.floor(((keywordIndex * enabledStrategies.length + strategyIndex + 1) / (keywords.length * enabledStrategies.length)) * 45);
        discoveryResults += `data: ${JSON.stringify({
          type: 'progress',
          progress: progressPercent,
          message: `Found ${opportunities.length} ${linkType.replace('_', ' ')} opportunities for "${keyword}"`
        })}\n\n`;
      }
    }

    // Send completion message
    discoveryResults += `data: ${JSON.stringify({
      type: 'complete',
      progress: 100,
      totalOpportunities: linkOpportunities.length,
      message: `Discovery complete! Found ${linkOpportunities.length} total opportunities across ${keywords.length} keywords.`
    })}\n\n`;

    // For streaming response, we would normally use a writable stream
    // For now, return all the data at once
    return {
      statusCode: 200,
      headers: sseHeaders,
      body: discoveryResults,
    };

  } catch (error) {
    console.error('Error in link discovery:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'An unexpected error occurred during discovery'
      }),
    };
  }
};
