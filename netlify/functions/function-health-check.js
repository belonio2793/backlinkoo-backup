/**
 * Function Health Check - Verify all campaign functions are working
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      environmentVariables: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      },
      dependencies: {},
      supabaseConnection: null,
      functions: []
    };

    // Check if dependencies are available
    try {
      const supabase = require('@supabase/supabase-js');
      results.dependencies['@supabase/supabase-js'] = '✅ Available';
    } catch (error) {
      results.dependencies['@supabase/supabase-js'] = `❌ Missing: ${error.message}`;
    }

    try {
      const openai = require('openai');
      results.dependencies['openai'] = '✅ Available';
    } catch (error) {
      results.dependencies['openai'] = `❌ Missing: ${error.message}`;
    }

    try {
      const fetch = require('node-fetch');
      results.dependencies['node-fetch'] = '✅ Available';
    } catch (error) {
      results.dependencies['node-fetch'] = `❌ Missing: ${error.message}`;
    }

    // Test Supabase connection
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // Test basic connection
        const { data, error } = await supabase
          .from('campaigns')
          .select('count')
          .limit(1);

        if (error) {
          results.supabaseConnection = `❌ Error: ${error.message}`;
        } else {
          results.supabaseConnection = '✅ Connected successfully';
        }
      } catch (error) {
        results.supabaseConnection = `❌ Connection failed: ${error.message}`;
      }
    } else {
      results.supabaseConnection = '❌ Missing environment variables';
    }

    // List available functions in this deployment
    const fs = require('fs');
    const path = require('path');
    
    try {
      const functionsDir = path.join(__dirname);
      const files = fs.readdirSync(functionsDir);
      
      results.functions = files
        .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
        .map(file => ({
          name: file,
          path: path.join(functionsDir, file),
          size: fs.statSync(path.join(functionsDir, file)).size
        }));
    } catch (error) {
      results.functions = [`❌ Error listing functions: ${error.message}`];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Function health check completed',
        data: results
      }),
    };

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Health check failed',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
