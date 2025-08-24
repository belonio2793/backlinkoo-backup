import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const NETLIFY_SITE_ID = Deno.env.get("NETLIFY_SITE_ID")!;
const NETLIFY_ACCESS_TOKEN = Deno.env.get("NETLIFY_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DomainRequest {
  action: "add" | "remove" | "list_dns" | "add_dns" | "delete_dns" | "sync" | "validate" | "sync_all";
  domain?: string;
  txt_record_value?: string;
  record_id?: string;
  zone_id?: string;
}

interface DomainValidation {
  domain_exists_in_netlify: boolean;
  is_custom_domain: boolean;
  is_domain_alias: boolean;
  dns_records_found: boolean;
  ssl_configured: boolean;
  validation_status: 'valid' | 'not_configured' | 'pending' | 'error';
  cname_found?: boolean;
  a_record_found?: boolean;
  propagation_status?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { action, domain, txt_record_value, record_id, zone_id }: DomainRequest = await req.json();

    console.log(`🚀 Domain action: ${action} for domain: ${domain}`);

    let response: Response;

    switch (action) {
      case "add":
        response = await addDomain(domain!, txt_record_value);
        break;
      
      case "remove":
        response = await removeDomain(domain!);
        break;
      
      case "list_dns":
        response = await listDNSZones();
        break;
      
      case "add_dns":
        response = await addDNSRecord(zone_id!, domain!);
        break;
      
      case "delete_dns":
        response = await deleteDNSRecord(zone_id!, record_id!);
        break;

      case "sync":
        response = await syncFromNetlify();
        break;

      case "sync_all":
        response = await syncAllDomains();
        break;

      case "validate":
        response = await validateDomain(domain!);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err) {
    console.error("❌ Domain management error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message || "Unknown error occurred" 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

/**
 * Add or update a custom domain for the Netlify site
 */
async function addDomain(domain: string, txt_record_value?: string): Promise<Response> {
  console.log(`➕ Adding domain: ${domain}`);
  
  // Get current site to add as alias
  const currentSiteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
    },
  });

  if (!currentSiteResponse.ok) {
    throw new Error(`Failed to get current site: ${currentSiteResponse.status}`);
  }

  const currentSite = await currentSiteResponse.json();
  const existingAliases = currentSite.domain_aliases || [];

  // Check if domain already exists
  if (existingAliases.includes(domain)) {
    return new Response(JSON.stringify({
      success: true,
      action: "add",
      domain,
      message: "Domain already exists as alias",
      data: {
        custom_domain: currentSite.custom_domain,
        domain_aliases: existingAliases,
        ssl_url: currentSite.ssl_url,
        url: currentSite.url,
      },
    }), { status: 200 });
  }

  // Add domain to aliases
  const updatedAliases = [...existingAliases, domain];
  
  const payload: any = { domain_aliases: updatedAliases };
  
  if (txt_record_value) {
    payload.txt_record_value = txt_record_value;
  }

  const response = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    action: "add",
    domain,
    data: {
      custom_domain: data.custom_domain,
      domain_aliases: data.domain_aliases,
      ssl_url: data.ssl_url,
      url: data.url,
    },
  }), { status: 200 });
}

/**
 * Remove domain from aliases
 */
async function removeDomain(domain: string): Promise<Response> {
  console.log(`➖ Removing domain: ${domain}`);

  // Get current site
  const currentSiteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
    },
  });

  if (!currentSiteResponse.ok) {
    throw new Error(`Failed to get current site: ${currentSiteResponse.status}`);
  }

  const currentSite = await currentSiteResponse.json();
  const existingAliases = currentSite.domain_aliases || [];

  // Remove domain from aliases
  const updatedAliases = existingAliases.filter((alias: string) => alias !== domain);

  const response = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain_aliases: updatedAliases }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    action: "remove",
    domain,
    data: {
      custom_domain: data.custom_domain,
      domain_aliases: data.domain_aliases,
      ssl_url: data.ssl_url,
      url: data.url,
    },
  }), { status: 200 });
}

/**
 * Sync domains from Netlify to database
 */
async function syncFromNetlify(): Promise<Response> {
  console.log("🔄 Syncing domains from Netlify...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get current site info from Netlify
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to get Netlify site: ${siteResponse.status}`);
    }

    const siteData = await siteResponse.json();
    const netlifyDomains = [];

    // Add custom domain if exists
    if (siteData.custom_domain) {
      netlifyDomains.push(siteData.custom_domain);
    }

    // Add domain aliases
    if (siteData.domain_aliases && Array.isArray(siteData.domain_aliases)) {
      netlifyDomains.push(...siteData.domain_aliases);
    }

    console.log(`📋 Found ${netlifyDomains.length} domains in Netlify`);

    let syncedCount = 0;

    // Sync each domain to database
    for (const domain of netlifyDomains) {
      try {
        // Check if domain exists in database
        const { data: existingDomain } = await supabase
          .from('domains')
          .select('id')
          .eq('domain', domain)
          .single();

        if (!existingDomain) {
          // Add new domain to database
          const { error: insertError } = await supabase
            .from('domains')
            .insert({
              domain: domain,
              user_id: '00000000-0000-0000-0000-000000000000',
              status: 'dns_ready',
              netlify_verified: true,
              netlify_site_id: NETLIFY_SITE_ID,
              is_global: true,
              created_by: 'netlify_sync'
            });

          if (!insertError) {
            syncedCount++;
            console.log(`✅ Synced domain: ${domain}`);
          } else {
            console.warn(`⚠️ Failed to sync ${domain}:`, insertError.message);
          }
        } else {
          // Update existing domain
          const { error: updateError } = await supabase
            .from('domains')
            .update({
              netlify_verified: true,
              netlify_site_id: NETLIFY_SITE_ID,
              status: 'dns_ready'
            })
            .eq('domain', domain);

          if (!updateError) {
            console.log(`🔄 Updated domain: ${domain}`);
          }
        }
      } catch (domainError) {
        console.warn(`⚠️ Error processing ${domain}:`, domainError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action: "sync",
      synced: syncedCount,
      total_netlify_domains: netlifyDomains.length,
      domains: netlifyDomains,
    }), { status: 200 });

  } catch (error) {
    console.error("❌ Sync error:", error);
    return new Response(JSON.stringify({
      success: false,
      action: "sync",
      error: error.message,
    }), { status: 500 });
  }
}

/**
 * Validate domain DNS configuration
 */
async function validateDomain(domain: string): Promise<Response> {
  console.log(`🔍 Validating domain: ${domain}`);

  try {
    const validation: DomainValidation = {
      domain_exists_in_netlify: false,
      is_custom_domain: false,
      is_domain_alias: false,
      dns_records_found: false,
      ssl_configured: false,
      validation_status: 'pending'
    };

    // Check if domain exists in Netlify
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      
      validation.domain_exists_in_netlify = 
        siteData.custom_domain === domain || 
        (siteData.domain_aliases && siteData.domain_aliases.includes(domain));
      
      validation.is_custom_domain = siteData.custom_domain === domain;
      validation.is_domain_alias = siteData.domain_aliases && siteData.domain_aliases.includes(domain);
      
      // Check SSL status
      if (validation.domain_exists_in_netlify) {
        validation.ssl_configured = !!siteData.ssl_url;
      }
    }

    // Perform DNS lookup to check records
    try {
      const dnsResult = await performDNSLookup(domain);
      validation.dns_records_found = dnsResult.records_found;
      validation.cname_found = dnsResult.cname_found;
      validation.a_record_found = dnsResult.a_record_found;
      validation.propagation_status = dnsResult.propagation_status;
    } catch (dnsError) {
      console.warn(`⚠️ DNS lookup failed for ${domain}:`, dnsError);
    }

    // Determine overall validation status
    if (validation.domain_exists_in_netlify && validation.dns_records_found && validation.ssl_configured) {
      validation.validation_status = 'valid';
    } else if (validation.domain_exists_in_netlify && validation.dns_records_found) {
      validation.validation_status = 'pending';
    } else if (validation.domain_exists_in_netlify) {
      validation.validation_status = 'not_configured';
    } else {
      validation.validation_status = 'error';
    }

    const isValidated = validation.validation_status === 'valid';

    return new Response(JSON.stringify({
      success: true,
      action: "validate",
      domain,
      validated: isValidated,
      validation,
      message: isValidated 
        ? `Domain ${domain} is fully configured and validated`
        : `Domain ${domain} needs DNS configuration or is still propagating`
    }), { status: 200 });

  } catch (error) {
    console.error(`❌ Validation error for ${domain}:`, error);
    return new Response(JSON.stringify({
      success: false,
      action: "validate",
      domain,
      error: error.message,
    }), { status: 500 });
  }
}

/**
 * Perform DNS lookup for domain validation
 */
async function performDNSLookup(domain: string) {
  console.log(`🔍 Performing DNS lookup for: ${domain}`);

  try {
    // Use Google DNS API for lookup
    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const dnsData = await dnsResponse.json();
    
    const result = {
      records_found: false,
      cname_found: false,
      a_record_found: false,
      propagation_status: 'unknown'
    };

    if (dnsData.Status === 0 && dnsData.Answer) {
      result.records_found = true;
      
      // Check for A records pointing to Netlify IPs
      const netlifyIPs = ['75.2.60.5', '99.83.190.102'];
      const aRecords = dnsData.Answer.filter((record: any) => record.type === 1);
      
      if (aRecords.length > 0) {
        result.a_record_found = true;
        const hasNetlifyIP = aRecords.some((record: any) => 
          netlifyIPs.includes(record.data)
        );
        if (hasNetlifyIP) {
          result.propagation_status = 'propagated';
        }
      }

      // Check for CNAME records
      const cnameRecords = dnsData.Answer.filter((record: any) => record.type === 5);
      if (cnameRecords.length > 0) {
        result.cname_found = true;
        const hasNetlifyCNAME = cnameRecords.some((record: any) => 
          record.data.includes('netlify.app')
        );
        if (hasNetlifyCNAME) {
          result.propagation_status = 'propagated';
        }
      }
    }

    // Also check CNAME specifically for www subdomain
    if (domain.indexOf('.') > 0 && !domain.startsWith('www.')) {
      try {
        const wwwResponse = await fetch(
          `https://dns.google/resolve?name=www.${domain}&type=CNAME`,
          {
            headers: {
              'Accept': 'application/dns-json',
            },
          }
        );
        const wwwData = await wwwResponse.json();
        
        if (wwwData.Status === 0 && wwwData.Answer) {
          const cnameRecords = wwwData.Answer.filter((record: any) => record.type === 5);
          if (cnameRecords.some((record: any) => record.data.includes('netlify.app'))) {
            result.cname_found = true;
          }
        }
      } catch (wwwError) {
        console.warn('Failed to check www CNAME:', wwwError);
      }
    }

    return result;
  } catch (error) {
    console.error('DNS lookup error:', error);
    throw new Error(`DNS lookup failed: ${error.message}`);
  }
}

/**
 * Sync all domains (bulk operation)
 */
async function syncAllDomains(): Promise<Response> {
  console.log("🔄 Performing bulk domain sync...");
  
  // This is essentially the same as syncFromNetlify but with additional logging
  return await syncFromNetlify();
}

/**
 * List DNS zones for the account
 */
async function listDNSZones(): Promise<Response> {
  console.log("📋 Listing DNS zones");

  const response = await fetch("https://api.netlify.com/api/v1/dns_zones", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    action: "list_dns",
    data: data,
  }), { status: 200 });
}

/**
 * Add a CNAME DNS record
 */
async function addDNSRecord(zone_id: string, domain: string): Promise<Response> {
  console.log(`➕ Adding DNS record for domain: ${domain} in zone: ${zone_id}`);

  const response = await fetch(`https://api.netlify.com/api/v1/dns_zones/${zone_id}/dns_records`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CNAME",
      hostname: domain,
      value: `${NETLIFY_SITE_ID}.netlify.app`,
      ttl: 3600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    action: "add_dns",
    domain,
    zone_id,
    data: data,
  }), { status: 200 });
}

/**
 * Delete a DNS record
 */
async function deleteDNSRecord(zone_id: string, record_id: string): Promise<Response> {
  console.log(`➖ Deleting DNS record: ${record_id} in zone: ${zone_id}`);

  const response = await fetch(`https://api.netlify.com/api/v1/dns_zones/${zone_id}/dns_records/${record_id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
  }

  return new Response(JSON.stringify({
    success: true,
    action: "delete_dns",
    zone_id,
    record_id,
  }), { status: 200 });
}
