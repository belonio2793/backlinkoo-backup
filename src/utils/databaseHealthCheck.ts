import { supabase } from '@/integrations/supabase/client';
import { initializeAutomationTables } from './createAutomationTables';

export class DatabaseHealthCheck {
  static async checkTables(): Promise<{ success: boolean; errors: string[]; details: any }> {
    const errors: string[] = [];
    const details: any = {};

    try {
      // Test automation_campaigns table
      console.log('Testing automation_campaigns table...');
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('automation_campaigns')
        .select('count')
        .limit(1);
      
      if (campaignsError) {
        errors.push(`automation_campaigns: ${campaignsError.message}`);
        details.automation_campaigns = {
          error: campaignsError.message,
          code: campaignsError.code,
          details: campaignsError.details,
          hint: campaignsError.hint
        };
      } else {
        details.automation_campaigns = { status: 'OK', count: campaignsData };
      }

      // Test link_placements table
      console.log('Testing link_placements table...');
      const { data: placementsData, error: placementsError } = await supabase
        .from('link_placements')
        .select('count')
        .limit(1);
      
      if (placementsError) {
        errors.push(`link_placements: ${placementsError.message}`);
        details.link_placements = {
          error: placementsError.message,
          code: placementsError.code,
          details: placementsError.details,
          hint: placementsError.hint
        };
      } else {
        details.link_placements = { status: 'OK', count: placementsData };
      }

      // Test user_link_quotas table
      console.log('Testing user_link_quotas table...');
      const { data: quotasData, error: quotasError } = await supabase
        .from('user_link_quotas')
        .select('count')
        .limit(1);
      
      if (quotasError) {
        errors.push(`user_link_quotas: ${quotasError.message}`);
        details.user_link_quotas = {
          error: quotasError.message,
          code: quotasError.code,
          details: quotasError.details,
          hint: quotasError.hint
        };
      } else {
        details.user_link_quotas = { status: 'OK', count: quotasData };
      }

      // Test database connection using a safer approach
      console.log('Testing database connection...');
      try {
        // Use SafeAuth to handle authentication gracefully
        const { SafeAuth } = await import('@/utils/safeAuth');
        const userResult = await SafeAuth.getCurrentUser();

        if (userResult.needsAuth) {
          // This is not an error - just no authenticated user
          details.connection = {
            status: 'OK_NO_AUTH',
            message: 'No authenticated user (expected for unauthenticated health checks)',
            connection_test: 'passed'
          };
        } else if (userResult.error) {
          errors.push(`Database connection: ${userResult.error}`);
          details.connection = {
            error: userResult.error,
            code: 400,
            details: { message: userResult.error }
          };
        } else {
          details.connection = {
            status: 'OK',
            auth_check: 'passed',
            user_authenticated: true
          };
        }
      } catch (connError: any) {
        // Only treat this as an error if it's a real connection issue
        if (connError.message?.includes('Auth session missing')) {
          details.connection = {
            status: 'OK_NO_AUTH',
            message: 'No authenticated user (expected for unauthenticated health checks)',
            connection_test: 'passed'
          };
        } else {
          errors.push(`Database connection: ${connError.message}`);
          details.connection = {
            error: connError.message,
            type: 'connection_error'
          };
        }
      }

    } catch (error: any) {
      errors.push(`Health check failed: ${error.message}`);
      details.healthCheck = {
        error: error.message,
        stack: error.stack
      };
    }

    return {
      success: errors.length === 0,
      errors,
      details
    };
  }

  static async logHealthCheck(): Promise<void> {
    console.log('🔍 Running database health check...');
    const result = await this.checkTables();

    // Also check automation tables specifically
    console.log('🔍 Checking automation tables...');
    const automationStatus = await initializeAutomationTables();

    // Log with proper JSON stringification to avoid [object Object]
    console.log('Automation tables status:', JSON.stringify(automationStatus, null, 2));

    if (result.success && automationStatus.allTablesExist) {
      console.log('✅ Database health check passed');
    } else {
      console.error('❌ Database health check failed:');
      console.error('General errors:', result.errors);
      console.error('Details:', JSON.stringify(result.details, null, 2));
      console.error('Automation tables status:', JSON.stringify(automationStatus, null, 2));
    }
  }
}
