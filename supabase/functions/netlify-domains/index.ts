import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const netlifyToken = Deno.env.get("NETLIFY_ACCESS_TOKEN");
    const headers = {
      Authorization: `Bearer ${netlifyToken}`,
      "User-Agent": "SupabaseEdgeFunction"
    };

    const { data: domains, error: fetchError } = await supabase
      .from("domains")
      .select("name, site_id, status")
      .eq("source", "supabase")
      .in("status", ["pending", "active"]);

    if (fetchError) throw fetchError;

    if (!domains?.length) {
      return new Response(JSON.stringify({
        message: "No domains to sync"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    for (const domain of domains) {
      if (!domain.site_id) {
        continue; // Skip if no site_id
      }

      const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${domain.site_id}`, {
        headers
      });

      if (!siteRes.ok) throw new Error(`Failed to fetch site ${domain.site_id}`);

      const site = await siteRes.json();
      const existingDomains = [
        site.custom_domain,
        ...(site.domain_aliases || [])
      ].filter(Boolean);

      if (!existingDomains.includes(domain.name)) {
        const payload = {
          domain: domain.name
        };

        const addRes = await fetch(`https://api.netlify.com/api/v1/sites/${domain.site_id}/domain_aliases`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!addRes.ok) {
          const errorText = await addRes.text();
          throw new Error(`Failed to add ${domain.name} to ${domain.site_id}: ${errorText}`);
        }

        await supabase
          .from("domains")
          .update({
            status: "active",
            updated_at: new Date().toISOString()
          })
          .eq("name", domain.name);
      }
    }

    return new Response(JSON.stringify({
      message: "Domains synced to Netlify",
      count: domains.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
