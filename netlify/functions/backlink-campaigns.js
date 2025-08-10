const { createClient } = require('@supabase/supabase-js');

// Backlink Campaign Management Function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Supabase configuration missing' }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
      }
    }

    // Get user from Authorization header
    const authHeader = event.headers.authorization;
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabase.auth.getUser(token);
      user = userData.user;
    }

    if (event.httpMethod === 'GET') {
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      // Get user's campaigns
      const { data: campaigns, error } = await supabase
        .from('backlink_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch campaigns' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          campaigns: campaigns || []
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      const { action, campaign, campaignId } = requestBody;

      switch (action) {
        case 'create':
          // Create new campaign
          const { data: newCampaign, error: createError } = await supabase
            .from('backlink_campaigns')
            .insert([{
              user_id: user.id,
              name: campaign.name,
              target_url: campaign.target_url,
              keywords: campaign.keywords,
              anchor_texts: campaign.anchor_texts,
              daily_limit: campaign.daily_limit,
              strategy_blog_comments: campaign.strategy_blog_comments,
              strategy_forum_profiles: campaign.strategy_forum_profiles,
              strategy_web2_platforms: campaign.strategy_web2_platforms,
              strategy_social_profiles: campaign.strategy_social_profiles,
              strategy_contact_forms: campaign.strategy_contact_forms
            }])
            .select()
            .single();

          if (createError) {
            console.error('Create campaign error:', createError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to create campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              campaign: newCampaign,
              message: 'Campaign created successfully'
            }),
          };

        case 'pause':
          const { error: pauseError } = await supabase
            .from('backlink_campaigns')
            .update({
              status: 'paused',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .eq('user_id', user.id);

          if (pauseError) {
            console.error('Pause campaign error:', pauseError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to pause campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign paused successfully'
            }),
          };

        case 'resume':
          const { error: resumeError } = await supabase
            .from('backlink_campaigns')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
              last_active_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .eq('user_id', user.id);

          if (resumeError) {
            console.error('Resume campaign error:', resumeError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to resume campaign' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Campaign resumed successfully'
            }),
          };

        case 'delete':
          // Enhanced delete with comprehensive safety checks and cascade operations
          const { forceDelete = false, reason } = requestBody;

          if (!campaignId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Campaign ID is required for deletion' }),
            };
          }

          // First, verify campaign exists and belongs to user
          const { data: existingCampaign, error: fetchError } = await supabase
            .from('backlink_campaigns')
            .select('*')
            .eq('id', campaignId)
            .eq('user_id', user.id)
            .single();

          if (fetchError || !existingCampaign) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({
                error: 'Campaign not found or access denied',
                details: 'Campaign may not exist or you may not have permission to delete it'
              }),
            };
          }

          // Safety check: prevent deletion of active campaigns unless forced
          if (existingCampaign.status === 'active' && !forceDelete) {
            return {
              statusCode: 409,
              headers,
              body: JSON.stringify({
                error: 'Cannot delete active campaign',
                details: 'Please pause the campaign first, or use forceDelete option',
                campaign: {
                  id: existingCampaign.id,
                  name: existingCampaign.name,
                  status: existingCampaign.status,
                  links_generated: existingCampaign.links_generated || 0
                },
                requiresConfirmation: true
              }),
            };
          }

          // Start transaction for cascade deletion
          const deletionStartTime = new Date();
          const deletionLog = {
            campaign_id: campaignId,
            user_id: user.id,
            initiated_at: deletionStartTime.toISOString(),
            reason: reason || 'User requested deletion',
            force_delete: forceDelete,
            campaign_data: existingCampaign
          };

          try {
            // Log deletion attempt for audit trail
            await supabase
              .from('campaign_deletion_logs')
              .insert(deletionLog);

            // Step 1: Delete related automation campaigns from queue manager
            const { error: automationDeleteError } = await supabase
              .from('automation_campaigns')
              .delete()
              .eq('campaign_id', campaignId)
              .eq('user_id', user.id);

            if (automationDeleteError) {
              console.error('Failed to delete automation campaigns:', automationDeleteError);
            }

            // Step 2: Delete campaign analytics and metrics
            const { error: analyticsDeleteError } = await supabase
              .from('campaign_analytics')
              .delete()
              .eq('campaign_id', campaignId)
              .eq('user_id', user.id);

            if (analyticsDeleteError) {
              console.error('Failed to delete campaign analytics:', analyticsDeleteError);
            }

            // Step 3: Archive generated links instead of deleting them
            const { error: linksArchiveError } = await supabase
              .from('generated_links')
              .update({
                status: 'archived',
                archived_at: new Date().toISOString(),
                archive_reason: `Campaign ${campaignId} deleted`
              })
              .eq('campaign_id', campaignId)
              .eq('user_id', user.id);

            if (linksArchiveError) {
              console.error('Failed to archive generated links:', linksArchiveError);
            }

            // Step 4: Delete the main campaign
            const { error: deleteError } = await supabase
              .from('backlink_campaigns')
              .delete()
              .eq('id', campaignId)
              .eq('user_id', user.id);

            if (deleteError) {
              console.error('Delete campaign error:', {
                message: deleteError.message || 'Unknown database error',
                code: deleteError.code,
                details: deleteError.details,
                hint: deleteError.hint
              });

              // Log the failure
              await supabase
                .from('campaign_deletion_logs')
                .update({
                  status: 'failed',
                  error_message: deleteError.message || 'Database deletion failed',
                  completed_at: new Date().toISOString()
                })
                .eq('campaign_id', campaignId)
                .eq('initiated_at', deletionStartTime.toISOString());

              return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                  error: 'Failed to delete campaign',
                  details: 'Database deletion failed. Please try again or contact support.',
                  supportInfo: {
                    campaignId,
                    timestamp: deletionStartTime.toISOString(),
                    errorCode: 'DB_DELETE_FAILED'
                  }
                }),
              };
            }

            // Step 5: Update deletion log with success
            await supabase
              .from('campaign_deletion_logs')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                links_archived: existingCampaign.links_generated || 0
              })
              .eq('campaign_id', campaignId)
              .eq('initiated_at', deletionStartTime.toISOString());

            // Return comprehensive deletion summary
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                message: 'Campaign deleted successfully with all related data',
                deletionSummary: {
                  campaignId,
                  campaignName: existingCampaign.name,
                  deletedAt: new Date().toISOString(),
                  linksArchived: existingCampaign.links_generated || 0,
                  wasForceDeleted: forceDelete,
                  cascadeOperations: {
                    automationCampaigns: 'deleted',
                    analytics: 'deleted',
                    generatedLinks: 'archived',
                    mainCampaign: 'deleted'
                  }
                }
              }),
            };

          } catch (cascadeError) {
            console.error('Cascade deletion error:', {
              message: cascadeError.message || 'Unknown cascade error',
              stack: cascadeError.stack,
              name: cascadeError.name
            });

            // Log the cascade failure
            await supabase
              .from('campaign_deletion_logs')
              .update({
                status: 'failed',
                error_message: cascadeError.message,
                completed_at: new Date().toISOString()
              })
              .eq('campaign_id', campaignId)
              .eq('initiated_at', deletionStartTime.toISOString());

            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                error: 'Partial deletion failure',
                details: 'Some related data may not have been properly cleaned up. Please contact support.',
                supportInfo: {
                  campaignId,
                  timestamp: deletionStartTime.toISOString(),
                  errorCode: 'CASCADE_DELETE_FAILED',
                  partialDeletion: true
                }
              }),
            };
          }

        case 'health_check':
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Backlink campaigns service is operational',
              timestamp: new Date().toISOString(),
              functionVersion: '1.0.0'
            }),
          };

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid action' }),
          };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in backlink campaigns:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
    };
  }
};
