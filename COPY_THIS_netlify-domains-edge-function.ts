import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface NetlifyDomain {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const NETLIFY_SITE_ID = Deno.env.get('NETLIFY_SITE_ID') || "ca6261e6-0a59-40b5-a2bc-5b5481ac8809";
    const NETLIFY_ACCESS_TOKEN = Deno.env.get('NETLIFY_ACCESS_TOKEN') || "nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967";

    console.log(`🔍 Processing ${req.method} request to netlify-domains function`);

    if (req.method === 'GET') {
      // Fetch domains from Netlify API
      const url = `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/domains`;
      
      console.log(`📡 Fetching domains from: ${url}`);
      
      const resp = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`❌ Netlify API error: ${resp.status} - ${errorText}`);
        
        return new Response(
          JSON.stringify({
            error: `Netlify API error: ${resp.status}`,
            details: errorText
          }), 
          {
            status: resp.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const domains = await resp.json();
      console.log(`✅ Successfully fetched ${domains?.length || 0} domains from Netlify`);

      return new Response(
        JSON.stringify(domains), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      // Add domain to Netlify
      const { domain } = await req.json();
      
      if (!domain) {
        return new Response(
          JSON.stringify({ error: 'Domain name is required' }), 
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const url = `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/domains`;
      
      console.log(`📡 Adding domain ${domain} to Netlify site`);

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ domain })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`❌ Failed to add domain: ${resp.status} - ${errorText}`);
        
        return new Response(
          JSON.stringify({
            error: `Failed to add domain: ${resp.status}`,
            details: errorText
          }), 
          {
            status: resp.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const result = await resp.json();
      console.log(`✅ Successfully added domain ${domain} to Netlify`);

      return new Response(
        JSON.stringify(result), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'DELETE') {
      // Remove domain from Netlify
      const url = new URL(req.url);
      const domain = url.searchParams.get('domain');
      
      if (!domain) {
        return new Response(
          JSON.stringify({ error: 'Domain parameter is required' }), 
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const deleteUrl = `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/domains/${domain}`;
      
      console.log(`📡 Removing domain ${domain} from Netlify site`);

      const resp = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${NETLIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`❌ Failed to remove domain: ${resp.status} - ${errorText}`);
        
        return new Response(
          JSON.stringify({
            error: `Failed to remove domain: ${resp.status}`,
            details: errorText
          }), 
          {
            status: resp.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`✅ Successfully removed domain ${domain} from Netlify`);

      return new Response(
        JSON.stringify({ success: true, message: `Domain ${domain} removed successfully` }), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
