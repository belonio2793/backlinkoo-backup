import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get the OpenAI API key from environment variables
    const openaiKey = process.env.OPENAI_API_KEY ||
                      process.env.VITE_OPENAI_API_KEY;

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not found in environment variables',
          available_vars: Object.keys(process.env).filter(key => 
            key.toLowerCase().includes('openai')
          )
        }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate the key format
    if (!openaiKey.startsWith('sk-')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid OpenAI API key format',
          key_prefix: openaiKey.substring(0, 10)
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ OpenAI API key retrieved: ${openaiKey.substring(0, 10)}...`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        api_key: openaiKey,
        key_length: openaiKey.length,
        key_prefix: openaiKey.substring(0, 10)
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error retrieving OpenAI API key:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config: Config = {
  path: "/api/get-openai-key"
};
