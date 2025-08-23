import type { Context, Config } from "@netlify/functions";

interface ThemeSelectionRequest {
  domainId: string;
  domain: string;
  themeId: string;
}

interface ThemeSelectionResponse {
  success: boolean;
  message: string;
  error?: string;
}

const AVAILABLE_THEMES = [
  { id: 'minimal', name: 'Minimal Clean', description: 'Clean and simple design' },
  { id: 'modern', name: 'Modern Business', description: 'Professional business layout' },
  { id: 'elegant', name: 'Elegant Editorial', description: 'Magazine-style layout' },
  { id: 'tech', name: 'Tech Focus', description: 'Technology-focused design' }
];

export default async (req: Request, context: Context): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { domainId, domain, themeId }: ThemeSelectionRequest = await req.json();

    if (!domainId || !domain || !themeId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Domain ID, domain, and theme ID are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate theme exists
    const selectedTheme = AVAILABLE_THEMES.find(theme => theme.id === themeId);
    if (!selectedTheme) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid theme ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Setting theme for domain ${domain}: ${selectedTheme.name}`);

    // Get Supabase credentials for database updates
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database configuration not available'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update domain with selected theme
    try {
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/domains?id=eq.${domainId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          selected_theme: themeId,
          theme_name: selectedTheme.name,
          status: 'active',
          blog_enabled: true,
          updated_at: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Database update failed: ${errorText}`);
      }

      console.log(`Successfully set theme ${selectedTheme.name} for domain ${domain}`);

      // Optionally create domain_blog_themes entry if table exists
      try {
        await fetch(`${supabaseUrl}/rest/v1/domain_blog_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            domain_id: domainId,
            theme_id: themeId,
            theme_name: selectedTheme.name,
            theme_config: {
              description: selectedTheme.description,
              enabled_for_campaigns: true
            },
            created_at: new Date().toISOString()
          })
        });
      } catch (themeError) {
        console.warn('Could not create domain_blog_themes entry:', themeError);
        // Don't fail the main operation if this fails
      }

      const result: ThemeSelectionResponse = {
        success: true,
        message: `Successfully configured ${domain} with ${selectedTheme.name} theme. Domain is now ready for campaign blog generation.`
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      return new Response(JSON.stringify({
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Database update failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Theme selection error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Theme selection failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/set-domain-theme"
};
