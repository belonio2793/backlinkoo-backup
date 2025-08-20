/**
 * Netlify Function to manage custom domains using the official Netlify API
 * This provides a secure server-side interface for adding/removing custom domains
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Health check endpoint
    if (event.queryStringParameters?.health === 'check') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Netlify Custom Domain API is running',
          timestamp: new Date().toISOString(),
          environment: {
            hasToken: !!process.env.NETLIFY_ACCESS_TOKEN,
            hasSiteId: !!process.env.NETLIFY_SITE_ID,
            tokenLength: process.env.NETLIFY_ACCESS_TOKEN?.length || 0
          }
        }),
      };
    }

    // Check required environment variables
    const token = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    if (!token) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'NETLIFY_ACCESS_TOKEN not configured',
          message: 'Please configure NETLIFY_ACCESS_TOKEN in environment variables'
        }),
      };
    }

    const { httpMethod, body: requestBody } = event;
    let requestData = {};

    // Parse request body for POST/PUT requests
    if (requestBody) {
      try {
        requestData = JSON.parse(requestBody);
      } catch (error) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body'
          }),
        };
      }
    }

    const baseUrl = 'https://api.netlify.com/api/v1';

    switch (httpMethod) {
      case 'GET':
        // Get current site information
        const siteResponse = await fetch(`${baseUrl}/sites/${siteId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!siteResponse.ok) {
          const errorText = await siteResponse.text();
          return {
            statusCode: siteResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: `Failed to get site info: ${siteResponse.status} ${siteResponse.statusText}`,
              details: errorText
            }),
          };
        }

        const siteData = await siteResponse.json();
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: siteData
          }),
        };

      case 'POST':
        // Add custom domain
        const { domain, txt_record_value } = requestData;

        if (!domain) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Domain is required'
            }),
          };
        }

        // Validate domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        if (!domainRegex.test(domain)) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Invalid domain format'
            }),
          };
        }

        // Prepare the payload for Netlify API
        const payload = { custom_domain: domain };
        if (txt_record_value) {
          payload.txt_record_value = txt_record_value;
        }

        console.log(`🚀 Adding custom domain ${domain} to Netlify site ${siteId}...`);

        // Make the PATCH request to update the site with custom domain
        const addResponse = await fetch(`${baseUrl}/sites/${siteId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!addResponse.ok) {
          const errorData = await addResponse.text();
          let errorMessage = `${addResponse.status} ${addResponse.statusText}`;
          
          try {
            const errorJson = JSON.parse(errorData);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch {
            // Use text error if JSON parsing fails
            if (errorData) {
              errorMessage = errorData;
            }
          }

          return {
            statusCode: addResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: `Failed to add custom domain: ${errorMessage}`
            }),
          };
        }

        const updatedSite = await addResponse.json();
        console.log('✅ Custom domain added to Netlify:', updatedSite);

        // Generate setup instructions
        const isSubdomain = domain.split('.').length > 2;
        const instructions = {
          title: isSubdomain ? 'Subdomain Setup Required' : 'Root Domain Setup Required',
          steps: isSubdomain ? [
            `Custom domain ${domain} has been added to your Netlify site`,
            'You need to verify ownership by adding a TXT record to your DNS',
            'Add the required TXT record to your DNS settings',
            'Wait for DNS propagation (usually 5-30 minutes)',
            'Netlify will automatically provision an SSL certificate once verified'
          ] : [
            `Custom domain ${domain} has been added to your Netlify site`,
            'Configure your DNS with the following records:',
            'Add A records pointing to Netlify\'s load balancer',
            'Wait for DNS propagation (can take up to 48 hours)',
            'Netlify will automatically provision an SSL certificate once DNS is verified'
          ],
          dnsRecords: isSubdomain ? [
            {
              type: 'TXT',
              name: domain,
              value: 'netlify-verification-code-here',
              ttl: 300
            },
            {
              type: 'CNAME',
              name: domain.split('.')[0],
              value: `${siteId}.netlify.app`,
              ttl: 3600
            }
          ] : [
            {
              type: 'A',
              name: '@',
              value: '75.2.60.5',
              ttl: 3600
            },
            {
              type: 'CNAME',
              name: 'www',
              value: `${siteId}.netlify.app`,
              ttl: 3600
            }
          ]
        };

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: updatedSite,
            instructions
          }),
        };

      case 'DELETE':
        // Remove custom domain
        console.log(`🗑️ Removing custom domain from Netlify site ${siteId}...`);

        const removeResponse = await fetch(`${baseUrl}/sites/${siteId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ custom_domain: '' }),
        });

        if (!removeResponse.ok) {
          const errorData = await removeResponse.text();
          return {
            statusCode: removeResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: `Failed to remove custom domain: ${removeResponse.status} ${removeResponse.statusText}`,
              details: errorData
            }),
          };
        }

        const updatedSiteAfterRemoval = await removeResponse.json();
        console.log('✅ Custom domain removed from Netlify');

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: updatedSiteAfterRemoval
          }),
        };

      default:
        return {
          statusCode: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
          }),
        };
    }

  } catch (error) {
    console.error('❌ Error in netlify-custom-domain function:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
    };
  }
};
