const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { slug, userId, userEmail } = JSON.parse(event.body);

    // Validate input
    if (!slug || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Missing slug or userId' })
      };
    }

    // Check user's current claimed posts count (limit of 5)
    const { data: userPosts, count, error: countError } = await supabase
      .from('published_blog_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_trial_post', false);

    if (countError) {
      console.error('Error checking user posts:', countError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Failed to check user posts limit' })
      };
    }

    if (count >= 5) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'User has reached the maximum limit of 5 claimed posts' 
        })
      };
    }

    // Check if the post exists and is available for claiming
    const { data: existingPost, error: fetchError } = await supabase
      .from('published_blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_trial_post', true)
      .is('user_id', null)
      .single();

    if (fetchError || !existingPost) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Blog post not found or already claimed' 
        })
      };
    }

    // Check if post has expired
    if (existingPost.expires_at && new Date() > new Date(existingPost.expires_at)) {
      return {
        statusCode: 410,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Blog post has expired and cannot be claimed' 
        })
      };
    }

    // Claim the post
    const { data: claimedPost, error: updateError } = await supabase
      .from('published_blog_posts')
      .update({ 
        user_id: userId, 
        expires_at: null,
        is_trial_post: false,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .eq('is_trial_post', true)
      .is('user_id', null)
      .select()
      .single();

    if (updateError) {
      console.error('Error claiming post:', updateError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Failed to claim blog post' })
      };
    }

    // Send confirmation email via Resend if email provided
    if (userEmail && process.env.RESEND_API_KEY) {
      try {
        await sendClaimConfirmationEmail(userEmail, claimedPost);
      } catch (emailError) {
        console.warn('Failed to send confirmation email:', emailError);
        // Don't fail the claim operation if email fails
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Blog post claimed successfully',
        claimedPost: claimedPost
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};

async function sendClaimConfirmationEmail(userEmail, claimedPost) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured');
    return;
  }

  const emailData = {
    from: 'no-reply@backlinkoo.com',
    to: userEmail,
    subject: 'Blog Post Successfully Claimed - Backlinkoo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 Congratulations! Your Blog Post Has Been Claimed</h2>
        
        <p>Great news! You've successfully claimed your blog post on Backlinkoo.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Blog Post Details:</h3>
          <p><strong>Title:</strong> ${claimedPost.title}</p>
          <p><strong>URL:</strong> <a href="${claimedPost.published_url}" style="color: #2563eb;">${claimedPost.published_url}</a></p>
          <p><strong>Target Website:</strong> ${claimedPost.target_url}</p>
          <p><strong>Word Count:</strong> ${claimedPost.word_count} words</p>
          <p><strong>Status:</strong> Permanently saved ✅</p>
        </div>
        
        <p>Your blog post is now permanently saved and will continue to provide SEO value to your website through its backlinks.</p>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0;"><strong>What's Next?</strong></p>
          <ul style="margin: 10px 0;">
            <li>Your backlink is now live and indexed</li>
            <li>Share your published blog post to increase its reach</li>
            <li>Create more backlinks to boost your SEO further</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="https://backlinkoo.com/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Dashboard</a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Thanks for using Backlinkoo!<br>
          <a href="https://backlinkoo.com" style="color: #2563eb;">https://backlinkoo.com</a>
        </p>
      </div>
    `
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status}`);
  }

  console.log('Claim confirmation email sent successfully');
}
