/**
 * Campaign Metrics Health Check
 * Tests and fixes campaign metrics database issues
 */

import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  healthy: boolean;
  issues: string[];
  fixes: string[];
}

class CampaignMetricsHealthCheck {
  
  /**
   * Run comprehensive health check
   */
  static async runHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      healthy: true,
      issues: [],
      fixes: []
    };
    
    console.log('🏥 Running campaign metrics health check...');
    
    try {
      // Test 1: Check if profiles table is accessible
      await this.checkProfilesAccess(result);
      
      // Test 2: Check if campaigns table is accessible
      await this.checkCampaignsAccess(result);
      
      // Test 3: Check if campaign_runtime_metrics table exists
      await this.checkMetricsTableAccess(result);
      
      // Test 4: Check for RLS recursion issues
      await this.checkRLSRecursion(result);
      
    } catch (error) {
      result.healthy = false;
      result.issues.push(`Health check failed: ${error.message}`);
    }
    
    console.log('🏥 Health check complete:', result);
    return result;
  }
  
  /**
   * Check profiles table access
   */
  private static async checkProfilesAccess(result: HealthCheckResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      if (error) {
        if (error.message?.includes('permission denied for table users')) {
          result.healthy = false;
          result.issues.push('RLS recursion detected in profiles table');
          result.fixes.push('Apply RLS fix to remove recursive functions');
        } else {
          result.healthy = false;
          result.issues.push(`Profiles table error: ${error.message}`);
        }
      }
    } catch (error) {
      result.healthy = false;
      result.issues.push(`Profiles table access failed: ${error.message}`);
    }
  }
  
  /**
   * Check campaigns table access
   */
  private static async checkCampaignsAccess(result: HealthCheckResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .select('count')
        .limit(1);
        
      if (error) {
        result.healthy = false;
        result.issues.push(`Campaigns table error: ${error.message}`);
        if (error.message?.includes('permission denied')) {
          result.fixes.push('Check campaigns table RLS policies');
        }
      }
    } catch (error) {
      result.healthy = false;
      result.issues.push(`Campaigns table access failed: ${error.message}`);
    }
  }
  
  /**
   * Check metrics table access
   */
  private static async checkMetricsTableAccess(result: HealthCheckResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_runtime_metrics')
        .select('count')
        .limit(1);
        
      if (error) {
        if (error.code === '42P01') {
          result.healthy = false;
          result.issues.push('campaign_runtime_metrics table does not exist');
          result.fixes.push('Run campaign metrics migration');
        } else {
          result.healthy = false;
          result.issues.push(`Metrics table error: ${error.message}`);
        }
      }
    } catch (error) {
      result.healthy = false;
      result.issues.push(`Metrics table access failed: ${error.message}`);
    }
  }
  
  /**
   * Check for RLS recursion issues
   */
  private static async checkRLSRecursion(result: HealthCheckResult): Promise<void> {
    try {
      // Try to get current user profile - this often triggers RLS issues
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.message?.includes('permission denied for table users')) {
          result.healthy = false;
          result.issues.push('RLS infinite recursion detected');
          result.fixes.push('Drop get_current_user_role() function and recreate policies');
        }
      }
    } catch (error) {
      // Don't fail health check for this test
      console.warn('RLS recursion check failed:', error);
    }
  }
  
  /**
   * Apply automatic fixes where possible
   */
  static async autoFix(): Promise<{ success: boolean; message: string }> {
    console.log('🔧 Attempting automatic fixes...');
    
    try {
      // Try to apply RLS fix using service role if available
      const { error } = await supabase.rpc('apply_rls_fix');
      
      if (error) {
        return {
          success: false,
          message: `Auto-fix failed: ${error.message}. Manual Supabase SQL fix required.`
        };
      }
      
      return {
        success: true,
        message: 'RLS fix applied successfully!'
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Auto-fix not available. Please apply SQL fix manually in Supabase dashboard.`
      };
    }
  }
  
  /**
   * Get manual fix instructions
   */
  static getManualFixInstructions(): string {
    return `
Manual Fix Instructions:

1. Go to Supabase Dashboard SQL Editor
2. Run this SQL:

DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_service_role_access" ON public.profiles 
FOR ALL USING (auth.role() = 'service_role');

GRANT ALL ON public.profiles TO authenticated;

3. Test by refreshing the application
    `;
  }
}

export default CampaignMetricsHealthCheck;
export { CampaignMetricsHealthCheck };
