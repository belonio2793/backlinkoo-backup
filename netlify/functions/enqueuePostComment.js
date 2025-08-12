const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const prompts = [
  "Write a short, one-sentence comment that expresses a positive or engaging opinion about {{keyword}}.",
  "In one sentence, give a casual, friendly remark about {{keyword}} that would fit in a social media conversation.",
  "Create a single-sentence comment about {{keyword}} that feels authentic and relevant.",
  "Write one concise, conversational comment that reacts to {{keyword}} in a relatable way.",
  "In one sentence, share a quick thought or reaction about {{keyword}} that would encourage further discussion."
];

function pickPrompt(keyword) {
  const p = prompts[Math.floor(Math.random() * prompts.length)];
  return p.replace(/{{keyword}}/g, keyword);
}

exports.handler = async (event, context) => {
  // Enable CORS
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
    const { campaign_id, candidate_url, anchor_text = '', name = 'Guest', email = 'noreply@example.com', keyword } = JSON.parse(event.body);
    
    if (!campaign_id || !candidate_url || !keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: campaign_id, candidate_url, keyword' }),
      };
    }

    // Generate comment using OpenAI
    let comment_text = '';
    
    if (OPENAI_KEY) {
      try {
        const prompt = pickPrompt(keyword);

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0.7,
            n: 1
          })
        });

        if (openaiRes.ok) {
          const openaiJson = await openaiRes.json();
          comment_text = (openaiJson.choices && openaiJson.choices[0].message.content || '').trim();
        } else {
          console.error('OpenAI API error:', await openaiRes.text());
          comment_text = `Great insights about ${keyword}! Thanks for sharing this valuable information.`;
        }
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError);
        comment_text = `Great insights about ${keyword}! Thanks for sharing this valuable information.`;
      }
    } else {
      // Fallback comment if no OpenAI key
      comment_text = `Great insights about ${keyword}! Thanks for sharing this valuable information.`;
    }

    // Update the backlink record with the generated comment (if it exists)
    const { data: existingBacklink, error: findError } = await supabase
      .from('backlinks')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('candidate_url', candidate_url)
      .single();

    if (existingBacklink) {
      // Update existing record
      await supabase
        .from('backlinks')
        .update({
          comment_text,
          anchor_text,
          indexed_status: 'pending'
        })
        .eq('id', existingBacklink.id);
    } else {
      // Create new backlink record
      await supabase.from('backlinks').insert([{
        campaign_id,
        candidate_url,
        anchor_text,
        comment_text,
        indexed_status: 'pending'
      }]);
    }

    // Enqueue post_comment job
    await supabase.from('jobs').insert([{
      job_type: 'post_comment',
      payload: {
        campaign_id,
        candidate_url,
        comment_text,
        anchor_text,
        name,
        email,
        keyword
      },
      status: 'queued'
    }]);

    // Log the event
    await supabase.from('campaign_logs').insert([{
      campaign_id,
      level: 'info',
      message: `Comment generated and queued for posting to ${candidate_url}`,
      meta: { candidate_url, comment_preview: comment_text.slice(0, 50) + '...' }
    }]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        comment_text,
        message: 'Comment generated and queued for posting'
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};
