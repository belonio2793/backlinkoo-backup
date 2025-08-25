import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
};

interface AddDomainRequest {
  action: 'add';
  domain: string;
  user_id?: string;
}

interface RemoveDomainRequest {
  action: 'remove';
  domain: string;
  user_id?: string;
}

interface SyncRequest {
  action: 'sync';
  user_id?: string;
}

type DomainRequest = AddDomainRequest | RemoveDomainRequest | SyncRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Netlify configuration
    const netlifyToken = Deno.env.get('NETLIFY_ACCESS_TOKEN');
    const netlifyaSiteId = Deno.env.get('NETLIFY_SITE_ID') || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    if (!netlifyToken) {
      throw new Error('Missing NETLIFY_ACCESS_TOKEN environment variable');
    }

    const netlifyHeaders = {
      'Authorization': `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Supabase-Edge-Function/1.0'
    };

    // Parse request body
    const requestBody: DomainRequest = await req.json();
    const { action, domain } = requestBody;

    console.log(`Processing ${action} request for domain: ${domain}`);

    switch (action) {
      case 'add':
        return await addDomain(supabase, netlifyHeaders, netlifyaSiteId, requestBody);
      
      case 'remove':
        return await removeDomain(supabase, netlifyHeaders, netlifyaSiteId, requestBody);
      
      case 'sync':
        return await syncDomains(supabase, netlifyHeaders, netlifyaSiteId, requestBody);
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid action. Must be "add", "remove", or "sync"' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function addDomain(
  supabase: any, 
  netlifyHeaders: Record<string, string>, 
  siteId: string, 
  request: AddDomainRequest
) {
  const { domain, user_id } = request;

  try {
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(domain)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid domain format'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if domain already exists in Supabase
    const { data: existingDomain } = await supabase
      .from('domains')
      .select('domain')
      .eq('domain', domain)
      .single();

    if (existingDomain) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Domain already exists'
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Add domain to Netlify
    const netlifyResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/domain_aliases`,
      {
        method: 'POST',
        headers: netlifyHeaders,
        body: JSON.stringify({ domain })
      }
    );

    let netlifyVerified = false;
    let errorMessage = null;

    if (netlifyResponse.ok) {
      netlifyVerified = true;
      console.log(`✅ Domain ${domain} added to Netlify successfully`);
    } else {
      const errorData = await netlifyResponse.text();
      errorMessage = `Netlify error: ${errorData}`;
      console.error(`❌ Failed to add domain ${domain} to Netlify:`, errorData);
    }

    // Add domain to Supabase regardless of Netlify success
    const { data: newDomain, error: supabaseError } = await supabase
      .from('domains')
      .insert({
        domain,
        user_id: user_id || null,
        status: netlifyVerified ? 'verified' : 'error',
        netlify_verified: netlifyVerified,
        dns_verified: false,
        custom_domain: true,
        ssl_status: 'none',
        error_message: errorMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase insert error:', supabaseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error: ${supabaseError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        domain: newDomain,
        netlify_verified: netlifyVerified,
        message: netlifyVerified 
          ? `Domain ${domain} added successfully` 
          : `Domain ${domain} added to database but failed to sync with Netlify`
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Add domain error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to add domain'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function removeDomain(
  supabase: any, 
  netlifyHeaders: Record<string, string>, 
  siteId: string, 
  request: RemoveDomainRequest
) {
  const { domain, user_id } = request;

  try {
    // Get domain from Supabase
    let query = supabase
      .from('domains')
      .select('*')
      .eq('domain', domain);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: existingDomain, error: fetchError } = await query.single();

    if (fetchError || !existingDomain) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Domain not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Remove from Netlify
    const netlifyResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/domain_aliases/${domain}`,
      {
        method: 'DELETE',
        headers: netlifyHeaders
      }
    );

    let netlifyRemoved = false;
    if (netlifyResponse.ok || netlifyResponse.status === 404) {
      netlifyRemoved = true;
      console.log(`✅ Domain ${domain} removed from Netlify`);
    } else {
      const errorData = await netlifyResponse.text();
      console.error(`❌ Failed to remove domain ${domain} from Netlify:`, errorData);
    }

    // Remove from Supabase
    const { error: deleteError } = await supabase
      .from('domains')
      .delete()
      .eq('id', existingDomain.id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error: ${deleteError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        domain: existingDomain,
        netlify_removed: netlifyRemoved,
        message: `Domain ${domain} removed successfully`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Remove domain error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to remove domain'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function syncDomains(
  supabase: any, 
  netlifyHeaders: Record<string, string>, 
  siteId: string, 
  request: SyncRequest
) {
  try {
    // Get all domains from Netlify
    const netlifyResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: 'GET',
        headers: netlifyHeaders
      }
    );

    if (!netlifyResponse.ok) {
      const errorData = await netlifyResponse.text();
      throw new Error(`Failed to fetch Netlify site info: ${errorData}`);
    }

    const siteData = await netlifyResponse.json();
    const netlifyDomains = [
      siteData.custom_domain,
      ...(siteData.domain_aliases || [])
    ].filter(Boolean);

    console.log(`Found ${netlifyDomains.length} domains in Netlify:`, netlifyDomains);

    // Get all domains from Supabase
    let query = supabase
      .from('domains')
      .select('*');

    if (request.user_id) {
      query = query.eq('user_id', request.user_id);
    }

    const { data: supabaseDomains, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch Supabase domains: ${fetchError.message}`);
    }

    const supabaseDomainNames = supabaseDomains?.map(d => d.domain) || [];
    console.log(`Found ${supabaseDomainNames.length} domains in Supabase:`, supabaseDomainNames);

    const syncResults = {
      total_netlify: netlifyDomains.length,
      total_supabase: supabaseDomainNames.length,
      in_sync: 0,
      added_to_supabase: 0,
      updated_in_supabase: 0
    };

    // Update Supabase domains with Netlify verification status
    for (const domain of supabaseDomains || []) {
      const isInNetlify = netlifyDomains.includes(domain.domain);
      
      if (domain.netlify_verified !== isInNetlify) {
        await supabase
          .from('domains')
          .update({
            netlify_verified: isInNetlify,
            status: isInNetlify ? 'verified' : 'error',
            updated_at: new Date().toISOString(),
            last_sync: new Date().toISOString()
          })
          .eq('id', domain.id);
        
        syncResults.updated_in_supabase++;
      } else {
        syncResults.in_sync++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sync_results: syncResults,
        netlify_domains: netlifyDomains,
        supabase_domains: supabaseDomainNames,
        message: 'Domain sync completed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Sync domains error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to sync domains'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
