const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { action, ...params } = JSON.parse(event.body || '{}');
    
    console.log('📧 Smart Outreach request:', { action, params });

    switch (action) {
      case 'create_campaign':
        return await handleCreateCampaign(params, headers);
      case 'add_prospects':
        return await handleAddProspects(params, headers);
      case 'start_research':
        return await handleStartResearch(params, headers);
      case 'send_outreach':
        return await handleSendOutreach(params, headers);
      case 'process_follow_ups':
        return await handleProcessFollowUps(params, headers);
      case 'analyze_response':
        return await handleAnalyzeResponse(params, headers);
      case 'get_campaign_performance':
        return await handleGetCampaignPerformance(params, headers);
      case 'get_email_templates':
        return await handleGetEmailTemplates(params, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Smart Outreach error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};

async function handleCreateCampaign(params, headers) {
  const { 
    user_id,
    name,
    template_style = 'professional',
    personalization_level = 'medium',
    follow_up_enabled = true,
    follow_up_delays = [7, 14, 21],
    target_keywords,
    target_url,
    anchor_text,
    email_settings
  } = params;

  if (!user_id || !name || !target_keywords || !target_url || !anchor_text || !email_settings) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
  }

  console.log(`🎯 Creating outreach campaign: ${name}`);

  try {
    const campaignId = `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const campaignData = {
      campaign_id: campaignId,
      user_id,
      name,
      status: 'draft',
      template_style,
      personalization_level,
      follow_up_enabled,
      follow_up_delays,
      target_keywords: Array.isArray(target_keywords) ? target_keywords : [target_keywords],
      target_url,
      anchor_text,
      email_settings,
      stats: {
        emails_sent: 0,
        emails_delivered: 0,
        emails_opened: 0,
        emails_replied: 0,
        positive_responses: 0,
        negative_responses: 0,
        neutral_responses: 0,
        links_acquired: 0,
        response_rate: 0,
        conversion_rate: 0
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('outreach_campaigns')
      .insert(campaignData);

    if (error) {
      console.error('Failed to create outreach campaign:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        campaign: campaignData
      })
    };

  } catch (error) {
    console.error('Create campaign error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleAddProspects(params, headers) {
  const { campaign_id, prospects } = params;
  
  if (!campaign_id || !prospects || !Array.isArray(prospects)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Campaign ID and prospects array are required' })
    };
  }

  console.log(`👥 Adding ${prospects.length} prospects to campaign: ${campaign_id}`);

  try {
    const processedProspects = prospects.map(prospect => ({
      prospect_id: `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id,
      domain: prospect.domain,
      url: prospect.url,
      contact_name: prospect.contact_name,
      contact_email: prospect.contact_email,
      contact_title: prospect.contact_title,
      company_name: prospect.company_name,
      prospect_research: {
        website_analysis: {
          accepts_guest_posts: false,
          has_contact_page: false,
          recent_posts: [],
          posting_frequency: 'unknown',
          content_style: 'unknown',
          audience_size: 0
        },
        contact_research: {
          social_profiles: [],
          recent_activity: [],
          interests: [],
          writing_topics: [],
          influence_score: 0
        },
        business_context: {
          company_size: 'unknown',
          industry: 'unknown',
          recent_news: [],
          competitors: [],
          market_position: 'unknown'
        },
        ai_insights: {
          personality_type: 'unknown',
          communication_style: 'unknown',
          pain_points: [],
          motivations: [],
          best_approach: 'unknown'
        }
      },
      outreach_status: 'discovered',
      response_status: 'none',
      link_acquired: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Store prospects
    const { error } = await supabase
      .from('outreach_prospects')
      .insert(processedProspects);

    if (error) {
      console.error('Failed to add prospects:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Start research for each prospect
    for (const prospect of processedProspects) {
      // Queue research job (would be async in production)
      setTimeout(() => {
        performProspectResearch(prospect.prospect_id);
      }, Math.random() * 5000); // Spread out research requests
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        prospects: processedProspects,
        count: processedProspects.length
      })
    };

  } catch (error) {
    console.error('Add prospects error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleStartResearch(params, headers) {
  const { prospect_id } = params;
  
  if (!prospect_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Prospect ID is required' })
    };
  }

  try {
    const research = await performProspectResearch(prospect_id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research
      })
    };

  } catch (error) {
    console.error('Start research error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleSendOutreach(params, headers) {
  const { prospect_id, email_type = 'initial', custom_message } = params;
  
  if (!prospect_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Prospect ID is required' })
    };
  }

  console.log(`📧 Sending ${email_type} outreach to prospect: ${prospect_id}`);

  try {
    // Get prospect and campaign data
    const { data: prospect, error: prospectError } = await supabase
      .from('outreach_prospects')
      .select(`
        *,
        outreach_campaigns!inner(*)
      `)
      .eq('prospect_id', prospect_id)
      .single();

    if (prospectError || !prospect) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Prospect not found' })
      };
    }

    const campaign = prospect.outreach_campaigns;

    // Generate personalized email
    const emailContent = generatePersonalizedEmail(
      prospect,
      campaign,
      email_type,
      custom_message
    );

    // Send email (simulated)
    const emailResult = await sendEmail(
      campaign.email_settings,
      prospect.contact_email,
      emailContent.subject,
      emailContent.content
    );

    if (!emailResult.success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: emailResult.error })
      };
    }

    // Create email record
    const outreachEmail = {
      email_id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prospect_id,
      email_type,
      subject: emailContent.subject,
      content: emailContent.content,
      personalization_data: emailContent.personalization_data,
      sent_at: new Date().toISOString(),
      status: 'sent',
      provider_email_id: emailResult.email_id
    };

    // Store email
    await supabase
      .from('outreach_emails')
      .insert(outreachEmail);

    // Update prospect status
    const newStatus = email_type === 'initial' ? 'initial_sent' : 
                     email_type === 'follow_up_1' ? 'follow_up_1' :
                     email_type === 'follow_up_2' ? 'follow_up_2' : 'follow_up_3';

    const nextFollowUpDelay = campaign.follow_up_delays[
      email_type === 'initial' ? 0 :
      email_type === 'follow_up_1' ? 1 :
      email_type === 'follow_up_2' ? 2 : null
    ];

    await supabase
      .from('outreach_prospects')
      .update({ 
        outreach_status: newStatus,
        last_contact_at: new Date().toISOString(),
        next_follow_up_at: nextFollowUpDelay && campaign.follow_up_enabled
          ? new Date(Date.now() + nextFollowUpDelay * 24 * 60 * 60 * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString()
      })
      .eq('prospect_id', prospect_id);

    // Update campaign stats
    await updateCampaignStats(campaign.campaign_id, { emails_sent: 1 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email: outreachEmail
      })
    };

  } catch (error) {
    console.error('Send outreach error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleProcessFollowUps(params, headers) {
  console.log('🤖 Processing automated follow-ups');

  try {
    // Get prospects ready for follow-up
    const { data: prospects, error } = await supabase
      .from('outreach_prospects')
      .select(`
        *,
        outreach_campaigns!inner(*)
      `)
      .in('outreach_status', ['initial_sent', 'follow_up_1', 'follow_up_2'])
      .lte('next_follow_up_at', new Date().toISOString())
      .eq('outreach_campaigns.follow_up_enabled', true);

    if (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    let processed = 0;
    const results = [];

    for (const prospect of prospects || []) {
      try {
        const followUpType = getNextFollowUpType(prospect.outreach_status);
        if (followUpType) {
          const result = await handleSendOutreach({
            prospect_id: prospect.prospect_id,
            email_type: followUpType
          }, headers);
          
          const resultData = JSON.parse(result.body);
          if (resultData.success) {
            processed++;
            results.push({
              prospect_id: prospect.prospect_id,
              email_type: followUpType,
              status: 'sent'
            });
          }
        }
      } catch (error) {
        console.error(`Failed to send follow-up to ${prospect.prospect_id}:`, error);
        results.push({
          prospect_id: prospect.prospect_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        processed,
        total_prospects: prospects?.length || 0,
        results
      })
    };

  } catch (error) {
    console.error('Process follow-ups error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleAnalyzeResponse(params, headers) {
  const { prospect_id, response_content } = params;
  
  if (!prospect_id || !response_content) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Prospect ID and response content are required' })
    };
  }

  console.log(`🧠 Analyzing response for prospect: ${prospect_id}`);

  try {
    // AI-powered response analysis (simulated)
    const analysis = performResponseAnalysis(response_content);

    // Update prospect with response data
    await supabase
      .from('outreach_prospects')
      .update({ 
        response_status: analysis.response_type,
        response_data: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('prospect_id', prospect_id);

    // Update campaign stats based on response type
    const { data: prospect } = await supabase
      .from('outreach_prospects')
      .select('campaign_id')
      .eq('prospect_id', prospect_id)
      .single();

    if (prospect) {
      const statUpdate = analysis.response_type === 'positive' 
        ? { positive_responses: 1, emails_replied: 1 }
        : analysis.response_type === 'negative'
        ? { negative_responses: 1, emails_replied: 1 }
        : { neutral_responses: 1, emails_replied: 1 };

      await updateCampaignStats(prospect.campaign_id, statUpdate);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis
      })
    };

  } catch (error) {
    console.error('Response analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleGetCampaignPerformance(params, headers) {
  const { campaign_id } = params;
  
  if (!campaign_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Campaign ID is required' })
    };
  }

  try {
    // Get campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('campaign_id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Campaign not found' })
      };
    }

    // Get prospects
    const { data: prospects, error: prospectsError } = await supabase
      .from('outreach_prospects')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('created_at', { ascending: false });

    if (prospectsError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: prospectsError.message })
      };
    }

    // Get recent emails
    const { data: recentEmails, error: emailsError } = await supabase
      .from('outreach_emails')
      .select(`
        *,
        outreach_prospects!inner(campaign_id)
      `)
      .eq('outreach_prospects.campaign_id', campaign_id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (emailsError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: emailsError.message })
      };
    }

    // Calculate analytics
    const analytics = calculateCampaignAnalytics(prospects || [], recentEmails || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        performance: {
          campaign,
          prospects: prospects || [],
          recent_emails: recentEmails || [],
          analytics
        }
      })
    };

  } catch (error) {
    console.error('Get campaign performance error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

async function handleGetEmailTemplates(params, headers) {
  const { template_style, email_type } = params;

  try {
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('success_rate', { ascending: false });

    if (template_style) {
      query = query.eq('style', template_style);
    }

    if (email_type) {
      query = query.eq('type', email_type);
    }

    const { data: templates, error } = await query;

    if (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        templates: templates || []
      })
    };

  } catch (error) {
    console.error('Get email templates error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
}

// Helper functions

async function performProspectResearch(prospectId) {
  console.log(`🔍 Starting research for prospect: ${prospectId}`);

  try {
    // Get prospect data
    const { data: prospect, error } = await supabase
      .from('outreach_prospects')
      .select('*')
      .eq('prospect_id', prospectId)
      .single();

    if (error || !prospect) {
      throw new Error('Prospect not found');
    }

    // Update status to researching
    await supabase
      .from('outreach_prospects')
      .update({ outreach_status: 'researching' })
      .eq('prospect_id', prospectId);

    // Simulate research (in production, this would use various APIs)
    const research = {
      website_analysis: {
        accepts_guest_posts: Math.random() > 0.4,
        has_contact_page: Math.random() > 0.2,
        recent_posts: [
          'AI in Modern Marketing',
          'Best SEO Practices',
          'Content Strategy Guide'
        ],
        posting_frequency: 'weekly',
        content_style: 'professional',
        audience_size: Math.floor(Math.random() * 100000) + 5000
      },
      contact_research: {
        social_profiles: [
          `https://twitter.com/${prospect.contact_name?.toLowerCase().replace(' ', '')}`,
          `https://linkedin.com/in/${prospect.contact_name?.toLowerCase().replace(' ', '-')}`
        ],
        recent_activity: [
          'Posted about digital marketing trends',
          'Shared article on content strategy',
          'Attended marketing conference'
        ],
        interests: ['digital marketing', 'content creation', 'SEO'],
        writing_topics: ['marketing automation', 'growth hacking', 'brand building'],
        influence_score: Math.floor(Math.random() * 100) + 1
      },
      business_context: {
        company_size: 'medium',
        industry: 'marketing',
        recent_news: ['Product launch', 'Team expansion', 'Partnership announcement'],
        competitors: ['competitor1.com', 'competitor2.com'],
        market_position: 'growing'
      },
      ai_insights: {
        personality_type: 'analytical',
        communication_style: 'professional but approachable',
        pain_points: ['time management', 'lead generation', 'content creation'],
        motivations: ['growth', 'efficiency', 'thought leadership'],
        best_approach: 'value-first with specific examples'
      }
    };

    // Update prospect with research data
    await supabase
      .from('outreach_prospects')
      .update({ 
        prospect_research: research,
        outreach_status: 'ready_to_contact',
        updated_at: new Date().toISOString()
      })
      .eq('prospect_id', prospectId);

    return research;

  } catch (error) {
    console.error('Prospect research error:', error);
    // Update status to failed
    await supabase
      .from('outreach_prospects')
      .update({ outreach_status: 'discovered' })
      .eq('prospect_id', prospectId);
    
    throw error;
  }
}

function generatePersonalizedEmail(prospect, campaign, emailType, customMessage) {
  const research = prospect.prospect_research;
  const contactName = prospect.contact_name || 'there';
  const companyName = prospect.company_name || prospect.domain;

  // Generate subject based on style
  const subjects = {
    friendly: `Hey ${contactName}, loved your recent article!`,
    professional: `Partnership opportunity for ${companyName}`,
    collaborative: `Quick collaboration idea for ${contactName}`,
    authoritative: `Proven strategy that could help ${companyName}`,
    casual: `Quick question about ${companyName}`,
    academic: `Research collaboration opportunity`
  };

  const subject = subjects[campaign.template_style] || subjects.professional;

  // Generate content based on personalization level
  let content = '';

  if (customMessage) {
    content = customMessage;
  } else {
    const templates = {
      basic: `Hi ${contactName},

I hope this email finds you well. I came across ${companyName} and was impressed by the quality of your content.

I'm reaching out because I believe we could create value for your audience through a collaboration. I've written extensively about ${campaign.target_keywords.join(', ')} and would love to contribute to your platform.

Would you be interested in discussing a potential guest post opportunity?

Best regards,
${campaign.email_settings.from_name}`,

      medium: `Hi ${contactName},

I just read your article "${research.website_analysis.recent_posts[0] || 'your recent content'}" and found your insights on ${campaign.target_keywords[0]} particularly valuable.

As someone who specializes in ${campaign.target_keywords.join(' and ')}, I've been following ${companyName}'s content strategy and believe there's a great opportunity for collaboration.

I'd love to contribute a guest post that builds on your recent themes while providing fresh insights for your ${research.website_analysis.audience_size?.toLocaleString() || 'growing'} audience.

Would you be open to a brief discussion about this?

Best regards,
${campaign.email_settings.from_name}`,

      high: `Hi ${contactName},

Your recent work on "${research.website_analysis.recent_posts[0] || 'digital marketing'}" caught my attention, especially your perspective on ${research.contact_research.writing_topics[0] || campaign.target_keywords[0]}. It aligns perfectly with some research I've been conducting.

I noticed ${companyName} has been focusing on ${research.business_context.industry || 'your industry'} content, and given your ${research.website_analysis.posting_frequency || 'regular'} publishing schedule, you might be interested in a collaboration.

I specialize in ${campaign.target_keywords.join(', ')} and have helped companies similar to yours achieve significant results. I'd love to share some insights that could benefit your audience while contributing to your content goals.

The piece I have in mind would complement your existing content on ${research.contact_research.writing_topics?.join(' and ') || campaign.target_keywords.join(' and ')}.

Would you be interested in a quick 10-minute call to discuss this opportunity?

Best regards,
${campaign.email_settings.from_name}
${campaign.email_settings.signature || ''}`,

      ai_deep: `Hi ${contactName},

I've been following your work at ${companyName}, particularly your insights on ${research.contact_research.writing_topics[0] || campaign.target_keywords[0]}. Your ${research.ai_insights.communication_style || 'professional'} approach really resonates with the ${research.business_context.industry || 'marketing'} community.

Given your focus on ${research.ai_insights.motivations?.join(' and ') || 'growth and efficiency'}, I believe you'd be interested in some research I've been conducting around ${campaign.target_keywords[0]}. It directly addresses the ${research.ai_insights.pain_points[0] || 'challenges'} you mentioned in your recent content.

I specialize in helping ${research.business_context.company_size || 'medium-sized'} companies like ${companyName} achieve ${research.ai_insights.motivations[0] || 'their goals'} through strategic ${campaign.target_keywords.join(' and ')} implementations.

Based on your ${research.ai_insights.best_approach || 'value-first approach'}, I think a collaboration would be mutually beneficial. I have a comprehensive piece that would fit perfectly with your audience's interests in ${research.contact_research.interests?.join(' and ') || campaign.target_keywords.join(' and ')}.

Would you be open to a brief conversation about this opportunity?

Best regards,
${campaign.email_settings.from_name}
${campaign.email_settings.signature || ''}`
    };

    content = templates[campaign.personalization_level] || templates.medium;
  }

  const personalizationData = {
    contact_name: contactName,
    company_name: companyName,
    recent_post: research.website_analysis.recent_posts[0],
    audience_size: research.website_analysis.audience_size,
    writing_topics: research.contact_research.writing_topics,
    personalization_level: campaign.personalization_level,
    template_style: campaign.template_style
  };

  return { subject, content, personalization_data };
}

async function sendEmail(emailSettings, toEmail, subject, content) {
  try {
    console.log(`📧 Sending email to: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    
    // In production, this would integrate with actual email providers:
    // - Gmail API
    // - Outlook API
    // - SMTP
    // - Resend
    // - SendGrid
    
    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate delivery tracking
      setTimeout(() => {
        console.log(`✅ Email delivered: ${emailId}`);
      }, Math.random() * 5000);
      
      return { success: true, email_id: emailId };
    } else {
      return { success: false, error: 'Email delivery failed' };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getNextFollowUpType(currentStatus) {
  switch (currentStatus) {
    case 'initial_sent':
      return 'follow_up_1';
    case 'follow_up_1':
      return 'follow_up_2';
    case 'follow_up_2':
      return 'follow_up_3';
    default:
      return null;
  }
}

function performResponseAnalysis(responseContent) {
  // Simulate AI response analysis
  const sentiment = Math.random() * 2 - 1; // -1 to 1
  const isPositive = sentiment > 0.2;
  const isNegative = sentiment < -0.2;
  
  // Keywords that indicate positive response
  const positiveKeywords = ['interested', 'yes', 'sounds good', 'love to', 'excited', 'perfect'];
  const negativeKeywords = ['not interested', 'no thank you', 'decline', 'busy', 'already have'];
  
  const contentLower = responseContent.toLowerCase();
  const hasPositiveKeywords = positiveKeywords.some(keyword => contentLower.includes(keyword));
  const hasNegativeKeywords = negativeKeywords.some(keyword => contentLower.includes(keyword));
  
  let responseType = 'neutral';
  if (hasPositiveKeywords || isPositive) responseType = 'positive';
  if (hasNegativeKeywords || isNegative) responseType = 'negative';
  
  return {
    response_type: responseType,
    response_content: responseContent,
    sentiment_score: sentiment,
    intent_analysis: {
      interested: responseType === 'positive',
      requires_follow_up: responseType !== 'negative',
      specific_requirements: responseType === 'positive' ? ['guest post guidelines', 'content calendar'] : [],
      timeline: responseType === 'positive' ? 'within 2 weeks' : 'not specified'
    },
    extracted_data: {
      contact_preferences: ['email'],
      submission_guidelines: responseType === 'positive' ? ['1500 words', 'original content', 'author bio'] : [],
      content_requirements: responseType === 'positive' ? ['actionable insights', 'case studies', 'data-driven'] : []
    },
    next_action: responseType === 'positive' ? 'send content proposal' : 
                responseType === 'negative' ? 'mark as not interested' : 'wait for clarification'
  };
}

async function updateCampaignStats(campaignId, updates) {
  try {
    // Get current stats
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('stats')
      .eq('campaign_id', campaignId)
      .single();

    if (campaign) {
      const currentStats = campaign.stats;
      const newStats = { ...currentStats };

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (key in newStats) {
          newStats[key] += updates[key];
        }
      });

      // Recalculate rates
      newStats.response_rate = newStats.emails_sent > 0 
        ? ((newStats.emails_replied / newStats.emails_sent) * 100)
        : 0;
      
      newStats.conversion_rate = newStats.emails_sent > 0
        ? ((newStats.links_acquired / newStats.emails_sent) * 100)
        : 0;

      // Update campaign
      await supabase
        .from('outreach_campaigns')
        .update({ stats: newStats })
        .eq('campaign_id', campaignId);
    }
  } catch (error) {
    console.error('Failed to update campaign stats:', error);
  }
}

function calculateCampaignAnalytics(prospects, emails) {
  const totalProspects = prospects.length;
  const contactedProspects = prospects.filter(p => p.outreach_status !== 'discovered').length;
  const respondedProspects = prospects.filter(p => p.response_status !== 'none').length;
  const positiveResponses = prospects.filter(p => p.response_status === 'positive').length;
  const linksAcquired = prospects.filter(p => p.link_acquired).length;

  return {
    total_prospects: totalProspects,
    contacted_prospects: contactedProspects,
    response_rate: contactedProspects > 0 ? (respondedProspects / contactedProspects) * 100 : 0,
    positive_response_rate: contactedProspects > 0 ? (positiveResponses / contactedProspects) * 100 : 0,
    conversion_rate: contactedProspects > 0 ? (linksAcquired / contactedProspects) * 100 : 0,
    total_emails_sent: emails.length,
    avg_response_time: '2.3 days',
    best_performing_template: 'collaborative',
    optimal_send_time: '10:00 AM',
    open_rate: Math.floor(Math.random() * 30) + 50, // 50-80%
    click_rate: Math.floor(Math.random() * 10) + 5, // 5-15%
    bounce_rate: Math.floor(Math.random() * 5) + 1 // 1-6%
  };
}
