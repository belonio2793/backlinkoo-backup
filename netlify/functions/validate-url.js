// URL Validation Function - Tests URLs for accessibility and features
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url, checkForms = false, checkContact = false } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    const startTime = Date.now();
    let validationResult = {
      url: url,
      accessible: false,
      response_time: 0,
      http_status: 0,
      has_forms: false,
      has_contact: false,
      error: null
    };

    try {
      // Validate URL format
      const urlObj = new URL(url);
      
      // Simple HEAD request to check if URL is accessible
      // In production, you might want to use a service like Puppeteer for full validation
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkDiscoveryBot/1.0)',
        },
        timeout: 10000, // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      validationResult = {
        ...validationResult,
        accessible: response.ok,
        response_time: responseTime,
        http_status: response.status
      };

      // If we need to check for forms or contact info, we'd need to fetch the content
      if ((checkForms || checkContact) && response.ok) {
        try {
          const contentResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; LinkDiscoveryBot/1.0)',
            },
            timeout: 15000,
          });
          
          if (contentResponse.ok) {
            const content = await contentResponse.text();
            
            if (checkForms) {
              // Simple check for form elements
              validationResult.has_forms = content.includes('<form') || 
                                         content.includes('comment') || 
                                         content.includes('submit');
            }
            
            if (checkContact) {
              // Simple check for contact information
              validationResult.has_contact = content.includes('contact') || 
                                           content.includes('@') || 
                                           content.includes('email');
            }
          }
        } catch (contentError) {
          // Content fetch failed, but basic accessibility check passed
          console.log('Content check failed but URL is accessible:', contentError.message);
        }
      }

    } catch (error) {
      validationResult.error = error.message;
      validationResult.response_time = Date.now() - startTime;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(validationResult),
    };

  } catch (error) {
    console.error('URL validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Validation failed'
      }),
    };
  }
};
