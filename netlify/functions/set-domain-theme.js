/**
 * Set Domain Theme - Netlify Function
 * Configures a domain with a selected blog theme
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const AVAILABLE_THEMES = [
  { id: 'minimal', name: 'Minimal Clean', description: 'Clean and simple design' },
  { id: 'modern', name: 'Modern Business', description: 'Professional business layout' },
  { id: 'elegant', name: 'Elegant Editorial', description: 'Magazine-style layout' },
  { id: 'tech', name: 'Tech Focus', description: 'Technology-focused design' }
];

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    console.log('🎨 Set domain theme function called');

    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('📋 Request data:', { domainId: requestData.domainId, domain: requestData.domain, themeId: requestData.themeId });
      } catch (error) {
        console.error('❌ Invalid JSON in request body:', error);
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        };
      }
    }

    const { domainId, domain, themeId } = requestData;

    if (!domainId || !domain || !themeId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Domain ID, domain, and theme ID are required' 
        }),
      };
    }

    // Validate theme exists
    const selectedTheme = AVAILABLE_THEMES.find(theme => theme.id === themeId);
    if (!selectedTheme) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid theme ID' 
        }),
      };
    }

    console.log(`🎨 Setting theme for domain ${domain}: ${selectedTheme.name}`);

    // Get Supabase credentials for database updates
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🔑 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'none'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Database configuration not available'
        }),
      };
    }

    // Update domain with selected theme
    try {
      console.log('📊 Updating domain in database...');
      
      const updateData = {
        selected_theme: themeId,
        theme_name: selectedTheme.name,
        status: 'active',
        blog_enabled: true,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Update data:', updateData);

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/domains?id=eq.${domainId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify(updateData)
      });

      console.log(`📊 Database update response status: ${updateResponse.status}`);

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Database update failed:', errorText);
        throw new Error(`Database update failed: ${errorText}`);
      }

      console.log(`✅ Successfully set theme ${selectedTheme.name} for domain ${domain}`);

      // Optionally create domain_blog_themes entry if table exists
      try {
        console.log('📋 Creating domain blog theme entry...');
        
        await fetch(`${supabaseUrl}/rest/v1/domain_blog_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Prefer': 'resolution=ignore-duplicates'
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
        
        console.log('✅ Domain blog theme entry created');
      } catch (themeError) {
        console.warn('⚠️ Could not create domain_blog_themes entry:', themeError);
        // Don't fail the main operation if this fails
      }

      const result = {
        success: true,
        message: `Successfully configured ${domain} with ${selectedTheme.name} theme. Domain is now ready for campaign blog generation.`,
        theme: selectedTheme,
        domain: domain
      };

      console.log('✅ Returning success response:', result);

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };

    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: dbError instanceof Error ? dbError.message : 'Database update failed'
        }),
      };
    }

  } catch (error) {
    console.error('❌ Theme selection error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Theme selection failed'
      }),
    };
  }
};
