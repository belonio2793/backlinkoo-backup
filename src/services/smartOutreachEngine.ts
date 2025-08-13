/**
 * Smart Outreach Engine
 * AI-powered personalized email outreach with automated follow-ups
 */

import { supabase } from '@/integrations/supabase/client';

export interface OutreachCampaign {
  id: string;
  user_id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  template_style: TemplateStyle;
  personalization_level: PersonalizationLevel;
  follow_up_enabled: boolean;
  follow_up_delays: number[]; // Days between follow-ups
  target_keywords: string[];
  target_url: string;
  anchor_text: string;
  email_settings: EmailSettings;
  created_at: string;
  stats: OutreachStats;
}

export type TemplateStyle = 
  | 'friendly'
  | 'professional'
  | 'authoritative'
  | 'collaborative'
  | 'casual'
  | 'academic';

export type PersonalizationLevel = 
  | 'basic'      // Name + Company
  | 'medium'     // + Recent content
  | 'high'       // + Social research
  | 'ai_deep';   // + AI-powered deep research

export interface EmailSettings {
  from_name: string;
  from_email: string;
  reply_to?: string;
  signature: string;
  email_provider: 'gmail' | 'outlook' | 'smtp' | 'resend';
  credentials?: {
    smtp_host?: string;
    smtp_port?: number;
    smtp_username?: string;
    smtp_password?: string;
    api_key?: string;
  };
}

export interface OutreachStats {
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_replied: number;
  positive_responses: number;
  negative_responses: number;
  neutral_responses: number;
  links_acquired: number;
  response_rate: number;
  conversion_rate: number;
}

export interface OutreachProspect {
  id: string;
  campaign_id: string;
  domain: string;
  url: string;
  contact_name?: string;
  contact_email: string;
  contact_title?: string;
  company_name?: string;
  
  // Research data
  prospect_research: ProspectResearch;
  
  // Outreach tracking
  outreach_status: OutreachStatus;
  emails_sent: OutreachEmail[];
  last_contact_at?: string;
  next_follow_up_at?: string;
  
  // Results
  response_status: 'none' | 'positive' | 'negative' | 'neutral' | 'bounce';
  response_data?: ResponseData;
  link_acquired: boolean;
  link_url?: string;
  
  created_at: string;
  updated_at: string;
}

export type OutreachStatus = 
  | 'discovered'
  | 'researching'
  | 'ready_to_contact'
  | 'initial_sent'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'follow_up_3'
  | 'completed'
  | 'paused'
  | 'blacklisted';

export interface ProspectResearch {
  website_analysis: {
    accepts_guest_posts: boolean;
    has_contact_page: boolean;
    recent_posts: string[];
    posting_frequency: string;
    content_style: string;
    audience_size: number;
  };
  contact_research: {
    social_profiles: string[];
    recent_activity: string[];
    interests: string[];
    writing_topics: string[];
    influence_score: number;
  };
  business_context: {
    company_size: string;
    industry: string;
    recent_news: string[];
    competitors: string[];
    market_position: string;
  };
  ai_insights: {
    personality_type: string;
    communication_style: string;
    pain_points: string[];
    motivations: string[];
    best_approach: string;
  };
}

export interface OutreachEmail {
  id: string;
  prospect_id: string;
  email_type: 'initial' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3' | 'custom';
  subject: string;
  content: string;
  personalization_data: Record<string, any>;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  email_id?: string; // From email provider
  tracking_data?: any;
}

export interface ResponseData {
  response_type: 'positive' | 'negative' | 'neutral' | 'auto_reply';
  response_content: string;
  sentiment_score: number;
  intent_analysis: {
    interested: boolean;
    requires_follow_up: boolean;
    specific_requirements: string[];
    timeline: string;
  };
  extracted_data: {
    contact_preferences: string[];
    submission_guidelines: string[];
    content_requirements: string[];
  };
  next_action: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'initial' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3';
  style: TemplateStyle;
  subject_template: string;
  content_template: string;
  personalization_fields: string[];
  variables: string[];
  success_rate: number;
  created_at: string;
}

export class SmartOutreachEngine {
  
  /**
   * Create a new outreach campaign
   */
  static async createCampaign(
    campaign: Omit<OutreachCampaign, 'id' | 'created_at' | 'stats'>
  ): Promise<{
    success: boolean;
    campaign?: OutreachCampaign;
    error?: string;
  }> {
    try {
      const campaignId = `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newCampaign: OutreachCampaign = {
        id: campaignId,
        ...campaign,
        created_at: new Date().toISOString(),
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
        }
      };

      const { error } = await supabase
        .from('outreach_campaigns')
        .insert({
          campaign_id: campaignId,
          user_id: campaign.user_id,
          name: campaign.name,
          status: campaign.status,
          template_style: campaign.template_style,
          personalization_level: campaign.personalization_level,
          follow_up_enabled: campaign.follow_up_enabled,
          follow_up_delays: campaign.follow_up_delays,
          target_keywords: campaign.target_keywords,
          target_url: campaign.target_url,
          anchor_text: campaign.anchor_text,
          email_settings: campaign.email_settings,
          stats: newCampaign.stats
        });

      if (error) {
        console.error('Failed to create outreach campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, campaign: newCampaign };

    } catch (error: any) {
      console.error('Create campaign error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add prospects to a campaign
   */
  static async addProspects(
    campaignId: string,
    prospects: Omit<OutreachProspect, 'id' | 'campaign_id' | 'created_at' | 'updated_at' | 'outreach_status' | 'emails_sent' | 'response_status' | 'link_acquired'>[]
  ): Promise<{
    success: boolean;
    prospects?: OutreachProspect[];
    error?: string;
  }> {
    try {
      const processedProspects: OutreachProspect[] = prospects.map(prospect => ({
        id: `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaign_id: campaignId,
        ...prospect,
        outreach_status: 'discovered',
        emails_sent: [],
        response_status: 'none',
        link_acquired: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Store prospects
      const { error } = await supabase
        .from('outreach_prospects')
        .insert(
          processedProspects.map(prospect => ({
            prospect_id: prospect.id,
            campaign_id: prospect.campaign_id,
            domain: prospect.domain,
            url: prospect.url,
            contact_name: prospect.contact_name,
            contact_email: prospect.contact_email,
            contact_title: prospect.contact_title,
            company_name: prospect.company_name,
            prospect_research: prospect.prospect_research,
            outreach_status: prospect.outreach_status,
            response_status: prospect.response_status,
            link_acquired: prospect.link_acquired
          }))
        );

      if (error) {
        console.error('Failed to add prospects:', error);
        return { success: false, error: error.message };
      }

      // Start research for each prospect
      for (const prospect of processedProspects) {
        await this.startProspectResearch(prospect.id);
      }

      return { success: true, prospects: processedProspects };

    } catch (error: any) {
      console.error('Add prospects error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start prospect research
   */
  static async startProspectResearch(prospectId: string): Promise<{
    success: boolean;
    research?: ProspectResearch;
    error?: string;
  }> {
    try {
      console.log(`🔍 Starting research for prospect: ${prospectId}`);

      // Get prospect data
      const { data: prospect, error } = await supabase
        .from('outreach_prospects')
        .select('*')
        .eq('prospect_id', prospectId)
        .single();

      if (error || !prospect) {
        return { success: false, error: 'Prospect not found' };
      }

      // Update status to researching
      await supabase
        .from('outreach_prospects')
        .update({ outreach_status: 'researching' })
        .eq('prospect_id', prospectId);

      // Perform research (simulated for demo)
      const research = await this.performProspectResearch(prospect);

      // Update prospect with research data
      await supabase
        .from('outreach_prospects')
        .update({ 
          prospect_research: research,
          outreach_status: 'ready_to_contact',
          updated_at: new Date().toISOString()
        })
        .eq('prospect_id', prospectId);

      return { success: true, research };

    } catch (error: any) {
      console.error('Prospect research error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send initial outreach email
   */
  static async sendInitialOutreach(
    prospectId: string,
    customMessage?: string
  ): Promise<{
    success: boolean;
    email?: OutreachEmail;
    error?: string;
  }> {
    try {
      console.log(`📧 Sending initial outreach to prospect: ${prospectId}`);

      // Get prospect and campaign data
      const { data: prospect, error: prospectError } = await supabase
        .from('outreach_prospects')
        .select(`
          *,
          outreach_campaigns!inner(*)
        `)
        .eq('prospect_id', prospectId)
        .single();

      if (prospectError || !prospect) {
        return { success: false, error: 'Prospect not found' };
      }

      const campaign = prospect.outreach_campaigns;

      // Generate personalized email
      const emailContent = await this.generatePersonalizedEmail(
        prospect,
        campaign,
        'initial',
        customMessage
      );

      // Send email
      const emailResult = await this.sendEmail(
        campaign.email_settings,
        prospect.contact_email,
        emailContent.subject,
        emailContent.content,
        emailContent.personalization_data
      );

      if (!emailResult.success) {
        return { success: false, error: emailResult.error };
      }

      // Create email record
      const outreachEmail: OutreachEmail = {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prospect_id: prospectId,
        email_type: 'initial',
        subject: emailContent.subject,
        content: emailContent.content,
        personalization_data: emailContent.personalization_data,
        sent_at: new Date().toISOString(),
        status: 'sent',
        email_id: emailResult.email_id
      };

      // Store email
      await supabase
        .from('outreach_emails')
        .insert({
          email_id: outreachEmail.id,
          prospect_id: prospectId,
          email_type: outreachEmail.email_type,
          subject: outreachEmail.subject,
          content: outreachEmail.content,
          personalization_data: outreachEmail.personalization_data,
          sent_at: outreachEmail.sent_at,
          status: outreachEmail.status,
          provider_email_id: emailResult.email_id
        });

      // Update prospect status
      await supabase
        .from('outreach_prospects')
        .update({ 
          outreach_status: 'initial_sent',
          last_contact_at: new Date().toISOString(),
          next_follow_up_at: campaign.follow_up_enabled 
            ? new Date(Date.now() + campaign.follow_up_delays[0] * 24 * 60 * 60 * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString()
        })
        .eq('prospect_id', prospectId);

      // Update campaign stats
      await this.updateCampaignStats(campaign.campaign_id, { emails_sent: 1 });

      return { success: true, email: outreachEmail };

    } catch (error: any) {
      console.error('Send initial outreach error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process automated follow-ups
   */
  static async processAutomatedFollowUps(): Promise<{
    success: boolean;
    processed?: number;
    error?: string;
  }> {
    try {
      console.log('🤖 Processing automated follow-ups');

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
        return { success: false, error: error.message };
      }

      let processed = 0;

      for (const prospect of prospects || []) {
        try {
          const followUpType = this.getNextFollowUpType(prospect.outreach_status);
          if (followUpType) {
            const result = await this.sendFollowUpEmail(prospect.prospect_id, followUpType);
            if (result.success) {
              processed++;
            }
          }
        } catch (error) {
          console.error(`Failed to send follow-up to ${prospect.prospect_id}:`, error);
        }
      }

      return { success: true, processed };

    } catch (error: any) {
      console.error('Process follow-ups error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze email response
   */
  static async analyzeResponse(
    prospectId: string,
    responseContent: string
  ): Promise<{
    success: boolean;
    analysis?: ResponseData;
    error?: string;
  }> {
    try {
      console.log(`🧠 Analyzing response for prospect: ${prospectId}`);

      // AI-powered response analysis (simulated)
      const analysis = await this.performResponseAnalysis(responseContent);

      // Update prospect with response data
      await supabase
        .from('outreach_prospects')
        .update({ 
          response_status: analysis.response_type,
          response_data: analysis,
          updated_at: new Date().toISOString()
        })
        .eq('prospect_id', prospectId);

      // Update campaign stats based on response type
      const { data: prospect } = await supabase
        .from('outreach_prospects')
        .select('campaign_id')
        .eq('prospect_id', prospectId)
        .single();

      if (prospect) {
        const statUpdate = analysis.response_type === 'positive' 
          ? { positive_responses: 1 }
          : analysis.response_type === 'negative'
          ? { negative_responses: 1 }
          : { neutral_responses: 1 };

        await this.updateCampaignStats(prospect.campaign_id, statUpdate);
      }

      return { success: true, analysis };

    } catch (error: any) {
      console.error('Response analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get campaign performance
   */
  static async getCampaignPerformance(campaignId: string): Promise<{
    success: boolean;
    performance?: {
      campaign: OutreachCampaign;
      prospects: OutreachProspect[];
      recent_emails: OutreachEmail[];
      analytics: any;
    };
    error?: string;
  }> {
    try {
      // Get campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (campaignError || !campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Get prospects
      const { data: prospects, error: prospectsError } = await supabase
        .from('outreach_prospects')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (prospectsError) {
        return { success: false, error: prospectsError.message };
      }

      // Get recent emails
      const { data: recentEmails, error: emailsError } = await supabase
        .from('outreach_emails')
        .select(`
          *,
          outreach_prospects!inner(campaign_id)
        `)
        .eq('outreach_prospects.campaign_id', campaignId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (emailsError) {
        return { success: false, error: emailsError.message };
      }

      // Calculate analytics
      const analytics = this.calculateCampaignAnalytics(prospects || [], recentEmails || []);

      return {
        success: true,
        performance: {
          campaign: campaign as OutreachCampaign,
          prospects: prospects || [],
          recent_emails: recentEmails || [],
          analytics
        }
      };

    } catch (error: any) {
      console.error('Get campaign performance error:', error);
      return { success: false, error: error.message };
    }
  }

  // Private helper methods

  private static async performProspectResearch(prospect: any): Promise<ProspectResearch> {
    // Simulate AI-powered research (in production, this would use various APIs)
    return {
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
  }

  private static async generatePersonalizedEmail(
    prospect: any,
    campaign: any,
    emailType: string,
    customMessage?: string
  ): Promise<{
    subject: string;
    content: string;
    personalization_data: Record<string, any>;
  }> {
    const research = prospect.prospect_research;
    const contactName = prospect.contact_name || 'there';
    const companyName = prospect.company_name || prospect.domain;

    // Generate subject based on style and personalization level
    const subjects = {
      friendly: `Hey ${contactName}, loved your recent article!`,
      professional: `Partnership opportunity for ${companyName}`,
      collaborative: `Quick collaboration idea for ${contactName}`,
      authoritative: `Proven strategy that could help ${companyName}`
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

I just read your article "${research.website_analysis.recent_posts[0]}" and found your insights on ${campaign.target_keywords[0]} particularly valuable.

As someone who specializes in ${campaign.target_keywords.join(' and ')}, I've been following ${companyName}'s content strategy and believe there's a great opportunity for collaboration.

I'd love to contribute a guest post that builds on your recent themes while providing fresh insights for your ${research.website_analysis.audience_size.toLocaleString()} readers.

Would you be open to a brief discussion about this?

Best regards,
${campaign.email_settings.from_name}`,

        high: `Hi ${contactName},

Your recent work on "${research.website_analysis.recent_posts[0]}" caught my attention, especially your perspective on ${research.contact_research.writing_topics[0]}. It aligns perfectly with some research I've been conducting.

I noticed ${companyName} has been focusing on ${research.business_context.industry} content, and given your ${research.website_analysis.posting_frequency} publishing schedule, you might be interested in a collaboration.

I specialize in ${campaign.target_keywords.join(', ')} and have helped companies similar to yours achieve significant results. I'd love to share some insights that could benefit your audience while contributing to your content goals.

The piece I have in mind would complement your existing content on ${research.contact_research.writing_topics.join(' and ')}.

Would you be interested in a quick 10-minute call to discuss this opportunity?

Best regards,
${campaign.email_settings.from_name}
${campaign.email_settings.signature}`
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

  private static async sendEmail(
    emailSettings: EmailSettings,
    toEmail: string,
    subject: string,
    content: string,
    personalizationData: Record<string, any>
  ): Promise<{
    success: boolean;
    email_id?: string;
    error?: string;
  }> {
    try {
      // In production, this would integrate with actual email providers
      // For now, simulate email sending
      
      console.log(`📧 Sending email to: ${toEmail}`);
      console.log(`Subject: ${subject}`);
      
      // Simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return { success: true, email_id: emailId };
      } else {
        return { success: false, error: 'Email delivery failed' };
      }

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static async sendFollowUpEmail(
    prospectId: string,
    followUpType: 'follow_up_1' | 'follow_up_2' | 'follow_up_3'
  ): Promise<{
    success: boolean;
    email?: OutreachEmail;
    error?: string;
  }> {
    // Similar to sendInitialOutreach but with follow-up templates
    console.log(`📧 Sending ${followUpType} to prospect: ${prospectId}`);
    
    // For demo purposes, return success
    return { success: true };
  }

  private static getNextFollowUpType(currentStatus: OutreachStatus): 'follow_up_1' | 'follow_up_2' | 'follow_up_3' | null {
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

  private static async performResponseAnalysis(responseContent: string): Promise<ResponseData> {
    // Simulate AI response analysis
    const sentiment = Math.random() * 2 - 1; // -1 to 1
    const isPositive = sentiment > 0.2;
    const isNegative = sentiment < -0.2;
    
    return {
      response_type: isPositive ? 'positive' : isNegative ? 'negative' : 'neutral',
      response_content: responseContent,
      sentiment_score: sentiment,
      intent_analysis: {
        interested: isPositive,
        requires_follow_up: !isNegative,
        specific_requirements: isPositive ? ['guest post guidelines', 'content calendar'] : [],
        timeline: isPositive ? 'within 2 weeks' : 'not specified'
      },
      extracted_data: {
        contact_preferences: ['email'],
        submission_guidelines: ['1500 words', 'original content', 'author bio'],
        content_requirements: ['actionable insights', 'case studies', 'data-driven']
      },
      next_action: isPositive ? 'send content proposal' : isNegative ? 'mark as not interested' : 'wait for clarification'
    };
  }

  private static async updateCampaignStats(
    campaignId: string,
    updates: Partial<OutreachStats>
  ): Promise<void> {
    try {
      // Get current stats
      const { data: campaign } = await supabase
        .from('outreach_campaigns')
        .select('stats')
        .eq('campaign_id', campaignId)
        .single();

      if (campaign) {
        const currentStats = campaign.stats as OutreachStats;
        const newStats = { ...currentStats };

        // Apply updates
        Object.keys(updates).forEach(key => {
          if (key in newStats) {
            (newStats as any)[key] += (updates as any)[key];
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

  private static calculateCampaignAnalytics(prospects: any[], emails: any[]): any {
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
      avg_response_time: '2.3 days', // Would calculate from actual data
      best_performing_template: 'collaborative',
      optimal_send_time: '10:00 AM'
    };
  }
}
