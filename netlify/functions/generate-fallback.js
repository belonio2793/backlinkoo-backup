/**
 * Intelligent Fallback Content Generation Netlify Function
 * Tries multiple providers in sequence for maximum reliability
 */

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  const attemptLog = [];
  const startTime = Date.now();

  try {
    const requestBody = JSON.parse(event.body);
    const { keyword, url } = requestBody;

    if (!keyword || !url) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: keyword and url' 
        })
      };
    }

    console.log('🚀 Starting intelligent fallback generation...', {
      keyword,
      url,
      timestamp: new Date().toISOString()
    });

    // Define provider order with randomization for load balancing
    const providers = ['openai', 'cohere'];
    
    // 70% chance to keep OpenAI first, 30% chance to randomize
    if (Math.random() > 0.7) {
      providers.sort(() => Math.random() - 0.5);
    }

    console.log('📋 Provider order:', providers);

    // Try each provider in sequence
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isLastAttempt = i === providers.length - 1;
      
      console.log(`🔄 Attempting provider ${i + 1}/${providers.length}: ${provider}`);

      try {
        // Call the specific provider function
        const providerUrl = `/.netlify/functions/generate-${provider}`;
        
        const response = await fetch(`${event.headers.host ? `https://${event.headers.host}` : 'http://localhost:8888'}${providerUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          timeout: 45000 // 45 second timeout per provider
        });

        const result = await response.json();
        
        // Log attempt
        attemptLog.push({
          provider,
          success: result.success,
          status: response.status,
          error: result.success ? null : result.error,
          timestamp: new Date().toISOString()
        });

        if (result.success && result.content) {
          console.log(`✅ Success with ${provider} on attempt ${i + 1}`);
          
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: true,
              content: result.content,
              provider: result.provider || provider,
              source: 'fallback',
              usage: result.usage || { tokens: 0, cost: 0 },
              attemptNumber: i + 1,
              fallbacksUsed: providers.slice(0, i),
              totalAttempts: i + 1,
              attemptLog,
              processingTime: Date.now() - startTime,
              timestamp: new Date().toISOString()
            })
          };
        } else {
          throw new Error(result.error || `${provider} generation failed`);
        }

      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        console.warn(`❌ ${provider} failed (attempt ${i + 1}):`, errorMessage);

        // Log failed attempt
        attemptLog.push({
          provider,
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        });

        // If this is the last attempt, fail completely
        if (isLastAttempt) {
          console.error('💀 All providers failed');
          
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              error: `All content providers failed. Last error: ${errorMessage}`,
              attemptLog,
              fallbacksUsed: providers.slice(0, -1),
              totalAttempts: providers.length,
              processingTime: Date.now() - startTime,
              timestamp: new Date().toISOString()
            })
          };
        }

        // Add exponential backoff between providers
        const backoffDelay = Math.min(1000 * Math.pow(2, i), 5000);
        console.log(`⏳ Waiting ${backoffDelay}ms before trying next provider...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    // This shouldn't be reached, but just in case
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Unexpected error in fallback logic',
        attemptLog,
        fallbacksUsed: providers,
        totalAttempts: providers.length,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Fallback function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        attemptLog,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      })
    };
  }
};
