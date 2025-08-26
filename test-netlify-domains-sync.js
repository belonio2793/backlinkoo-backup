#!/usr/bin/env node

/**
 * Test script to sync domains from Netlify to Supabase
 * This will fetch all domains from the Netlify site and add them to Supabase
 */

require('dotenv').config();

async function testNetlifyDomainsSync() {
  console.log('🚀 Starting Netlify domains sync test...');
  
  // Test environment variables
  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔑 Environment check:', {
    hasNetlifyToken: !!netlifyToken,
    netlifyTokenLength: netlifyToken?.length || 0,
    netlifyTokenPreview: netlifyToken ? `${netlifyToken.substring(0, 8)}...` : 'none',
    siteId: siteId,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    supabaseUrl: supabaseUrl
  });

  if (!netlifyToken) {
    console.error('❌ NETLIFY_ACCESS_TOKEN not found in environment variables');
    return false;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase configuration not complete');
    return false;
  }

  try {
    // Step 1: Fetch domains from Netlify
    console.log('📡 Step 1: Fetching domains from Netlify...');
    const netlifyResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!netlifyResponse.ok) {
      const errorText = await netlifyResponse.text();
      throw new Error(`Netlify API error: ${netlifyResponse.status} - ${errorText}`);
    }

    const siteData = await netlifyResponse.json();
    const domains = [];

    // Collect all domains
    if (siteData.custom_domain) {
      domains.push(siteData.custom_domain);
    }
    if (siteData.domain_aliases && Array.isArray(siteData.domain_aliases)) {
      domains.push(...siteData.domain_aliases);
    }

    // Remove duplicates and sort
    const uniqueDomains = [...new Set(domains)].sort();

    console.log('✅ Netlify domains found:', {
      count: uniqueDomains.length,
      domains: uniqueDomains,
      custom_domain: siteData.custom_domain,
      domain_aliases: siteData.domain_aliases,
      site_name: siteData.name,
      site_url: siteData.url
    });

    if (uniqueDomains.length === 0) {
      console.log('ℹ️ No domains found in Netlify site');
      return true;
    }

    // Step 2: Check existing domains in Supabase
    console.log('🗄️ Step 2: Checking existing domains in Supabase...');
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/domains?select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      }
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      throw new Error(`Supabase API error: ${supabaseResponse.status} - ${errorText}`);
    }

    const existingDomains = await supabaseResponse.json();
    const existingDomainsMap = new Map();
    existingDomains.forEach(domain => {
      existingDomainsMap.set(domain.domain.toLowerCase(), domain);
    });

    console.log('✅ Existing Supabase domains:', {
      count: existingDomains.length,
      domains: existingDomains.map(d => ({ id: d.id, domain: d.domain, netlify_verified: d.netlify_verified }))
    });

    // Step 3: Add missing domains to Supabase
    console.log('➕ Step 3: Adding missing domains to Supabase...');
    
    const results = {
      added: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const domain of uniqueDomains) {
      const domainLower = domain.toLowerCase();
      const existingDomain = existingDomainsMap.get(domainLower);
      
      try {
        if (existingDomain) {
          // Update existing domain to mark as Netlify verified
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/domains?id=eq.${existingDomain.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseKey
            },
            body: JSON.stringify({
              status: 'verified',
              netlify_verified: true,
              dns_verified: true,
              ssl_status: 'issued',
              custom_domain: domain === siteData.custom_domain,
              updated_at: new Date().toISOString()
            })
          });

          if (updateResponse.ok) {
            results.updated.push({ domain, id: existingDomain.id });
            console.log(`🔄 Updated domain: ${domain}`);
          } else {
            const errorText = await updateResponse.text();
            throw new Error(`Update failed: ${errorText}`);
          }
        } else {
          // Add new domain
          const insertResponse = await fetch(`${supabaseUrl}/rest/v1/domains`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              domain: domain,
              user_id: '00000000-0000-0000-0000-000000000000', // Use a default user ID or admin ID
              status: 'verified',
              netlify_verified: true,
              dns_verified: true,
              ssl_status: 'issued',
              custom_domain: domain === siteData.custom_domain
            })
          });

          if (insertResponse.ok) {
            const [newDomain] = await insertResponse.json();
            results.added.push({ domain, id: newDomain.id });
            console.log(`➕ Added domain: ${domain}`);
          } else {
            const errorText = await insertResponse.text();
            throw new Error(`Insert failed: ${errorText}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing domain ${domain}:`, error.message);
        results.errors.push({ domain, error: error.message });
      }
    }

    // Step 4: Summary
    console.log('✅ Sync completed!');
    console.log('📊 Summary:', {
      total_domains: uniqueDomains.length,
      added: results.added.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      errors: results.errors.length
    });

    if (results.added.length > 0) {
      console.log('➕ Added domains:', results.added.map(r => r.domain));
    }
    if (results.updated.length > 0) {
      console.log('🔄 Updated domains:', results.updated.map(r => r.domain));
    }
    if (results.errors.length > 0) {
      console.log('❌ Errors:', results.errors);
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testNetlifyDomainsSync()
  .then(success => {
    console.log(success ? '✅ Test completed successfully!' : '❌ Test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
