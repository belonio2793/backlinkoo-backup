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

      // Test database connection
      console.log('Testing database connection...');
      const { data: connectionData, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        errors.push(`Database connection: ${connectionError.message}`);
        details.connection = {
          error: connectionError.message,
          code: connectionError.code,
          details: connectionError.details,
          hint: connectionError.hint
        };
      } else {
        details.connection = { status: 'OK' };
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
    
    if (result.success) {
      console.log('✅ Database health check passed');
    } else {
      console.error('❌ Database health check failed:');
      console.error('Errors:', result.errors);
      console.error('Details:', result.details);
    }
  }
}
