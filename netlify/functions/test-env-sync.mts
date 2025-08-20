import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context): Promise<Response> => {
  try {
    // Test all possible ways to access the Netlify token
    const tests = {
      netlify_env: Netlify.env.get('NETLIFY_ACCESS_TOKEN'),
      process_env: process.env.NETLIFY_ACCESS_TOKEN,
      context_env: context.clientContext?.environment?.NETLIFY_ACCESS_TOKEN,
      direct_check: typeof Netlify !== 'undefined' ? 'Netlify object available' : 'Netlify object not available'
    };

    // Check if we can access Netlify API
    let netlifyApiTest = null;
    if (tests.netlify_env) {
      try {
        const response = await fetch('https://api.netlify.com/api/v1/user', {
          headers: {
            'Authorization': `Bearer ${tests.netlify_env}`
          }
        });
        
        if (response.ok) {
          const user = await response.json();
          netlifyApiTest = {
            success: true,
            user_email: user.email,
            user_name: user.full_name
          };
        } else {
          netlifyApiTest = {
            success: false,
            status: response.status,
            error: await response.text()
          };
        }
      } catch (error) {
        netlifyApiTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      netlifyApiTest = {
        success: false,
        error: 'No NETLIFY_ACCESS_TOKEN found'
      };
    }

    // Get site information
    let siteInfo = null;
    if (tests.netlify_env) {
      try {
        const siteResponse = await fetch('https://api.netlify.com/api/v1/sites/ca6261e6-0a59-40b5-a2bc-5b5481ac8809', {
          headers: {
            'Authorization': `Bearer ${tests.netlify_env}`
          }
        });
        
        if (siteResponse.ok) {
          const site = await siteResponse.json();
          siteInfo = {
            name: site.name,
            url: site.url,
            custom_domain: site.custom_domain,
            ssl_url: site.ssl_url,
            domains: site.domain_aliases || []
          };
        }
      } catch (error) {
        siteInfo = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return new Response(JSON.stringify({
      message: 'Environment variable sync test',
      timestamp: new Date().toISOString(),
      environment_tests: tests,
      netlify_api_test: netlifyApiTest,
      site_info: siteInfo,
      recommendations: {
        working: tests.netlify_env ? 'NETLIFY_ACCESS_TOKEN accessible via Netlify.env.get()' : null,
        issue: !tests.netlify_env ? 'NETLIFY_ACCESS_TOKEN not accessible - check environment variable configuration' : null,
        action: !tests.netlify_env ? 'Set NETLIFY_ACCESS_TOKEN in Netlify dashboard or via DevServerControl' : 'Environment setup is working correctly'
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Environment test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/domains/test-env"
};
