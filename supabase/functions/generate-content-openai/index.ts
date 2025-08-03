// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OpenAIRequest {
  keyword: string;
  anchorText: string;
  url: string;
  wordCount?: number;
  contentType?: string;
  tone?: string;
  selectedPrompt?: string;
  promptIndex?: number;
}

interface OpenAIResponse {
  success: boolean;
  content?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
  error?: string;
  prompt?: string;
  promptIndex?: number;
  provider: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { keyword, anchorText, url, wordCount = 1000, contentType = 'comprehensive', tone = 'professional', selectedPrompt, promptIndex }: OpenAIRequest = await req.json();

    // Validate required fields
    if (!keyword || !url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: keyword and url are required',
          provider: 'supabase-openai'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured in Supabase environment',
          provider: 'supabase-openai'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Define the 3 prompt templates
    const promptTemplates = [
      `Generate a ${wordCount} word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}`,
      `Write a ${wordCount} word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}`,
      `Produce a ${wordCount}-word blog post on {{keyword}} that links {{anchor_text}}`
    ];

    // Use provided prompt or select random one
    let finalPrompt: string;
    let usedPromptIndex: number;
    
    if (selectedPrompt && promptIndex !== undefined) {
      finalPrompt = selectedPrompt;
      usedPromptIndex = promptIndex;
    } else {
      usedPromptIndex = Math.floor(Math.random() * promptTemplates.length);
      finalPrompt = promptTemplates[usedPromptIndex]
        .replace('{{keyword}}', keyword)
        .replace('{{anchor_text}}', anchorText || keyword)
        .replace('{{url}}', url);
    }

    const systemPrompt = `You are an expert SEO content writer with deep specialization in "${keyword}". You create high-quality, engaging blog posts that rank well in search engines specifically for "${keyword}" topics. Focus on step-by-step instructions, practical tips, and actionable advice specifically about "${keyword}". Use ${tone} tone throughout the article. Always create original, valuable content that genuinely helps readers with "${keyword}" and ensures natural, contextual backlink integration. NEVER use generic business language - everything must be specific to "${keyword}".`;

    const userPrompt = `Create a comprehensive ${wordCount}-word ${contentType} blog post SPECIFICALLY about "${keyword}" that naturally incorporates a backlink. You must demonstrate deep expertise in "${keyword}" - NOT generic content.

CONTENT REQUIREMENTS:
- Write exactly ${wordCount} words of high-quality, original content SPECIFICALLY about "${keyword}"
- Focus exclusively on "${keyword}" as the main topic - show expert knowledge
- Include practical, actionable advice specific to "${keyword}"
- Structure with proper headings (H1, H2, H3) all related to "${keyword}"
- Natural integration of anchor text "${anchorText || keyword}" linking to ${url}
- AVOID generic business phrases - be specific to "${keyword}"

CONTENT STRUCTURE:
1. Compelling H1 title with the primary keyword "${keyword}"
2. Engaging introduction that hooks the reader with "${keyword}" insights
3. 4-6 main sections with H2 headings about different aspects of "${keyword}"
4. Subsections with H3 headings about specific "${keyword}" topics
5. Natural placement of backlink: "${anchorText || keyword}" → ${url}
6. Strong conclusion with actionable takeaways for "${keyword}"

SEO OPTIMIZATION:
- Include primary keyword "${keyword}" naturally throughout
- Use semantic keywords and related terms specific to "${keyword}"
- Include numbered lists or bullet points about "${keyword}"

BACKLINK INTEGRATION:
- Place the backlink "${anchorText || keyword}" naturally within the "${keyword}" content
- Make the link contextually relevant to the surrounding "${keyword}" text
- Ensure it adds value to the reader learning about "${keyword}"

OUTPUT FORMAT:
Return the content as HTML with proper tags:
- Use <h1> for main title about "${keyword}"
- Use <h2> for main sections about "${keyword}"
- Use <h3> for subsections about "${keyword}"
- Use <p> for paragraphs
- Use <ul>/<ol> and <li> for lists related to "${keyword}"
- Use <strong> for emphasis
- Use <a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText || keyword}</a> for the backlink

Focus on creating valuable, informative content that genuinely helps readers with "${keyword}".`;

    console.log('🚀 Starting OpenAI generation via Supabase Edge Function...');
    console.log(`Using prompt template ${usedPromptIndex + 1}: ${finalPrompt}`);

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BacklinkooBot/2.0-Supabase'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: Math.min(4000, Math.floor(wordCount * 2.5)),
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `OpenAI API error: ${response.status}`;
      
      if (errorData.error?.message) {
        errorMessage += ` - ${errorData.error.message}`;
      }

      console.error('❌ OpenAI API error:', errorMessage);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          provider: 'supabase-openai',
          prompt: finalPrompt,
          promptIndex: usedPromptIndex,
          timestamp: new Date().toISOString()
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No content generated from OpenAI',
          provider: 'supabase-openai',
          prompt: finalPrompt,
          promptIndex: usedPromptIndex,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const content = data.choices[0].message.content;

    if (!content || content.trim().length < 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Generated content is too short or empty',
          provider: 'supabase-openai',
          prompt: finalPrompt,
          promptIndex: usedPromptIndex,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tokens = data.usage.total_tokens;
    const cost = tokens * 0.000002; // Approximate cost for gpt-3.5-turbo

    console.log('✅ OpenAI generation successful via Supabase:', {
      contentLength: content.length,
      tokens,
      cost: `$${cost.toFixed(4)}`,
      promptUsed: usedPromptIndex + 1
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        provider: 'supabase-openai',
        content,
        usage: {
          tokens,
          cost
        },
        prompt: finalPrompt,
        promptIndex: usedPromptIndex,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Supabase OpenAI Edge Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        provider: 'supabase-openai',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
