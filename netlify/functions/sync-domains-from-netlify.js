/**
 * Netlify-to-Supabase Domain Sync Function
 * 
 * This function fetches existing domain aliases from Netlify using the site ID
 * and personal access token, then syncs them to Supabase without creating duplicates.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    console.log('🔄 Netlify-to-Supabase domain sync function started...');

    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
      } catch (error) {
        console.error('❌ Invalid JSON in request body:', error);
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body'
          }),
        };
      }
    }

    const { userId, syncMode = 'safe' } = requestData;

    // Environment variables
    const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🔑 Environment check:', {
      hasNetlifyToken: !!netlifyToken,
      netlifyTokenLength: netlifyToken?.length || 0,
      siteId: siteId,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      userId: userId
    });

    // Validate required environment variables
    if (!netlifyToken) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Netlify access token not configured',
          details: 'NETLIFY_ACCESS_TOKEN environment variable is missing'
        }),
      };
    }

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Supabase configuration not complete',
          details: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY'
        }),
      };
    }

    // Step 1: Fetch domains from Netlify
    console.log('📡 Step 1: Fetching domains from Netlify...');
    const netlifyDomains = await fetchNetlifyDomains(netlifyToken, siteId);
    
    if (!netlifyDomains.success) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch domains from Netlify',
          details: netlifyDomains.error
        }),
      };
    }

    console.log('✅ Netlify domains fetched:', {
      count: netlifyDomains.domains.length,
      domains: netlifyDomains.domains,
      siteInfo: netlifyDomains.siteInfo
    });

    // Step 2: Fetch existing domains from Supabase
    console.log('🗄️ Step 2: Fetching existing domains from Supabase...');
    const supabaseDomains = await fetchSupabaseDomains(supabaseUrl, supabaseKey, userId);
    
    if (!supabaseDomains.success) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch domains from Supabase',
          details: supabaseDomains.error
        }),
      };
    }

    console.log('✅ Supabase domains fetched:', {
      count: supabaseDomains.domains.length,
      domains: supabaseDomains.domains.map(d => ({ id: d.id, domain: d.domain, netlify_verified: d.netlify_verified }))
    });

    // Step 3: Compare and sync domains
    console.log('🔄 Step 3: Comparing and syncing domains...');
    const syncResult = await syncDomains(
      netlifyDomains.domains,
      supabaseDomains.domains,
      netlifyDomains.siteInfo,
      supabaseUrl,
      supabaseKey,
      userId,
      syncMode
    );

    console.log('✅ Sync completed:', syncResult);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Sync completed successfully`,
        syncResult: {
          ...syncResult,
          netlifyDomains: netlifyDomains.domains,
          netlifyCount: netlifyDomains.domains.length,
          supabaseCount: supabaseDomains.domains.length,
          siteInfo: netlifyDomains.siteInfo
        }
      }),
    };

  } catch (error) {
    console.error('❌ Unexpected error in sync function:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: {
          error_type: 'unexpected_error',
          timestamp: new Date().toISOString()
        }
      }),
    };
  }
};

/**
 * Fetch all domains from Netlify site
 */
async function fetchNetlifyDomains(netlifyToken, siteId) {
  try {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
    }

    const siteData = await response.json();
    const domains = [];

    // Collect all domains (custom domain + aliases)
    if (siteData.custom_domain) {
      domains.push(siteData.custom_domain);
    }
    if (siteData.domain_aliases && Array.isArray(siteData.domain_aliases)) {
      domains.push(...siteData.domain_aliases);
    }

    // Remove duplicates and sort
    const uniqueDomains = [...new Set(domains)].sort();

    return {
      success: true,
      domains: uniqueDomains,
      siteInfo: {
        id: siteData.id,
        name: siteData.name,
        url: siteData.url,
        custom_domain: siteData.custom_domain,
        domain_aliases: siteData.domain_aliases || [],
        ssl_url: siteData.ssl_url,
        total_domains: uniqueDomains.length
      }
    };

  } catch (error) {
    console.error('❌ Error fetching Netlify domains:', error);
    return {
      success: false,
      error: error.message,
      domains: []
    };
  }
}

/**
 * Fetch existing domains from Supabase
 */
async function fetchSupabaseDomains(supabaseUrl, supabaseKey, userId) {
  try {
    let url = `${supabaseUrl}/rest/v1/domains?select=*`;
    
    // If userId provided, filter by user
    if (userId) {
      url += `&user_id=eq.${userId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
    }

    const domains = await response.json();

    return {
      success: true,
      domains: domains || []
    };

  } catch (error) {
    console.error('❌ Error fetching Supabase domains:', error);
    return {
      success: false,
      error: error.message,
      domains: []
    };
  }
}

/**
 * Sync domains between Netlify and Supabase
 */
async function syncDomains(netlifyDomains, supabaseDomains, siteInfo, supabaseUrl, supabaseKey, userId, syncMode) {
  const syncResult = {
    domainsAdded: [],
    domainsUpdated: [],
    domainsSkipped: [],
    errors: [],
    summary: {
      total: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    }
  };

  // Create a map of existing Supabase domains for quick lookup
  const supabaseDomainsMap = new Map();
  supabaseDomains.forEach(domain => {
    supabaseDomainsMap.set(domain.domain.toLowerCase(), domain);
  });

  // Process each Netlify domain
  for (const netlifyDomain of netlifyDomains) {
    syncResult.summary.total++;
    const domainLower = netlifyDomain.toLowerCase();
    const existingDomain = supabaseDomainsMap.get(domainLower);

    try {
      if (existingDomain) {
        // Domain exists - check if we need to update
        const needsUpdate = 
          !existingDomain.netlify_verified ||
          existingDomain.status !== 'verified' ||
          !existingDomain.netlify_site_id;

        if (needsUpdate) {
          console.log(`🔄 Updating existing domain: ${netlifyDomain}`);
          
          const updateResult = await updateDomainInSupabase(
            supabaseUrl,
            supabaseKey,
            existingDomain.id,
            {
              status: 'verified',
              netlify_verified: true,
              netlify_site_id: siteInfo.id,
              error_message: null,
              custom_domain: netlifyDomain === siteInfo.custom_domain
            }
          );

          if (updateResult.success) {
            syncResult.domainsUpdated.push({
              domain: netlifyDomain,
              id: existingDomain.id,
              action: 'updated_verification_status'
            });
            syncResult.summary.updated++;
          } else {
            throw new Error(`Update failed: ${updateResult.error}`);
          }
        } else {
          console.log(`⏭️ Domain already synced: ${netlifyDomain}`);
          syncResult.domainsSkipped.push({
            domain: netlifyDomain,
            id: existingDomain.id,
            reason: 'already_synced'
          });
          syncResult.summary.skipped++;
        }
      } else {
        // Domain doesn't exist - add it
        console.log(`➕ Adding new domain: ${netlifyDomain}`);
        
        const addResult = await addDomainToSupabase(
          supabaseUrl,
          supabaseKey,
          {
            domain: netlifyDomain,
            user_id: userId,
            status: 'verified',
            netlify_verified: true,
            netlify_site_id: siteInfo.id,
            dns_verified: true, // Assume DNS is working if it's in Netlify
            custom_domain: netlifyDomain === siteInfo.custom_domain,
            ssl_status: 'issued' // Assume SSL is working if it's in Netlify
          }
        );

        if (addResult.success) {
          syncResult.domainsAdded.push({
            domain: netlifyDomain,
            id: addResult.id,
            action: 'added_from_netlify'
          });
          syncResult.summary.added++;
        } else {
          throw new Error(`Add failed: ${addResult.error}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing domain ${netlifyDomain}:`, error);
      syncResult.errors.push({
        domain: netlifyDomain,
        error: error.message,
        action: existingDomain ? 'update' : 'add'
      });
      syncResult.summary.errors++;
    }
  }

  return syncResult;
}

/**
 * Add a new domain to Supabase
 */
async function addDomainToSupabase(supabaseUrl, supabaseKey, domainData) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(domainData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add domain: ${errorText}`);
    }

    const [newDomain] = await response.json();

    return {
      success: true,
      id: newDomain.id,
      domain: newDomain.domain
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update an existing domain in Supabase
 */
async function updateDomainInSupabase(supabaseUrl, supabaseKey, domainId, updateData) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/domains?id=eq.${domainId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        ...updateData,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update domain: ${errorText}`);
    }

    return {
      success: true,
      domainId: domainId
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
