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

// Netlify configuration (using your actual values)
const NETLIFY_SITE_ID = "ca6261e6-0a59-40b5-a2bc-5b5481ac8809";
const NETLIFY_ACCESS_TOKEN = "nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967";
const NETLIFY_API = `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/domains`;

// Supabase configuration (from environment)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      console.log(`📡 Fetching domains from: ${NETLIFY_API}`);

      const resp = await fetch(NETLIFY_API, {
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

      // Sync domains to Supabase
      try {
        for (const domain of domains) {
          await supabase.from("domains").upsert(
            {
              name: domain.name || domain.domain,
              site_id: NETLIFY_SITE_ID,
              source: "netlify",
              status: domain.state === "verified" ? "verified" : "unverified"
            },
            { onConflict: "name" }
          );
        }
        console.log(`✅ Synced ${domains.length} domains to Supabase`);
      } catch (syncError) {
        console.warn('⚠️ Failed to sync to Supabase:', syncError);
        // Continue and return domains even if sync fails
      }

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

      console.log(`📡 Adding domain ${domain} to Netlify site`);

      const resp = await fetch(NETLIFY_API, {
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

      // Sync to Supabase if domain was added successfully
      try {
        await supabase.from("domains").upsert({
          name: domain,
          site_id: NETLIFY_SITE_ID,
          source: "netlify",
          status: result.state === "verified" ? "verified" : "unverified"
        });
        console.log(`✅ Synced new domain ${domain} to Supabase`);
      } catch (syncError) {
        console.warn('⚠️ Failed to sync new domain to Supabase:', syncError);
        // Continue and return result even if sync fails
      }

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

      const deleteUrl = `${NETLIFY_API}/${domain}`;

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

      // Remove from Supabase if deletion was successful
      try {
        await supabase.from("domains").delete().eq("name", domain);
        console.log(`✅ Removed domain ${domain} from Supabase`);
      } catch (syncError) {
        console.warn('⚠️ Failed to remove domain from Supabase:', syncError);
        // Continue and return success even if sync fails
      }

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
