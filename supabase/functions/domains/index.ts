import { serve } from "https://deno.land/std/http/server.ts";

const NETLIFY_SITE_ID = Deno.env.get("NETLIFY_SITE_ID")!;
const NETLIFY_ACCESS_TOKEN = Deno.env.get("NETLIFY_ACCESS_TOKEN")!;

interface DomainRequest {
  action: "add" | "remove" | "list_dns" | "add_dns" | "delete_dns";
  domain?: string;
  txt_record_value?: string;
  record_id?: string;
  zone_id?: string;
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
        response = await removeDomain();
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
  
  const payload: any = { custom_domain: domain };
  
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
 * Remove custom domain (set to null)
 */
async function removeDomain(): Promise<Response> {
  console.log("➖ Removing custom domain");

  const response = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ custom_domain: null }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    action: "remove",
    data: {
      custom_domain: data.custom_domain,
      domain_aliases: data.domain_aliases,
      ssl_url: data.ssl_url,
      url: data.url,
    },
  }), { status: 200 });
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
